import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Pause, Play, Trophy, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../utils/audio';
import { getHighScore, saveHighScore } from '../utils/storage';

const GRID_SIZE = 20;
const CANVAS_WIDTH = 440;
const CANVAS_HEIGHT = 440;
const CELL_SIZE = CANVAS_WIDTH / GRID_SIZE;

const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

const SPEEDS = {
  easy: 120,
  normal: 90,
  hard: 65,
};

export default function SnakeGame() {
  const canvasRef = useRef(null);

  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => getHighScore('snake'));
  const [difficulty, setDifficulty] = useState('normal');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [muted, setMuted] = useState(() => sounds.getMuted());

  // Mutable refs for fluid animation loop without lag
  const directionRef = useRef(direction);
  directionRef.current = direction;
  const nextDirRef = useRef(direction);
  const snakeRef = useRef(snake);
  snakeRef.current = snake;
  const foodRef = useRef(food);
  foodRef.current = food;
  const isGameOverRef = useRef(isGameOver);
  isGameOverRef.current = isGameOver;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const hasStartedRef = useRef(hasStarted);
  hasStartedRef.current = hasStarted;
  const scoreRef = useRef(score);
  scoreRef.current = score;

  const generateFood = useCallback((currentSnake) => {
    let newFood;
    let collision;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      collision = currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      );
    } while (collision);
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    const startFood = generateFood(INITIAL_SNAKE);
    setFood(startFood);
    foodRef.current = startFood;
    setDirection({ x: 1, y: 0 });
    nextDirRef.current = { x: 1, y: 0 };
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setHasStarted(true);
    sounds.playBlip(440);
  }, [generateFood]);

  const toggleMute = () => {
    const isNowMuted = sounds.toggleMute();
    setMuted(isNowMuted);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent default scrolling on game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
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

      if (!hasStartedRef.current || isPausedRef.current || isGameOverRef.current) return;

      const current = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (current.y === 0) nextDirRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (current.y === 0) nextDirRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (current.x === 0) nextDirRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (current.x === 0) nextDirRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetGame]);

  // Main game tick loop
  useEffect(() => {
    if (!hasStarted || isPaused || isGameOver) return;

    const interval = setInterval(() => {
      const curSnake = snakeRef.current;
      const curDir = nextDirRef.current;
      directionRef.current = curDir;

      const head = curSnake[0];
      const newHead = {
        x: head.x + curDir.x,
        y: head.y + curDir.y,
      };

      // Wall collision check
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        handleGameOver();
        return;
      }

      // Self collision check
      if (
        curSnake.slice(0, -1).some((seg) => seg.x === newHead.x && seg.y === newHead.y)
      ) {
        handleGameOver();
        return;
      }

      const newSnake = [newHead, ...curSnake];

      // Food eating check
      if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
        sounds.playScore();
        const newScore = scoreRef.current + 10;
        setScore(newScore);
        if (newScore > highScore) {
          saveHighScore('snake', newScore);
          setHighScore(newScore);
        }
        const nextFood = generateFood(newSnake);
        setFood(nextFood);
        foodRef.current = nextFood;
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);
    }, SPEEDS[difficulty]);

    const handleGameOver = () => {
      setIsGameOver(true);
      sounds.playGameOver();
      const best = Math.max(scoreRef.current, highScore);
      if (best > highScore) {
        saveHighScore('snake', best);
        setHighScore(best);
      }
    };

    return () => clearInterval(interval);
  }, [hasStarted, isPaused, isGameOver, difficulty, generateFood, highScore]);

  // Drawing Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark canvas background
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle grid lines
    ctx.strokeStyle = '#151d30';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_HEIGHT);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_WIDTH, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw Food (Apple)
    const fx = food.x * CELL_SIZE;
    const fy = food.y * CELL_SIZE;
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(fx + CELL_SIZE / 2, fy + CELL_SIZE / 2, CELL_SIZE / 2.3, 0, Math.PI * 2);
    ctx.fill();

    // Leaf on apple
    ctx.fillStyle = '#22c55e';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(fx + CELL_SIZE / 2 + 3, fy + 3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw Snake
    snake.forEach((segment, index) => {
      const sx = segment.x * CELL_SIZE;
      const sy = segment.y * CELL_SIZE;

      if (index === 0) {
        // Head
        ctx.fillStyle = '#10b981'; // emerald-500
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(sx + 1, sy + 1, CELL_SIZE - 2, CELL_SIZE - 2, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eyes
        ctx.fillStyle = '#022c22';
        const eyeOffset = 4;
        const eyeSize = 3;
        const dir = directionRef.current;
        let e1x = sx + eyeOffset;
        let e1y = sy + eyeOffset;
        let e2x = sx + CELL_SIZE - eyeOffset - eyeSize;
        let e2y = sy + eyeOffset;

        if (dir.y !== 0) {
          e1y = dir.y > 0 ? sy + CELL_SIZE - eyeOffset - eyeSize : sy + eyeOffset;
          e2y = e1y;
        } else if (dir.x !== 0) {
          e1x = dir.x > 0 ? sx + CELL_SIZE - eyeOffset - eyeSize : sx + eyeOffset;
          e2x = e1x;
          e1y = sy + eyeOffset;
          e2y = sy + CELL_SIZE - eyeOffset - eyeSize;
        }

        ctx.fillRect(e1x, e1y, eyeSize, eyeSize);
        ctx.fillRect(e2x, e2y, eyeSize, eyeSize);
      } else {
        // Body Segment
        const gradRatio = 1 - index / (snake.length * 1.5);
        ctx.fillStyle = `rgba(16, 185, 129, ${Math.max(0.4, gradRatio)})`;
        ctx.beginPath();
        ctx.roundRect(sx + 2, sy + 2, CELL_SIZE - 4, CELL_SIZE - 4, 4);
        ctx.fill();
      }
    });
  }, [snake, food]);

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto select-none">
      {/* Top Header stats */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-5 py-3 mb-4 backdrop-blur">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs font-semibold text-slate-400">Score</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">{score}</div>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-xs font-semibold text-slate-400">Best</span>
              <div className="text-2xl font-bold font-mono text-amber-400">{Math.max(score, highScore)}</div>
            </div>
          </div>
        </div>

        {/* Speed / Controls */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
            {(['easy', 'normal', 'hard']).map((spd) => (
              <button
                key={spd}
                onClick={() => setDifficulty(spd)}
                className={`px-2.5 py-1 rounded capitalize font-semibold transition ${
                  difficulty === spd
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}
              </button>
            ))}
          </div>

          <button
            onClick={toggleMute}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title={muted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {hasStarted && !isGameOver && (
            <button
              onClick={() => setIsPaused((p) => !p)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title={isPaused ? 'Resume (P)' : 'Pause (P)'}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={resetGame}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-1.5 transition shadow-sm"
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
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block max-w-full h-auto aspect-square"
        />

        {/* Start Overlay */}
        {!hasStarted && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-3">
              <Sparkles className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Retro Snake</h3>
            <p className="text-xs text-slate-300 max-w-xs mb-5">
              Eat juicy apples to grow. Don't hit the borders or crash into yourself!
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              Start Game (Space)
            </button>
          </div>
        )}

        {/* Pause Overlay */}
        {isPaused && hasStarted && !isGameOver && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center">
            <Pause className="w-12 h-12 text-emerald-400 mb-2" />
            <h3 className="text-xl font-bold text-white mb-2">Game Paused</h3>
            <button
              onClick={() => setIsPaused(false)}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition"
            >
              Resume (P)
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="text-4xl mb-2">💀</div>
            <h3 className="text-2xl font-bold text-red-400 mb-1">Game Over!</h3>
            <p className="text-sm text-slate-300 mb-4">
              Your Score: <span className="font-bold text-emerald-400">{score}</span> | Best: {Math.max(score, highScore)}
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              Play Again (Space)
            </button>
          </div>
        )}
      </div>

      {/* On-screen Directional Touch Controls for mobile/tablets */}
      <div className="mt-4 grid grid-cols-3 gap-2 w-48 sm:hidden">
        <div />
        <button
          onClick={() => {
            if (directionRef.current.y === 0) nextDirRef.current = { x: 0, y: -1 };
          }}
          className="p-3 bg-slate-800 text-white rounded-xl active:bg-slate-700 flex justify-center border border-slate-700"
        >
          ▲
        </button>
        <div />
        <button
          onClick={() => {
            if (directionRef.current.x === 0) nextDirRef.current = { x: -1, y: 0 };
          }}
          className="p-3 bg-slate-800 text-white rounded-xl active:bg-slate-700 flex justify-center border border-slate-700"
        >
          ◀
        </button>
        <button
          onClick={() => {
            if (directionRef.current.y === 0) nextDirRef.current = { x: 0, y: 1 };
          }}
          className="p-3 bg-slate-800 text-white rounded-xl active:bg-slate-700 flex justify-center border border-slate-700"
        >
          ▼
        </button>
        <button
          onClick={() => {
            if (directionRef.current.x === 0) nextDirRef.current = { x: 1, y: 0 };
          }}
          className="p-3 bg-slate-800 text-white rounded-xl active:bg-slate-700 flex justify-center border border-slate-700"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
