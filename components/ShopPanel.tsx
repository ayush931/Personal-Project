'use client';

import React, { useState } from 'react';
import { GAME_ITEMS, GameItem } from '@/lib/items';
import { Coins, Gem, ShoppingBag, PlusCircle, HelpCircle, Check, Info, Sparkles } from 'lucide-react';
import canvasConfetti from 'canvas-confetti';

interface ShopPanelProps {
  userCoins: number;
  userGems: number;
  ownedItemIds: string[];
  onPurchaseSuccess: (itemId: string, costCoins: number, costGems: number) => void;
  onClose: () => void;
}

export default function ShopPanel({
  userCoins,
  userGems,
  ownedItemIds,
  onPurchaseSuccess,
  onClose,
}: ShopPanelProps) {
  const [activeTab, setActiveTab] = useState<'CLOTHING' | 'AVATAR_MODEL' | 'PET' | 'FURNITURE' | 'CREATOR'>('CLOTHING');
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Creator items listing (custom creator store designs)
  const creatorItems: GameItem[] = [
    {
      id: 'creator_sword_red',
      name: 'Demon Flame Sword',
      description: 'Hand-forged creator sword accessory.',
      type: 'CLOTHING',
      category: 'accessory',
      costCoins: 1500,
      costGems: 0,
      isCreator: true,
      assetData: { color: '#ff0000', style: 'sword' }
    },
    {
      id: 'creator_hoodie_pink',
      name: 'Cyber Bubblegum Hoodie',
      description: 'Custom creator design. Glow in the dark.',
      type: 'CLOTHING',
      category: 'shirt',
      costCoins: 800,
      costGems: 0,
      isCreator: true,
      assetData: { color: '#ff69b4', style: 'hoodie' }
    },
    {
      id: 'creator_neon_cat',
      name: 'Vaporwave Robo Cat',
      description: 'Synthesized cyber feline. Follows you anywhere.',
      type: 'PET',
      costCoins: 0,
      costGems: 12,
      isCreator: true,
      assetData: { color: '#00ffcc', style: 'cat' }
    }
  ];

  const handleBuyItem = async () => {
    if (!selectedItem) return;
    setPurchasing(true);
    setErrorText('');

    try {
      const response = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: selectedItem.id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete transaction');
      }

      canvasConfetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      onPurchaseSuccess(selectedItem.id, selectedItem.costCoins, selectedItem.costGems);
      setSelectedItem(null);
    } catch (e: any) {
      setErrorText(e.message || 'Error occurred during purchase');
    } finally {
      setPurchasing(false);
    }
  };

  const getItemsForTab = () => {
    if (activeTab === 'CREATOR') return creatorItems;
    return Object.values(GAME_ITEMS).filter((item) => item.type === activeTab);
  };

  const currentItems = getItemsForTab();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="modern-panel relative w-full max-w-4xl p-6 flex flex-col min-h-[500px]">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 modern-btn modern-btn-accent text-sm w-9 h-9 rounded-full p-0 flex items-center justify-center shadow-lg"
        >
          ✕
        </button>

        {/* HEADER & BALANCES */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-white/5 pb-4">
          <h2 className="font-modern-heading text-xl text-purple-400 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-purple-400" /> Catalog Shopping
          </h2>
          
          <div className="flex gap-3">
            {/* Coins */}
            <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 border border-yellow-500/20 rounded-xl text-xs text-yellow-400 font-semibold shadow-inner">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span>{userCoins.toLocaleString()}</span>
            </div>
            {/* Gems */}
            <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 border border-cyan-500/20 rounded-xl text-xs text-cyan-400 font-semibold shadow-inner">
              <Gem className="w-4 h-4 text-cyan-400" />
              <span>{userGems.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap bg-slate-950/40 p-1 border border-white/5 rounded-xl gap-1 mb-6">
          {(['CLOTHING', 'AVATAR_MODEL', 'PET', 'FURNITURE', 'CREATOR'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedItem(null);
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'AVATAR_MODEL' ? 'Avatars' : tab === 'CLOTHING' ? 'Clothing' : tab === 'PET' ? 'Pets' : tab === 'FURNITURE' ? 'Furniture' : 'Creator Store'}
            </button>
          ))}
        </div>

        {/* BODY PANEL: GRID OF ITEMS & PURCHASE CONFIRMATION */}
        <div className="flex-1 flex flex-col md:flex-row gap-6">
          
          {/* ITEMS GRID */}
          <div className="flex-1 overflow-y-auto max-h-[350px] pr-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentItems.map((item) => {
              const isOwned = ownedItemIds.includes(item.id);
              const isPremium = item.isPremium;

              return (
                <div
                  key={item.id}
                  onClick={() => !isOwned && setSelectedItem(item)}
                  className={`modern-card p-4 flex flex-col justify-between border ${
                    isOwned
                      ? 'border-slate-850 bg-slate-950/20 opacity-55 cursor-default'
                      : selectedItem?.id === item.id
                      ? 'border-purple-500 bg-purple-950/20'
                      : 'border-white/5 bg-slate-900/60'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2.5">
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded uppercase"
                        style={{
                          backgroundColor: item.type === 'PET' ? 'rgba(34, 197, 94, 0.15)' : item.type === 'FURNITURE' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(236, 72, 153, 0.15)',
                          color: item.type === 'PET' ? '#22c55e' : item.type === 'FURNITURE' ? '#3b82f6' : '#ec4899',
                        }}
                      >
                        {item.category || item.type}
                      </span>
                      {isPremium && (
                        <span className="text-[9px] font-bold bg-yellow-400 text-black px-2 py-0.5 rounded">
                          VIP
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5">
                    {isOwned ? (
                      <span className="text-xs text-purple-400 font-semibold flex items-center gap-1">
                        <Check className="w-4 h-4" /> Already Owned
                      </span>
                    ) : (
                      <div className="flex items-center gap-3">
                        {item.costCoins > 0 && (
                          <div className="flex items-center gap-1 text-xs text-yellow-400 font-semibold">
                            🪙 {item.costCoins}
                          </div>
                        )}
                        {item.costGems > 0 && (
                          <div className="flex items-center gap-1 text-xs text-cyan-400 font-semibold">
                            💎 {item.costGems}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PURCHASE SIDEBAR */}
          <div className="w-full md:w-80 bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between shadow-inner">
            {selectedItem ? (
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-inner mb-4">
                    {selectedItem.type === 'PET' ? '🦊' : selectedItem.type === 'FURNITURE' ? '🛋️' : '👕'}
                  </div>
                  <h3 className="font-semibold text-sm text-yellow-400 text-center mb-1">
                    {selectedItem.name}
                  </h3>
                  <p className="text-xs text-slate-400 text-center mb-4 leading-relaxed">
                    {selectedItem.description}
                  </p>
                  
                  {selectedItem.isCreator && (
                    <div className="bg-purple-950/20 border border-purple-500/10 p-2.5 rounded-xl text-center text-xs text-purple-300 font-medium mb-4 flex items-center justify-center gap-1">
                      <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> CREATOR ITEM
                    </div>
                  )}

                  {errorText && (
                    <div className="bg-red-950/40 border border-red-500/20 p-2.5 rounded-xl text-center text-xs text-red-300 font-medium mb-4">
                      ⚠️ {errorText}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-semibold bg-slate-900/60 p-3 rounded-xl border border-white/5">
                    <span>Total Cost:</span>
                    <div className="flex gap-2 font-bold">
                      {selectedItem.costCoins > 0 && (
                        <span className="text-yellow-400">🪙 {selectedItem.costCoins}</span>
                      )}
                      {selectedItem.costGems > 0 && (
                        <span className="text-cyan-400">💎 {selectedItem.costGems}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleBuyItem}
                    disabled={purchasing}
                    className="w-full modern-btn modern-btn-primary py-3"
                  >
                    {purchasing ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs py-12">
                <Info className="w-8 h-8 mb-2.5 text-slate-600" />
                Select an item on the left to purchase.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
