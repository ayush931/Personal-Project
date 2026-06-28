import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById, equipItem, getInventory } from '@/lib/userData';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserById(session.id);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const inventory = await getInventory(session.id);

  return NextResponse.json({ user, inventory });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, itemId, equip, statusText, activeBadge } = body;

    if (action === 'equip') {
      if (!itemId) {
        return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
      }
      const result = await equipItem(session.id, itemId, equip);
      return NextResponse.json(result);
    }

    if (action === 'update_profile') {
      try {
        const updateData: any = {};
        if (statusText !== undefined) updateData.status = statusText;
        if (activeBadge !== undefined) updateData.activeBadge = activeBadge;

        // If we are using SQLite via Prisma, update it. If not, update fallback.
        let user;
        try {
          user = await prisma.user.update({
            where: { id: session.id },
            data: updateData
          });
        } catch (e) {
          // Fallback update
          const { prisma: _, ...userData } = require('@/lib/userData');
          user = await userData.addCoins(session.id, 0); // triggers memory DB lookup/save
          if (user) {
            if (statusText !== undefined) user.status = statusText;
            if (activeBadge !== undefined) user.activeBadge = activeBadge;
          }
        }
        return NextResponse.json({ success: true, user });
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error updating profile' }, { status: 500 });
  }
}
