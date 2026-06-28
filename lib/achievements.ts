export interface AchievementConfig {
  id: string;
  title: string;
  description: string;
  badgeName: string;
  rewardCoins: number;
  rewardGems: number;
  icon: string;
}

export const ACHIEVEMENTS: Record<string, AchievementConfig> = {
  'first_steps': {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Create your avatar and step into the PixelVerse world!',
    badgeName: 'Pioneer',
    rewardCoins: 100,
    rewardGems: 2,
    icon: '👣'
  },
  'chatty_cat': {
    id: 'chatty_cat',
    title: 'Chitchatter',
    description: 'Send 30 chat messages to friends or players in public maps.',
    badgeName: 'Speaker',
    rewardCoins: 250,
    rewardGems: 0,
    icon: '💬'
  },
  'game_conqueror': {
    id: 'game_conqueror',
    title: 'Arcade King/Queen',
    description: 'Win a total of 10 mini-games (Chess, Tic Tac Toe, Snake, etc.).',
    badgeName: 'Pro Gamer',
    rewardCoins: 500,
    rewardGems: 5,
    icon: '👑'
  },
  'big_spender': {
    id: 'big_spender',
    title: 'Shopaholic',
    description: 'Spend 3,000 coins in any of the PixelVerse shops.',
    badgeName: 'Collector',
    rewardCoins: 400,
    rewardGems: 3,
    icon: '🛍️'
  },
  'pet_collector': {
    id: 'pet_collector',
    title: 'Beast Master',
    description: 'Own at least 2 active pets in your inventory.',
    badgeName: 'Pet Lover',
    rewardCoins: 300,
    rewardGems: 2,
    icon: '🐾'
  },
  'interior_designer': {
    id: 'interior_designer',
    title: 'Architect of Dreams',
    description: 'Place 5 furniture items in your private room.',
    badgeName: 'Decorator',
    rewardCoins: 300,
    rewardGems: 1,
    icon: '🛋️'
  },
  'guild_founder': {
    id: 'guild_founder',
    title: 'Guild Unity',
    description: 'Join or create a Guild to play together.',
    badgeName: 'Team Player',
    rewardCoins: 200,
    rewardGems: 2,
    icon: '🛡️'
  },
  'gem_hoarder': {
    id: 'gem_hoarder',
    title: 'Gleaming Gems',
    description: 'Accumulate 100 premium gems on your profile.',
    badgeName: 'Elite',
    rewardCoins: 1000,
    rewardGems: 10,
    icon: '💎'
  }
};
