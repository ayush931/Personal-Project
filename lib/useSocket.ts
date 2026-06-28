import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface NetworkPlayer {
  id: string;
  username: string;
  map: string;
  x: number;
  y: number;
  avatar: string;
  status: string;
  level: number;
  badge: string;
  socketId: string;
  activeAnimation: string;
  isVip: boolean;
}

export interface ChatMessage {
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isVip: boolean;
}

export interface GameChallenge {
  challengerSocketId: string;
  challengerName: string;
  gameId: string;
}

export function useSocket(user: any, activeMap: string, onMapSwitch: (map: string) => void) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [playersInMap, setPlayersInMap] = useState<NetworkPlayer[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [activeChallenge, setActiveChallenge] = useState<GameChallenge | null>(null);
  const [gameMatch, setGameMatch] = useState<any>(null);
  const [activeEmotes, setActiveEmotes] = useState<Record<string, { type: string; content: string; timestamp: number }>>({});
  const [activeParty, setActiveParty] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    // Connect to Socket.io server
    const serverUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    const socket = io(serverUrl, {
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('Connected to PixelVerse realtime gateway!');
      
      // Join world
      socket.emit('join_world', {
        id: user.id,
        username: user.username,
        avatar: user.avatarCustomization,
        map: activeMap,
        level: user.level,
        badge: user.activeBadge,
        isVip: user.role === 'VIP' || user.role === 'ADMIN',
      });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // MAP SYNC
    socket.on('players_in_map', (players: NetworkPlayer[]) => {
      setPlayersInMap(players);
    });

    socket.on('map_changed', (data: { map: string }) => {
      onMapSwitch(data.map);
    });

    socket.on('player_joined', (player: NetworkPlayer) => {
      setPlayersInMap((prev) => {
        if (prev.some((p) => p.socketId === player.socketId)) return prev;
        return [...prev, player];
      });
    });

    socket.on('player_left', (data: { id: string; socketId: string }) => {
      setPlayersInMap((prev) => prev.filter((p) => p.socketId !== data.socketId));
      setActiveEmotes((prev) => {
        const next = { ...prev };
        delete next[data.socketId];
        return next;
      });
    });

    socket.on('player_moved', (data: { socketId: string; x: number; y: number; animation: string }) => {
      setPlayersInMap((prev) =>
        prev.map((p) => (p.socketId === data.socketId ? { ...p, x: data.x, y: data.y, activeAnimation: data.animation } : p))
      );
    });

    // CHAT & EMOTES
    socket.on('chat_message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev.slice(-99), msg]); // Keep last 100
    });

    socket.on('player_emote', (data: { socketId: string; type: string; content: string }) => {
      setActiveEmotes((prev) => ({
        ...prev,
        [data.socketId]: { type: data.type, content: data.content, timestamp: Date.now() },
      }));
    });

    socket.on('system_message', (msg: { content: string }) => {
      setChatMessages((prev) => [
        ...prev.slice(-99),
        { senderId: 'system', senderName: '📢 SYSTEM', content: msg.content, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isVip: false },
      ]);
    });

    // PARTY EVENTS
    socket.on('party_updated', (party: any) => {
      setActiveParty(party);
    });

    // EVENTS SCHEDULER
    socket.on('event_started', (event: any) => {
      setActiveEvent(event);
      setChatMessages((prev) => [
        ...prev,
        {
          senderId: 'system',
          senderName: '🔔 EVENT',
          content: `Live Event Started: "${event.name}" on the ${event.map} map! Join now!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isVip: false,
        },
      ]);
    });

    socket.on('event_ended', (data: { name: string }) => {
      setActiveEvent(null);
      setChatMessages((prev) => [
        ...prev,
        {
          senderId: 'system',
          senderName: '🔔 EVENT',
          content: `The Event "${data.name}" has ended. Stay tuned for the next one!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isVip: false,
        },
      ]);
    });

    // MINI GAMES: CHALLENGE & GAME STATE
    socket.on('game_challenge', (challenge: GameChallenge) => {
      setActiveChallenge(challenge);
    });

    socket.on('challenge_declined', (data: { username: string }) => {
      alert(`${data.username} declined your mini-game challenge.`);
    });

    socket.on('game_started', (match: { roomId: string; gameId: string; opponent: string; isFirst: boolean; state: any }) => {
      setGameMatch(match);
      setActiveChallenge(null);
    });

    socket.on('game_moved', (data: { state: any; turn: string }) => {
      setGameMatch((prev: any) => (prev ? { ...prev, state: data.state, turn: data.turn } : null));
    });

    socket.on('game_ended', (data: { result: 'WIN' | 'LOSS' | 'DRAW'; winnerName?: string; reason?: string }) => {
      setGameMatch((prev: any) => (prev ? { ...prev, ended: true, result: data.result, winnerName: data.winnerName, reason: data.reason } : null));
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Keep socket room in sync with activeMap parameter changes (e.g. URL changes or navigation)
  useEffect(() => {
    if (socketRef.current && connected && activeMap) {
      socketRef.current.emit('switch_map', { targetMap: activeMap });
    }
  }, [activeMap, connected]);

  // Actions
  const movePlayer = (x: number, y: number, animation: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('player_move', { x, y, animation });
    }
  };

  const switchMap = (targetMap: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('switch_map', { targetMap });
      onMapSwitch(targetMap);
    }
  };

  const sendChatMessage = (content: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('chat_message', { content });
    }
  };

  const sendEmote = (type: 'text' | 'reaction', content: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('send_emote', { type, content });
    }
  };

  const challengePlayer = (targetSocketId: string, gameId: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('challenge_player', { targetSocketId, gameId });
    }
  };

  const respondChallenge = (challengerSocketId: string, gameId: string, accept: boolean) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('accept_challenge', { challengerSocketId, gameId, accept });
      if (!accept) setActiveChallenge(null);
    }
  };

  const submitGameMove = (roomId: string, state: any) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('game_move', { roomId, state });
      setGameMatch((prev: any) => (prev ? { ...prev, state } : null));
    }
  };

  const finishGame = (roomId: string, result: 'WIN' | 'LOSS' | 'DRAW', winnerName?: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('game_over', { roomId, result, winnerName });
      setGameMatch(null);
    }
  };

  const createParty = () => {
    if (socketRef.current && connected) {
      socketRef.current.emit('create_party');
    }
  };

  return {
    socket: socketRef.current,
    connected,
    playersInMap,
    chatMessages,
    activeEmotes,
    activeEvent,
    activeChallenge,
    gameMatch,
    activeParty,
    movePlayer,
    switchMap,
    sendChatMessage,
    sendEmote,
    challengePlayer,
    respondChallenge,
    submitGameMove,
    finishGame,
    createParty,
    setGameMatch,
  };
}
