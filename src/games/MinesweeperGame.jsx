import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Flag, Bomb, Timer, Award } from 'lucide-react';
import { sounds } from '../utils/audio';
import { getHighScore, saveHighScore } from '../utils/storage';

const DIFFICULTIES = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 14, cols: 14, mines: 30 },
  hard: { rows: 14, cols: 20, mines: 50 },
};

const NUMBER_COLORS = [
  '',
  'text-blue-400 font-bold',
  'text-emerald-400 font-bold',
  'text-red-400 font-bold',
  'text-purple-400 font-bold',
  'text-amber-500 font-bold',
  'text-cyan-400 font-bold',
  'text-pink-400 font-bold',
  'text-slate-200 font-bold',
];

export default function MinesweeperGame() {
  const [difficulty, setDifficulty] = useState('easy');
  const [board, setBoard] = useState([]);
  const [gameStatus, setGameStatus] = useState('idle'); // 'idle' | 'playing' | 'won' | 'lost'
  const [flagsRemaining, setFlagsRemaining] = useState(10);
  const [timer, setTimer] = useState(0);
  const [bestTime, setBestTime] = useState(() => getHighScore('minesweeper'));
  const [flagMode, setFlagMode] = useState(false); // mobile friendly tap toggle

  const config = DIFFICULTIES[difficulty];

  // Initialize fresh empty board
  const initBoard = useCallback(() => {
    const { rows, cols } = config;
    const newBoard = [];

    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          row: r,
          col: c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      newBoard.push(row);
    }

    setBoard(newBoard);
    setGameStatus('idle');
    setFlagsRemaining(config.mines);
    setTimer(0);
  }, [config]);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Timer tick
  useEffect(() => {
    let interval;
    if (gameStatus === 'playing') {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus]);

  // Populate mines after initial first safe click
  const placeMinesAndStart = (firstRow, firstCol) => {
    const { rows, cols, mines } = config;
    const newBoard = board.map((r) => r.map((c) => ({ ...c })));

    let planted = 0;
    while (planted < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);

      // Don't place on first clicked cell or adjacent neighborhood
      const isNeighborOrSelf = Math.abs(r - firstRow) <= 1 && Math.abs(c - firstCol) <= 1;

      if (!newBoard[r][c].isMine && !isNeighborOrSelf) {
        newBoard[r][c].isMine = true;
        planted++;
      }
    }

    // Calculate neighbor mine numbers
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!newBoard[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
                count++;
              }
            }
          }
          newBoard[r][c].neighborMines = count;
        }
      }
    }

    setGameStatus('playing');
    sounds.playBlip(500, 0.05);
    return newBoard;
  };

  // Reveal cell recursive flood fill
  const revealCell = (r, c) => {
    if (gameStatus === 'won' || gameStatus === 'lost') return;

    let currentBoard = board;
    if (gameStatus === 'idle') {
      currentBoard = placeMinesAndStart(r, c);
    }

    const cell = currentBoard[r][c];
    if (cell.isRevealed || cell.isFlagged) return;

    // Hit a mine!
    if (cell.isMine) {
      sounds.playExplosion();
      setGameStatus('lost');
      // Reveal all mines
      const revealedAll = currentBoard.map((row) =>
        row.map((cl) => (cl.isMine ? { ...cl, isRevealed: true } : cl))
      );
      setBoard(revealedAll);
      return;
    }

    sounds.playBlip(440, 0.03);

    // Flood fill blank zero neighbors
    const updated = currentBoard.map((row) => row.map((cl) => ({ ...cl })));
    const queue = [[r, c]];
    updated[r][c].isRevealed = true;

    while (queue.length > 0) {
      const [curR, curC] = queue.shift();
      const current = updated[curR][curC];

      if (current.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = curR + dr;
            const nc = curC + dc;
            if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
              const neighbor = updated[nr][nc];
              if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
                neighbor.isRevealed = true;
                if (neighbor.neighborMines === 0) {
                  queue.push([nr, nc]);
                }
              }
            }
          }
        }
      }
    }

    // Check Win Condition
    let unrevealedSafe = 0;
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        const item = updated[row][col];
        if (!item.isMine && !item.isRevealed) {
          unrevealedSafe++;
        }
      }
    }

    if (unrevealedSafe === 0) {
      sounds.playScore();
      setGameStatus('won');
      if (bestTime === 0 || timer < bestTime) {
        saveHighScore('minesweeper', timer);
        setBestTime(timer);
      }
    }

    setBoard(updated);
  };

  // Toggle flag on right click or flag mode click
  const toggleFlag = (r, c, e) => {
    if (e) e.preventDefault();
    if (gameStatus === 'won' || gameStatus === 'lost') return;

    const current = board[r][c];
    if (current.isRevealed) return;

    const newFlagged = !current.isFlagged;
    if (newFlagged && flagsRemaining <= 0) return;

    sounds.playBlip(320, 0.04);
    const updated = board.map((row) =>
      row.map((cell) => {
        if (cell.row === r && cell.col === c) {
          return { ...cell, isFlagged: newFlagged };
        }
        return cell;
      })
    );

    setFlagsRemaining((prev) => (newFlagged ? prev - 1 : prev + 1));
    setBoard(updated);
  };

  const handleCellClick = (r, c) => {
    if (flagMode) {
      toggleFlag(r, c);
    } else {
      revealCell(r, c);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto select-none">
      {/* Top Header stats */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-5 py-3 mb-4 backdrop-blur">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <Bomb className="w-4 h-4 text-red-400" />
            <span className="text-xl font-bold font-mono text-red-400">
              {String(flagsRemaining).padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-amber-400" />
            <span className="text-xl font-bold font-mono text-amber-400">
              {String(timer).padStart(3, '0')}s
            </span>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
            {Object.keys(DIFFICULTIES).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-2.5 py-1 rounded capitalize font-semibold transition ${
                  difficulty === d
                    ? 'bg-slate-700 text-slate-100 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Mobile Flag Mode toggle */}
          <button
            onClick={() => setFlagMode((f) => !f)}
            className={`p-2 rounded-lg border transition ${
              flagMode
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Flagging Tool"
          >
            <Flag className="w-4 h-4" />
          </button>

          {/* Smiley Status Reset Button */}
          <button
            onClick={initBoard}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-xl transition"
            title="New Game"
          >
            {gameStatus === 'won' ? '😎' : gameStatus === 'lost' ? '😵' : '🙂'}
          </button>
        </div>
      </div>

      {/* Minesweeper Grid */}
      <div className="p-3 rounded-2xl bg-slate-900 border-4 border-slate-800 shadow-2xl overflow-x-auto max-w-full">
        <div
          className="grid gap-1 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
            width: config.cols * 32,
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={(e) => toggleFlag(r, c, e)}
                  className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded font-mono text-sm font-bold flex items-center justify-center transition-all ${
                    cell.isRevealed
                      ? cell.isMine
                        ? 'bg-red-600/90 text-white'
                        : 'bg-slate-950/70 border border-slate-800/80 text-slate-200 shadow-inner'
                      : 'bg-slate-800 hover:bg-slate-700 border-t-2 border-l-2 border-slate-600 border-b-2 border-r-2 border-slate-950 text-white shadow-xs cursor-pointer active:scale-95'
                  }`}
                >
                  {cell.isRevealed ? (
                    cell.isMine ? (
                      <Bomb className="w-4 h-4 text-white animate-bounce" />
                    ) : cell.neighborMines > 0 ? (
                      <span className={NUMBER_COLORS[cell.neighborMines]}>
                        {cell.neighborMines}
                      </span>
                    ) : null
                  ) : cell.isFlagged ? (
                    <Flag className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Win Banner */}
      {gameStatus === 'won' && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-center flex items-center gap-3 animate-in fade-in">
          <Award className="w-8 h-8 text-emerald-400" />
          <div className="text-left">
            <h4 className="text-sm font-bold text-emerald-300">Minefield Cleared!</h4>
            <p className="text-xs text-emerald-200">
              Completed in {timer} seconds without triggering an explosive.
            </p>
          </div>
        </div>
      )}

      {/* Tips */}
      <p className="text-[11px] text-slate-400 mt-3 text-center">
        Tip: Left click to reveal, Right click to plant flag. On mobile, tap the red Flag button.
      </p>
    </div>
  );
}
