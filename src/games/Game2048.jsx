import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Trophy, Undo2, Award } from 'lucide-react';
import { sounds } from '../utils/audio';
import { getHighScore, saveHighScore } from '../utils/storage';

const GRID_SIZE = 4;

const TILE_STYLES = {
  2: { bg: 'bg-[#eee4da]', text: 'text-[#776e65]', glow: '' },
  4: { bg: 'bg-[#ede0c8]', text: 'text-[#776e65]', glow: '' },
  8: { bg: 'bg-[#f2b179]', text: 'text-[#f9f6f2]', glow: 'shadow-[0_0_8px_rgba(242,177,121,0.3)]' },
  16: { bg: 'bg-[#f59563]', text: 'text-[#f9f6f2]', glow: 'shadow-[0_0_10px_rgba(245,149,99,0.4)]' },
  32: { bg: 'bg-[#f67c5f]', text: 'text-[#f9f6f2]', glow: 'shadow-[0_0_12px_rgba(246,124,95,0.5)]' },
  64: { bg: 'bg-[#f65e3b]', text: 'text-[#f9f6f2]', glow: 'shadow-[0_0_14px_rgba(246,94,59,0.6)]' },
  128: { bg: 'bg-[#edcf72]', text: 'text-[#f9f6f2]', glow: 'shadow-[0_0_16px_rgba(237,207,114,0.7)]' },
  256: { bg: 'bg-[#edcc61]', text: 'text-[#f9f6f2]', glow: 'shadow-[0_0_18px_rgba(237,204,97,0.75)]' },
  512: { bg: 'bg-[#edc850]', text: 'text-[#f9f6f2]', glow: 'shadow-[0_0_20px_rgba(237,200,80,0.8)]' },
  1024: { bg: 'bg-[#edc53f]', text: 'text-[#f9f6f2]', glow: 'shadow-[0_0_24px_rgba(237,197,63,0.85)]' },
  2048: { bg: 'bg-[#edc22e]', text: 'text-[#f9f6f2]', glow: 'shadow-[0_0_30px_rgba(237,194,46,1)]' },
};

export default function Game2048() {
  const [board, setBoard] = useState(() =>
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
  );
  const [previousBoard, setPreviousBoard] = useState(null);
  const [score, setScore] = useState(0);
  const [previousScore, setPreviousScore] = useState(0);
  const [highScore, setHighScore] = useState(() => getHighScore('2048'));
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [continuePlaying, setContinuePlaying] = useState(false);

  const touchStartRef = useRef({ x: 0, y: 0 });

  const addRandomTile = useCallback((currentBoard) => {
    const emptyCells = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (currentBoard[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }
    if (emptyCells.length === 0) return currentBoard;

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = currentBoard.map((row) => [...row]);
    newBoard[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  }, []);

  const initGame = useCallback(() => {
    let empty = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    empty = addRandomTile(empty);
    empty = addRandomTile(empty);
    setBoard(empty);
    setPreviousBoard(null);
    setScore(0);
    setIsGameOver(false);
    setHasWon(false);
    setContinuePlaying(false);
    sounds.playBlip(440);
  }, [addRandomTile]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const checkGameOver = (currentBoard) => {
    // Check if any zeros exist
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (currentBoard[r][c] === 0) return false;
      }
    }
    // Check adjacent matches
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const val = currentBoard[r][c];
        if (r < GRID_SIZE - 1 && val === currentBoard[r + 1][c]) return false;
        if (c < GRID_SIZE - 1 && val === currentBoard[r][c + 1]) return false;
      }
    }
    return true;
  };

  const slideAndMergeRow = (row) => {
    const nonZero = row.filter((v) => v !== 0);
    let gained = 0;
    const merged = [];

    for (let i = 0; i < nonZero.length; i++) {
      if (i < nonZero.length - 1 && nonZero[i] === nonZero[i + 1]) {
        const sum = nonZero[i] * 2;
        merged.push(sum);
        gained += sum;
        if (sum === 2048) {
          setHasWon(true);
          sounds.playScore();
        }
        i++; // skip next merged
      } else {
        merged.push(nonZero[i]);
      }
    }

    while (merged.length < GRID_SIZE) {
      merged.push(0);
    }

    return { row: merged, gained };
  };

  const move = useCallback(
    (direction) => {
      if (isGameOver) return;

      let hasMoved = false;
      let totalGained = 0;
      const newBoard = board.map((row) => [...row]);

      // Helper to rotate board clockwise
      const rotate = (m) => {
        const n = m.length;
        const res = Array(n).fill(null).map(() => Array(n).fill(0));
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            res[c][n - 1 - r] = m[r][c];
          }
        }
        return res;
      };

      let working = newBoard;
      let rotations = 0;

      if (direction === 'left') rotations = 0;
      else if (direction === 'down') rotations = 1;
      else if (direction === 'right') rotations = 2;
      else if (direction === 'up') rotations = 3;

      for (let i = 0; i < rotations; i++) {
        working = rotate(working);
      }

      for (let r = 0; r < GRID_SIZE; r++) {
        const { row: mergedRow, gained } = slideAndMergeRow(working[r]);
        if (JSON.stringify(working[r]) !== JSON.stringify(mergedRow)) {
          hasMoved = true;
        }
        working[r] = mergedRow;
        totalGained += gained;
      }

      // Rotate back
      const backRotations = (4 - rotations) % 4;
      for (let i = 0; i < backRotations; i++) {
        working = rotate(working);
      }

      if (hasMoved) {
        setPreviousBoard(board);
        setPreviousScore(score);

        sounds.playBlip(500, 0.04);
        const boardWithNewTile = addRandomTile(working);
        setBoard(boardWithNewTile);

        const nextScore = score + totalGained;
        setScore(nextScore);
        if (nextScore > highScore) {
          saveHighScore('2048', nextScore);
          setHighScore(nextScore);
        }

        if (checkGameOver(boardWithNewTile)) {
          setIsGameOver(true);
          sounds.playGameOver();
        }
      }
    },
    [board, isGameOver, score, highScore, addRandomTile]
  );

  const undoMove = () => {
    if (previousBoard) {
      setBoard(previousBoard);
      setScore(previousScore);
      setPreviousBoard(null);
      setIsGameOver(false);
      sounds.playBlip(350, 0.04);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          move('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          move('right');
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          move('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          move('down');
          break;
        case 'u':
        case 'U':
          undoMove();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch swipes on mobile
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const threshold = 30;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > threshold) move('right');
      else if (dx < -threshold) move('left');
    } else {
      if (dy > threshold) move('down');
      else if (dy < -threshold) move('up');
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto select-none">
      {/* Top Header stats */}
      <div className="w-full flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-amber-400 font-sans tracking-tight">2048</h2>
          <p className="text-xs text-slate-400">Join tiles to reach 2048!</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Score</span>
            <span className="text-xl font-bold font-mono text-amber-400">{score}</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" /> Best
            </span>
            <span className="text-xl font-bold font-mono text-slate-200">{Math.max(score, highScore)}</span>
          </div>
        </div>
      </div>

      {/* Buttons Bar */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={undoMove}
            disabled={!previousBoard}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
            title="Undo last move (U)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
        </div>

        <button
          onClick={initGame}
          className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Game</span>
        </button>
      </div>

      {/* 2048 Grid Board */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative bg-[#bbada0]/40 backdrop-blur border-4 border-slate-800 p-3 rounded-2xl aspect-square w-full max-w-[380px] flex flex-col justify-between shadow-2xl"
      >
        <div className="grid grid-cols-4 gap-2.5 h-full w-full">
          {board.map((row, r) =>
            row.map((val, c) => {
              const style = TILE_STYLES[val] || {
                bg: 'bg-[#3c3a32]',
                text: 'text-white',
                glow: 'shadow-[0_0_20px_rgba(255,255,255,0.4)]',
              };
              const fontSize = val > 512 ? 'text-xl' : val > 64 ? 'text-2xl' : 'text-3xl';

              return (
                <div
                  key={`${r}-${c}`}
                  className={`rounded-xl flex items-center justify-center font-bold font-mono transition-all duration-100 ${
                    val === 0
                      ? 'bg-slate-900/60'
                      : `${style.bg} ${style.text} ${style.glow} scale-100 animate-in fade-in zoom-in-75`
                  }`}
                >
                  {val > 0 && <span className={`${fontSize} font-extrabold`}>{val}</span>}
                </div>
              );
            })
          )}
        </div>

        {/* Win Overlay */}
        {hasWon && !continuePlaying && (
          <div className="absolute inset-0 bg-amber-950/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center">
            <Award className="w-14 h-14 text-amber-400 mb-2" />
            <h3 className="text-2xl font-bold text-amber-300 mb-1">You Reached 2048!</h3>
            <p className="text-xs text-amber-200 mb-5">You have mastered the grid!</p>
            <div className="flex gap-2">
              <button
                onClick={() => setContinuePlaying(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
              >
                Keep Going
              </button>
              <button
                onClick={initGame}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center">
            <div className="text-3xl mb-1">🛑</div>
            <h3 className="text-2xl font-bold text-red-400 mb-1">No Moves Left!</h3>
            <p className="text-xs text-slate-300 mb-4">
              Final Score: <span className="font-bold text-amber-400">{score}</span>
            </p>
            <button
              onClick={initGame}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* On-screen Directional Touch Controls */}
      <div className="mt-4 grid grid-cols-3 gap-2 w-44 sm:hidden">
        <div />
        <button
          onClick={() => move('up')}
          className="p-3 bg-slate-800 text-white rounded-xl active:bg-slate-700 flex justify-center border border-slate-700"
        >
          ▲
        </button>
        <div />
        <button
          onClick={() => move('left')}
          className="p-3 bg-slate-800 text-white rounded-xl active:bg-slate-700 flex justify-center border border-slate-700"
        >
          ◀
        </button>
        <button
          onClick={() => move('down')}
          className="p-3 bg-slate-800 text-white rounded-xl active:bg-slate-700 flex justify-center border border-slate-700"
        >
          ▼
        </button>
        <button
          onClick={() => move('right')}
          className="p-3 bg-slate-800 text-white rounded-xl active:bg-slate-700 flex justify-center border border-slate-700"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
