export interface GameItem {
  id: string;
  name: string;
  description: string;
  type: 'CLOTHING' | 'AVATAR_MODEL' | 'PET' | 'FURNITURE';
  category?: string; // hair, eyes, shirt, pants, shoes, hat, glasses, accessory, pet, furniture, etc.
  costCoins: number;
  costGems: number;
  isPremium?: boolean;
  isCreator?: boolean;
  creatorId?: string;
  assetData?: any; // colors, styles, icon keys
}

export const GAME_ITEMS: Record<string, GameItem> = {
  // CLOTHING: HAIR
  'hair_short_brown': {
    id: 'hair_short_brown',
    name: 'Short Brown Hair',
    description: 'A simple and tidy brown hairstyle.',
    type: 'CLOTHING',
    category: 'hair',
    costCoins: 0,
    costGems: 0,
    assetData: { color: '#8b4513', style: 'short' }
  },
  'hair_neon_pink': {
    id: 'hair_neon_pink',
    name: 'Neon Pink Pixie',
    description: 'Stand out in the dark with neon pink!',
    type: 'CLOTHING',
    category: 'hair',
    costCoins: 350,
    costGems: 0,
    assetData: { color: '#ff1493', style: 'pixie' }
  },
  'hair_wizard_long': {
    id: 'hair_wizard_long',
    name: 'Wizard White Beard & Hair',
    description: 'Wise beyond years, flowing white hair.',
    type: 'CLOTHING',
    category: 'hair',
    costCoins: 800,
    costGems: 5,
    assetData: { color: '#f8f8ff', style: 'beard_long' }
  },
  'hair_spiky_blue': {
    id: 'hair_spiky_blue',
    name: 'Spiky Anime Blue',
    description: 'Channel your inner protagonist.',
    type: 'CLOTHING',
    category: 'hair',
    costCoins: 500,
    costGems: 0,
    assetData: { color: '#00bfff', style: 'spiky' }
  },

  // CLOTHING: SHIRT
  'shirt_basic_blue': {
    id: 'shirt_basic_blue',
    name: 'Basic Blue Tee',
    description: 'Comfortable everyday blue t-shirt.',
    type: 'CLOTHING',
    category: 'shirt',
    costCoins: 0,
    costGems: 0,
    assetData: { color: '#4169e1', style: 'tshirt' }
  },
  'shirt_vip_hoodie': {
    id: 'shirt_vip_hoodie',
    name: 'Golden VIP Hoodie',
    description: 'Gold-embroidered luxury wear.',
    type: 'CLOTHING',
    category: 'shirt',
    costCoins: 0,
    costGems: 20,
    isPremium: true,
    assetData: { color: '#ffd700', style: 'hoodie', hasGlow: true }
  },
  'shirt_cyber_neon': {
    id: 'shirt_cyber_neon',
    name: 'Cyberpunk Neon Jacket',
    description: 'LED-infused futuristic jacket.',
    type: 'CLOTHING',
    category: 'shirt',
    costCoins: 1200,
    costGems: 10,
    assetData: { color: '#39ff14', style: 'cyber_jacket' }
  },
  'shirt_pirate_coat': {
    id: 'shirt_pirate_coat',
    name: 'Pirate Captain Coat',
    description: 'Fierce red coat with gold epaulets.',
    type: 'CLOTHING',
    category: 'shirt',
    costCoins: 900,
    costGems: 0,
    assetData: { color: '#b22222', style: 'pirate_coat' }
  },

  // CLOTHING: PANTS
  'pants_basic_jeans': {
    id: 'pants_basic_jeans',
    name: 'Basic Jeans',
    description: 'Classic denim jeans.',
    type: 'CLOTHING',
    category: 'pants',
    costCoins: 0,
    costGems: 0,
    assetData: { color: '#2f4f4f', style: 'jeans' }
  },
  'pants_vip_joggers': {
    id: 'pants_vip_joggers',
    name: 'Golden VIP Joggers',
    description: 'Sleek dark joggers with gold stripes.',
    type: 'CLOTHING',
    category: 'pants',
    costCoins: 0,
    costGems: 15,
    isPremium: true,
    assetData: { color: '#111111', secondaryColor: '#ffd700', style: 'joggers' }
  },
  'pants_ninja_hakama': {
    id: 'pants_ninja_hakama',
    name: 'Ninja Shadow Hakama',
    description: 'Lightweight and silent trousers.',
    type: 'CLOTHING',
    category: 'pants',
    costCoins: 600,
    costGems: 0,
    assetData: { color: '#2e2e2e', style: 'hakama' }
  },

  // CLOTHING: SHOES
  'shoes_sneakers_white': {
    id: 'shoes_sneakers_white',
    name: 'White Sneakers',
    description: 'Fresh and sporty sneakers.',
    type: 'CLOTHING',
    category: 'shoes',
    costCoins: 0,
    costGems: 0,
    assetData: { color: '#ffffff', style: 'sneakers' }
  },
  'shoes_cyber_boots': {
    id: 'shoes_cyber_boots',
    name: 'Cyber Hover Boots',
    description: 'Glow-in-the-dark hover sneakers.',
    type: 'CLOTHING',
    category: 'shoes',
    costCoins: 950,
    costGems: 8,
    assetData: { color: '#00ffff', style: 'hover_boots' }
  },

  // CLOTHING: HATS
  'hat_none': {
    id: 'hat_none',
    name: 'No Hat',
    description: 'Show off your hair.',
    type: 'CLOTHING',
    category: 'hat',
    costCoins: 0,
    costGems: 0,
    assetData: { color: 'transparent', style: 'none' }
  },
  'hat_pirate_tricorn': {
    id: 'hat_pirate_tricorn',
    name: 'Pirate Tricorn',
    description: 'With a skull-and-bones insignia.',
    type: 'CLOTHING',
    category: 'hat',
    costCoins: 750,
    costGems: 2,
    assetData: { color: '#1a1a1a', style: 'tricorn' }
  },
  'hat_wizard_pointed': {
    id: 'hat_wizard_pointed',
    name: 'Wizard Pointed Hat',
    description: 'Starred hat brimmed with magical energy.',
    type: 'CLOTHING',
    category: 'hat',
    costCoins: 1100,
    costGems: 8,
    assetData: { color: '#4b0082', style: 'pointed_hat' }
  },
  'hat_crown': {
    id: 'hat_crown',
    name: 'Imperial Crown',
    description: 'Fit for royalty. Heavy lies the head.',
    type: 'CLOTHING',
    category: 'hat',
    costCoins: 10000,
    costGems: 50,
    assetData: { color: '#ffd700', style: 'crown' }
  },

  // CLOTHING: GLASSES
  'glasses_none': {
    id: 'glasses_none',
    name: 'No Glasses',
    description: 'Perfect 20/20 vision.',
    type: 'CLOTHING',
    category: 'glasses',
    costCoins: 0,
    costGems: 0,
    assetData: { style: 'none' }
  },
  'glasses_sun': {
    id: 'glasses_sun',
    name: 'Cool Aviators',
    description: 'Blocks 99% of sun and 100% of haters.',
    type: 'CLOTHING',
    category: 'glasses',
    costCoins: 250,
    costGems: 0,
    assetData: { color: '#000000', style: 'aviator' }
  },
  'glasses_cyber_visor': {
    id: 'glasses_cyber_visor',
    name: 'Cyber HUD Visor',
    description: 'Streams system data directly to your retina.',
    type: 'CLOTHING',
    category: 'glasses',
    costCoins: 850,
    costGems: 5,
    assetData: { color: '#ff00ff', style: 'visor' }
  },

  // CLOTHING: ACCESSORIES & BACKPACKS
  'accessory_none': {
    id: 'accessory_none',
    name: 'No Accessory',
    description: 'Clean look.',
    type: 'CLOTHING',
    category: 'accessory',
    costCoins: 0,
    costGems: 0,
    assetData: { style: 'none' }
  },
  'accessory_katana': {
    id: 'accessory_katana',
    name: 'Samurai Katana',
    description: 'Sheathed sword on your hip.',
    type: 'CLOTHING',
    category: 'accessory',
    costCoins: 2000,
    costGems: 12,
    assetData: { color: '#c0c0c0', style: 'katana' }
  },
  'backpack_wings': {
    id: 'backpack_wings',
    name: 'Cosmic Fairy Wings',
    description: 'Sparkling wings that gently hover.',
    type: 'CLOTHING',
    category: 'backpack',
    costCoins: 5000,
    costGems: 25,
    assetData: { color: '#ee82ee', style: 'wings' }
  },

  // AVATAR MODELS
  'avatar_human': {
    id: 'avatar_human',
    name: 'Classic Human',
    description: 'The standard model with maximum customization.',
    type: 'AVATAR_MODEL',
    costCoins: 0,
    costGems: 0,
    assetData: { model: 'human' }
  },
  'avatar_robot': {
    id: 'avatar_robot',
    name: 'C-3PO Bot',
    description: 'A modular copper android model.',
    type: 'AVATAR_MODEL',
    costCoins: 2000,
    costGems: 15,
    assetData: { model: 'robot', color: '#cd7f32' }
  },
  'avatar_ninja': {
    id: 'avatar_ninja',
    name: 'Shadow Ninja',
    description: 'Draped in pure darkness.',
    type: 'AVATAR_MODEL',
    costCoins: 1500,
    costGems: 0,
    assetData: { model: 'ninja', color: '#1a1a1a' }
  },
  'avatar_alien': {
    id: 'avatar_alien',
    name: 'Zorgon Alien',
    description: 'A cute green extraterrestrial with antennas.',
    type: 'AVATAR_MODEL',
    costCoins: 3000,
    costGems: 20,
    assetData: { model: 'alien', color: '#32cd32' }
  },

  // PETS
  'pet_cat_ginger': {
    id: 'pet_cat_ginger',
    name: 'Ginger Kitten',
    description: 'A cute, meowing ginger kitty.',
    type: 'PET',
    costCoins: 800,
    costGems: 0,
    assetData: { color: '#ff8c00', style: 'cat', anim: 'bounce' }
  },
  'pet_dog_pug': {
    id: 'pet_dog_pug',
    name: 'Puggy',
    description: 'Pant-pant! Always happy to follow you.',
    type: 'PET',
    costCoins: 900,
    costGems: 0,
    assetData: { color: '#e5c583', style: 'dog', anim: 'wag' }
  },
  'pet_fox_mystic': {
    id: 'pet_fox_mystic',
    name: 'Mystic Nebula Fox',
    description: 'A purple glowing celestial fox.',
    type: 'PET',
    costCoins: 2500,
    costGems: 15,
    assetData: { color: '#9370db', style: 'fox', anim: 'float', glow: true }
  },
  'pet_dragon_baby': {
    id: 'pet_dragon_baby',
    name: 'Baby Fire Dragon',
    description: 'Flaps small wings and occasionally puffs smoke.',
    type: 'PET',
    costCoins: 8000,
    costGems: 45,
    isPremium: true,
    assetData: { color: '#ff4500', style: 'dragon', anim: 'fly' }
  },

  // FURNITURE
  'furn_modern_bed': {
    id: 'furn_modern_bed',
    name: 'Cyberpunk Led Bed',
    description: 'Float to sleep with custom base lighting.',
    type: 'FURNITURE',
    category: 'bed',
    costCoins: 1500,
    costGems: 5,
    assetData: { w: 3, h: 2, color: '#00ffff' }
  },
  'furn_gaming_setup': {
    id: 'furn_gaming_setup',
    name: 'Ultimate RGB BattleStation',
    description: 'Triple monitors, mechanical keyboard, and watercooled rig.',
    type: 'FURNITURE',
    category: 'desk',
    costCoins: 4000,
    costGems: 20,
    assetData: { w: 3, h: 2, color: '#ff00ff' }
  },
  'furn_comfy_sofa': {
    id: 'furn_comfy_sofa',
    name: 'Retro Velvet Sofa',
    description: 'Super soft red sofa.',
    type: 'FURNITURE',
    category: 'chair',
    costCoins: 800,
    costGems: 0,
    assetData: { w: 2, h: 1, color: '#dc143c' }
  },
  'furn_pot_plant': {
    id: 'furn_pot_plant',
    name: 'Monstera Delicious Plant',
    description: 'Adds organic life to your private server room.',
    type: 'FURNITURE',
    category: 'plant',
    costCoins: 300,
    costGems: 0,
    assetData: { w: 1, h: 1, color: '#228b22' }
  },
  'furn_juke_box': {
    id: 'furn_juke_box',
    name: 'Retro Jukebox',
    description: 'Plays sweet pixel beats in your room.',
    type: 'FURNITURE',
    category: 'music',
    costCoins: 2500,
    costGems: 10,
    assetData: { w: 1, h: 2, color: '#ffd700' }
  }
};
