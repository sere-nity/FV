import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId required' }, { status: 400 });
    }

    const fans = await db.fan.findMany({
      where: { creatorId },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
        tasteProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ fans });
  } catch (error) {
    console.error('Error fetching fans:', error);
    return NextResponse.json({ error: 'Failed to fetch fans' }, { status: 500 });
  }
}
