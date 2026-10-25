import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * DEV ONLY: Generate a fake launch token for testing without Fanvue
 * This bypasses the real Fanvue auth flow
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Dev endpoint not available in production' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { fanvueUserUuid, role = 'fan' } = body;

    if (!fanvueUserUuid) {
      return NextResponse.json({ error: 'fanvueUserUuid required' }, { status: 400 });
    }

    // Lookup user in database
    let user;
    if (role === 'creator') {
      user = await db.creator.findUnique({
        where: { fanvueUserUuid },
      });
    } else {
      user = await db.fan.findUnique({
        where: { fanvueUserUuid },
        include: { creator: true },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found in seed data' }, { status: 404 });
    }

    // Create a fake token (in real flow, this would be from Fanvue)
    const fakeToken = Buffer.from(
      JSON.stringify({
        fanvueUserUuid,
        role,
        displayName: role === 'creator' ? user.displayName : (user as any).displayName,
        creatorId: role === 'creator' ? user.id : (user as any).creatorId,
        fanId: role === 'fan' ? user.id : undefined,
        creatorHandle: role === 'creator' ? (user as any).handle : (user as any).creator.handle,
      })
    ).toString('base64');

    return NextResponse.json({ token: fakeToken, user });
  } catch (error) {
    console.error('Error generating dev token:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
