'use client';

import React, { useState, useEffect } from 'react';
import { Milestone, HelpCircle, CheckCircle, Award, Coins, Gem, Sparkles } from 'lucide-react';
import canvasConfetti from 'canvas-confetti';

interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'DAILY' | 'WEEKLY' | 'EVENT';
  targetCount: number;
  rewardCoins: number;
  rewardGems: number;
  rewardXp: number;
  progress: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CLAIMED';
}

interface QuestPanelProps {
  onRewardClaimed: (coins: number, gems: number, xp: number) => void;
  onClose: () => void;
}

export default function QuestPanel({
  onRewardClaimed,
  onClose,
}: QuestPanelProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchQuests = async () => {
    try {
      const response = await fetch('/api/quests');
      const data = await response.json();
      if (response.ok && data.quests) {
        setQuests(data.quests);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  const handleClaimReward = async (questId: string) => {
    setClaimingId(questId);
    try {
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim', questId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      canvasConfetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.6 }
      });

      onRewardClaimed(data.coinsReward || 0, data.gemsReward || 0, data.xpReward || 0);
      setQuests(prev => prev.map(q => q.id === questId ? { ...q, status: 'CLAIMED' } : q));
    } catch (e) {
      console.error(e);
    } finally {
      setClaimingId(null);
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
            <Milestone className="w-5 h-5 text-purple-400" /> Quest Bulletin Board
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-medium">
            Complete daily and weekly chores to earn pixel coins, experience, and rare gems!
          </p>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto max-h-[320px] pr-2 space-y-4">
          {loading ? (
            <div className="text-center py-16 text-xs text-slate-500 font-semibold animate-pulse">
              Reading Quest Board...
            </div>
          ) : quests.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-500 font-medium">
              No active quests found. Relax and enjoy the square!
            </div>
          ) : (
            quests.map((quest) => {
              const isClaimable = quest.status === 'COMPLETED';
              const isClaimed = quest.status === 'CLAIMED';

              return (
                <div
                  key={quest.id}
                  className={`border p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    isClaimed
                      ? 'border-slate-850 bg-slate-950/20 opacity-50'
                      : isClaimable
                      ? 'border-green-500/30 bg-green-950/10 shadow-md shadow-green-500/5'
                      : 'border-white/5 bg-slate-900/60 hover:border-white/10'
                  }`}
                >
                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[8px] font-bold px-2 py-0.5 rounded uppercase"
                        style={{
                          backgroundColor:
                            quest.type === 'DAILY'
                              ? 'rgba(157, 78, 221, 0.15)'
                              : quest.type === 'WEEKLY'
                              ? 'rgba(234, 179, 8, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                          color:
                            quest.type === 'DAILY'
                              ? '#d8b4fe'
                              : quest.type === 'WEEKLY'
                              ? '#fef08a'
                              : '#a7f3d0',
                        }}
                      >
                        {quest.type}
                      </span>
                      <h3 className="text-xs font-semibold text-foreground">{quest.title}</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">{quest.description}</p>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-950 h-2 border border-white/5 rounded-full overflow-hidden">
                        <div
                          style={{
                            width: `${Math.min(100, (quest.progress / quest.targetCount) * 100)}%`,
                          }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            isClaimable || isClaimed ? 'bg-emerald-500' : 'bg-purple-500'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 min-w-[40px] text-right">
                        {quest.progress} / {quest.targetCount}
                      </span>
                    </div>
                  </div>

                  {/* REWARDS & CLAIM BUTTON */}
                  <div className="flex flex-col items-end gap-3 min-w-[150px] border-t md:border-t-0 border-white/5 pt-3.5 md:pt-0">
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      {quest.rewardCoins > 0 && (
                        <span className="text-yellow-400 flex items-center gap-0.5">
                          🪙 {quest.rewardCoins}
                        </span>
                      )}
                      {quest.rewardGems > 0 && (
                        <span className="text-cyan-400 flex items-center gap-0.5">
                          💎 {quest.rewardGems}
                        </span>
                      )}
                      {quest.rewardXp > 0 && (
                        <span className="text-purple-400">+{quest.rewardXp} XP</span>
                      )}
                    </div>

                    {isClaimed ? (
                      <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-slate-650" /> Claimed
                      </span>
                    ) : isClaimable ? (
                      <button
                        onClick={() => handleClaimReward(quest.id)}
                        disabled={claimingId === quest.id}
                        className="modern-btn modern-btn-primary py-2 text-xs"
                      >
                        {claimingId === quest.id ? 'Claiming...' : 'Claim Reward'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-semibold">In Progress</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 text-right">
          <button
            onClick={onClose}
            className="modern-btn modern-btn-primary text-xs"
          >
            Close Board
          </button>
        </div>

      </div>
    </div>
  );
}
