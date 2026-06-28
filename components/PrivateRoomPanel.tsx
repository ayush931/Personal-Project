'use client';

import React, { useState, useEffect } from 'react';
import { GAME_ITEMS } from '@/lib/items';
import { LayoutGrid, Home, Save, RotateCw, Trash2, Plus, Volume2, Info } from 'lucide-react';
import canvasConfetti from 'canvas-confetti';

interface PlacedItem {
  id: string;
  itemId: string;
  x: number; // grid x (0 to 9)
  y: number; // grid y (0 to 9)
  rotation: number; // 0, 90, 180, 270 degrees
}

interface PrivateRoomPanelProps {
  user: any;
  inventory: any[];
  onClose: () => void;
}

export default function PrivateRoomPanel({
  user,
  inventory,
  onClose,
}: PrivateRoomPanelProps) {
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState('cosy_cabin');
  const [playingMusic, setPlayingMusic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roomInfo, setRoomInfo] = useState('');

  // Grid Size
  const GRID_SIZE = 10;

  // Filter owned furniture
  const ownedFurniture = inventory.filter((item) => item.itemType === 'FURNITURE');

  // Load existing room configuration
  useEffect(() => {
    const saved = localStorage.getItem(`pixelverse_room_${user.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPlacedItems(parsed.items || []);
        setActiveTheme(parsed.theme || 'cosy_cabin');
      } catch (e) {
        console.error(e);
      }
    } else {
      setPlacedItems([
        { id: 'placed-1', itemId: 'furn_modern_bed', x: 2, y: 2, rotation: 0 },
        { id: 'placed-2', itemId: 'furn_comfy_sofa', x: 5, y: 6, rotation: 90 },
        { id: 'placed-3', itemId: 'furn_pot_plant', x: 8, y: 1, rotation: 0 }
      ]);
    }
  }, [user]);

  const handleTileClick = (x: number, y: number) => {
    if (!selectedInventoryItem) return;

    if (placedItems.some((item) => item.x === x && item.y === y)) {
      setRoomInfo('Tile already occupied!');
      return;
    }

    const newItem: PlacedItem = {
      id: `placed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemId: selectedInventoryItem,
      x,
      y,
      rotation: 0
    };

    setPlacedItems((prev) => [...prev, newItem]);
    setSelectedInventoryItem(null);
    setRoomInfo('Placed furniture!');
  };

  const handleRotateItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlacedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, rotation: (item.rotation + 90) % 360 } : item))
    );
  };

  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlacedItems((prev) => prev.filter((item) => item.id !== id));
    setRoomInfo('Removed furniture');
  };

  const handleSaveRoom = async () => {
    setSaving(true);
    try {
      const payload = { theme: activeTheme, items: placedItems };
      localStorage.setItem(`pixelverse_room_${user.id}`, JSON.stringify(payload));
      
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          activeBadge: undefined,
          statusText: undefined,
        }),
      });

      canvasConfetti({ particleCount: 30, spread: 30 });
      setRoomInfo('Room saved successfully!');
    } catch (e) {
      console.error(e);
      setRoomInfo('Failed to save room details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="modern-panel relative w-full max-w-5xl p-6 flex flex-col md:flex-row gap-6 min-h-[520px]">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 modern-btn modern-btn-accent text-sm w-9 h-9 rounded-full p-0 flex items-center justify-center shadow-lg"
        >
          ✕
        </button>

        {/* LEFT COLUMN: THE GRID DISPLAY */}
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-950/40 p-4 border border-white/5 rounded-2xl shadow-inner">
          <div className="flex justify-between items-center w-full mb-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Home className="w-4 h-4 text-purple-400" /> Room Layout Grid</span>
            {selectedInventoryItem ? (
              <span className="text-yellow-400 animate-pulse font-bold">Click tile to place item</span>
            ) : (
              <span className="text-slate-500 font-medium">Select item from inventory bag</span>
            )}
          </div>

          {/* 10x10 PLACEMENT GRID MAP */}
          <div
            className="grid grid-cols-10 gap-0.5 aspect-square w-full max-w-[340px] border border-white/5 bg-slate-950/80 rounded-xl shadow-2xl relative p-1"
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
              const x = idx % GRID_SIZE;
              const y = Math.floor(idx / GRID_SIZE);
              
              const placed = placedItems.find((item) => item.x === x && item.y === y);
              const itemDetails = placed ? GAME_ITEMS[placed.itemId] : null;

              return (
                <div
                  key={idx}
                  onClick={() => handleTileClick(x, y)}
                  className={`aspect-square border border-white/5 hover:bg-purple-950/20 transition-all flex items-center justify-center relative cursor-pointer group`}
                >
                  {placed && itemDetails && (
                    <div
                      style={{
                        backgroundColor: itemDetails.assetData?.color || '#ffd700',
                        transform: `rotate(${placed.rotation}deg)`,
                      }}
                      className="w-[85%] h-[85%] rounded border border-white/10 flex items-center justify-center shadow text-xs relative"
                      title={itemDetails.name}
                    >
                      🛋️
                      
                      {/* HOVER EDIT CONTROLS */}
                      <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 rounded-lg transition-opacity duration-100">
                        <button
                          onClick={(e) => handleRotateItem(placed.id, e)}
                          className="p-1 bg-slate-800 hover:bg-slate-750 text-white rounded-md border border-slate-750"
                          title="Rotate"
                        >
                          <RotateCw className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleRemoveItem(placed.id, e)}
                          className="p-1 bg-rose-900 hover:bg-rose-800 text-white rounded-md border border-rose-750"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {roomInfo && (
            <p className="text-xs font-semibold text-emerald-400 mt-4 text-center">{roomInfo}</p>
          )}
        </div>

        {/* RIGHT COLUMN: CONTROLS & FURNITURE STORAGE BAG */}
        <div className="w-full md:w-80 flex flex-col justify-between">
          <div>
            <h3 className="font-modern-heading text-lg text-purple-400 mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
              <LayoutGrid className="w-4 h-4 text-purple-400" /> Room Builder
            </h3>

            {/* Room themes */}
            <div className="mb-5 space-y-2">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Select Room Theme</span>
              <div className="grid grid-cols-2 gap-2">
                {['cosy_cabin', 'space_station', 'beach_cabana', 'cyber_grid'].map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setActiveTheme(theme)}
                    className={`text-[10px] font-semibold py-2 border capitalize rounded-lg transition-all ${
                      activeTheme === theme
                        ? 'border-purple-500 bg-purple-950/20 text-purple-300'
                        : 'border-white/5 bg-slate-900/60 text-slate-400 hover:text-white hover:border-white/10'
                    }`}
                  >
                    {theme.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Furniture Storage */}
            <div className="space-y-2 mb-4">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Select Furniture From Bag</span>
              
              <div className="grid grid-cols-1 gap-2.5 max-h-[140px] overflow-y-auto pr-1">
                {ownedFurniture.map((invItem) => {
                  const item = GAME_ITEMS[invItem.itemId];
                  if (!item) return null;

                  return (
                    <button
                      key={invItem.id}
                      onClick={() => setSelectedInventoryItem(item.id)}
                      className={`p-2 border rounded-xl text-left transition-all flex items-center justify-between ${
                        selectedInventoryItem === item.id
                          ? 'border-yellow-500 bg-yellow-950/15'
                          : 'border-white/5 bg-slate-900/60 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          style={{ backgroundColor: item.assetData?.color }}
                          className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-sm shadow-inner"
                        >
                          🛋️
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{item.name}</p>
                          <p className="text-[10px] text-slate-455 mt-0.5 leading-none">{item.description}</p>
                        </div>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                    </button>
                  );
                })}
                {ownedFurniture.length === 0 && (
                  <div className="text-center py-6 text-slate-500 text-xs font-medium border border-dashed border-white/5 bg-slate-950/10 rounded-xl">
                    No furniture owned yet. Buy some in the Shop!
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-white/5">
            {/* Music Jukebox play toggle */}
            <button
              onClick={() => {
                setPlayingMusic(!playingMusic);
                setRoomInfo(playingMusic ? 'Music muted' : 'Playing pixel retro beat! 🎵');
              }}
              className={`w-full py-2.5 border border-white/5 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl transition-all ${
                playingMusic ? 'bg-amber-600/90 text-white border-amber-700 animate-pulse' : 'bg-slate-950/80 text-slate-400 hover:text-white'
              }`}
            >
              <Volume2 className="w-4 h-4" /> {playingMusic ? 'Playing Chiptune' : 'Jukebox Music'}
            </button>

            <button
              onClick={handleSaveRoom}
              disabled={saving}
              className="w-full modern-btn modern-btn-primary py-2.5 flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Room Layout'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
