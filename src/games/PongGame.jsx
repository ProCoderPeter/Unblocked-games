import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Pause, Play, Users, Bot } from 'lucide-react';
import { sounds } from '../utils/audio';

const WIDTH = 540;
const HEIGHT = 360;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 70;
const BALL_SIZE = 10;
const WINNING_SCORE = 7;

export default function PongGame() {
  const canvasRef = useRef(null);

  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [gameMode, setGameMode] = useState('pvc'); // 'pvc' | 'pvp'
  const [difficulty, setDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [hasStarted, setHasStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [winner, setWinner] = useState('');

  // Mutable refs for high speed physics loop
  const p1Ref = useRef({ y: HEIGHT / 2 - PADDLE_HEIGHT / 2, speed: 6, up: false, down: false });
  const p2Ref = useRef({ y: HEIGHT / 2 - PADDLE_HEIGHT / 2, speed: 6, up: false, down: false });
  const ballRef = useRef({
    x: WIDTH / 2,
    y: HEIGHT / 2,
    vx: 5,
    vy: 2.5,
    speed: 5.5,
  });

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const isGameOverRef = useRef(isGameOver);
  isGameOverRef.current = isGameOver;
  const hasStartedRef = useRef(hasStarted);
  hasStartedRef.current = hasStarted;
  const gameModeRef = useRef(gameMode);
  gameModeRef.current = gameMode;
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;

  const resetBall = useCallback((direction = 1) => {
    const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6; // -30 to +30 deg
    const speed = 5.5;
    ballRef.current = {
      x: WIDTH / 2,
      y: HEIGHT / 2,
      vx: direction * speed * Math.cos(angle),
      vy: speed * Math.sin(angle),
      speed: 5.5,
    };
  }, []);

  const resetGame = useCallback(() => {
    setScore1(0);
    setScore2(0);
    setIsGameOver(false);
    setIsPaused(false);
    setHasStarted(true);
    setWinner('');
    p1Ref.current.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
    p2Ref.current.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
    resetBall(Math.random() > 0.5 ? 1 : -1);
    sounds.playBlip(440);
  }, [resetBall]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && (!hasStartedRef.current || isGameOverRef.current)) {
        resetGame();
        return;
      }

      if (e.key.toLowerCase() === 'p') {
        setIsPaused((prev) => !prev);
        return;
      }

      // Player 1 (W / S)
      if (e.key.toLowerCase() === 'w') p1Ref.current.up = true;
      if (e.key.toLowerCase() === 's') p1Ref.current.down = true;

      // Player 2 (Up / Down)
      if (e.key === 'ArrowUp') p2Ref.current.up = true;
      if (e.key === 'ArrowDown') p2Ref.current.down = true;
    };

    const handleKeyUp = (e) => {
      if (e.key.toLowerCase() === 'w') p1Ref.current.up = false;
      if (e.key.toLowerCase() === 's') p1Ref.current.down = false;

      if (e.key === 'ArrowUp') p2Ref.current.up = false;
      if (e.key === 'ArrowDown') p2Ref.current.down = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetGame]);

  // Physics update & bot loop
  useEffect(() => {
    let animId;

    const loop = () => {
      animId = requestAnimationFrame(loop);

      if (!hasStartedRef.current || isPausedRef.current || isGameOverRef.current) return;

      const p1 = p1Ref.current;
      const p2 = p2Ref.current;
      const ball = ballRef.current;

      // 1. Move Player 1
      if (p1.up) p1.y = Math.max(10, p1.y - p1.speed);
      if (p1.down) p1.y = Math.min(HEIGHT - PADDLE_HEIGHT - 10, p1.y + p1.speed);

      // 2. Move Player 2 (or AI Bot)
      if (gameModeRef.current === 'pvp') {
        if (p2.up) p2.y = Math.max(10, p2.y - p2.speed);
        if (p2.down) p2.y = Math.min(HEIGHT - PADDLE_HEIGHT - 10, p2.y + p2.speed);
      } else {
        // AI Logic based on difficulty
        const botSpeed = difficultyRef.current === 'easy' ? 3.5 : difficultyRef.current === 'medium' ? 4.8 : 6.2;
        const paddleCenter = p2.y + PADDLE_HEIGHT / 2;
        const targetY = ball.y;

        // Add a slight reaction delay threshold
        const tolerance = difficultyRef.current === 'easy' ? 24 : difficultyRef.current === 'medium' ? 12 : 4;
        if (paddleCenter < targetY - tolerance) {
          p2.y = Math.min(HEIGHT - PADDLE_HEIGHT - 10, p2.y + botSpeed);
        } else if (paddleCenter > targetY + tolerance) {
          p2.y = Math.max(10, p2.y - botSpeed);
        }
      }

      // 3. Move Ball
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Top and Bottom wall collisions
      if (ball.y - BALL_SIZE / 2 <= 0) {
        ball.y = BALL_SIZE / 2;
        ball.vy = Math.abs(ball.vy);
        sounds.playBlip(320, 0.03);
      } else if (ball.y + BALL_SIZE / 2 >= HEIGHT) {
        ball.y = HEIGHT - BALL_SIZE / 2;
        ball.vy = -Math.abs(ball.vy);
        sounds.playBlip(320, 0.03);
      }

      // Paddle 1 Collision (Left side)
      const p1X = 25;
      if (
        ball.x - BALL_SIZE / 2 <= p1X + PADDLE_WIDTH &&
        ball.x + BALL_SIZE / 2 >= p1X &&
        ball.y >= p1.y &&
        ball.y <= p1.y + PADDLE_HEIGHT &&
        ball.vx < 0
      ) {
        // Calculate deflection angle based on hit location
        const hitOffset = (ball.y - (p1.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        const maxAngle = Math.PI / 3; // 60 deg max
        const angle = hitOffset * maxAngle;
        ball.speed = Math.min(10, ball.speed + 0.3);
        ball.vx = Math.abs(ball.speed * Math.cos(angle));
        ball.vy = ball.speed * Math.sin(angle);
        ball.x = p1X + PADDLE_WIDTH + BALL_SIZE / 2;
        sounds.playBlip(550, 0.04);
      }

      // Paddle 2 Collision (Right side)
      const p2X = WIDTH - 25 - PADDLE_WIDTH;
      if (
        ball.x + BALL_SIZE / 2 >= p2X &&
        ball.x - BALL_SIZE / 2 <= p2X + PADDLE_WIDTH &&
        ball.y >= p2.y &&
        ball.y <= p2.y + PADDLE_HEIGHT &&
        ball.vx > 0
      ) {
        const hitOffset = (ball.y - (p2.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        const maxAngle = Math.PI / 3;
        const angle = hitOffset * maxAngle;
        ball.speed = Math.min(10, ball.speed + 0.3);
        ball.vx = -Math.abs(ball.speed * Math.cos(angle));
        ball.vy = ball.speed * Math.sin(angle);
        ball.x = p2X - BALL_SIZE / 2;
        sounds.playBlip(620, 0.04);
      }

      // Point Scored (Ball past boundary)
      if (ball.x < 0) {
        // Player 2 scores
        sounds.playScore();
        setScore2((s) => {
          const next = s + 1;
          if (next >= WINNING_SCORE) {
            setIsGameOver(true);
            setWinner(gameModeRef.current === 'pvp' ? 'Player 2 Wins!' : 'Computer Wins!');
          } else {
            resetBall(1);
          }
          return next;
        });
      } else if (ball.x > WIDTH) {
        // Player 1 scores
        sounds.playScore();
        setScore1((s) => {
          const next = s + 1;
          if (next >= WINNING_SCORE) {
            setIsGameOver(true);
            setWinner('Player 1 Wins!');
          } else {
            resetBall(-1);
          }
          return next;
        });
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [resetBall]);

  // Drawing Canvas loop
  useEffect(() => {
    let animId;

    const render = () => {
      animId = requestAnimationFrame(render);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark futuristic ping-pong table
      ctx.fillStyle = '#060a16';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Center dashed net line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2, 0);
      ctx.lineTo(WIDTH / 2, HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center circle
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(WIDTH / 2, HEIGHT / 2, 40, 0, Math.PI * 2);
      ctx.stroke();

      // Left Paddle (Player 1 - Cyan)
      const p1 = p1Ref.current;
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(25, p1.y, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Right Paddle (Player 2 - Rose/Magenta)
      const p2 = p2Ref.current;
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(WIDTH - 25 - PADDLE_WIDTH, p2.y, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Cyber Ball
      const ball = ballRef.current;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto select-none">
      {/* Top Header stats */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-5 py-3 mb-4 backdrop-blur">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-400">P1 (W/S)</span>
            <span className="text-2xl font-bold font-mono text-cyan-400">{score1}</span>
          </div>
          <span className="text-slate-600 font-mono text-lg">:</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-rose-400">{score2}</span>
            <span className="text-xs font-bold text-rose-400">
              {gameMode === 'pvc' ? 'Bot' : 'P2 (↑/↓)'}
            </span>
          </div>
        </div>

        {/* Mode / Difficulty Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setGameMode((m) => (m === 'pvc' ? 'pvp' : 'pvc'));
              resetGame();
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
            title="Toggle Singleplayer / 2-Player"
          >
            {gameMode === 'pvc' ? <Bot className="w-3.5 h-3.5 text-cyan-400" /> : <Users className="w-3.5 h-3.5 text-amber-400" />}
            <span>{gameMode === 'pvc' ? 'Vs Bot' : '2 Player'}</span>
          </button>

          {gameMode === 'pvc' && (
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              {(['easy', 'medium', 'hard']).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-2 py-0.5 rounded capitalize font-semibold transition ${
                    difficulty === d ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  {d[0].toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {hasStarted && !isGameOver && (
            <button
              onClick={() => setIsPaused((p) => !p)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={resetGame}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Box */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="block max-w-full h-auto aspect-[540/360]"
        />

        {!hasStarted && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Neon Pong</h3>
            <p className="text-xs text-slate-300 max-w-xs mb-5">
              Deflect the cyber ball past your opponent. First player to {WINNING_SCORE} points wins!
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              Serve Ball
            </button>
          </div>
        )}

        {isPaused && hasStarted && !isGameOver && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center">
            <Pause className="w-10 h-10 text-cyan-400 mb-2" />
            <h3 className="text-lg font-bold text-white mb-2">Game Paused</h3>
            <button
              onClick={() => setIsPaused(false)}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition"
            >
              Resume (P)
            </button>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-5 text-center">
            <div className="text-3xl mb-1">🏓</div>
            <h3 className="text-2xl font-bold text-amber-400 mb-1">{winner}</h3>
            <p className="text-xs text-slate-300 mb-4">
              Final: {score1} — {score2}
            </p>
            <button
              onClick={resetGame}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              Rematch (Space)
            </button>
          </div>
        )}
      </div>

      {/* Mobile Touch Paddle Controls */}
      <div className="mt-4 flex items-center justify-between w-full max-w-md sm:hidden px-4">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-cyan-400 text-center">P1 Controls</span>
          <div className="flex gap-2">
            <button
              onTouchStart={() => (p1Ref.current.up = true)}
              onTouchEnd={() => (p1Ref.current.up = false)}
              className="p-3 bg-slate-800 text-cyan-400 rounded-xl active:bg-slate-700 font-bold"
            >
              ▲
            </button>
            <button
              onTouchStart={() => (p1Ref.current.down = true)}
              onTouchEnd={() => (p1Ref.current.down = false)}
              className="p-3 bg-slate-800 text-cyan-400 rounded-xl active:bg-slate-700 font-bold"
            >
              ▼
            </button>
          </div>
        </div>

        {gameMode === 'pvp' && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-rose-400 text-center">P2 Controls</span>
            <div className="flex gap-2">
              <button
                onTouchStart={() => (p2Ref.current.up = true)}
                onTouchEnd={() => (p2Ref.current.up = false)}
                className="p-3 bg-slate-800 text-rose-400 rounded-xl active:bg-slate-700 font-bold"
              >
                ▲
              </button>
              <button
                onTouchStart={() => (p2Ref.current.down = true)}
                onTouchEnd={() => (p2Ref.current.down = false)}
                className="p-3 bg-slate-800 text-rose-400 rounded-xl active:bg-slate-700 font-bold"
              >
                ▼
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
