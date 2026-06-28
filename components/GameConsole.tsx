'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Award, Zap, HelpCircle, User, Check, Play, RefreshCw } from 'lucide-react';
import canvasConfetti from 'canvas-confetti';

interface GameConsoleProps {
  user: any;
  socket: any;
  gameMatch: any; // Realtime match info from useSocket
  onSubmitMove: (roomId: string, state: any) => void;
  onFinishGame: (roomId: string, result: 'WIN' | 'LOSS' | 'DRAW', winnerName?: string) => void;
  onClose: () => void;
}

export default function GameConsole({
  user,
  socket,
  gameMatch,
  onSubmitMove,
  onFinishGame,
  onClose,
}: GameConsoleProps) {
  const [activeGame, setActiveGame] = useState<'SELECTION' | 'SNAKE' | 'MEMORY' | 'TICTACTOE'>('SELECTION');
  const [loading, setLoading] = useState(false);

  // Challenge target states (for Tic Tac Toe multiplayer matchmaking)
  const [targetSocketId, setTargetSocketId] = useState('');
  const [playersList, setPlayersList] = useState<any[]>([]);

  useEffect(() => {
    if (gameMatch) {
      setActiveGame('TICTACTOE');
    }
  }, [gameMatch]);

  const recordScoreInDb = async (gameId: string, result: 'WIN' | 'LOSS' | 'DRAW', score = 0) => {
    try {
      await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger', questId: 'daily_game' }),
      });
      
      const coinsReward = result === 'WIN' ? 150 : result === 'DRAW' ? 80 : 50;
      canvasConfetti({ particleCount: 30, spread: 30 });
    } catch (e) {
      console.error(e);
    }
  };

  // ==========================================
  // GAME 1: MEMORY MATCHING GAME (SINGLE PLAYER)
  // ==========================================
  const [memoryCards, setMemoryCards] = useState<any[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);
  const [memoryScore, setMemoryScore] = useState(0);

  const initMemoryGame = () => {
    const symbols = ['🍎', '🍌', '🍇', '🍓', '🍒', '🍉', '🍎', '🍌', '🍇', '🍓', '🍒', '🍉'];
    const shuffled = symbols
      .map((sym, idx) => ({ id: idx, symbol: sym }))
      .sort(() => Math.random() - 0.5);
    setMemoryCards(shuffled);
    setSelectedCards([]);
    setMatchedCards([]);
    setMemoryScore(0);
  };

  const handleCardClick = (idx: number) => {
    if (selectedCards.length >= 2 || selectedCards.includes(idx) || matchedCards.includes(idx)) return;

    const newSelection = [...selectedCards, idx];
    setSelectedCards(newSelection);

    if (newSelection.length === 2) {
      const first = memoryCards[newSelection[0]];
      const second = memoryCards[newSelection[1]];

      if (first.symbol === second.symbol) {
        setMatchedCards((prev) => [...prev, newSelection[0], newSelection[1]]);
        setMemoryScore((prev) => prev + 100);
        setSelectedCards([]);
        
        if (matchedCards.length + 2 === memoryCards.length) {
          canvasConfetti({ particleCount: 60, spread: 40 });
          recordScoreInDb('memory', 'WIN', memoryScore + 100);
        }
      } else {
        setTimeout(() => {
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  // ==========================================
  // GAME 2: SNAKE GAME (SINGLE PLAYER)
  // ==========================================
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [snakeScore, setSnakeScore] = useState(0);
  const [snakePlaying, setSnakePlaying] = useState(false);
  const snakeIntervalRef = useRef<any>(null);

  const startSnakeGame = () => {
    setSnakeScore(0);
    setSnakePlaying(true);
    
    let snake = [{ x: 10, y: 10 }];
    let apple = { x: 5, y: 5 };
    let dx = 1;
    let dy = 0;
    const gridCount = 20;

    // Keyboard bindings
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -1; }
      else if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 1; }
      else if (e.key === 'ArrowLeft' && dx === 0) { dx = -1; dy = 0; }
      else if (e.key === 'ArrowRight' && dx === 0) { dx = 1; dy = 0; }
    };
    window.addEventListener('keydown', handleKeyDown);

    const generateApple = () => {
      let rx = 0, ry = 0;
      do {
        rx = Math.floor(Math.random() * gridCount);
        ry = Math.floor(Math.random() * gridCount);
      } while (snake.some(s => s.x === rx && s.y === ry));
      apple = { x: rx, y: ry };
    };

    if (snakeIntervalRef.current) clearInterval(snakeIntervalRef.current);

    snakeIntervalRef.current = setInterval(() => {
      const head = { x: snake[0].x + dx, y: snake[0].y + dy };
      
      // Wall collision
      if (head.x < 0 || head.x >= gridCount || head.y < 0 || head.y >= gridCount) {
        clearInterval(snakeIntervalRef.current);
        setSnakePlaying(false);
        recordScoreInDb('snake', 'LOSS', snakeScore);
        window.removeEventListener('keydown', handleKeyDown);
        return;
      }
      
      // Self collision
      if (snake.some(s => s.x === head.x && s.y === head.y)) {
        clearInterval(snakeIntervalRef.current);
        setSnakePlaying(false);
        recordScoreInDb('snake', 'LOSS', snakeScore);
        window.removeEventListener('keydown', handleKeyDown);
        return;
      }

      snake.unshift(head);

      if (head.x === apple.x && head.y === apple.y) {
        setSnakeScore(prev => prev + 10);
        generateApple();
      } else {
        snake.pop();
      }

      // Draw canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw apple
          ctx.fillStyle = '#ef4444';
          const cw = canvas.width / gridCount;
          const ch = canvas.height / gridCount;
          ctx.fillRect(apple.x * cw, apple.y * ch, cw - 1, ch - 1);

          // Draw snake
          ctx.fillStyle = '#10b981';
          snake.forEach(s => {
            ctx.fillRect(s.x * cw, s.y * ch, cw - 1, ch - 1);
          });
        }
      }
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (snakeIntervalRef.current) clearInterval(snakeIntervalRef.current);
    };
  }, []);

  // ==========================================
  // GAME 3: TICTACTOE MULTIPLAYER
  // ==========================================
  const handleTttClick = (cellIdx: number) => {
    if (!gameMatch || gameMatch.ended) return;
    
    // Check if cell empty
    if (gameMatch.state.board[cellIdx] !== '') return;
    
    // Check if user turn
    const isXTurn = gameMatch.state.xIsNext;
    const isUserX = gameMatch.isFirst; // challenger is X, receiver is O
    
    if ((isXTurn && !isUserX) || (!isXTurn && isUserX)) {
      alert("It is not your turn!");
      return;
    }

    const newBoard = [...gameMatch.state.board];
    newBoard[cellIdx] = isUserX ? 'X' : 'O';

    onSubmitMove(gameMatch.roomId, {
      board: newBoard,
      xIsNext: !isXTurn
    });
  };

  const handleChallengeRequest = (socketId: string) => {
    socket.emit('challenge_player', { targetSocketId: socketId, gameId: 'tictactoe' });
    alert("Sent game challenge request!");
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
        <div className="border-b border-white/5 pb-4 mb-5 flex justify-between items-center">
          <h2 className="font-modern-heading text-xl text-purple-400 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-purple-400" /> Arcade Station
          </h2>
          {activeGame !== 'SELECTION' && (
            <button
              onClick={() => {
                setActiveGame('SELECTION');
                setSnakePlaying(false);
              }}
              className="modern-btn modern-btn-secondary py-1.5 px-3.5 text-xs text-slate-400 hover:text-white"
            >
              ← Back to Arcade
            </button>
          )}
        </div>

        {/* VIEW 1: GAME SELECTION LIST */}
        {activeGame === 'SELECTION' && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Snake Card */}
            <div className="modern-card p-4 flex flex-col justify-between border border-white/5 bg-slate-900/60 hover:border-green-500/30">
              <div>
                <span className="text-[9px] font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded">Singleplayer</span>
                <h3 className="text-sm font-semibold text-foreground mt-2.5">Retro Snake</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Guide the pixel snake to eat apples and grow without hitting the wall!</p>
              </div>
              <button
                onClick={() => {
                  setActiveGame('SNAKE');
                  startSnakeGame();
                }}
                className="modern-btn modern-btn-primary mt-4 py-2 flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Play Now
              </button>
            </div>

            {/* Memory Card */}
            <div className="modern-card p-4 flex flex-col justify-between border border-white/5 bg-slate-900/60 hover:border-yellow-500/30">
              <div>
                <span className="text-[9px] font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded">Singleplayer</span>
                <h3 className="text-sm font-semibold text-foreground mt-2.5">Memory Match</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Flip card pairs and clear the grid. Test your concentration!</p>
              </div>
              <button
                onClick={() => {
                  setActiveGame('MEMORY');
                  initMemoryGame();
                }}
                className="modern-btn modern-btn-primary mt-4 py-2 flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Play Now
              </button>
            </div>

            {/* Tic Tac Toe Card */}
            <div className="modern-card p-4 flex flex-col justify-between border border-white/5 bg-slate-900/60 hover:border-purple-500/30">
              <div>
                <span className="text-[9px] font-bold bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">Multiplayer</span>
                <h3 className="text-sm font-semibold text-foreground mt-2.5">Tic Tac Toe</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Challenge other players in your map to a synchronized match of 3-in-a-row!</p>
              </div>
              <div className="mt-4 space-y-2">
                <input
                  type="text"
                  placeholder="Enter target username..."
                  className="modern-input py-1.5 px-3"
                  value={targetSocketId}
                  onChange={(e) => setTargetSocketId(e.target.value)}
                />
                <button
                  onClick={() => handleChallengeRequest(targetSocketId)}
                  className="w-full modern-btn modern-btn-secondary py-2 text-xs"
                >
                  Send Challenge
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SNAKE SCREEN */}
        {activeGame === 'SNAKE' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="flex justify-between items-center w-full max-w-md text-xs font-semibold text-yellow-400 px-2">
              <span>Score: {snakeScore}</span>
              <span>Use Arrow Keys</span>
            </div>
            
            <div className="relative border border-white/5 bg-slate-950 rounded-2xl overflow-hidden shadow-2xl p-1">
              <canvas
                ref={canvasRef}
                width={400}
                height={300}
                className="bg-slate-950 rounded-xl"
              />
              {!snakePlaying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
                  <p className="text-sm font-bold text-red-500">GAME OVER</p>
                  <button
                    onClick={startSnakeGame}
                    className="modern-btn modern-btn-primary py-2 text-xs"
                  >
                    Play Again
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: MEMORY MATCH */}
        {activeGame === 'MEMORY' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="flex justify-between items-center w-full max-w-sm text-xs font-semibold text-yellow-400">
              <span>Score: {memoryScore}</span>
              <button onClick={initMemoryGame} className="flex items-center gap-1 hover:text-white transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Restart
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 max-w-sm">
              {memoryCards.map((card, idx) => {
                const isSelected = selectedCards.includes(idx);
                const isMatched = matchedCards.includes(idx);

                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    className={`w-16 h-16 border rounded-xl flex items-center justify-center text-2xl transition-all ${
                      isSelected || isMatched
                        ? 'bg-purple-950/20 border-purple-500 rotate-0 shadow-md shadow-purple-500/5'
                        : 'bg-slate-950 border-white/5 hover:border-white/10 rotate-180 shadow'
                    }`}
                  >
                    {(isSelected || isMatched) ? card.symbol : '❓'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 4: MULTIPLAYER TIC TAC TOE */}
        {activeGame === 'TICTACTOE' && gameMatch && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            <div className="text-center text-xs space-y-1 font-semibold">
              <p className="text-purple-400">Match Vs. {gameMatch.opponent}</p>
              <p className="text-slate-400">
                {gameMatch.ended
                  ? `Match Finished! Winner: ${gameMatch.winnerName || 'Draw'}`
                  : `Current Turn: ${
                      (gameMatch.state.xIsNext && gameMatch.isFirst) ||
                      (!gameMatch.state.xIsNext && !gameMatch.isFirst)
                        ? 'Your Turn'
                        : 'Opponent Turn'
                    }`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 w-56 h-56">
              {gameMatch.state.board.map((cell: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleTttClick(idx)}
                  className="bg-slate-950 hover:bg-slate-900 border border-white/5 rounded-xl flex items-center justify-center text-3xl font-bold text-white transition-all shadow-inner active:scale-95"
                >
                  {cell}
                </button>
              ))}
            </div>

            {gameMatch.ended && (
              <button
                onClick={() => {
                  setActiveGame('SELECTION');
                }}
                className="modern-btn modern-btn-accent text-xs"
              >
                Return to Lobby
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
