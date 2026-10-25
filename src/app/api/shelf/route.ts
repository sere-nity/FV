import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const creatorId = searchParams.get('creatorId');
    const type = searchParams.get('type');

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId required' }, { status: 400 });
    }

    const where: any = { creatorId };
    if (type && type !== 'all') {
      where.type = type;
    }

    const items = await db.shelfItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching shelf items:', error);
    return NextResponse.json({ error: 'Failed to fetch shelf items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { creatorId, type, source, url, quoteText, title, imageUrl, description, tags, creatorNote } = body;

    if (!creatorId || !type || !source || !title || !creatorNote) {
      return NextResponse.json(
        { error: 'Missing required fields: creatorId, type, source, title, creatorNote' },
        { status: 400 }
      );
    }

    const item = await db.shelfItem.create({
      data: {
        creatorId,
        type,
        source,
        url: url || null,
        quoteText: quoteText || null,
        title,
        imageUrl: imageUrl || null,
        description: description || null,
        tags: tags ? JSON.stringify(tags) : null,
        creatorNote,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Error creating shelf item:', error);
    return NextResponse.json({ error: 'Failed to create shelf item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    await db.shelfItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shelf item:', error);
    return NextResponse.json({ error: 'Failed to delete shelf item' }, { status: 500 });
  }
}
