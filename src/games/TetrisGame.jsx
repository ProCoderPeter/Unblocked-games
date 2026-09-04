import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Pause, Play, Trophy, ArrowDown, RefreshCw, ArrowLeft, ArrowRight } from 'lucide-react';
import { sounds } from '../utils/audio';
import { getHighScore, saveHighScore } from '../utils/storage';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;

// Standard Tetromino shapes and hex colors
const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#06b6d4', // cyan
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#eab308', // yellow
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#a855f7', // purple
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#22c55e', // green
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#ef4444', // red
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#3b82f6', // blue
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#f97316', // orange
  },
};

const TETROMINO_KEYS = Object.keys(TETROMINOES);

export default function TetrisGame() {
  const canvasRef = useRef(null);
  const nextCanvasRef = useRef(null);
  const holdCanvasRef = useRef(null);

  const [grid, setGrid] = useState(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(''))
  );
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPieceType, setNextPieceType] = useState('T');
  const [holdPieceType, setHoldPieceType] = useState(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => getHighScore('tetris'));
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const gridRef = useRef(grid);
  gridRef.current = grid;
  const pieceRef = useRef(currentPiece);
  pieceRef.current = currentPiece;
  const nextTypeRef = useRef(nextPieceType);
  nextTypeRef.current = nextPieceType;
  const holdTypeRef = useRef(holdPieceType);
  holdTypeRef.current = holdPieceType;
  const canHoldRef = useRef(canHold);
  canHoldRef.current = canHold;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const isGameOverRef = useRef(isGameOver);
  isGameOverRef.current = isGameOver;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const hasStartedRef = useRef(hasStarted);
  hasStartedRef.current = hasStarted;

  const getRandomType = () => {
    return TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
  };

  const createPiece = (type) => {
    const data = TETROMINOES[type];
    return {
      type,
      shape: data.shape.map((row) => [...row]),
      color: data.color,
      x: Math.floor(COLS / 2) - Math.ceil(data.shape[0].length / 2),
      y: 0,
    };
  };

  const checkCollision = useCallback(
    (piece, testX = piece.x, testY = piece.y, testShape = piece.shape) => {
      const g = gridRef.current;
      for (let r = 0; r < testShape.length; r++) {
        for (let c = 0; c < testShape[r].length; c++) {
          if (testShape[r][c] !== 0) {
            const newX = testX + c;
            const newY = testY + r;
            if (newX < 0 || newX >= COLS || newY >= ROWS) {
              return true;
            }
            if (newY >= 0 && g[newY][newX] !== '') {
              return true;
            }
          }
        }
      }
      return false;
    },
    []
  );

  const rotateMatrix = (matrix) => {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rotated[c][rows - 1 - r] = matrix[r][c];
      }
    }
    return rotated;
  };

  const lockPieceAndClear = useCallback(() => {
    const p = pieceRef.current;
    if (!p) return;

    sounds.playBlip(300, 0.05);

    const newGrid = gridRef.current.map((row) => [...row]);
    let gameOver = false;

    for (let r = 0; r < p.shape.length; r++) {
      for (let c = 0; c < p.shape[r].length; c++) {
        if (p.shape[r][c] !== 0) {
          const gy = p.y + r;
          const gx = p.x + c;
          if (gy < 0) {
            gameOver = true;
          } else {
            newGrid[gy][gx] = p.color;
          }
        }
      }
    }

    if (gameOver) {
      setIsGameOver(true);
      sounds.playGameOver();
      const best = Math.max(scoreRef.current, highScore);
      if (best > highScore) {
        saveHighScore('tetris', best);
        setHighScore(best);
      }
      return;
    }

    // Line clearing
    let clearedCount = 0;
    const filteredGrid = newGrid.filter((row) => {
      const isFull = row.every((cell) => cell !== '');
      if (isFull) clearedCount++;
      return !isFull;
    });

    while (filteredGrid.length < ROWS) {
      filteredGrid.unshift(Array(COLS).fill(''));
    }

    if (clearedCount > 0) {
      sounds.playScore();
      const points = [0, 100, 300, 500, 800][clearedCount] || 100;
      const addedScore = points * level;
      setScore((s) => s + addedScore);
      setLines((prev) => {
        const total = prev + clearedCount;
        setLevel(Math.floor(total / 10) + 1);
        return total;
      });
    }

    setGrid(filteredGrid);
    setCanHold(true);

    // Spawn next piece
    const nextType = nextTypeRef.current;
    const newP = createPiece(nextType);
    const futureType = getRandomType();
    setNextPieceType(futureType);

    if (checkCollision(newP)) {
      setIsGameOver(true);
      sounds.playGameOver();
      const best = Math.max(scoreRef.current, highScore);
      if (best > highScore) {
        saveHighScore('tetris', best);
        setHighScore(best);
      }
      return;
    }

    setCurrentPiece(newP);
  }, [checkCollision, highScore, level]);

  const moveDown = useCallback(() => {
    const p = pieceRef.current;
    if (!p) return;
    if (!checkCollision(p, p.x, p.y + 1)) {
      setCurrentPiece({ ...p, y: p.y + 1 });
    } else {
      lockPieceAndClear();
    }
  }, [checkCollision, lockPieceAndClear]);

  const hardDrop = useCallback(() => {
    const p = pieceRef.current;
    if (!p) return;
    let targetY = p.y;
    while (!checkCollision(p, p.x, targetY + 1)) {
      targetY++;
    }
    const dropDistance = targetY - p.y;
    setScore((s) => s + dropDistance * 2);
    const droppedPiece = { ...p, y: targetY };
    pieceRef.current = droppedPiece;
    setCurrentPiece(droppedPiece);
    lockPieceAndClear();
  }, [checkCollision, lockPieceAndClear]);

  const moveHorizontally = useCallback(
    (dir) => {
      const p = pieceRef.current;
      if (!p) return;
      if (!checkCollision(p, p.x + dir, p.y)) {
        setCurrentPiece({ ...p, x: p.x + dir });
        sounds.playBlip(440, 0.03);
      }
    },
    [checkCollision]
  );

  const rotate = useCallback(() => {
    const p = pieceRef.current;
    if (!p) return;
    const rotated = rotateMatrix(p.shape);
    // Wall kick attempts: offset 0, -1, +1, -2, +2
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!checkCollision(p, p.x + kick, p.y, rotated)) {
        setCurrentPiece({
          ...p,
          shape: rotated,
          x: p.x + kick,
        });
        sounds.playBlip(520, 0.04);
        return;
      }
    }
  }, [checkCollision]);

  const holdPiece = useCallback(() => {
    if (!canHoldRef.current || !pieceRef.current) return;
    sounds.playBlip(360, 0.05);
    const curType = pieceRef.current.type;
    const currentHold = holdTypeRef.current;

    setCanHold(false);
    if (!currentHold) {
      setHoldPieceType(curType);
      const nextT = nextTypeRef.current;
      setCurrentPiece(createPiece(nextT));
      setNextPieceType(getRandomType());
    } else {
      setHoldPieceType(curType);
      setCurrentPiece(createPiece(currentHold));
    }
  }, []);

  const resetGame = useCallback(() => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill('')));
    const firstType = getRandomType();
    const secondType = getRandomType();
    setCurrentPiece(createPiece(firstType));
    setNextPieceType(secondType);
    setHoldPieceType(null);
    setCanHold(true);
    setScore(0);
    setLines(0);
    setLevel(1);
    setIsGameOver(false);
    setIsPaused(false);
    setHasStarted(true);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && (!hasStartedRef.current || isGameOverRef.current)) {
        resetGame();
        return;
      }

      if (e.key.toLowerCase() === 'p') {
        setIsPaused((p) => !p);
        return;
      }

      if (!hasStartedRef.current || isPausedRef.current || isGameOverRef.current) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          moveHorizontally(-1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          moveHorizontally(1);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          rotate();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          moveDown();
          break;
        case ' ':
          hardDrop();
          break;
        case 'c':
        case 'C':
          holdPiece();
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [resetGame, moveHorizontally, rotate, moveDown, hardDrop, holdPiece]);

  // Drop gravity timer
  useEffect(() => {
    if (!hasStarted || isPaused || isGameOver) return;
    const speedMs = Math.max(120, 800 - (level - 1) * 75);
    const interval = setInterval(moveDown, speedMs);
    return () => clearInterval(interval);
  }, [hasStarted, isPaused, isGameOver, level, moveDown]);

  // Calculate Ghost Piece position (where piece lands)
  const getGhostY = () => {
    const p = currentPiece;
    if (!p) return 0;
    let ghostY = p.y;
    while (!checkCollision(p, p.x, ghostY + 1)) {
      ghostY++;
    }
    return ghostY;
  };

  // Main Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear board
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle Grid background
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK_SIZE, 0);
      ctx.lineTo(c * BLOCK_SIZE, ROWS * BLOCK_SIZE);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK_SIZE);
      ctx.lineTo(COLS * BLOCK_SIZE, r * BLOCK_SIZE);
      ctx.stroke();
    }

    // Draw settled blocks
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = grid[r][c];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(c * BLOCK_SIZE + 1, r * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);

          // Highlights for 3D retro look
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          ctx.fillRect(c * BLOCK_SIZE + 1, r * BLOCK_SIZE + 1, BLOCK_SIZE - 2, 3);
          ctx.fillRect(c * BLOCK_SIZE + 1, r * BLOCK_SIZE + 1, 3, BLOCK_SIZE - 2);
        }
      }
    }

    const p = currentPiece;
    if (p) {
      // Draw Ghost Piece
      const ghostY = getGhostY();
      for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[r].length; c++) {
          if (p.shape[r][c] !== 0) {
            const gx = (p.x + c) * BLOCK_SIZE;
            const gy = (ghostY + r) * BLOCK_SIZE;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(gx + 2, gy + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
          }
        }
      }

      // Draw Active Piece
      for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[r].length; c++) {
          if (p.shape[r][c] !== 0) {
            const px = (p.x + c) * BLOCK_SIZE;
            const py = (p.y + r) * BLOCK_SIZE;
            ctx.fillStyle = p.color;
            ctx.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);

            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, 3);
            ctx.fillRect(px + 1, py + 1, 3, BLOCK_SIZE - 2);
          }
        }
      }
    }
  }, [grid, currentPiece]);

  // Mini preview canvas renderer helper
  const drawMiniPreview = (canvas, type) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!type) return;
    const piece = TETROMINOES[type];
    if (!piece) return;

    const miniSize = 16;
    const shape = piece.shape;
    const offsetX = (canvas.width - shape[0].length * miniSize) / 2;
    const offsetY = (canvas.height - shape.length * miniSize) / 2;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          ctx.fillStyle = piece.color;
          ctx.fillRect(offsetX + c * miniSize + 1, offsetY + r * miniSize + 1, miniSize - 2, miniSize - 2);
        }
      }
    }
  };

  useEffect(() => {
    drawMiniPreview(nextCanvasRef.current, nextPieceType);
  }, [nextPieceType]);

  useEffect(() => {
    drawMiniPreview(holdCanvasRef.current, holdPieceType);
  }, [holdPieceType]);

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto select-none">
      {/* Top Header stats */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-5 py-3 mb-4 backdrop-blur">
        <div className="flex items-center gap-5">
          <div>
            <span className="text-xs font-semibold text-slate-400">Score</span>
            <div className="text-2xl font-bold font-mono text-cyan-400">{score}</div>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">Lines</span>
            <div className="text-2xl font-bold font-mono text-slate-200">{lines}</div>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">Level</span>
            <div className="text-2xl font-bold font-mono text-amber-400">{level}</div>
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
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Playfield Layout with Sidebars */}
      <div className="flex items-start justify-center gap-4">
        {/* Hold Piece Sidebar */}
        <div className="flex flex-col items-center gap-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
            <span className="text-xs font-semibold text-slate-400 mb-2">Hold (C)</span>
            <canvas ref={holdCanvasRef} width={76} height={64} className="rounded-lg bg-slate-950" />
            <button
              onClick={holdPiece}
              disabled={!canHold || !hasStarted}
              className="mt-2 w-full py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
            >
              Swap
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center w-full">
            <Trophy className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] font-semibold uppercase text-slate-400">Best</span>
            <span className="text-sm font-bold font-mono text-amber-400">{Math.max(score, highScore)}</span>
          </div>
        </div>

        {/* Center Canvas */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950">
          <canvas
            ref={canvasRef}
            width={COLS * BLOCK_SIZE}
            height={ROWS * BLOCK_SIZE}
            className="block"
          />

          {!hasStarted && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Block Drop</h3>
              <p className="text-xs text-slate-300 max-w-xs mb-5">
                Rotate and stack falling tetrominoes. Clear lines before the board fills up!
              </p>
              <button
                onClick={resetGame}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer"
              >
                Start Game
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
              <div className="text-3xl mb-1">🧱</div>
              <h3 className="text-xl font-bold text-red-400 mb-1">Game Over</h3>
              <p className="text-xs text-slate-300 mb-4">
                Score: <span className="font-bold text-cyan-400">{score}</span> | Lines: {lines}
              </p>
              <button
                onClick={resetGame}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer"
              >
                Play Again (Space)
              </button>
            </div>
          )}
        </div>

        {/* Next Piece Sidebar */}
        <div className="flex flex-col items-center gap-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
            <span className="text-xs font-semibold text-slate-400 mb-2">Next</span>
            <canvas ref={nextCanvasRef} width={76} height={64} className="rounded-lg bg-slate-950" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 flex flex-col gap-1 w-24">
            <div><span className="font-bold text-slate-200">↑ / W:</span> Spin</div>
            <div><span className="font-bold text-slate-200">Space:</span> Drop</div>
            <div><span className="font-bold text-slate-200">C:</span> Hold</div>
          </div>
        </div>
      </div>

      {/* On-screen controls for touch devices */}
      <div className="mt-4 flex items-center justify-center gap-2 sm:hidden w-full max-w-xs">
        <button
          onClick={() => moveHorizontally(-1)}
          className="p-3 bg-slate-800 text-white rounded-xl active:bg-slate-700 flex-1 flex justify-center border border-slate-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={rotate}
          className="p-3 bg-slate-800 text-cyan-400 rounded-xl active:bg-slate-700 flex-1 flex justify-center border border-slate-700"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
        <button
          onClick={moveDown}
          className="p-3 bg-slate-800 text-white rounded-xl active:bg-slate-700 flex-1 flex justify-center border border-slate-700"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
        <button
          onClick={() => moveHorizontally(1)}
          className="p-3 bg-slate-800 text-white rounded-xl active:bg-slate-700 flex-1 flex justify-center border border-slate-700"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={hardDrop}
          className="p-3 bg-cyan-600 text-white font-bold rounded-xl active:bg-cyan-500 flex-1 flex justify-center"
        >
          Drop
        </button>
      </div>
    </div>
  );
}
