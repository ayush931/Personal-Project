'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Gamepad2, User, Key, Mail, Sparkles, LogIn, Cpu, Terminal, Palette } from 'lucide-react';
import canvasConfetti from 'canvas-confetti';

export default function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string }>;
}) {
  const router = useRouter();
  const resolvedSearchParams = React.use(searchParams);
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState(resolvedSearchParams.roomId || '');
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [roomAction, setRoomAction] = useState<'join' | 'create'>('join');
  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'cyberpunk' | 'lavender'>('cyberpunk');

  useEffect(() => {
    if (resolvedSearchParams.roomId) {
      setRoomId(resolvedSearchParams.roomId);
    }
  }, [resolvedSearchParams.roomId]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('pixelverse_theme') as any;
    if (savedTheme && ['cyberpunk', 'lavender'].includes(savedTheme)) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'cyberpunk');
    }
  }, []);

  const changeTheme = (newTheme: 'cyberpunk' | 'lavender') => {
    setTheme(newTheme);
    localStorage.setItem('pixelverse_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            const savedRoom = localStorage.getItem('pixelverse_current_room') || localStorage.getItem('aetheria_current_room');
            const targetRoom = resolvedSearchParams.roomId || savedRoom;
            if (targetRoom) {
              router.push(`/${targetRoom}`);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    checkSession();
  }, [router, resolvedSearchParams.roomId]);

  const preventKeyStealing = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorText('Username is required.');
      return;
    }
    if (!roomId.trim()) {
      setErrorText('Room ID is required.');
      return;
    }
    if (roomAction === 'create' && isPrivate && !roomPassword.trim()) {
      setErrorText('Password is required for private rooms.');
      return;
    }

    setLoading(true);
    setErrorText('');

    try {
      const payload = {
        action: 'room_auth',
        username,
        roomId,
        isPrivate,
        roomPassword,
        roomAction,
      };

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error('Server returned an invalid response. Please try again later.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      // Save session and room in localStorage
      localStorage.setItem('aetheria_user', JSON.stringify(data.user));
      localStorage.setItem('aetheria_current_room', data.roomId);
      localStorage.setItem('pixelverse_user', JSON.stringify(data.user));
      localStorage.setItem('pixelverse_current_room', data.roomId);

      canvasConfetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      router.push(`/${data.roomId}`);
    } catch (err: any) {
      setErrorText(err.message || 'Error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative bg-grid-pattern overflow-hidden">
      
      {/* Theme Switcher Widget (Floating Top Right) */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-secondary/85 border border-border/40 px-3 py-1.5 rounded-2xl shadow-md backdrop-blur-md">
        <Palette className="w-3.5 h-3.5 text-primary" />
        <select
          value={theme}
          onChange={(e) => changeTheme(e.target.value as any)}
          className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer pr-1"
        >
          <option value="cyberpunk" className="bg-slate-900 text-white">Cyberpunk Retro</option>
          <option value="lavender" className="bg-slate-900 text-white">Lavender Dusk</option>
        </select>
      </div>

      {/* Decorative Glows */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
      
      <div className="modern-panel w-full max-w-md p-8 z-10 relative">
        
        {/* Glow Header */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-24 bg-primary/20 blur-2xl rounded-full" />

        {/* LOGO */}
        <div className="text-center mb-8 select-none">
          <div className="inline-flex mb-4 relative group">
            {/* Pulsing glow background */}
            <div className="absolute inset-0 bg-primary/25 blur-xl rounded-full scale-110 group-hover:scale-125 transition-transform duration-500 animate-pulse" />
            
            {/* SVG Logo Container */}
            <div className="relative p-0.5 bg-gradient-to-tr from-primary via-secondary to-accent rounded-3xl shadow-xl hover:rotate-6 transition-transform duration-300">
              <div className="bg-background/90 p-4 rounded-[22px]">
                <svg className="w-12 h-12 text-primary animate-float" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="var(--accent)" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  {/* Outer glowing polygon */}
                  <polygon points="50,8 87,29.5 87,70.5 50,92 13,70.5 13,29.5" stroke="url(#logo-grad)" strokeWidth="3" fill="var(--background)" fillOpacity="0.4" />
                  {/* Inner dashed polygon */}
                  <polygon points="50,22 74,36 74,64 50,78 26,64 26,36" stroke="url(#logo-grad)" strokeWidth="1.5" strokeDasharray="3,3" fill="none" />
                  {/* Central glowing core */}
                  <circle cx="50" cy="50" r="10" fill="url(#logo-grad)" filter="url(#glow)" />
                  {/* Outer orbital rings */}
                  <ellipse cx="50" cy="50" rx="32" ry="8" stroke="var(--accent)" strokeWidth="1.5" transform="rotate(-30 50 50)" strokeDasharray="4,4" />
                </svg>
              </div>
            </div>
          </div>
          <h1 className="font-modern-heading text-3xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
            Aetheria
          </h1>
          <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide">
            Join the modern virtual world sandbox
          </p>
        </div>

        {/* TAB TOGGLE */}
        <div className="flex bg-background/90 border border-primary/10 rounded-2xl p-1 mb-6">
          {(['join', 'create'] as const).map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => {
                setRoomAction(action);
                setErrorText('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
                roomAction === action
                  ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-lg shadow-primary/20'
                  : 'text-slate-400 hover:text-foreground hover:bg-white/5'
              }`}
            >
              {action === 'join' ? 'Join Room' : 'Create Room'}
            </button>
          ))}
        </div>

        {/* FORM */}
        <form onSubmit={handleAuthSubmit} className="space-y-5 font-sans">
          {errorText && (
            <div className="bg-red-950/40 border border-red-500/20 p-3 rounded-xl text-center text-xs text-red-300 font-medium">
              ⚠️ {errorText}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1.5 ml-1 uppercase tracking-wider">
              Username
            </label>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="e.g. PixelBoy"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={preventKeyStealing}
                onKeyUp={preventKeyStealing}
                className="modern-input-with-icon"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1.5 ml-1 uppercase tracking-wider">
              Room ID
            </label>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="e.g. secret-garden"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyDown={preventKeyStealing}
                onKeyUp={preventKeyStealing}
                className="modern-input-with-icon"
              />
            </div>
          </div>

          {roomAction === 'create' && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1.5 ml-1 uppercase tracking-wider">
                Room Visibility
              </label>
              <div className="flex gap-3 bg-background/60 border border-primary/10 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    !isPrivate
                      ? 'bg-primary/20 border border-primary/30 text-primary'
                      : 'text-slate-400 hover:text-foreground'
                  }`}
                >
                  🌐 Public
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    isPrivate
                      ? 'bg-primary/20 border border-primary/30 text-primary'
                      : 'text-slate-400 hover:text-foreground'
                  }`}
                >
                  🔒 Private
                </button>
              </div>
            </div>
          )}

          {(roomAction === 'join' || (roomAction === 'create' && isPrivate)) && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1.5 ml-1 uppercase tracking-wider">
                {roomAction === 'create' ? 'Set Room Password' : 'Room Password (if private)'}
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required={roomAction === 'create' && isPrivate}
                  placeholder="••••••••"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  onKeyDown={preventKeyStealing}
                  onKeyUp={preventKeyStealing}
                  className="modern-input-with-icon"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full modern-btn modern-btn-primary py-3 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" /> {loading ? 'Processing...' : roomAction === 'join' ? 'Join Room' : 'Create Room'}
          </button>
        </form>
      </div>
    </div>
  );
}


