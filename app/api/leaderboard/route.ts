import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/userData';

export async function GET(req: NextRequest) {
  try {
    const leaderboard = await getLeaderboard();
    return NextResponse.json(leaderboard);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
