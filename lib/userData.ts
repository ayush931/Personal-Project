import { prisma } from './db';
import { GAME_ITEMS } from './items';
import { ACHIEVEMENTS } from './achievements';
import { QUESTS } from './quests';

// Runtime in-memory DB fallback in case database connection fails
export const MEMORY_DB = {
  users: new Map<string, any>(),
  inventory: new Map<string, any[]>(),
  friends: new Map<string, any[]>(),
  roomItems: new Map<string, any[]>(),
  achievements: new Map<string, any[]>(),
  quests: new Map<string, any[]>(),
  transactions: new Map<string, any[]>(),
  matches: new Map<string, any[]>(),
  guilds: new Map<string, any>()
};

// Seed initial memory DB with sample guest / admin
const adminId = 'admin-dev-id';
MEMORY_DB.users.set(adminId, {
  id: adminId,
  username: 'PixelAdmin',
  email: 'admin@pixelverse.com',
  role: 'ADMIN',
  coins: 99999,
  gems: 999,
  level: 10,
  xp: 4500,
  avatarCustomization: JSON.stringify({
    skin: '#ffd1a9',
    hair: 'hair_wizard_long',
    eyes: 'default_black',
    face: 'happy',
    shirt: 'shirt_vip_hoodie',
    pants: 'pants_vip_joggers',
    shoes: 'shoes_cyber_boots',
    hat: 'hat_crown',
    glasses: 'glasses_cyber_visor',
    accessory: 'accessory_katana',
    backpack: 'backpack_wings',
    pet: 'pet_dragon_baby'
  }),
  status: 'PixelVerse Administrator',
  activeBadge: 'Creator',
  createdAt: new Date(),
  updatedAt: new Date()
});
MEMORY_DB.inventory.set(adminId, Object.keys(GAME_ITEMS).map(id => ({
  id: `inv-${id}`,
  userId: adminId,
  itemId: id,
  itemType: GAME_ITEMS[id].type,
  equipped: true,
  purchasedAt: new Date()
})));

export async function getUserById(id: string) {
  try {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        inventory: true,
        friends: {
          include: {
            friend: {
              select: { id: true, username: true, status: true, activeBadge: true, level: true }
            }
          }
        },
        achievements: true,
        quests: true,
        guild: true
      }
    });
  } catch (e) {
    console.warn("⚠️ Database query failed in getUserById. Falling back to memory.", e);
    return MEMORY_DB.users.get(id) || null;
  }
}

export async function getUserByUsername(username: string) {
  try {
    return await prisma.user.findUnique({
      where: { username }
    });
  } catch (e) {
    console.warn("⚠️ Database query failed in getUserByUsername. Falling back to memory.", e);
    return Array.from(MEMORY_DB.users.values()).find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  }
}

export async function createGuestUser(username: string) {
  const defaultAvatar = {
    skin: '#ffd1a9',
    hair: 'hair_short_brown',
    eyes: 'default_black',
    face: 'happy',
    shirt: 'shirt_basic_blue',
    pants: 'pants_basic_jeans',
    shoes: 'shoes_sneakers_white',
    hat: 'hat_none',
    glasses: 'glasses_none',
    accessory: 'accessory_none',
    backpack: 'none',
    pet: 'none'
  };

  const id = 'guest-' + Math.random().toString(36).substring(2, 9);
  const guestData = {
    id,
    username,
    role: 'USER',
    coins: 1000,
    gems: 50,
    level: 1,
    xp: 0,
    avatarCustomization: JSON.stringify(defaultAvatar),
    status: 'Exploring PixelVerse!',
    activeBadge: 'Newcomer',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  try {
    const user = await prisma.user.create({
      data: {
        id,
        username,
        avatarCustomization: JSON.stringify(defaultAvatar),
      }
    });

    // Create starter items in inventory
    const starterItems = ['hair_short_brown', 'shirt_basic_blue', 'pants_basic_jeans', 'shoes_sneakers_white', 'hat_none', 'glasses_none', 'accessory_none'];
    await prisma.inventoryItem.createMany({
      data: starterItems.map(itemId => ({
        userId: user.id,
        itemId,
        itemType: 'CLOTHING',
        equipped: true
      }))
    });

    return await getUserById(user.id);
  } catch (e) {
    console.warn("⚠️ Database insert failed in createGuestUser. Falling back to memory.", e);
    MEMORY_DB.users.set(id, guestData);
    
    // Add default items to inventory fallback
    const starterItems = ['hair_short_brown', 'shirt_basic_blue', 'pants_basic_jeans', 'shoes_sneakers_white', 'hat_none', 'glasses_none', 'accessory_none'];
    const inv = starterItems.map((itemId, idx) => ({
      id: `inv-${id}-${idx}`,
      userId: id,
      itemId,
      itemType: 'CLOTHING',
      equipped: true,
      purchasedAt: new Date()
    }));
    MEMORY_DB.inventory.set(id, inv);
    return { ...guestData, inventory: inv, friends: [], achievements: [], quests: [] };
  }
}

export async function updateAvatar(userId: string, customization: any) {
  const customStr = JSON.stringify(customization);
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: { avatarCustomization: customStr }
    });
  } catch (e) {
    console.warn("⚠️ Database update failed in updateAvatar. Falling back to memory.", e);
    const user = MEMORY_DB.users.get(userId);
    if (user) {
      user.avatarCustomization = customStr;
      MEMORY_DB.users.set(userId, user);
    }
    return user;
  }
}

export async function addCoins(userId: string, amount: number, gems = 0) {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        coins: { increment: amount },
        gems: { increment: gems }
      }
    });
  } catch (e) {
    console.warn("⚠️ Database update failed in addCoins. Falling back to memory.", e);
    const user = MEMORY_DB.users.get(userId);
    if (user) {
      user.coins = Math.max(0, user.coins + amount);
      user.gems = Math.max(0, user.gems + gems);
      MEMORY_DB.users.set(userId, user);
      return user;
    }
    return null;
  }
}

export async function addXp(userId: string, xpAmount: number) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    let newXp = user.xp + xpAmount;
    let newLevel = user.level;
    let extraCoins = 0;

    let nextLevelThreshold = newLevel * 500;
    while (newXp >= nextLevelThreshold) {
      newXp -= nextLevelThreshold;
      newLevel += 1;
      extraCoins += 500;
      nextLevelThreshold = newLevel * 500;
    }

    return await prisma.user.update({
      where: { id: userId },
      data: {
        xp: newXp,
        level: newLevel,
        coins: { increment: extraCoins }
      }
    });
  } catch (e) {
    console.warn("⚠️ Database query failed in addXp. Falling back to memory.", e);
    const user = MEMORY_DB.users.get(userId);
    if (user) {
      user.xp += xpAmount;
      const nextLevelThreshold = user.level * 500;
      if (user.xp >= nextLevelThreshold) {
        user.xp -= nextLevelThreshold;
        user.level += 1;
        user.coins += 500;
      }
      MEMORY_DB.users.set(userId, user);
      return user;
    }
    return null;
  }
}

export async function buyItem(userId: string, itemId: string) {
  const item = GAME_ITEMS[itemId];
  if (!item) throw new Error("Item not found");

  try {
    const result = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          coins: { decrement: item.costCoins },
          gems: { decrement: item.costGems }
        }
      }),
      prisma.inventoryItem.create({
        data: {
          userId,
          itemId,
          itemType: item.type,
          equipped: false
        }
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount: item.costCoins > 0 ? -item.costCoins : -item.costGems,
          currencyType: item.costCoins > 0 ? 'COINS' : 'GEMS',
          description: `Bought ${item.name}`
        }
      })
    ]);
    return { success: true, coins: result[0].coins, gems: result[0].gems, inventoryItem: result[1] };
  } catch (e) {
    console.warn("⚠️ Database transaction failed in buyItem. Falling back to memory.", e);
    
    // Memory fallback logic
    const user = await getUserById(userId);
    if (!user) throw new Error("User not found");

    const userInv = MEMORY_DB.inventory.get(userId) || [];
    if (userInv.some((i: any) => i.itemId === itemId)) {
      throw new Error("Item already owned");
    }

    if (user.coins < item.costCoins || user.gems < item.costGems) {
      throw new Error("Insufficient funds");
    }

    user.coins -= item.costCoins;
    user.gems -= item.costGems;
    MEMORY_DB.users.set(userId, user);

    const newItem = {
      id: `inv-${userId}-${Date.now()}`,
      userId,
      itemId,
      itemType: item.type,
      equipped: false,
      purchasedAt: new Date()
    };
    userInv.push(newItem);
    MEMORY_DB.inventory.set(userId, userInv);

    return { success: true, coins: user.coins, gems: user.gems, inventoryItem: newItem };
  }
}

export async function equipItem(userId: string, itemId: string, equip: boolean) {
  const item = GAME_ITEMS[itemId];
  if (!item) throw new Error("Item not found");

  try {
    if (equip && item.type === 'CLOTHING' && item.category) {
      const ownedItems = await prisma.inventoryItem.findMany({
        where: { userId }
      });
      const idsToUnequip = ownedItems
        .filter(i => {
          const cat = GAME_ITEMS[i.itemId]?.category;
          return cat === item.category && i.itemId !== itemId;
        })
        .map(i => i.id);

      await prisma.inventoryItem.updateMany({
        where: { id: { in: idsToUnequip } },
        data: { equipped: false }
      });
    }

    await prisma.inventoryItem.update({
      where: { userId_itemId: { userId, itemId } },
      data: { equipped: equip }
    });

    if (equip && item.category) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const avatar = JSON.parse(user.avatarCustomization);
        avatar[item.category] = itemId;
        await prisma.user.update({
          where: { id: userId },
          data: { avatarCustomization: JSON.stringify(avatar) }
        });
      }
    }

    return { success: true };
  } catch (e) {
    console.warn("⚠️ Database update failed in equipItem. Falling back to memory.", e);
    
    // Memory fallback logic
    const inv = MEMORY_DB.inventory.get(userId) || [];
    const target = inv.find(i => i.itemId === itemId);
    if (!target) throw new Error("You do not own this item");

    if (equip && item.type === 'CLOTHING') {
      inv.forEach(i => {
        const otherItem = GAME_ITEMS[i.itemId];
        if (otherItem && otherItem.type === 'CLOTHING' && otherItem.category === item.category) {
          i.equipped = false;
        }
      });
    }
    target.equipped = equip;
    MEMORY_DB.inventory.set(userId, inv);

    const user = MEMORY_DB.users.get(userId);
    if (user && equip && item.category) {
      const avatar = JSON.parse(user.avatarCustomization);
      avatar[item.category] = itemId;
      user.avatarCustomization = JSON.stringify(avatar);
      MEMORY_DB.users.set(userId, user);
    }
    return { success: true };
  }
}

export async function getInventory(userId: string) {
  try {
    return await prisma.inventoryItem.findMany({
      where: { userId }
    });
  } catch (e) {
    console.warn("⚠️ Database query failed in getInventory. Falling back to memory.", e);
    return MEMORY_DB.inventory.get(userId) || [];
  }
}

export async function handleQuestProgress(userId: string, questId: string, increment = 1) {
  const quest = QUESTS[questId];
  if (!quest) return null;

  try {
    const progress = await prisma.questProgress.upsert({
      where: { userId_questId: { userId, questId } },
      create: { userId, questId, progress: increment, status: increment >= quest.targetCount ? 'COMPLETED' : 'ACTIVE' },
      update: {
        progress: { increment },
      }
    });

    if (progress.progress >= quest.targetCount && progress.status === 'ACTIVE') {
      return await prisma.questProgress.update({
        where: { id: progress.id },
        data: { status: 'COMPLETED' }
      });
    }

    return progress;
  } catch (e) {
    console.warn("⚠️ Database query failed in handleQuestProgress. Falling back to memory.", e);
    const list = MEMORY_DB.quests.get(userId) || [];
    let progress = list.find(q => q.questId === questId);
    if (!progress) {
      progress = { id: `qp-${questId}-${Date.now()}`, userId, questId, progress: 0, status: 'ACTIVE' };
      list.push(progress);
      MEMORY_DB.quests.set(userId, list);
    }

    if (progress.status === 'ACTIVE') {
      progress.progress = Math.min(quest.targetCount, progress.progress + increment);
      if (progress.progress >= quest.targetCount) {
        progress.status = 'COMPLETED';
      }
    }
    return progress;
  }
}

export async function claimQuestReward(userId: string, questId: string) {
  const quest = QUESTS[questId];
  if (!quest) throw new Error("Quest not found");

  try {
    const progress = await prisma.questProgress.findUnique({
      where: { userId_questId: { userId, questId } }
    });

    if (!progress || progress.status !== 'COMPLETED') {
      throw new Error("Quest reward not claimable");
    }

    await prisma.$transaction([
      prisma.questProgress.update({
        where: { id: progress.id },
        data: { status: 'CLAIMED' }
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          coins: { increment: quest.rewardCoins },
          gems: { increment: quest.rewardGems }
        }
      })
    ]);

    await addXp(userId, quest.rewardXp);
    return { success: true, coinsReward: quest.rewardCoins, gemsReward: quest.rewardGems, xpReward: quest.rewardXp };
  } catch (e: any) {
    console.warn("⚠️ Database transaction failed in claimQuestReward. Falling back to memory.", e);
    
    // Memory fallback logic
    const list = MEMORY_DB.quests.get(userId) || [];
    const progress = list.find(q => q.questId === questId);
    if (!progress || progress.status !== 'COMPLETED') throw new Error("Quest not completed or already claimed");

    progress.status = 'CLAIMED';
    await addCoins(userId, quest.rewardCoins, quest.rewardGems);
    await addXp(userId, quest.rewardXp);
    return { success: true, coinsReward: quest.rewardCoins, gemsReward: quest.rewardGems, xpReward: quest.rewardXp };
  }
}

export async function unlockAchievement(userId: string, achId: string) {
  const ach = ACHIEVEMENTS[achId];
  if (!ach) return null;

  try {
    const existing = await prisma.achievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: achId } }
    });
    if (existing) return null;

    const newAch = await prisma.achievement.create({
      data: { userId, achievementId: achId }
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        coins: { increment: ach.rewardCoins },
        gems: { increment: ach.rewardGems },
        activeBadge: ach.badgeName
      }
    });

    return newAch;
  } catch (e) {
    console.warn("⚠️ Database query failed in unlockAchievement. Falling back to memory.", e);
    const list = MEMORY_DB.achievements.get(userId) || [];
    if (list.some(a => a.achievementId === achId)) return null;

    const newAch = { id: `ach-${achId}-${Date.now()}`, userId, achievementId: achId, unlockedAt: new Date() };
    list.push(newAch);
    MEMORY_DB.achievements.set(userId, list);

    await addCoins(userId, ach.rewardCoins, ach.rewardGems);
    
    const user = MEMORY_DB.users.get(userId);
    if (user) {
      user.activeBadge = ach.badgeName;
      MEMORY_DB.users.set(userId, user);
    }

    return newAch;
  }
}

export async function addFriend(userId: string, friendUsername: string) {
  const friend = await getUserByUsername(friendUsername);
  if (!friend) throw new Error("User not found");
  if (friend.id === userId) throw new Error("Cannot add yourself");

  try {
    const existing = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId, friendId: friend.id },
          { userId: friend.id, friendId: userId }
        ]
      }
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') throw new Error("Already friends");
      throw new Error("Request already sent or received");
    }

    await prisma.friend.create({
      data: { userId, friendId: friend.id, status: 'PENDING' }
    });

    return { success: true, status: 'PENDING' };
  } catch (e: any) {
    console.warn("⚠️ Database insert failed in addFriend. Falling back to memory.", e);
    const friends = MEMORY_DB.friends.get(userId) || [];
    if (friends.some(f => f.friendId === friend.id)) {
      throw new Error("Already friends or request pending");
    }

    const request = {
      id: `fr-${userId}-${friend.id}`,
      userId,
      friendId: friend.id,
      status: 'PENDING',
      friend: { id: friend.id, username: friend.username, status: friend.status, activeBadge: friend.activeBadge, level: friend.level }
    };
    friends.push(request);
    MEMORY_DB.friends.set(userId, friends);

    const rFriends = MEMORY_DB.friends.get(friend.id) || [];
    rFriends.push({
      id: `fr-${friend.id}-${userId}`,
      userId: friend.id,
      friendId: userId,
      status: 'PENDING_INCOMING',
      friend: { id: userId, username: (MEMORY_DB.users.get(userId))?.username || 'Guest', status: 'Hey!', activeBadge: 'Newcomer', level: 1 }
    });
    MEMORY_DB.friends.set(friend.id, rFriends);

    return { success: true, status: 'PENDING' };
  }
}

export async function acceptFriend(userId: string, friendId: string) {
  try {
    const req1 = await prisma.friend.findUnique({
      where: { userId_friendId: { userId, friendId } }
    });
    const req2 = await prisma.friend.findUnique({
      where: { userId_friendId: { userId: friendId, friendId: userId } }
    });

    const targetId = req1 ? req1.id : req2?.id;
    if (!targetId) throw new Error("Friend request not found");

    await prisma.friend.update({
      where: { id: targetId },
      data: { status: 'ACCEPTED' }
    });

    await handleQuestProgress(userId, 'weekly_friends');
    await handleQuestProgress(friendId, 'weekly_friends');

    return { success: true };
  } catch (e) {
    console.warn("⚠️ Database update failed in acceptFriend. Falling back to memory.", e);
    const friends = MEMORY_DB.friends.get(userId) || [];
    const request = friends.find(f => f.friendId === friendId);
    if (request) request.status = 'ACCEPTED';

    const rFriends = MEMORY_DB.friends.get(friendId) || [];
    const rRequest = rFriends.find(f => f.friendId === userId);
    if (rRequest) rRequest.status = 'ACCEPTED';

    await handleQuestProgress(userId, 'weekly_friends');
    await handleQuestProgress(friendId, 'weekly_friends');

    return { success: true };
  }
}

export async function getFriendsList(userId: string) {
  try {
    const list = await prisma.friend.findMany({
      where: {
        OR: [
          { userId },
          { friendId: userId }
        ],
        status: 'ACCEPTED'
      },
      include: {
        user: { select: { id: true, username: true, status: true, activeBadge: true, level: true } },
        friend: { select: { id: true, username: true, status: true, activeBadge: true, level: true } }
      }
    });

    return list.map(f => {
      if (f.userId === userId) {
        return { friendId: f.friendId, friend: f.friend, status: 'ACCEPTED' };
      } else {
        return { friendId: f.userId, friend: f.user, status: 'ACCEPTED' };
      }
    });
  } catch (e) {
    console.warn("⚠️ Database query failed in getFriendsList. Falling back to memory.", e);
    return MEMORY_DB.friends.get(userId) || [];
  }
}

export async function getLeaderboard() {
  try {
    const byCoins = await prisma.user.findMany({
      select: { id: true, username: true, coins: true, level: true, activeBadge: true },
      orderBy: { coins: 'desc' },
      take: 10
    });
    const byLevel = await prisma.user.findMany({
      select: { id: true, username: true, coins: true, level: true, activeBadge: true },
      orderBy: { level: 'desc' },
      take: 10
    });
    return { byCoins, byLevel };
  } catch (e) {
    console.warn("⚠️ Database query failed in getLeaderboard. Falling back to memory.", e);
    const list = Array.from(MEMORY_DB.users.values()).map(u => ({
      id: u.id,
      username: u.username,
      coins: u.coins,
      gems: u.gems,
      level: u.level,
      xp: u.xp,
      activeBadge: u.activeBadge
    }));
    return {
      byCoins: [...list].sort((a, b) => b.coins - a.coins).slice(0, 10),
      byLevel: [...list].sort((a, b) => b.level - a.level).slice(0, 10)
    };
  }
}

export async function addMatchRecord(userId: string, gameId: string, result: 'WIN' | 'LOSS' | 'DRAW', score: number) {
  let coinsEarned = 50;
  let xpEarned = 25;
  if (result === 'WIN') {
    coinsEarned = 150;
    xpEarned = 75;
  } else if (result === 'DRAW') {
    coinsEarned = 80;
    xpEarned = 40;
  }

  try {
    const newMatch = await prisma.matchHistory.create({
      data: { userId, gameId, result, score, coinsEarned, xpEarned }
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        coins: { increment: coinsEarned }
      }
    });
    await addXp(userId, xpEarned);

    await handleQuestProgress(userId, 'daily_game');
    await handleQuestProgress(userId, 'weekly_games');

    if (result === 'WIN') {
      const totalWins = await prisma.matchHistory.count({
        where: { userId, result: 'WIN' }
      });
      if (totalWins >= 10) {
        await unlockAchievement(userId, 'game_conqueror');
      }
    }

    return newMatch;
  } catch (e) {
    console.warn("⚠️ Database query failed in addMatchRecord. Falling back to memory.", e);
    const matches = MEMORY_DB.matches.get(userId) || [];
    const newMatch = { id: `m-${Date.now()}`, userId, gameId, result, score, coinsEarned, xpEarned, playedAt: new Date() };
    matches.push(newMatch);
    MEMORY_DB.matches.set(userId, matches);

    await addCoins(userId, coinsEarned);
    await addXp(userId, xpEarned);

    await handleQuestProgress(userId, 'daily_game');
    await handleQuestProgress(userId, 'weekly_games');

    if (result === 'WIN') {
      const winsCount = matches.filter(m => m.result === 'WIN').length;
      if (winsCount >= 10) {
        await unlockAchievement(userId, 'game_conqueror');
      }
    }

    return newMatch;
  }
}
