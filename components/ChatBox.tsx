'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, ShieldAlert, Sparkles, MessageCircle, User } from 'lucide-react';
import { ChatMessage } from '@/lib/useSocket';

interface ChatBoxProps {
  messages: ChatMessage[];
  activeMap: string;
  onSendMessage: (content: string) => void;
  onSendEmote: (type: 'text' | 'reaction', content: string) => void;
}

export default function ChatBox({
  messages,
  activeMap,
  onSendMessage,
  onSendEmote,
}: ChatBoxProps) {
  const [inputText, setInputText] = useState('');
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const emojis = ['😀', '🔥', '💖', '👍', '🎉', '😢', '😮', '👑', '💩', '✨', '👋', '💀'];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    onSendEmote('text', inputText);
    setInputText('');
  };

  const handleEmojiClick = (emoji: string) => {
    onSendEmote('reaction', emoji);
    setShowEmojiMenu(false);
  };

  return (
    <div className="modern-panel w-80 h-96 flex flex-col shadow-2xl overflow-hidden relative font-sans">
      {/* HEADER */}
      <div className="bg-slate-950/80 px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-xs text-purple-400 uppercase tracking-wider">Map Chat</span>
        </div>
        <span className="text-[10px] font-semibold bg-slate-900/80 px-2 py-1 rounded-lg border border-white/5 text-slate-400">
          📍 {activeMap}
        </span>
      </div>

      {/* CHAT MESSAGES BODY */}
      <div
        ref={scrollRef}
        className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-950/20 scrollbar-thin"
      >
        {messages.map((msg, idx) => {
          const isSystem = msg.senderId === 'system';
          const isVip = msg.isVip;

          return (
            <div
              key={idx}
              className={`p-2 rounded-xl transition-all ${
                isSystem
                  ? 'bg-slate-900/40 border border-white/5 text-purple-300 text-xs italic'
                  : 'hover:bg-slate-900/25 bg-white/5 border border-white/5'
              }`}
            >
              {!isSystem && (
                <div className="flex items-center gap-1.5 mb-1">
                  {isVip && (
                    <span className="text-[8px] font-bold bg-yellow-400 text-black px-1.5 py-0.5 rounded">
                      VIP
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-purple-400 hover:underline cursor-pointer">
                    {msg.senderName}
                  </span>
                  <span className="text-[8px] text-slate-500 ml-auto">{msg.timestamp}</span>
                </div>
              )}
              <p className={`text-xs ${isSystem ? 'text-slate-350' : 'text-slate-200'} leading-relaxed`}>
                {msg.content}
              </p>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="text-center text-slate-500 py-16 text-xs font-medium leading-relaxed">
            Chat is quiet... Send a message to start socializing!
          </div>
        )}
      </div>

      {/* EMOJI MENU POPOVER */}
      {showEmojiMenu && (
        <div className="absolute bottom-14 left-2.5 right-2.5 bg-slate-900/95 border border-white/10 p-3 rounded-2xl shadow-2xl grid grid-cols-6 gap-2 z-20 animate-fadeIn backdrop-filter blur-xl">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="text-2xl hover:scale-125 transition-transform p-1.5 flex items-center justify-center rounded-xl hover:bg-white/5"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* INPUT FORM */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-slate-950/80 border-t border-white/5 flex gap-2">
        <button
          type="button"
          onClick={() => setShowEmojiMenu(!showEmojiMenu)}
          className="p-2 bg-slate-900/60 hover:bg-slate-850 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
          title="Send Emote Reaction"
        >
          <Smile className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          placeholder="Say something..."
          className="flex-1 bg-slate-900/80 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
        />

        <button
          type="submit"
          className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl border border-purple-700 transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
