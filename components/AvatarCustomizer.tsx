'use client';

import React, { useState } from 'react';
import { GAME_ITEMS } from '@/lib/items';
import { ShieldAlert, Sparkles, Check, Shirt, HelpCircle, Palette, Milestone } from 'lucide-react';

interface AvatarCustomizerProps {
  currentAvatar: any;
  ownedItems: string[]; // itemIds
  onEquipItem: (itemId: string, equip: boolean) => Promise<void>;
  onClose: () => void;
  avatarColors?: any;
}

export default function AvatarCustomizer({
  currentAvatar,
  ownedItems,
  onEquipItem,
  onClose,
}: AvatarCustomizerProps) {
  const [activeTab, setActiveTab] = useState<'hair' | 'shirt' | 'pants' | 'hat' | 'glasses' | 'accessory' | 'skin'>('hair');
  const [saving, setSaving] = useState(false);

  // Default color options for skin
  const skinColors = ['#ffd1a9', '#f3a07a', '#c68642', '#8d5524', '#2c1b18', '#00ffcc', '#e2e2e2'];

  const handleSelectSkin = async (color: string) => {
    setSaving(true);
    try {
      const updated = { ...currentAvatar, skin: color };
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          avatarCustomization: updated,
        }),
      });
      await onEquipItem('avatar_human', true);
      currentAvatar.skin = color;
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectItem = async (itemId: string, category: string) => {
    setSaving(true);
    try {
      const isEquipped = currentAvatar[category] === itemId;
      await onEquipItem(itemId, !isEquipped);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const itemsInTab = Object.values(GAME_ITEMS).filter(
    (item) => item.type === 'CLOTHING' && item.category === activeTab
  );

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

        {/* LEFT COLUMN: LIVE AVATAR PREVIEW */}
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-950/40 p-6 border border-white/5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-4 left-4 flex items-center gap-1.5 text-xs text-purple-400 font-semibold tracking-wider uppercase">
            <Sparkles className="w-4 h-4 text-purple-400" /> Preview
          </div>
          
          {/* DYNAMIC SVG PLAYER PREVIEW */}
          <div className="relative w-48 h-48 bg-slate-950/80 border border-white/5 rounded-2xl flex items-center justify-center p-4 shadow-inner">
            <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
              {/* Backpack / Wings */}
              {currentAvatar.backpack === 'backpack_wings' && (
                <path d="M 15 50 Q 0 20 35 40 Q 5 60 20 80 Z M 85 50 Q 100 20 65 40 Q 95 60 80 80 Z" fill="#ee82ee" opacity="0.8" />
              )}
              
              {/* Pet follows */}
              {currentAvatar.pet && currentAvatar.pet !== 'none' && (
                <circle cx="18" cy="95" r="8" fill={currentAvatar.pet.includes('dragon') ? '#ff4500' : currentAvatar.pet.includes('fox') ? '#9370db' : '#ff8c00'} className="animate-bounce" />
              )}

              {/* Body (Skin) */}
              <circle cx="50" cy="40" r="16" fill={currentAvatar.skin || '#ffd1a9'} />
              <rect x="34" y="56" width="32" height="30" rx="4" fill={currentAvatar.skin || '#ffd1a9'} />
              <rect x="36" y="86" width="10" height="20" rx="2" fill={currentAvatar.skin || '#ffd1a9'} />
              <rect x="54" y="86" width="10" height="20" rx="2" fill={currentAvatar.skin || '#ffd1a9'} />

              {/* Eyes */}
              <circle cx="44" cy="38" r="2" fill="#000" />
              <circle cx="56" cy="38" r="2" fill="#000" />
              
              {/* Face Details */}
              <path d="M 46 45 Q 50 48 54 45" stroke="#000" strokeWidth="1.5" fill="none" />

              {/* Hair Layer */}
              {currentAvatar.hair && GAME_ITEMS[currentAvatar.hair] && (
                <path
                  d="M 32 36 Q 50 15 68 36 Q 72 45 68 40 Q 50 30 32 40 Z"
                  fill={GAME_ITEMS[currentAvatar.hair].assetData?.color || '#8b4513'}
                />
              )}

              {/* Shirt Layer */}
              {currentAvatar.shirt && GAME_ITEMS[currentAvatar.shirt] && (
                <rect
                  x="34"
                  y="56"
                  width="32"
                  height="26"
                  rx="2"
                  fill={GAME_ITEMS[currentAvatar.shirt].assetData?.color || '#4169e1'}
                />
              )}

              {/* Pants Layer */}
              {currentAvatar.pants && GAME_ITEMS[currentAvatar.pants] && (
                <rect
                  x="34"
                  y="78"
                  width="32"
                  height="12"
                  fill={GAME_ITEMS[currentAvatar.pants].assetData?.color || '#2f4f4f'}
                />
              )}

              {/* Shoes Layer */}
              {currentAvatar.shoes && GAME_ITEMS[currentAvatar.shoes] && (
                <>
                  <rect x="35" y="102" width="12" height="5" fill={GAME_ITEMS[currentAvatar.shoes].assetData?.color || '#fff'} rx="1" />
                  <rect x="53" y="102" width="12" height="5" fill={GAME_ITEMS[currentAvatar.shoes].assetData?.color || '#fff'} rx="1" />
                </>
              )}

              {/* Hat Layer */}
              {currentAvatar.hat && currentAvatar.hat !== 'hat_none' && GAME_ITEMS[currentAvatar.hat] && (
                <path
                  d="M 28 28 L 72 28 L 50 10 Z"
                  fill={GAME_ITEMS[currentAvatar.hat].assetData?.color || '#ffd700'}
                />
              )}

              {/* Glasses Layer */}
              {currentAvatar.glasses && currentAvatar.glasses !== 'glasses_none' && GAME_ITEMS[currentAvatar.glasses] && (
                <rect
                  x="38"
                  y="36"
                  width="24"
                  height="4"
                  rx="1"
                  fill={GAME_ITEMS[currentAvatar.glasses].assetData?.color || '#ff00ff'}
                  opacity="0.85"
                />
              )}

              {/* Hand Accessory */}
              {currentAvatar.accessory && currentAvatar.accessory !== 'accessory_none' && GAME_ITEMS[currentAvatar.accessory] && (
                <path d="M 25 65 L 15 95" stroke="#c0c0c0" strokeWidth="3" strokeLinecap="round" />
              )}
            </svg>
          </div>

          <div className="mt-4 text-center">
            <h3 className="font-semibold text-slate-100 text-sm">Pixel Citizen</h3>
            <p className="text-xs text-slate-400 mt-1">Level {currentAvatar.level || 1}</p>
          </div>
        </div>

        {/* RIGHT COLUMN: EDITOR CONTROLS */}
        <div className="flex-[1.5] flex flex-col min-h-[380px]">
          <h2 className="font-modern-heading text-xl text-purple-400 mb-4 flex items-center gap-2">
            <Shirt className="w-5 h-5 text-purple-400" /> Character Customization
          </h2>

          {/* TAB HEADERS */}
          <div className="flex flex-wrap bg-slate-950/40 p-1 border border-white/5 rounded-xl gap-1 mb-4">
            {(['hair', 'shirt', 'pants', 'hat', 'glasses', 'accessory', 'skin'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TAB BODY CONTENTS */}
          <div className="flex-1 overflow-y-auto max-h-[300px] pr-2">
            {activeTab === 'skin' ? (
              <div className="p-1">
                <h4 className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  <Palette className="w-4 h-4 text-purple-400" /> Choose Skin Tone
                </h4>
                <div className="flex flex-wrap gap-3">
                  {skinColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleSelectSkin(color)}
                      style={{ backgroundColor: color }}
                      className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-105 flex items-center justify-center ${
                        currentAvatar.skin === color ? 'border-purple-500 scale-105 ring-2 ring-purple-500/20' : 'border-slate-800 hover:border-slate-700'
                      }`}
                      title={color}
                    >
                      {currentAvatar.skin === color && (
                        <Check className="w-5 h-5 text-black drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {itemsInTab.map((item) => {
                    const isOwned = ownedItems.includes(item.id) || item.costCoins === 0;
                    const isEquipped = currentAvatar[item.category!] === item.id;
                    const isPremium = item.isPremium;

                    return (
                      <div
                        key={item.id}
                        onClick={() => isOwned && handleSelectItem(item.id, item.category!)}
                        className={`border rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer ${
                          !isOwned
                            ? 'border-slate-850 bg-slate-950/20 opacity-50 cursor-not-allowed'
                            : isEquipped
                            ? 'border-purple-500 bg-purple-950/20 shadow-md shadow-purple-500/5'
                            : 'border-white/5 bg-slate-900/60 hover:border-white/10 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            style={{
                              backgroundColor: item.assetData?.color || '#7b2cbf',
                            }}
                            className="w-10 h-10 border border-white/10 rounded-xl flex items-center justify-center text-lg shadow-inner"
                          >
                            👕
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-100">{item.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{item.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isPremium && (
                            <span className="text-[8px] font-bold bg-yellow-400 text-black px-1.5 py-0.5 rounded">
                              VIP
                            </span>
                          )}
                          {!isOwned ? (
                            <span className="text-[10px] text-slate-500 font-medium">
                              🔒 Shop
                            </span>
                          ) : isEquipped ? (
                            <span className="text-xs text-purple-400 font-semibold flex items-center gap-0.5">
                              ✓ Use
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Equip</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {itemsInTab.length === 0 && (
                  <div className="text-center py-12 text-slate-500 text-xs font-medium">
                    No items in this category.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Milestone className="w-3.5 h-3.5" /> Changes save automatically
            </span>
            <button
              onClick={onClose}
              disabled={saving}
              className="modern-btn modern-btn-primary text-xs"
            >
              {saving ? 'Saving...' : 'Confirm Setup'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
