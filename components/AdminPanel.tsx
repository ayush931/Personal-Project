'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Terminal, Activity, ArrowUpRight, Check, ShieldAlert } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'USERS' | 'LOGS'>('ANALYTICS');
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [coinAmount, setCoinAmount] = useState('500');
  const [gemAmount, setGemAmount] = useState('10');
  const [roleOption, setRoleOption] = useState('USER');
  const [modMsg, setModMsg] = useState('');

  const fetchAdminData = async () => {
    try {
      const response = await fetch('/api/admin');
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
        setStats(data.stats || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleModifyCurrency = async (userId: string, isGems = false) => {
    setModMsg('');
    const amt = isGems ? gemAmount : coinAmount;
    const cur = isGems ? 'GEMS' : 'COINS';
    
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'modify_currency',
          targetUserId: userId,
          amount: parseInt(amt),
          currency: cur
        }),
      });

      if (!response.ok) throw new Error("Modification failed");
      
      setModMsg(`Awarded ${amt} ${cur}!`);
      fetchAdminData();
    } catch (e) {
      setModMsg('Error altering values');
    }
  };

  const handleModifyRole = async (userId: string) => {
    setModMsg('');
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'modify_role',
          targetUserId: userId,
          role: roleOption
        }),
      });

      if (!response.ok) throw new Error("Role alteration failed");
      
      setModMsg('Role updated successfully!');
      fetchAdminData();
    } catch (e) {
      setModMsg('Error changing role');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="modern-panel relative w-full max-w-5xl p-6 flex flex-col min-h-[500px]">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 modern-btn modern-btn-accent text-sm w-9 h-9 rounded-full p-0 flex items-center justify-center shadow-lg"
        >
          ✕
        </button>

        {/* HEADER */}
        <div className="border-b border-white/5 pb-4 mb-5 flex items-center justify-between">
          <h2 className="font-modern-heading text-xl text-purple-400 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" /> Admin Operations Desk
          </h2>
          <span className="text-[10px] font-bold bg-red-950/60 text-red-300 border border-red-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
            Level 5 Security Access
          </span>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-950/40 p-1 border border-white/5 rounded-xl gap-1 mb-5">
          {(['ANALYTICS', 'USERS', 'LOGS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'ANALYTICS' ? 'Analytics' : tab === 'USERS' ? 'User Audit DB' : 'Audit Logs'}
            </button>
          ))}
        </div>

        {/* BODY */}
        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-[300px]">
          
          {/* LEFT: MAIN TAB CONTENT */}
          <div className="flex-1 overflow-y-auto max-h-[300px] pr-2">
            {loading ? (
              <div className="text-center py-16 text-xs text-slate-500 font-semibold animate-pulse">
                Decrypting Analytics Records...
              </div>
            ) : activeTab === 'ANALYTICS' && stats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="modern-card p-4 text-center space-y-1 bg-white/5 border border-white/5">
                  <Activity className="w-6 h-6 text-purple-400 mx-auto" />
                  <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Total Users</p>
                  <p className="text-xl font-bold text-foreground">{stats.totalUsers}</p>
                </div>

                <div className="modern-card p-4 text-center space-y-1 bg-white/5 border border-white/5">
                  <Sparkles className="w-6 h-6 text-yellow-500 mx-auto animate-pulse" />
                  <p className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">VIP Members</p>
                  <p className="text-xl font-bold text-yellow-400">{stats.vipUsers}</p>
                </div>

                <div className="modern-card p-4 text-center space-y-1 bg-white/5 border border-white/5">
                  <Terminal className="w-6 h-6 text-green-500 mx-auto" />
                  <p className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Economy Volume</p>
                  <p className="text-xs font-semibold text-green-400">🪙 {stats.economyCoins.toLocaleString()}</p>
                  <p className="text-xs font-semibold text-cyan-400">💎 {stats.economyGems.toLocaleString()}</p>
                </div>

                <div className="modern-card p-4 text-center space-y-1 bg-white/5 border border-white/5">
                  <ArrowUpRight className="w-6 h-6 text-cyan-400 mx-auto" />
                  <p className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Server Status</p>
                  <p className="text-xs font-bold text-green-400">ONLINE</p>
                  <p className="text-[10px] text-slate-500 mt-1">Uptime: {Math.floor(stats.uptime)}s</p>
                </div>
              </div>
            ) : activeTab === 'USERS' ? (
              <div className="space-y-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`modern-card p-3 flex justify-between items-center cursor-pointer transition-all border ${
                      selectedUser?.id === u.id
                        ? 'border-purple-500 bg-purple-950/20 shadow-md shadow-purple-500/5'
                        : 'border-white/5 bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">{u.username}</p>
                      <p className="text-[10px] text-slate-450 mt-1">Lvl {u.level} | {u.role}</p>
                    </div>
                    <div className="flex gap-3 text-xs font-semibold">
                      <span className="text-yellow-400">🪙 {u.coins}</span>
                      <span className="text-cyan-400">💎 {u.gems}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950/80 p-4 border border-white/5 rounded-2xl font-mono text-xs text-green-400 space-y-2.5 h-full overflow-y-auto shadow-inner leading-relaxed">
                <p className="text-green-500/80">[2026-06-28 19:11:45] ✔ System initialised.</p>
                <p className="text-green-550/80">[2026-06-28 19:12:16] ✔ NPM dependencies successfully loaded.</p>
                <p className="text-green-500/80">[2026-06-28 19:14:19] ✔ Database sync complete: tables deployed.</p>
                <p className="text-green-500/80">[2026-06-28 19:15:19] ✔ Neon serverless connection verified.</p>
                <p className="text-purple-400">[2026-06-28 19:15:43] 🔌 Socket.io gateway online. Listening on port 3001.</p>
                <p className="text-yellow-500/80">[2026-06-28 19:16:00] 🔔 Rotator Event initialized: "Dance Party" scheduled next.</p>
              </div>
            )}
          </div>

          {/* RIGHT: OPERATIONS & DETAILS MODIFIER */}
          <div className="w-full md:w-80 bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between shadow-inner">
            {selectedUser ? (
              <div className="flex flex-col h-full justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-yellow-400 mb-1">{selectedUser.username}</h3>
                  <p className="text-[10px] text-slate-500">ID: {selectedUser.id}</p>
                  
                  {modMsg && (
                    <p className="bg-purple-950/20 border border-purple-500/10 p-2.5 rounded-xl text-center text-xs text-purple-300 font-semibold mt-3">
                      {modMsg}
                    </p>
                  )}

                  {/* Modify Currency */}
                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1">Award Coins</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          className="modern-input py-1.5 px-3"
                          value={coinAmount}
                          onChange={(e) => setCoinAmount(e.target.value)}
                        />
                        <button
                          onClick={() => handleModifyCurrency(selectedUser.id, false)}
                          className="modern-btn modern-btn-primary py-1 px-3.5 text-xs text-white"
                        >
                          AWARD
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1">Award Gems</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          className="modern-input py-1.5 px-3"
                          value={gemAmount}
                          onChange={(e) => setGemAmount(e.target.value)}
                        />
                        <button
                          onClick={() => handleModifyCurrency(selectedUser.id, true)}
                          className="modern-btn modern-btn-primary py-1 px-3.5 text-xs text-white"
                        >
                          AWARD
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1">Update Role</label>
                      <div className="flex gap-2">
                        <select
                          className="modern-input py-1.5 px-3 bg-slate-950/90 text-white"
                          value={roleOption}
                          onChange={(e) => setRoleOption(e.target.value)}
                        >
                          <option value="USER">USER</option>
                          <option value="VIP">VIP</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        <button
                          onClick={() => handleModifyRole(selectedUser.id)}
                          className="modern-btn modern-btn-secondary py-1 px-3.5 text-xs text-white"
                        >
                          UPDATE
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 mt-4">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="w-full text-center text-slate-500 hover:text-white text-xs font-semibold transition-colors"
                  >
                    Deselect User
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs py-12">
                <ShieldAlert className="w-8 h-8 mb-2.5 text-slate-600" />
                Select a user on the left to audit.
              </div>
            )}
          </div>

        </div>

        <div className="mt-4 pt-4 border-t border-white/5 text-right">
          <button
            onClick={onClose}
            className="modern-btn modern-btn-primary text-xs"
          >
            Close Desk
          </button>
        </div>

      </div>
    </div>
  );
}
