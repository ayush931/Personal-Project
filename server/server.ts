import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const PORT = process.env.BACKEND_PORT || 3001;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// TYPES
interface Player {
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
  partyId?: string;
}

interface GameRoom {
  id: string;
  gameId: string; // chess, tictactoe, connect4, snake
  players: string[]; // usernames or socketIds
  state: any;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  turn?: string;
}

// IN-MEMORY GAME STATE
const players: Map<string, Player> = new Map(); // socketId -> Player
const gameRooms: Map<string, GameRoom> = new Map(); // gameRoomId -> GameRoom
const parties: Map<string, { id: string; leader: string; members: string[] }> = new Map();

// CURRENT LIVE EVENT
let currentEvent = {
  name: 'None',
  map: 'None',
  description: 'Relax and hang out in the Town Square!',
  timeLeft: 0
};

// Start live hourly events rotation
const EVENTS = [
  { name: 'Dance Party', map: 'Music Stage', description: 'Join the rhythm! Dance on the stage to earn double XP!' },
  { name: 'Beach Treasure Hunt', map: 'Beach', description: 'Find the hidden chest buried deep in the golden sand!' },
  { name: 'Trivia Night', map: 'Arcade', description: 'Show off your massive brain at the Arcade screens!' },
  { name: 'Music Concert', map: 'Music Stage', description: 'Headbang with the live DJ and pixel lights!' },
  { name: 'Pixel Festival', map: 'Town Square', description: 'Gather round the bonfire! Trade, chat and celebrate!' }
];

function rotateEvent() {
  const next = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  currentEvent = {
    ...next,
    timeLeft: 300 // 5 minutes event length for testing/demo
  };
  io.emit('event_started', currentEvent);

  const countdown = setInterval(() => {
    currentEvent.timeLeft--;
    if (currentEvent.timeLeft <= 0) {
      clearInterval(countdown);
      io.emit('event_ended', { name: currentEvent.name });
      currentEvent = {
        name: 'None',
        map: 'None',
        description: 'Relax and hang out in the Town Square!',
        timeLeft: 0
      };
      // Schedule next event in 2 minutes
      setTimeout(rotateEvent, 120000);
    }
  }, 1000);
}
// Start first event after 10 seconds
setTimeout(rotateEvent, 10000);

// API STATUS
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    connections: players.size,
    activeRooms: gameRooms.size,
    currentEvent
  });
});

// SOCKET EVENTS
io.on('connection', (socket: Socket) => {
  console.log(`🔌 Player connected: ${socket.id}`);

  // JOIN WORLD
  socket.on('join_world', (data: { id: string; username: string; avatar: any; map: string; level: number; badge: string; isVip: boolean }) => {
    const avatarStr = typeof data.avatar === 'string' ? data.avatar : JSON.stringify(data.avatar);
    const newPlayer: Player = {
      id: data.id,
      username: data.username,
      map: data.map || 'Town Square',
      x: 400 + Math.random() * 100, // Spawn around center
      y: 300 + Math.random() * 100,
      avatar: avatarStr,
      status: 'Exploring!',
      level: data.level || 1,
      badge: data.badge || 'Newcomer',
      socketId: socket.id,
      activeAnimation: 'idle',
      isVip: data.isVip || false
    };

    players.set(socket.id, newPlayer);
    socket.join(newPlayer.map);

    // Tell user about existing players in that map
    const mapPlayers = Array.from(players.values()).filter(p => p.map === newPlayer.map && p.socketId !== socket.id);
    socket.emit('players_in_map', mapPlayers);
    socket.emit('map_changed', { map: newPlayer.map });

    // Tell other players in the map
    socket.to(newPlayer.map).emit('player_joined', newPlayer);

    // Welcome notice
    socket.emit('system_message', { content: `Welcome to the ${newPlayer.map}, ${newPlayer.username}!` });
    
    // Broadcast active event info
    if (currentEvent.name !== 'None') {
      socket.emit('event_started', currentEvent);
    }
  });

  // MOVEMENT SYNC
  socket.on('player_move', (data: { x: number; y: number; animation: string }) => {
    const player = players.get(socket.id);
    if (player) {
      player.x = data.x;
      player.y = data.y;
      player.activeAnimation = data.animation;
      // Broadcast to all other players in same map
      socket.to(player.map).emit('player_moved', {
        id: player.id,
        socketId: socket.id,
        x: player.x,
        y: player.y,
        animation: player.activeAnimation
      });
    }
  });

  // MAP SWITCHING
  socket.on('switch_map', (data: { targetMap: string }) => {
    const player = players.get(socket.id);
    if (player) {
      const oldMap = player.map;
      socket.leave(oldMap);
      
      // Notify old map players
      socket.to(oldMap).emit('player_left', { id: player.id, socketId: socket.id });

      // Update player map and position
      player.map = data.targetMap;
      player.x = 400 + Math.random() * 50;
      player.y = 300 + Math.random() * 50;
      player.activeAnimation = 'idle';

      socket.join(player.map);

      // Tell user about new players
      const mapPlayers = Array.from(players.values()).filter(p => p.map === player.map && p.socketId !== socket.id);
      socket.emit('players_in_map', mapPlayers);
      socket.emit('map_changed', { map: player.map });

      // Notify new map players
      socket.to(player.map).emit('player_joined', player);
      
      socket.emit('system_message', { content: `Entered ${player.map}` });
    }
  });

  // EMOTE / SPEECH BUBBLE
  socket.on('send_emote', (data: { type: string; content: string }) => {
    const player = players.get(socket.id);
    if (player) {
      // Broadcast emote to all in map
      io.to(player.map).emit('player_emote', {
        playerId: player.id,
        socketId: socket.id,
        type: data.type, // 'text' (speech bubble) or 'reaction' (emoji)
        content: data.content
      });
    }
  });

  // REALTIME CHAT
  socket.on('chat_message', (data: { content: string }) => {
    const player = players.get(socket.id);
    if (player) {
      const chatMsg = {
        senderId: player.id,
        senderName: player.username,
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isVip: player.isVip
      };
      
      // Broadcast to room
      io.to(player.map).emit('chat_message', chatMsg);
    }
  });

  // PRIVATE MESSAGE
  socket.on('private_message', (data: { targetSocketId: string; content: string }) => {
    const player = players.get(socket.id);
    if (player) {
      const pm = {
        senderId: player.id,
        senderName: player.username,
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      socket.to(data.targetSocketId).emit('private_message', { ...pm, fromSocketId: socket.id });
      socket.emit('private_message_sent', { ...pm, toSocketId: data.targetSocketId });
    }
  });

  // PARTY SYSTEM
  socket.on('create_party', () => {
    const player = players.get(socket.id);
    if (player) {
      const partyId = 'party-' + Math.random().toString(36).substring(2, 9);
      parties.set(partyId, {
        id: partyId,
        leader: player.username,
        members: [player.username]
      });
      player.partyId = partyId;
      socket.emit('party_updated', parties.get(partyId));
      socket.emit('system_message', { content: `Party created successfully!` });
    }
  });

  socket.on('join_party', (data: { partyId: string }) => {
    const player = players.get(socket.id);
    const party = parties.get(data.partyId);
    if (player && party) {
      if (!party.members.includes(player.username)) {
        party.members.push(player.username);
        player.partyId = data.partyId;
        
        // Notify members
        party.members.forEach(m => {
          const memberSocket = Array.from(players.values()).find(p => p.username === m);
          if (memberSocket) {
            io.to(memberSocket.socketId).emit('party_updated', party);
          }
        });
      }
    }
  });

  // TRADING SYSTEM
  socket.on('propose_trade', (data: { targetSocketId: string }) => {
    const player = players.get(socket.id);
    if (player) {
      socket.to(data.targetSocketId).emit('trade_proposed', {
        fromSocketId: socket.id,
        fromUsername: player.username
      });
    }
  });

  socket.on('respond_trade', (data: { targetSocketId: string; accept: boolean }) => {
    const player = players.get(socket.id);
    if (player) {
      socket.to(data.targetSocketId).emit('trade_response', {
        fromSocketId: socket.id,
        fromUsername: player.username,
        accept: data.accept
      });
    }
  });

  socket.on('update_trade_offer', (data: { targetSocketId: string; offer: any }) => {
    socket.to(data.targetSocketId).emit('trade_offer_updated', {
      offer: data.offer
    });
  });

  socket.on('lock_trade', (data: { targetSocketId: string; locked: boolean }) => {
    socket.to(data.targetSocketId).emit('trade_locked', {
      locked: data.locked
    });
  });

  socket.on('confirm_trade', (data: { targetSocketId: string }) => {
    socket.to(data.targetSocketId).emit('trade_confirmed');
  });

  // MINI GAMES: MATCHMAKING
  socket.on('challenge_player', (data: { targetSocketId: string; gameId: string }) => {
    const player = players.get(socket.id);
    if (player) {
      socket.to(data.targetSocketId).emit('game_challenge', {
        challengerSocketId: socket.id,
        challengerName: player.username,
        gameId: data.gameId
      });
    }
  });

  socket.on('accept_challenge', (data: { challengerSocketId: string; gameId: string; accept: boolean }) => {
    const player = players.get(socket.id);
    if (!player) return;

    if (!data.accept) {
      socket.to(data.challengerSocketId).emit('challenge_declined', { username: player.username });
      return;
    }

    const challenger = players.get(data.challengerSocketId);
    if (!challenger) {
      socket.emit('system_message', { content: 'Challenger is offline.' });
      return;
    }

    // Create Game Room
    const roomId = `game-${Date.now()}`;
    const initialStates: Record<string, any> = {
      tictactoe: { board: Array(9).fill(null), winner: null, xIsNext: true },
      chess: { fen: 'start', turn: 'w', history: [] },
      connect4: { board: Array(6).fill(null).map(() => Array(7).fill(null)), winner: null, redIsNext: true }
    };

    const newRoom: GameRoom = {
      id: roomId,
      gameId: data.gameId,
      players: [challenger.username, player.username],
      status: 'PLAYING',
      state: initialStates[data.gameId] || {},
      turn: challenger.username // Challenger goes first
    };

    gameRooms.set(roomId, newRoom);

    // Notify both sockets to load game UI
    socket.emit('game_started', { roomId, gameId: data.gameId, opponent: challenger.username, isFirst: false, state: newRoom.state });
    socket.to(data.challengerSocketId).emit('game_started', { roomId, gameId: data.gameId, opponent: player.username, isFirst: true, state: newRoom.state });
  });

  // MINI GAME MOVE SYNC
  socket.on('game_move', (data: { roomId: string; state: any; score?: number }) => {
    const room = gameRooms.get(data.roomId);
    if (room && room.status === 'PLAYING') {
      room.state = data.state;
      
      // Determine next turn
      const nextTurn = room.players.find(p => p !== room.turn) || room.players[0];
      room.turn = nextTurn;

      // Broadcast move to all game room players
      const opponent = room.players.find(name => name !== players.get(socket.id)?.username);
      const opponentPlayer = Array.from(players.values()).find(p => p.username === opponent);
      if (opponentPlayer) {
        io.to(opponentPlayer.socketId).emit('game_moved', { state: room.state, turn: room.turn });
      }
    }
  });

  // MINI GAME OVER
  socket.on('game_over', (data: { roomId: string; result: 'WIN' | 'LOSS' | 'DRAW'; winnerName?: string }) => {
    const room = gameRooms.get(data.roomId);
    if (room && room.status === 'PLAYING') {
      room.status = 'FINISHED';
      
      // Tell opponent
      const opponent = room.players.find(name => name !== players.get(socket.id)?.username);
      const opponentPlayer = Array.from(players.values()).find(p => p.username === opponent);
      if (opponentPlayer) {
        const oppResult = data.result === 'WIN' ? 'LOSS' : data.result === 'LOSS' ? 'WIN' : 'DRAW';
        io.to(opponentPlayer.socketId).emit('game_ended', { result: oppResult, winnerName: data.winnerName });
      }
      
      gameRooms.delete(data.roomId);
    }
  });

  // WEBRTC VOICE CHAT SIGNALING
  socket.on('webrtc_signal', (data: { targetSocketId: string; signal: any }) => {
    socket.to(data.targetSocketId).emit('webrtc_signal', {
      senderSocketId: socket.id,
      signal: data.signal
    });
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    console.log(`🔌 Player disconnected: ${socket.id}`);
    const player = players.get(socket.id);
    if (player) {
      socket.to(player.map).emit('player_left', { id: player.id, socketId: socket.id });
      players.delete(socket.id);
      
      // Remove from any active games
      for (const [roomId, room] of gameRooms.entries()) {
        if (room.players.includes(player.username)) {
          room.status = 'FINISHED';
          const opponent = room.players.find(name => name !== player.username);
          const opponentPlayer = Array.from(players.values()).find(p => p.username === opponent);
          if (opponentPlayer) {
            io.to(opponentPlayer.socketId).emit('game_ended', { result: 'WIN', reason: 'Opponent disconnected' });
          }
          gameRooms.delete(roomId);
        }
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 PixelVerse Realtime Server running on port ${PORT}`);
});
