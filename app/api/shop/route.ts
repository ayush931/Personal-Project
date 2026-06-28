import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { buyItem } from '@/lib/userData';
import { GAME_ITEMS } from '@/lib/items';

export async function GET(req: NextRequest) {
  // Returns all items in catalog
  return NextResponse.json({ items: Object.values(GAME_ITEMS) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const result = await buyItem(session.id, itemId);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to purchase item' }, { status: 400 });
  }
}
