'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Sparkles, Check, X, ShieldAlert } from 'lucide-react';

interface Friend {
  friendId: string;
  status: string; // PENDING, ACCEPTED, PENDING_INCOMING
  friend: {
    id: string;
    username: string;
    status: string;
    activeBadge: string;
    level: number;
  };
}

interface SocialPanelProps {
  user: any;
  socket: any;
  activeParty: any;
  onCreateParty: () => void;
  onClose: () => void;
}

export default function SocialPanel({
  user,
  socket,
  activeParty,
  onCreateParty,
  onClose,
}: SocialPanelProps) {
  const [activeTab, setActiveTab] = useState<'FRIENDS' | 'PARTY' | 'GUILD'>('FRIENDS');
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [statusErr, setStatusErr] = useState(false);

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();
      if (response.ok && data.user) {
        setFriendsList(data.user.friends || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchName.trim()) return;
    setStatusMsg('');
    setStatusErr(false);

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          statusText: undefined,
          activeBadge: undefined,
        }),
      });

      if (!response.ok) throw new Error("Friend request failed");

      setStatusMsg(`Sent friend request to ${searchName}!`);
      setSearchName('');
      setTimeout(fetchFriends, 1000);
    } catch (err: any) {
      setStatusErr(true);
      setStatusMsg(err.message || 'Player not found');
    }
  };

  const handleAcceptFriend = async (friendId: string) => {
    try {
      setStatusMsg('Accepting request...');
      setTimeout(async () => {
        setStatusMsg('Accepted friend request!');
        await fetchFriends();
      }, 1000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="modern-panel relative w-full max-w-3xl p-6 flex flex-col min-h-[480px]">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 modern-btn modern-btn-accent text-sm w-9 h-9 rounded-full p-0 flex items-center justify-center shadow-lg"
        >
          ✕
        </button>

        {/* HEADER */}
        <div className="border-b border-white/5 pb-4 mb-5">
          <h2 className="font-modern-heading text-xl text-purple-400 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" /> Social Portal
          </h2>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-950/40 p-1 border border-white/5 rounded-xl gap-1 mb-5">
          {(['FRIENDS', 'PARTY', 'GUILD'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'FRIENDS' ? 'Friends' : tab === 'PARTY' ? 'Party Group' : 'Guild'}
            </button>
          ))}
        </div>

        {/* BODY */}
        <div className="flex-1 flex flex-col overflow-y-auto max-h-[300px] pr-2">
          {activeTab === 'FRIENDS' && (
            <div className="space-y-4">
              {/* Add Friend Form */}
              <form onSubmit={handleAddFriend} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter citizen username..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                  className="modern-input"
                />
                <button
                  type="submit"
                  className="modern-btn modern-btn-primary py-2 px-4 flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Add Friend
                </button>
              </form>

              {statusMsg && (
                <p className={`text-xs font-semibold ${statusErr ? 'text-red-455' : 'text-emerald-400'}`}>
                  {statusMsg}
                </p>
              )}

              {/* Friends Listing */}
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-12 text-xs text-slate-500 font-semibold animate-pulse">
                    Retrieving relations...
                  </div>
                ) : friendsList.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500 font-medium">
                    You have no friends in your list.
                  </div>
                ) : (
                  friendsList.map((friend) => (
                    <div
                      key={friend.friendId}
                      className="bg-white/5 border border-white/5 p-3.5 rounded-2xl flex items-center justify-between shadow-sm hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-950 border border-purple-800/30 flex items-center justify-center text-sm shadow-inner">
                          👤
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">
                              {friend.friend.username}
                            </span>
                            <span className="text-[9px] font-bold bg-slate-900 border border-white/5 text-slate-400 px-2 py-0.5 rounded">
                              Lvl {friend.friend.level}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 italic mt-0.5">
                            "{friend.friend.status}"
                          </p>
                        </div>
                      </div>

                      <div>
                        {friend.status === 'PENDING_INCOMING' ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleAcceptFriend(friend.friendId)}
                              className="p-2 bg-emerald-650 hover:bg-emerald-600 rounded-xl text-white transition-colors border border-emerald-700/30"
                              title="Accept request"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 bg-rose-650 hover:bg-rose-600 rounded-xl text-white transition-colors border border-rose-700/30"
                              title="Decline request"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : friend.status === 'PENDING' ? (
                          <span className="text-xs font-bold text-yellow-500">Pending</span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Online
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'PARTY' && (
            <div className="space-y-4 text-center py-6">
              {activeParty ? (
                <div className="bg-white/5 border border-white/5 p-5 rounded-2xl max-w-md mx-auto space-y-4">
                  <h3 className="text-sm font-semibold text-yellow-400">Active Party</h3>
                  <p className="text-xs text-slate-450">Leader: {activeParty.leader}</p>
                  
                  <div className="space-y-2 text-left mt-3">
                    {activeParty.members.map((member: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2.5 p-2 border border-white/5 bg-slate-900/60 rounded-xl shadow-inner">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs">👤</div>
                        <span className="text-xs font-semibold">{member}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-8">
                  <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                    Create or join a party to sync locations, play together, and share events!
                  </p>
                  <button
                    onClick={onCreateParty}
                    className="modern-btn modern-btn-primary py-2.5 px-6 text-xs"
                  >
                    Create Party
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'GUILD' && (
            <div className="space-y-4 text-center py-6">
              <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                Guilds enable persistent communities, custom achievements, and ranking badges!
              </p>
              <div className="bg-white/5 border border-white/5 p-6 rounded-2xl max-w-md mx-auto">
                <span className="text-[10px] font-bold bg-slate-900 border border-white/5 px-3 py-1 rounded-full text-slate-500 uppercase tracking-wider">
                  Feature Coming in Season 2!
                </span>
                <p className="text-[11px] text-slate-550 mt-4 leading-relaxed font-medium">
                  Earn VIP tokens to register a pixel Guild and construct a custom Guild Headquarters.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 text-right">
          <button
            onClick={onClose}
            className="modern-btn modern-btn-primary text-xs"
          >
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
}
