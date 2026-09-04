import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Pause, Play, Trophy, Heart } from 'lucide-react';
import { sounds } from '../utils/audio';
import { getHighScore, saveHighScore } from '../utils/storage';

const WIDTH = 480;
const HEIGHT = 460;
const PADDLE_WIDTH = 75;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 6;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_HEIGHT = 16;
const BRICK_PADDING = 6;
const BRICK_OFFSET_TOP = 40;
const BRICK_OFFSET_LEFT = 20;

const BRICK_COLORS = ['#ec4899', '#f43f5e', '#f97316', '#eab308', '#10b981'];

export default function BreakoutGame() {
  const canvasRef = useRef(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => getHighScore('breakout'));
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [hasStarted, setHasStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isWon, setIsWon] = useState(false);

  // Physics refs for 60fps loop
  const paddleRef = useRef({ x: WIDTH / 2 - PADDLE_WIDTH / 2, width: PADDLE_WIDTH });
  const ballRef = useRef({
    x: WIDTH / 2,
    y: HEIGHT - 60,
    vx: 3.5,
    vy: -4,
    speed: 5,
    stuck: true,
  });
  const bricksRef = useRef([]);
  const keysRef = useRef({ left: false, right: false });

  const scoreRef = useRef(score);
  scoreRef.current = score;
  const livesRef = useRef(lives);
  livesRef.current = lives;
  const isGameOverRef = useRef(isGameOver);
  isGameOverRef.current = isGameOver;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const hasStartedRef = useRef(hasStarted);
  hasStartedRef.current = hasStarted;

  const initBricks = useCallback(() => {
    const totalBrickWidth = WIDTH - BRICK_OFFSET_LEFT * 2;
    const brickWidth = (totalBrickWidth - (BRICK_COLS - 1) * BRICK_PADDING) / BRICK_COLS;
    const bricks = [];

    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: BRICK_OFFSET_LEFT + c * (brickWidth + BRICK_PADDING),
          y: BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_PADDING),
          width: brickWidth,
          height: BRICK_HEIGHT,
          color: BRICK_COLORS[r % BRICK_COLORS.length],
          points: (BRICK_ROWS - r) * 10,
          alive: true,
        });
      }
    }
    bricksRef.current = bricks;
  }, []);

  const resetGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setIsGameOver(false);
    setIsWon(false);
    setIsPaused(false);
    setHasStarted(true);

    paddleRef.current = { x: WIDTH / 2 - PADDLE_WIDTH / 2, width: PADDLE_WIDTH };
    ballRef.current = {
      x: WIDTH / 2,
      y: HEIGHT - 60,
      vx: 3.5,
      vy: -4,
      speed: 5,
      stuck: true,
    };
    initBricks();
    sounds.playBlip(440);
  }, [initBricks]);

  // Launch ball off paddle
  const launchBall = useCallback(() => {
    if (ballRef.current.stuck) {
      ballRef.current.stuck = false;
      sounds.playBlip(550, 0.05);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && (!hasStartedRef.current || isGameOverRef.current)) {
        resetGame();
        return;
      }

      if (e.key === ' ' && ballRef.current.stuck) {
        launchBall();
        return;
      }

      if (e.key.toLowerCase() === 'p') {
        setIsPaused((p) => !p);
        return;
      }

      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        keysRef.current.right = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        keysRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        keysRef.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetGame, launchBall]);

  // Mouse / Touch paddle tracking
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const p = paddleRef.current;
    p.x = Math.max(10, Math.min(WIDTH - p.width - 10, mouseX - p.width / 2));
  };

  const handleTouchMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const touch = e.touches[0];
    const mouseX = (touch.clientX - rect.left) * scaleX;
    const p = paddleRef.current;
    p.x = Math.max(10, Math.min(WIDTH - p.width - 10, mouseX - p.width / 2));
  };

  // Main game physics loop
  useEffect(() => {
    let animId;

    const loop = () => {
      animId = requestAnimationFrame(loop);

      if (!hasStartedRef.current || isPausedRef.current || isGameOverRef.current) return;

      const p = paddleRef.current;
      const b = ballRef.current;
      const keys = keysRef.current;
      const bricks = bricksRef.current;

      // Keyboard paddle movement
      if (keys.left) p.x = Math.max(10, p.x - 7);
      if (keys.right) p.x = Math.min(WIDTH - p.width - 10, p.x + 7);

      // If ball stuck on paddle
      if (b.stuck) {
        b.x = p.x + p.width / 2;
        b.y = HEIGHT - 35 - BALL_RADIUS;
        return;
      }

      // Move Ball
      b.x += b.vx;
      b.y += b.vy;

      // Left & Right walls
      if (b.x - BALL_RADIUS <= 0) {
        b.x = BALL_RADIUS;
        b.vx = Math.abs(b.vx);
        sounds.playBlip(350, 0.03);
      } else if (b.x + BALL_RADIUS >= WIDTH) {
        b.x = WIDTH - BALL_RADIUS;
        b.vx = -Math.abs(b.vx);
        sounds.playBlip(350, 0.03);
      }

      // Ceiling
      if (b.y - BALL_RADIUS <= 0) {
        b.y = BALL_RADIUS;
        b.vy = Math.abs(b.vy);
        sounds.playBlip(380, 0.03);
      }

      // Paddle Collision
      const paddleTop = HEIGHT - 35;
      if (
        b.y + BALL_RADIUS >= paddleTop &&
        b.y - BALL_RADIUS <= paddleTop + PADDLE_HEIGHT &&
        b.x >= p.x &&
        b.x <= p.x + p.width &&
        b.vy > 0
      ) {
        // Angle depends on where on paddle ball struck
        const hitOffset = (b.x - (p.x + p.width / 2)) / (p.width / 2);
        const maxAngle = (Math.PI / 3) * 0.9;
        const angle = hitOffset * maxAngle;
        b.speed = Math.min(8.5, b.speed + 0.1);
        b.vx = b.speed * Math.sin(angle);
        b.vy = -Math.abs(b.speed * Math.cos(angle));
        sounds.playBlip(550, 0.04);
      }

      // Brick Collisions
      let livingBricks = 0;
      for (const br of bricks) {
        if (!br.alive) continue;
        livingBricks++;

        if (
          b.x + BALL_RADIUS > br.x &&
          b.x - BALL_RADIUS < br.x + br.width &&
          b.y + BALL_RADIUS > br.y &&
          b.y - BALL_RADIUS < br.y + br.height
        ) {
          br.alive = false;
          sounds.playScore();
          b.vy = -b.vy; // bounce

          const newScore = scoreRef.current + br.points;
          setScore(newScore);
          if (newScore > highScore) {
            saveHighScore('breakout', newScore);
            setHighScore(newScore);
          }
          break;
        }
      }

      // Check level cleared
      if (livingBricks === 0) {
        sounds.playScore();
        setLevel((l) => l + 1);
        initBricks();
        b.stuck = true;
        b.speed = Math.min(8, b.speed + 0.5);
      }

      // Ball missed bottom
      if (b.y > HEIGHT) {
        sounds.playExplosion();
        setLives((l) => {
          const rem = l - 1;
          if (rem <= 0) {
            setIsGameOver(true);
            sounds.playGameOver();
            const best = Math.max(scoreRef.current, highScore);
            if (best > highScore) {
              saveHighScore('breakout', best);
              setHighScore(best);
            }
          } else {
            b.stuck = true;
          }
          return rem;
        });
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [highScore, initBricks]);

  // Drawing Canvas loop
  useEffect(() => {
    let animId;

    const render = () => {
      animId = requestAnimationFrame(render);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark background
      ctx.fillStyle = '#0a0d18';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Draw Bricks
      for (const br of bricksRef.current) {
        if (!br.alive) continue;
        ctx.fillStyle = br.color;
        ctx.shadowColor = br.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(br.x, br.y, br.width, br.height, 4);
        ctx.fill();

        // 3D bevel top stripe
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(br.x + 2, br.y + 2, br.width - 4, 3);
      }
      ctx.shadowBlur = 0;

      // Draw Paddle
      const p = paddleRef.current;
      ctx.fillStyle = '#ec4899'; // pink
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(p.x, HEIGHT - 35, p.width, PADDLE_HEIGHT, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Ball
      const b = ballRef.current;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto select-none">
      {/* Top Stats Bar */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-5 py-3 mb-4 backdrop-blur">
        <div className="flex items-center gap-5">
          <div>
            <span className="text-xs font-semibold text-slate-400">Score</span>
            <div className="text-2xl font-bold font-mono text-pink-400">{score}</div>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">Level</span>
            <div className="text-2xl font-bold font-mono text-cyan-400">{level}</div>
          </div>
          <div className="flex items-center gap-1.5 pt-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 ${
                  i < lives ? 'text-pink-500 fill-pink-500' : 'text-slate-700 fill-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Canvas with Mouse / Touch Listeners */}
      <div
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onClick={launchBall}
        className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950 cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="block max-w-full h-auto aspect-[480/460]"
        />

        {!hasStarted && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Brick Breaker</h3>
            <p className="text-xs text-slate-300 max-w-xs mb-5">
              Smash through all neon bricks with your paddle. Click or press Spacebar to launch!
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-2.5 bg-pink-500 hover:bg-pink-400 text-white font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              Start Game
            </button>
          </div>
        )}

        {isPaused && hasStarted && !isGameOver && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center">
            <Pause className="w-10 h-10 text-pink-400 mb-2" />
            <h3 className="text-lg font-bold text-white mb-2">Game Paused</h3>
            <button
              onClick={() => setIsPaused(false)}
              className="px-4 py-1.5 bg-pink-500 hover:bg-pink-400 text-white font-bold rounded-lg transition"
            >
              Resume (P)
            </button>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-5 text-center">
            <div className="text-3xl mb-1">💔</div>
            <h3 className="text-xl font-bold text-red-400 mb-1">Game Over</h3>
            <p className="text-xs text-slate-300 mb-4">
              Final Score: <span className="font-bold text-pink-400">{score}</span>
            </p>
            <button
              onClick={resetGame}
              className="px-5 py-2 bg-pink-500 hover:bg-pink-400 text-white font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 mt-3 text-center">
        Tip: Move paddle with <span className="text-slate-200 font-bold">Mouse / Arrow keys</span>. Click or tap to release ball.
      </p>
    </div>
  );
}
