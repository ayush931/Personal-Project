'use client';

import React, { useState } from 'react';
import { GAME_ITEMS } from '@/lib/items';
import { Shield, Sparkles, User, Package, Award, Smile } from 'lucide-react';

interface InventoryPanelProps {
  user: any;
  inventory: any[]; // items owned
  onEquipItem: (itemId: string, equip: boolean) => Promise<void>;
  onTriggerEmote: (emoteKey: string) => void;
  onUpdateBadge: (badgeName: string) => Promise<void>;
  onClose: () => void;
}

export default function InventoryPanel({
  user,
  inventory,
  onEquipItem,
  onTriggerEmote,
  onUpdateBadge,
  onClose,
}: InventoryPanelProps) {
  const [activeTab, setActiveTab] = useState<'CLOTHING' | 'PET' | 'FURNITURE' | 'EMOTES'>('CLOTHING');
  const [updatingBadge, setUpdatingBadge] = useState(false);

  // Available animated emotes list
  const EMOTES_LIST = [
    { key: 'wave', name: 'Wave 👋', desc: 'Greet fellow citizens' },
    { key: 'dance', name: 'Dance 🕺', desc: 'Show off your retro grooves' },
    { key: 'wave_hands', name: 'Wave Hands 🙌', desc: 'Excited greeting' },
    { key: 'laugh', name: 'Laugh 😂', desc: 'Share some pixels of humor' },
    { key: 'cry', name: 'Cry 😢', desc: 'Feeling a bit pixel-sad' },
    { key: 'sit', name: 'Sit 🪑', desc: 'Take a break and sit down' },
    { key: 'sleep', name: 'Sleep 😴', desc: 'Sweet dreams in retro world' },
    { key: 'celebrate', name: 'Celebrate 🎉', desc: 'Throw up confetti!' }
  ];

  // List of unlocked badges from user achievements
  const getUnlockedBadges = () => {
    const list = ['Newcomer'];
    if (user.role === 'ADMIN') list.push('Creator');
    if (user.role === 'VIP') list.push('Elite');
    
    if (user.achievements) {
      user.achievements.forEach((ach: any) => {
        if (ach.achievementId === 'first_steps') list.push('Pioneer');
        if (ach.achievementId === 'chatty_cat') list.push('Speaker');
        if (ach.achievementId === 'game_conqueror') list.push('Pro Gamer');
        if (ach.achievementId === 'big_spender') list.push('Collector');
        if (ach.achievementId === 'pet_collector') list.push('Pet Lover');
        if (ach.achievementId === 'interior_designer') list.push('Decorator');
        if (ach.achievementId === 'guild_founder') list.push('Team Player');
      });
    }
    return Array.from(new Set(list));
  };

  const handleSelectBadge = async (badgeName: string) => {
    if (updatingBadge) return;
    setUpdatingBadge(true);
    try {
      await onUpdateBadge(badgeName);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingBadge(false);
    }
  };

  const ownedItemsInTab = inventory.filter((item) => {
    if (activeTab === 'EMOTES') return false;
    return item.itemType === activeTab;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="modern-panel relative w-full max-w-4xl p-6 flex flex-col md:flex-row gap-6">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 modern-btn modern-btn-accent text-sm w-9 h-9 rounded-full p-0 flex items-center justify-center shadow-lg"
        >
          ✕
        </button>

        {/* LEFT COLUMN: USER PROFILE STATS & BADGES */}
        <div className="flex-1 flex flex-col bg-slate-950/40 p-5 border border-white/5 rounded-2xl">
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-12 h-12 bg-purple-950/80 border border-purple-800/30 rounded-2xl flex items-center justify-center text-xl shadow-md">
              👤
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">{user.username}</h3>
                {user.role === 'ADMIN' && (
                  <span className="text-[8px] font-bold bg-red-650 text-white px-2 py-0.5 rounded">ADMIN</span>
                )}
                {user.role === 'VIP' && (
                  <span className="text-[8px] font-bold bg-yellow-500 text-black px-2 py-0.5 rounded">VIP</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 italic">"{user.status}"</p>
            </div>
          </div>

          {/* Level Progress */}
          <div className="space-y-2 mb-6 bg-slate-900/60 p-4 border border-white/5 rounded-2xl">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-purple-400 font-bold">Level {user.level}</span>
              <span className="text-slate-400">{user.xp} / {user.level * 500} XP</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
              <div
                style={{ width: `${Math.min(100, (user.xp / (user.level * 500)) * 100)}%` }}
                className="bg-purple-500 h-full rounded-full transition-all duration-300"
              />
            </div>
          </div>

          {/* BADGE SYSTEM */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <Award className="w-4 h-4 text-purple-400" /> Active Title Badge
            </h4>
            
            <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1">
              {getUnlockedBadges().map((badge) => (
                <button
                  key={badge}
                  onClick={() => handleSelectBadge(badge)}
                  disabled={updatingBadge}
                  className={`text-[10px] font-semibold px-2.5 py-1.5 border rounded-lg transition-all ${
                    user.activeBadge === badge
                      ? 'border-purple-500 bg-purple-950/20 text-purple-300'
                      : 'border-white/5 bg-slate-900/50 text-slate-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  {badge === 'Newcomer' ? '🆕 Newcomer' : badge === 'Pioneer' ? '👣 Pioneer' : badge === 'Speaker' ? '💬 Speaker' : badge === 'Pro Gamer' ? '🎮 Pro Gamer' : badge === 'Collector' ? '🛍️ Collector' : badge === 'Pet Lover' ? '🐾 Pet Lover' : badge === 'Decorator' ? '🛋️ Decorator' : badge === 'Team Player' ? '🛡️ Team Player' : badge === 'Creator' ? '🛠️ Creator' : `⭐ ${badge}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INVENTORY ITEMS */}
        <div className="flex-[1.5] flex flex-col min-h-[380px]">
          <h2 className="font-modern-heading text-xl text-purple-400 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-400" /> Inventory Bag
          </h2>

          {/* TABS */}
          <div className="flex bg-slate-950/40 p-1 border border-white/5 rounded-xl gap-1 mb-4">
            {(['CLOTHING', 'PET', 'FURNITURE', 'EMOTES'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'CLOTHING' ? 'Clothing' : tab === 'PET' ? 'Pets' : tab === 'FURNITURE' ? 'Furniture' : 'Emotes'}
              </button>
            ))}
          </div>

          {/* CONTENT GRID */}
          <div className="flex-1 overflow-y-auto max-h-[250px] pr-2">
            {activeTab === 'EMOTES' ? (
              <div className="grid grid-cols-2 gap-3.5">
                {EMOTES_LIST.map((emote) => (
                  <button
                    key={emote.key}
                    onClick={() => {
                      onTriggerEmote(emote.key);
                      onClose();
                    }}
                    className="border border-white/5 bg-slate-900/60 hover:border-purple-500 hover:bg-purple-950/10 p-3 rounded-xl text-left transition-all flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground">{emote.name}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{emote.desc}</p>
                    </div>
                    <Smile className="w-4 h-4 text-purple-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {ownedItemsInTab.map((invItem) => {
                  const item = GAME_ITEMS[invItem.itemId];
                  if (!item) return null;
                  const isEquipped = invItem.equipped;

                  return (
                    <div
                      key={invItem.id}
                      onClick={() => onEquipItem(item.id, !isEquipped)}
                      className={`modern-card p-3 flex items-center justify-between border cursor-pointer ${
                        isEquipped
                          ? 'border-purple-500 bg-purple-950/20 shadow-md shadow-purple-500/5'
                          : 'border-white/5 bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          style={{ backgroundColor: item.assetData?.color || '#7b2cbf' }}
                          className="w-10 h-10 border border-white/10 rounded-xl flex items-center justify-center text-lg shadow-inner"
                        >
                          {item.type === 'PET' ? '🐾' : item.type === 'FURNITURE' ? '🛋' : '👕'}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{item.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.description}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-semibold ${isEquipped ? 'text-purple-400' : 'text-slate-400'}`}>
                        {isEquipped ? '✓ Equipped' : 'Equip'}
                      </span>
                    </div>
                  );
                })}
                {ownedItemsInTab.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-slate-500 text-xs font-medium">
                    No items owned in this category. Visit the Shop to adopt pets or buy decorations!
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 text-right">
            <button
              onClick={onClose}
              className="modern-btn modern-btn-primary text-xs"
            >
              Close Inventory
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
