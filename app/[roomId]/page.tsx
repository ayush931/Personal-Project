'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSocket } from '@/lib/useSocket';
import { User, Coins, Gem, ShoppingBag, FolderHeart, Milestone, Users, Gamepad2, Settings, Home, Shield, LogOut, Mic, MicOff, AlertCircle, Palette, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';

// Dynamically import panels to ensure code-splitting and fast loading
const AvatarCustomizer = dynamic(() => import('@/components/AvatarCustomizer'), { ssr: false });
const ShopPanel = dynamic(() => import('@/components/ShopPanel'), { ssr: false });
const InventoryPanel = dynamic(() => import('@/components/InventoryPanel'), { ssr: false });
const QuestPanel = dynamic(() => import('@/components/QuestPanel'), { ssr: false });
const SocialPanel = dynamic(() => import('@/components/SocialPanel'), { ssr: false });
const GameConsole = dynamic(() => import('@/components/GameConsole'), { ssr: false });
const PrivateRoomPanel = dynamic(() => import('@/components/PrivateRoomPanel'), { ssr: false });
const AdminPanel = dynamic(() => import('@/components/AdminPanel'), { ssr: false });
const ChatBox = dynamic(() => import('@/components/ChatBox'), { ssr: false });

export default function WorldPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const router = useRouter();
  const { roomId } = React.use(params);
  const decodedRoomId = decodeURIComponent(roomId);

  const [user, setUser] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [activeMap, setActiveMap] = useState(decodedRoomId);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'cyberpunk' | 'lavender'>('cyberpunk');
  const [hideHud, setHideHud] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toggle browser fullscreen API
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  // Sync fullscreen state with browser changes (e.g. Esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcut to hide/show HUD [Key: H]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setHideHud((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('pixelverse_theme') as any;
    if (savedTheme && ['cyberpunk', 'lavender'].includes(savedTheme)) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'cyberpunk');
    }
  }, []);

  const toggleTheme = (newTheme: 'cyberpunk' | 'lavender') => {
    setTheme(newTheme);
    localStorage.setItem('pixelverse_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Sync activeMap when dynamic URL param changes (e.g. browser navigation)
  useEffect(() => {
    if (decodedRoomId && decodedRoomId !== activeMap) {
      setActiveMap(decodedRoomId);
    }
  }, [decodedRoomId]);

  // Modal displays toggle
  const [activeModal, setActiveModal] = useState<
    'NONE' | 'AVATAR' | 'SHOP' | 'INVENTORY' | 'QUESTS' | 'SOCIAL' | 'ARCADE' | 'ROOM' | 'ADMIN'
  >('NONE');

  // Interaction details of player clicked in Phaser
  const [selectedInteractionPlayer, setSelectedInteractionPlayer] = useState<any | null>(null);



  // WebRTC Voice Chat state
  const [voiceMuted, setVoiceMuted] = useState(true);

  // Phaser Game instance reference
  const phaserGameRef = useRef<any>(null);
  const phaserContainerId = 'phaser-game-viewport';

  // 1. AUTH CHECK
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setUser(data.user);
            localStorage.setItem('pixelverse_user', JSON.stringify(data.user));
          } else {
            // Attempt localStorage fallback
            const localUser = localStorage.getItem('pixelverse_user');
            if (localUser) {
              setUser(JSON.parse(localUser));
            } else {
              router.push(`/?roomId=${encodeURIComponent(decodedRoomId)}`);
              return;
            }
          }
        } else {
          // Attempt localStorage fallback
          const localUser = localStorage.getItem('pixelverse_user');
          if (localUser) {
            setUser(JSON.parse(localUser));
          } else {
            router.push(`/?roomId=${encodeURIComponent(decodedRoomId)}`);
            return;
          }
        }
        
        // Store room too
        localStorage.setItem('pixelverse_current_room', decodedRoomId);
        localStorage.setItem('aetheria_current_room', decodedRoomId);
        
        // Load inventory too
        const invRes = await fetch('/api/profile');
        if (invRes.ok) {
          const invData = await invRes.json();
          setInventory(invData.inventory || []);
        } else {
          setInventory([]);
        }
      } catch (e) {
        console.error("Auth check error, attempting localStorage fallback", e);
        const localUser = localStorage.getItem('pixelverse_user');
        if (localUser) {
          setUser(JSON.parse(localUser));
        } else {
          router.push(`/?roomId=${encodeURIComponent(decodedRoomId)}`);
          return;
        }
        localStorage.setItem('pixelverse_current_room', decodedRoomId);
        localStorage.setItem('aetheria_current_room', decodedRoomId);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router, decodedRoomId]);

  // 2. REALTIME SOCKET.IO SYNC
  const socketHook = useSocket(user, activeMap, (newMap) => {
    setActiveMap(newMap);
    router.replace(`/${encodeURIComponent(newMap)}`);
  });

  // Open Arcade panel if game starts
  useEffect(() => {
    if (socketHook.gameMatch) {
      setActiveModal('ARCADE');
    }
  }, [socketHook.gameMatch]);

  // Listen to Phaser player click events
  useEffect(() => {
    const handlePhaserPlayerClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      setSelectedInteractionPlayer(customEvent.detail);
    };

    window.addEventListener('phaser-player-click', handlePhaserPlayerClick);
    return () => {
      window.removeEventListener('phaser-player-click', handlePhaserPlayerClick);
    };
  }, []);

  // 3. LAZY LOAD PHASER CLIENT
  useEffect(() => {
    if (loading || !user) return;

    // Dynamically bootstrap Phaser inside client browser viewport
    let isDestroyed = false;
    let gameInstance: any = null;

    async function loadGame() {
      const { startPhaserGame } = await import('@/game/GameClient');
      if (isDestroyed) return;

      gameInstance = startPhaserGame({
        containerId: phaserContainerId,
        socket: socketHook.socket,
        mapName: activeMap,
        username: user.username,
        avatar: user.avatarCustomization,
        theme: theme, // Pass active theme
        initialPlayers: socketHook.playersInMap,
      });

      phaserGameRef.current = gameInstance;

      // If the component was destroyed while the game was booting, destroy it immediately
      if (isDestroyed && gameInstance) {
        gameInstance.destroy(true);
        phaserGameRef.current = null;
      }
    }

    loadGame();

    return () => {
      isDestroyed = true;
      if (gameInstance) {
        gameInstance.destroy(true);
      }
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
      }
      phaserGameRef.current = null;
    };
  }, [loading, user]);

  // Handle map change via Phaser portals triggering re-renders
  useEffect(() => {
    if (phaserGameRef.current) {
      // Access scene and reload data
      const scene = phaserGameRef.current.scene.getScene('WorldScene');
      if (scene && scene.sys.isActive()) {
        scene.scene.restart({
          socket: socketHook.socket,
          mapName: activeMap,
          username: user.username,
          avatar: user.avatarCustomization,
          theme: theme, // Pass active theme
          initialPlayers: socketHook.playersInMap,
        });
      }
    }
  }, [activeMap, theme]);

  // Handle socket connection transitions
  useEffect(() => {
    if (phaserGameRef.current && socketHook.connected) {
      const scene = phaserGameRef.current.scene.getScene('WorldScene');
      if (scene && scene.sys.isActive()) {
        scene.scene.restart({
          socket: socketHook.socket,
          mapName: activeMap,
          username: user.username,
          avatar: user.avatarCustomization,
          theme: theme, // Pass active theme
          initialPlayers: socketHook.playersInMap,
        });
      }
    }
  }, [socketHook.connected, theme]);

  // Sync other players' coordinates and presence to Phaser
  useEffect(() => {
    if (phaserGameRef.current) {
      const scene = phaserGameRef.current.scene.getScene('WorldScene') as any;
      if (scene && scene.sys.isActive() && typeof scene.updateOtherPlayers === 'function') {
        scene.updateOtherPlayers(socketHook.playersInMap);
      }
    }
  }, [socketHook.playersInMap]);

  // Refresh profile data from API
  const refreshProfileData = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setInventory(data.inventory || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. ACTION CALLBACKS
  const handleEquipItem = async (itemId: string, equip: boolean) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'equip', itemId, equip }),
      });
      if (response.ok) {
        await refreshProfileData();
        // Trigger avatar visual reload in Phaser
        if (phaserGameRef.current) {
          const scene = phaserGameRef.current.scene.getScene('WorldScene');
          if (scene) {
            scene.scene.restart({
              socket: socketHook.socket,
              mapName: activeMap,
              username: user.username,
              avatar: user.avatarCustomization,
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateBadge = async (badgeName: string) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_profile', activeBadge: badgeName }),
      });
      if (response.ok) {
        await refreshProfileData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerEmote = (emoteKey: string) => {
    // Sends animation trigger to socket
    socketHook.sendEmote('text', `*${emoteKey.toUpperCase()}S*`);
  };

  const handleLogout = async () => {
    localStorage.removeItem('pixelverse_user');
    localStorage.removeItem('pixelverse_current_room');
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    router.push('/');
  };

  // Loading indicator
  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background font-sans text-slate-400 gap-4">
        <div className="w-12 h-12 border-4 border-t-primary border-secondary rounded-full animate-spin" />
        <span className="text-xs font-semibold tracking-wider">CONNECTING TO WORLD GATEWAY...</span>
      </div>
    );
  }

  const isVip = user.role === 'VIP' || user.role === 'ADMIN';

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-hidden bg-background select-none">
      
      {/* 1. HUD TOP BAR HEADER */}
      <div className={`glass-panel absolute top-0 left-0 right-0 h-14 z-20 flex items-center justify-between px-6 border-b border-border/10 transition-all duration-300 ${hideHud ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <div className="flex items-center gap-4">
          {/* Avatar Profile Box */}
          <button
            onClick={() => setActiveModal('AVATAR')}
            className="flex items-center gap-2 bg-secondary/60 hover:bg-secondary/80 border border-border/40 px-3 py-1.5 rounded-xl cursor-pointer group transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                  {user.username}
                </span>
                {isVip && (
                  <span className="text-[9px] font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-1.5 py-0.5 rounded">
                    VIP
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                Level {user.level} • {user.activeBadge}
              </span>
            </div>
          </button>
          
          {/* Room & Online Stats */}
          <div className="px-3 py-1.5 rounded-xl border border-border/30 bg-secondary/40 text-foreground flex items-center gap-2 font-medium text-xs backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
            <span className="text-slate-400">Room:</span>
            <span className="font-bold text-primary">{activeMap}</span>
            <span className="text-slate-600">|</span>
            <span className="font-semibold text-foreground">{socketHook.playersInMap.length + 1} Online</span>
          </div>
          
          {/* Voice Chat state indicator */}
          <button
            onClick={() => {
              setVoiceMuted(!voiceMuted);
              socketHook.sendChatMessage(voiceMuted ? '*unmuted microphone*' : '*muted microphone*');
            }}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-medium text-xs transition-all ${
              voiceMuted
                ? 'bg-secondary/60 border-border/40 text-foreground hover:text-primary hover:border-border'
                : 'bg-red-950/40 border-red-500/30 text-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.15)]'
            }`}
          >
            {voiceMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            <span>Voice Chat: {voiceMuted ? 'Off' : 'Online'}</span>
          </button>
        </div>

        {/* Live event banner Alert */}
        {socketHook.activeEvent && (
          <div className="hidden md:flex items-center gap-2 bg-primary/20 border border-primary/30 px-3 py-1.5 rounded-xl animate-float font-medium text-xs text-primary shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <AlertCircle className="w-4 h-4 text-primary animate-spin" />
            <span>
              LIVE EVENT: "{socketHook.activeEvent.name}" on {socketHook.activeEvent.map} ({socketHook.activeEvent.timeLeft}s left!)
            </span>
          </div>
        )}

        {/* Currency balances & Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-secondary/60 border border-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-400 rounded-xl backdrop-blur-md">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{user.coins}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary/60 border border-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-400 rounded-xl backdrop-blur-md">
            <Gem className="w-4 h-4 text-cyan-400" />
            <span>{user.gems}</span>
          </div>
          
          {/* Theme Selector Widget */}
          <div className="flex items-center gap-1 bg-secondary/60 border border-border/40 px-2.5 py-1.5 rounded-xl backdrop-blur-md">
            <Palette className="w-3.5 h-3.5 text-primary" />
            <select
              value={theme}
              onChange={(e) => toggleTheme(e.target.value as any)}
              className="bg-transparent text-[11px] font-semibold text-foreground focus:outline-none cursor-pointer pr-1"
            >
              <option value="cyberpunk" className="bg-slate-900 text-white">Cyberpunk</option>
              <option value="lavender" className="bg-slate-900 text-white">Lavender</option>
            </select>
          </div>

          {/* Zen Mode Toggle Button */}
          <button
            onClick={() => setHideHud(true)}
            className="p-2 bg-secondary/60 border border-border/50 hover:bg-primary/20 hover:border-primary rounded-xl text-foreground hover:text-primary transition-all duration-200"
            title="Zen Mode (Hide HUD) [Key: H]"
          >
            <EyeOff className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-secondary/60 border border-border/50 hover:bg-primary/20 hover:border-primary rounded-xl text-foreground hover:text-primary transition-all duration-200"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handleLogout}
            className="p-2 bg-secondary/60 border border-border/50 hover:bg-red-950/40 hover:border-red-900 rounded-xl text-foreground hover:text-red-400 transition-colors"
            title="Disconnect Room Gateway"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN PHASER VIEWPORT CANVAS */}
      <div id={phaserContainerId} className="flex-1 w-full h-full relative" />

      {/* 2.5 FLOATING HUD RESTORE BUTTON */}
      {hideHud && (
        <button
          onClick={() => setHideHud(false)}
          className="absolute top-4 right-4 z-30 p-2.5 bg-slate-900/90 hover:bg-primary/95 border border-primary/30 text-white rounded-2xl shadow-xl flex items-center gap-1.5 transition-all duration-300 animate-fadeIn"
          title="Restore HUD [Key: H]"
        >
          <Eye className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-[10px] font-bold tracking-wider uppercase">Restore HUD</span>
        </button>
      )}

      {/* 3. FLOATING ACTION PANELS BUTTONS (BOTTOM RIGHT HUD) */}
      <div className={`absolute bottom-6 right-6 z-20 flex flex-col gap-3 transition-all duration-300 ${hideHud ? 'translate-x-[calc(100%+24px)] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
        {/* Admin operations trigger */}
        {user.role === 'ADMIN' && (
          <button
            onClick={() => setActiveModal('ADMIN')}
            className="modern-btn modern-btn-accent text-[11px] py-2.5 flex items-center justify-center gap-1.5"
          >
            <Shield className="w-4 h-4" /> SECURE CONSOLE
          </button>
        )}

        {/* Private Decorator room */}
        <button
          onClick={() => setActiveModal('ROOM')}
          className="modern-btn modern-btn-secondary text-[11px] py-2.5 flex items-center justify-center gap-1.5"
        >
          <Home className="w-4 h-4" /> DECORATE PRIVATE ROOM
        </button>

        {/* Arcade Console trigger */}
        <button
          onClick={() => setActiveModal('ARCADE')}
          className="modern-btn modern-btn-secondary text-[11px] py-2.5 flex items-center justify-center gap-1.5"
        >
          <Gamepad2 className="w-4 h-4" /> ARCADE STATION
        </button>

        {/* Row of HUD utilities buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveModal('SHOP')}
            className="p-3 bg-purple-650 hover:bg-purple-600 border border-purple-750 text-white rounded shadow-lg flex items-center justify-center transition-colors"
            title="Cosmetics Shop"
          >
            <ShoppingBag className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveModal('INVENTORY')}
            className="p-3 bg-purple-650 hover:bg-purple-600 border border-purple-750 text-white rounded shadow-lg flex items-center justify-center transition-colors"
            title="Avatar Inventory Bag"
          >
            <FolderHeart className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveModal('QUESTS')}
            className="p-3 bg-purple-650 hover:bg-purple-600 border border-purple-750 text-white rounded shadow-lg flex items-center justify-center transition-colors"
            title="Quest bulletin board"
          >
            <Milestone className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveModal('SOCIAL')}
            className="p-3 bg-purple-650 hover:bg-purple-600 border border-purple-750 text-white rounded shadow-lg flex items-center justify-center transition-colors"
            title="Social Contacts"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 4. CHAT BOX OVERLAY (BOTTOM LEFT HUD) */}
      <div className={`absolute bottom-6 left-6 z-20 shadow-2xl transition-all duration-300 ${hideHud ? '-translate-x-[calc(100%+24px)] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
        <ChatBox
          messages={socketHook.chatMessages}
          activeMap={activeMap}
          onSendMessage={socketHook.sendChatMessage}
          onSendEmote={socketHook.sendEmote}
        />
      </div>

      {/* 5. CHALLENGE REQUEST POPOVER ALERT */}
      {socketHook.activeChallenge && (
        <div className="fixed top-20 right-6 z-40 modern-panel p-5 w-80 text-white shadow-2xl animate-float">
          <p className="text-xs font-bold text-yellow-400">🚨 CHALLENGE DETECTED!</p>
          <p className="text-sm text-slate-200 mt-1.5">
            {socketHook.activeChallenge.challengerName} challenges you to standard {socketHook.activeChallenge.gameId}!
          </p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => socketHook.respondChallenge(socketHook.activeChallenge!.challengerSocketId, socketHook.activeChallenge!.gameId, true)}
              className="flex-1 modern-btn modern-btn-primary py-2 text-xs"
            >
              ACCEPT
            </button>
            <button
              onClick={() => socketHook.respondChallenge(socketHook.activeChallenge!.challengerSocketId, socketHook.activeChallenge!.gameId, false)}
              className="flex-1 modern-btn modern-btn-accent py-2 text-xs"
            >
              DECLINE
            </button>
          </div>
        </div>
      )}

      {/* 6. MODAL OVERLAY PORTALS */}
      {activeModal === 'AVATAR' && (
        <AvatarCustomizer
          currentAvatar={user}
          ownedItems={inventory.map(i => i.itemId)}
          onEquipItem={handleEquipItem}
          onClose={() => setActiveModal('NONE')}
        />
      )}

      {activeModal === 'SHOP' && (
        <ShopPanel
          userCoins={user.coins}
          userGems={user.gems}
          ownedItemIds={inventory.map(i => i.itemId)}
          onPurchaseSuccess={async () => {
            await refreshProfileData();
          }}
          onClose={() => setActiveModal('NONE')}
        />
      )}

      {activeModal === 'INVENTORY' && (
        <InventoryPanel
          user={user}
          inventory={inventory}
          onEquipItem={handleEquipItem}
          onTriggerEmote={handleTriggerEmote}
          onUpdateBadge={handleUpdateBadge}
          onClose={() => setActiveModal('NONE')}
        />
      )}

      {activeModal === 'QUESTS' && (
        <QuestPanel
          onRewardClaimed={async () => {
            await refreshProfileData();
          }}
          onClose={() => setActiveModal('NONE')}
        />
      )}

      {activeModal === 'SOCIAL' && (
        <SocialPanel
          user={user}
          socket={socketHook.socket}
          activeParty={socketHook.activeParty}
          onCreateParty={socketHook.createParty}
          onClose={() => setActiveModal('NONE')}
        />
      )}

      {activeModal === 'ARCADE' && (
        <GameConsole
          user={user}
          socket={socketHook.socket}
          gameMatch={socketHook.gameMatch}
          playersInMap={socketHook.playersInMap}
          onSubmitMove={socketHook.submitGameMove}
          onFinishGame={socketHook.finishGame}
          onClose={() => setActiveModal('NONE')}
        />
      )}

      {activeModal === 'ROOM' && (
        <PrivateRoomPanel
          user={user}
          inventory={inventory}
          onClose={() => setActiveModal('NONE')}
        />
      )}

      {activeModal === 'ADMIN' && (
        <AdminPanel
          onClose={() => setActiveModal('NONE')}
        />
      )}

      {selectedInteractionPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="modern-panel relative w-full max-w-sm p-6 flex flex-col items-center text-center">
            
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setSelectedInteractionPlayer(null)}
              className="absolute -top-3 -right-3 modern-btn modern-btn-accent text-sm w-9 h-9 rounded-full p-0 flex items-center justify-center shadow-lg"
            >
              ✕
            </button>

            {/* HEADER */}
            <div className="w-16 h-16 rounded-full bg-purple-950 border border-purple-800/30 flex items-center justify-center text-2xl mb-3 shadow-inner">
              👤
            </div>
            
            <h3 className="font-modern-heading text-lg text-purple-400">
              {selectedInteractionPlayer.username}
            </h3>
            
            <div className="flex gap-2 mt-1.5 mb-5">
              <span className="text-[10px] font-bold bg-slate-900 border border-white/5 text-slate-400 px-2 py-0.5 rounded">
                Lvl {selectedInteractionPlayer.level || 1}
              </span>
              <span className="text-[10px] font-bold bg-slate-900 border border-white/5 text-slate-400 px-2 py-0.5 rounded">
                {selectedInteractionPlayer.badge || 'Newcomer'}
              </span>
            </div>

            <div className="w-full space-y-2.5">
              <button
                onClick={() => {
                  socketHook.challengePlayer(selectedInteractionPlayer.socketId, 'tictactoe');
                  setSelectedInteractionPlayer(null);
                  setActiveModal('ARCADE');
                }}
                className="w-full modern-btn modern-btn-primary py-2.5 text-xs flex items-center justify-center gap-2"
              >
                🎮 Challenge to Tic Tac Toe
              </button>

              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/profile', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'add_friend',
                        friendUsername: selectedInteractionPlayer.username,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to add friend');
                    alert(`Friend request sent to ${selectedInteractionPlayer.username}!`);
                  } catch (err: any) {
                    alert(err.message || 'Could not send friend request.');
                  }
                  setSelectedInteractionPlayer(null);
                }}
                className="w-full modern-btn modern-btn-secondary py-2.5 text-xs flex items-center justify-center gap-2 text-slate-300 hover:text-white"
              >
                👤 Add Citizen as Friend
              </button>

              <button
                onClick={() => setSelectedInteractionPlayer(null)}
                className="w-full modern-btn modern-btn-accent py-2 text-xs"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
