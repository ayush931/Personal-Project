export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'DAILY' | 'WEEKLY' | 'EVENT';
  targetCount: number;
  rewardCoins: number;
  rewardGems: number;
  rewardXp: number;
}

export const QUESTS: Record<string, Quest> = {
  // DAILY
  'daily_login': {
    id: 'daily_login',
    title: 'Daily Check-in',
    description: 'Log into PixelVerse today and visit the Town Square.',
    type: 'DAILY',
    targetCount: 1,
    rewardCoins: 100,
    rewardGems: 0,
    rewardXp: 20
  },
  'daily_chat': {
    id: 'daily_chat',
    title: 'Friendly Neighbor',
    description: 'Send at least 3 chat messages to other players in the world.',
    type: 'DAILY',
    targetCount: 3,
    rewardCoins: 150,
    rewardGems: 0,
    rewardXp: 30
  },
  'daily_game': {
    id: 'daily_game',
    title: 'Arcade Enthusiast',
    description: 'Play at least 1 mini-game in the Arcade map.',
    type: 'DAILY',
    targetCount: 1,
    rewardCoins: 200,
    rewardGems: 0,
    rewardXp: 50
  },
  'daily_dance': {
    id: 'daily_dance',
    title: 'Groovy Moves',
    description: 'Dance in the Town Square or Cafe (press dance emote!).',
    type: 'DAILY',
    targetCount: 1,
    rewardCoins: 120,
    rewardGems: 0,
    rewardXp: 25
  },

  // WEEKLY
  'weekly_games': {
    id: 'weekly_games',
    title: 'Arcade Champion',
    description: 'Play and finish 5 mini-games this week.',
    type: 'WEEKLY',
    targetCount: 5,
    rewardCoins: 800,
    rewardGems: 2,
    rewardXp: 200
  },
  'weekly_friends': {
    id: 'weekly_friends',
    title: 'Social Butterfly',
    description: 'Make 3 new friends this week.',
    type: 'WEEKLY',
    targetCount: 3,
    rewardCoins: 600,
    rewardGems: 1,
    rewardXp: 150
  },
  'weekly_spend': {
    id: 'weekly_spend',
    title: 'Economic Contributor',
    description: 'Spend at least 1000 coins in the Shop.',
    type: 'WEEKLY',
    targetCount: 1000,
    rewardCoins: 500,
    rewardGems: 2,
    rewardXp: 120
  },

  // EVENTS & NPC MISSIONS
  'event_treasure': {
    id: 'event_treasure',
    title: 'Beach Treasure Hunt',
    description: 'Find the glowing treasure chest hidden in the sand at the Beach map.',
    type: 'EVENT',
    targetCount: 1,
    rewardCoins: 500,
    rewardGems: 5,
    rewardXp: 100
  },
  'npc_cafe_delivery': {
    id: 'npc_cafe_delivery',
    title: 'Coffee for Barnaby',
    description: 'Purchase a pixel espresso from Cafe and deliver it to Barnaby in the Town Square.',
    type: 'EVENT',
    targetCount: 1,
    rewardCoins: 300,
    rewardGems: 1,
    rewardXp: 75
  }
};
