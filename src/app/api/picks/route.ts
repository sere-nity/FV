import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getDataSource } from '@/lib/data-source';
import { extractProfile, scoreItems, explainPick } from '@/lib/recommend';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const fanId = searchParams.get('fanId');
    const creatorId = searchParams.get('creatorId');
    const count = parseInt(searchParams.get('count') || '3');

    if (!fanId || !creatorId) {
      return NextResponse.json({ error: 'fanId and creatorId required' }, { status: 400 });
    }

    // Get fan from database
    const fan = await db.fan.findUnique({
      where: { id: fanId },
    });

    if (!fan) {
      return NextResponse.json({ error: 'Fan not found' }, { status: 404 });
    }

    // Check if we have a cached profile
    let profile = await db.tasteProfile.findUnique({
      where: { fanId },
    });

    const dataSource = getDataSource();

    // If no profile or stale (> 1 day), regenerate
    const isStale = profile
      ? Date.now() - profile.updatedAt.getTime() > 24 * 60 * 60 * 1000
      : true;

    if (!profile || isStale) {
      // Get chat messages
      const chatMessages = await dataSource.getChatMessages(creatorId, fanId);

      // Extract profile
      const extracted = await extractProfile(
        chatMessages.map((m) => ({
          sender: m.sender,
          text: m.text,
        }))
      );

      // Save or update profile
      profile = await db.tasteProfile.upsert({
        where: { fanId },
        create: {
          fanId,
          summary: extracted.summary,
          liked: JSON.stringify(extracted.liked),
          wantsNext: JSON.stringify(extracted.wantsNext),
          wantedTypes: JSON.stringify(extracted.wantedTypes),
          avoid: JSON.stringify(extracted.avoid),
        },
        update: {
          summary: extracted.summary,
          liked: JSON.stringify(extracted.liked),
          wantsNext: JSON.stringify(extracted.wantsNext),
          wantedTypes: JSON.stringify(extracted.wantedTypes),
          avoid: JSON.stringify(extracted.avoid),
          updatedAt: new Date(),
        },
      });
    }

    // Parse profile arrays
    const tasteProfile = {
      summary: profile.summary,
      liked: profile.liked ? JSON.parse(profile.liked) : [],
      wantsNext: profile.wantsNext ? JSON.parse(profile.wantsNext) : [],
      wantedTypes: profile.wantedTypes ? JSON.parse(profile.wantedTypes) : [],
      avoid: profile.avoid ? JSON.parse(profile.avoid) : [],
    };

    // Get all shelf items
    const shelfItems = await db.shelfItem.findMany({
      where: { creatorId },
    });

    // Get already shown picks
    const existingPicks = await db.pick.findMany({
      where: { fanId, status: 'shown' },
      select: { shelfItemId: true },
    });
    const alreadyPickedIds = existingPicks.map((p) => p.shelfItemId);

    // Score items
    const scored = await scoreItems(tasteProfile, shelfItems, alreadyPickedIds);

    // Take top N
    const topItems = scored.slice(0, count);

    // Generate explanations and save picks
    const picks = [];
    for (const scored of topItems) {
      const reason = await explainPick(scored.item, tasteProfile, fan.displayName);

      // Save pick
      const pick = await db.pick.create({
        data: {
          fanId,
          shelfItemId: scored.item.id,
          reason,
          score: scored.score,
          status: 'suggested',
        },
      });

      picks.push({
        id: pick.id,
        item: scored.item,
        reason,
        score: scored.score,
        breakdown: scored.breakdown,
      });
    }

    return NextResponse.json({
      picks,
      profile: tasteProfile,
    });
  } catch (error) {
    console.error('Error generating picks:', error);
    return NextResponse.json(
      { error: 'Failed to generate picks', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { pickId, status } = body;

    if (!pickId || !status) {
      return NextResponse.json({ error: 'pickId and status required' }, { status: 400 });
    }

    if (!['suggested', 'shown', 'opened'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const pick = await db.pick.update({
      where: { id: pickId },
      data: { status },
    });

    return NextResponse.json({ pick });
  } catch (error) {
    console.error('Error updating pick status:', error);
    return NextResponse.json({ error: 'Failed to update pick status' }, { status: 500 });
  }
}
