import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById } from '@/lib/userData';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const caller = await getUserById(session.id);
  if (!caller || caller.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    let usersList: any[] = [];
    try {
      usersList = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          coins: true,
          gems: true,
          level: true,
          activeBadge: true,
          createdAt: true
        }
      });
    } catch (e) {
      // Fallback: load users from memory map
      const { MEMORY_DB } = require('@/lib/userData');
      usersList = Array.from(MEMORY_DB.users.values()).map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email || 'guest@pixelverse.com',
        role: u.role,
        coins: u.coins,
        gems: u.gems,
        level: u.level,
        activeBadge: u.activeBadge,
        createdAt: u.createdAt
      }));
    }

    // Server analytics metrics
    const stats = {
      totalUsers: usersList.length,
      vipUsers: usersList.filter(u => u.role === 'VIP').length,
      adminUsers: usersList.filter(u => u.role === 'ADMIN').length,
      economyCoins: usersList.reduce((sum, u) => sum + u.coins, 0),
      economyGems: usersList.reduce((sum, u) => sum + u.gems, 0),
      activeServers: 1,
      uptime: process.uptime(),
    };

    return NextResponse.json({ users: usersList, stats });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch admin dashboard' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const caller = await getUserById(session.id);
  if (!caller || caller.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, targetUserId, amount, currency, role } = body;

    if (action === 'modify_currency') {
      if (!targetUserId || amount === undefined || !currency) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
      }

      let user;
      try {
        const incrementData: any = {};
        if (currency === 'COINS') incrementData.coins = { increment: parseInt(amount) };
        if (currency === 'GEMS') incrementData.gems = { increment: parseInt(amount) };

        user = await prisma.user.update({
          where: { id: targetUserId },
          data: incrementData
        });
      } catch (e) {
        // Fallback
        const { MEMORY_DB } = require('@/lib/userData');
        user = MEMORY_DB.users.get(targetUserId);
        if (user) {
          if (currency === 'COINS') user.coins += parseInt(amount);
          if (currency === 'GEMS') user.gems += parseInt(amount);
        }
      }

      return NextResponse.json({ success: true, user });
    }

    if (action === 'modify_role') {
      if (!targetUserId || !role) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
      }

      let user;
      try {
        user = await prisma.user.update({
          where: { id: targetUserId },
          data: { role }
        });
      } catch (e) {
        // Fallback
        const { MEMORY_DB } = require('@/lib/userData');
        user = MEMORY_DB.users.get(targetUserId);
        if (user) {
          user.role = role;
        }
      }

      return NextResponse.json({ success: true, user });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Admin action failed' }, { status: 500 });
  }
}
