import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { claimQuestReward, handleQuestProgress } from '@/lib/userData';
import { QUESTS } from '@/lib/quests';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user quest progress
  let progress = [];
  try {
    progress = await prisma.questProgress.findMany({
      where: { userId: session.id }
    });
  } catch (e) {
    // Fallback: import the memory database helper
    const { prisma: _, ...userData } = require('@/lib/userData');
    progress = await userData.handleQuestProgress(session.id, 'daily_login', 0).then(() => {
      // return progress list
      const list = userData.MEMORY_DB?.quests?.get(session.id) || [];
      return list;
    });
  }

  // Map progress to our quest configs
  const questsWithProgress = Object.values(QUESTS).map(q => {
    const prog = progress.find((p: any) => p.questId === q.id);
    return {
      ...q,
      progress: prog ? prog.progress : 0,
      status: prog ? prog.status : 'ACTIVE'
    };
  });

  return NextResponse.json({ quests: questsWithProgress });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, questId } = body;

    if (!questId) {
      return NextResponse.json({ error: 'Quest ID is required' }, { status: 400 });
    }

    if (action === 'claim') {
      const result = await claimQuestReward(session.id, questId);
      return NextResponse.json(result);
    }

    if (action === 'trigger') {
      // Helper to test / manually increment quest progress
      const result = await handleQuestProgress(session.id, questId, 1);
      return NextResponse.json({ success: true, progress: result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to process quest' }, { status: 400 });
  }
}
