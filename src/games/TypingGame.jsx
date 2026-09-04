import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Pause, Play, Trophy, Keyboard, Zap, Heart } from 'lucide-react';
import { sounds } from '../utils/audio';
import { getHighScore, saveHighScore } from '../utils/storage';

const WORD_BANK = [
  'pixel', 'arcade', 'retro', 'speed', 'turbo', 'ninja', 'laser', 'galaxy',
  'dragon', 'cyber', 'rocket', 'shield', 'vector', 'matrix', 'portal',
  'python', 'canvas', 'vertex', 'shadow', 'energy', 'future', 'hyper',
  'cosmic', 'legend', 'strike', 'falcon', 'comet', 'spark', 'blaster',
  'quantum', 'gravity', 'nebula', 'asteroid', 'velocity', 'titanium'
];

export default function TypingGame() {
  const [words, setWords] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => getHighScore('typer'));
  const [lives, setLives] = useState(3);
  const [wpm, setWpm] = useState(0);
  const [wordsTyped, setWordsTyped] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const inputRef = useRef(null);
  const startTimeRef = useRef(0);
  const wordIdRef = useRef(0);

  const wordsRef = useRef(words);
  wordsRef.current = words;
  const isGameOverRef = useRef(isGameOver);
  isGameOverRef.current = isGameOver;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const hasStartedRef = useRef(hasStarted);
  hasStartedRef.current = hasStarted;
  const scoreRef = useRef(score);
  scoreRef.current = score;

  const COLORS = ['#38bdf8', '#a855f7', '#34d399', '#f43f5e', '#fbbf24'];

  const spawnWord = useCallback(() => {
    const text = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
    const newWord = {
      id: ++wordIdRef.current,
      text,
      x: 10 + Math.random() * 75, // percentage 10% - 85%
      y: 0,
      speed: 0.25 + Math.random() * 0.2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
    setWords((prev) => [...prev, newWord]);
  }, []);

  const resetGame = useCallback(() => {
    setWords([]);
    setCurrentInput('');
    setScore(0);
    setLives(3);
    setWpm(0);
    setWordsTyped(0);
    setStreak(0);
    setIsGameOver(false);
    setIsPaused(false);
    setHasStarted(true);
    startTimeRef.current = Date.now();
    sounds.playBlip(440);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, []);

  // Main animation loop: move words down
  useEffect(() => {
    if (!hasStarted || isPaused || isGameOver) return;

    const interval = setInterval(() => {
      setWords((prevWords) => {
        const nextWords = [];
        let lostLife = false;

        for (const w of prevWords) {
          const nextY = w.y + w.speed;
          if (nextY >= 92) {
            // Reached ground!
            lostLife = true;
          } else {
            nextWords.push({ ...w, y: nextY });
          }
        }

        if (lostLife) {
          sounds.playBlip(180, 0.1);
          setStreak(0);
          setLives((l) => {
            const nextL = l - 1;
            if (nextL <= 0) {
              setIsGameOver(true);
              sounds.playGameOver();
              const best = Math.max(scoreRef.current, highScore);
              if (best > highScore) {
                saveHighScore('typer', best);
                setHighScore(best);
              }
            }
            return nextL;
          });
        }

        return nextWords;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [hasStarted, isPaused, isGameOver, highScore]);

  // Spawner interval
  useEffect(() => {
    if (!hasStarted || isPaused || isGameOver) return;
    const spawnTimer = setInterval(spawnWord, 2000);
    return () => clearInterval(spawnTimer);
  }, [hasStarted, isPaused, isGameOver, spawnWord]);

  // Calculate WPM periodically
  useEffect(() => {
    if (!hasStarted || isPaused || isGameOver) return;
    const wpmTimer = setInterval(() => {
      const elapsedMins = (Date.now() - startTimeRef.current) / 60000;
      if (elapsedMins > 0.05) {
        setWpm(Math.round(wordsTyped / elapsedMins));
      }
    }, 1000);
    return () => clearInterval(wpmTimer);
  }, [hasStarted, isPaused, isGameOver, wordsTyped]);

  const handleInputChange = (e) => {
    const val = e.target.value.toLowerCase().trim();
    setCurrentInput(e.target.value);
    sounds.playBlip(700, 0.02);

    // Check if matched any word
    const matchedIndex = words.findIndex((w) => w.text.toLowerCase() === val);
    if (matchedIndex !== -1) {
      const matched = words[matchedIndex];
      sounds.playScore();

      setWords((prev) => prev.filter((_, i) => i !== matchedIndex));
      setCurrentInput('');
      setWordsTyped((c) => c + 1);
      setStreak((s) => s + 1);

      const points = matched.text.length * 10 * Math.min(4, 1 + Math.floor(streak / 5));
      setScore((s) => {
        const nextScore = s + points;
        if (nextScore > highScore) {
          saveHighScore('typer', nextScore);
          setHighScore(nextScore);
        }
        return nextScore;
      });
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto select-none">
      {/* Top Header stats */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-5 py-3 mb-4 backdrop-blur">
        <div className="flex items-center gap-5">
          <div>
            <span className="text-xs font-semibold text-slate-400">Score</span>
            <div className="text-2xl font-bold font-mono text-purple-400">{score}</div>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">WPM</span>
            <div className="text-2xl font-bold font-mono text-cyan-400">{wpm}</div>
          </div>
          <div className="flex items-center gap-1 pt-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 ${
                  i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700 fill-slate-800'
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
            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Sky Fall Zone */}
      <div className="relative w-full h-[360px] rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950">
        {/* Falling Words */}
        {words.map((w) => {
          const isPrefix = currentInput.trim().length > 0 && w.text.startsWith(currentInput.trim().toLowerCase());
          return (
            <div
              key={w.id}
              className="absolute px-3 py-1 rounded-lg font-mono font-bold text-sm tracking-wide border shadow-md transition-all duration-75"
              style={{
                left: `${w.x}%`,
                top: `${w.y}%`,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                borderColor: isPrefix ? '#38bdf8' : w.color,
                color: w.color,
                boxShadow: isPrefix ? '0 0 12px #38bdf8' : 'none',
              }}
            >
              {isPrefix ? (
                <>
                  <span className="text-cyan-300 underline">{currentInput.trim()}</span>
                  <span>{w.text.slice(currentInput.trim().length)}</span>
                </>
              ) : (
                w.text
              )}
            </div>
          );
        })}

        {/* Danger Line */}
        <div className="absolute bottom-6 left-0 right-0 h-0.5 bg-red-500/40 border-b border-dashed border-red-500/80" />

        {/* Start Overlay */}
        {!hasStarted && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <Keyboard className="w-12 h-12 text-purple-400 mb-2" />
            <h3 className="text-2xl font-bold text-white mb-2">Speed Typer</h3>
            <p className="text-xs text-slate-300 max-w-xs mb-5">
              Type the falling words before they crash into the ground! Boost your typing speed & accuracy.
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              Start Typing
            </button>
          </div>
        )}

        {isPaused && hasStarted && !isGameOver && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center">
            <Pause className="w-10 h-10 text-purple-400 mb-2" />
            <h3 className="text-lg font-bold text-white mb-2">Game Paused</h3>
            <button
              onClick={() => setIsPaused(false)}
              className="px-4 py-1.5 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-lg transition"
            >
              Resume
            </button>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-5 text-center">
            <div className="text-3xl mb-1">⌨️💥</div>
            <h3 className="text-xl font-bold text-red-400 mb-1">Defense Collapsed</h3>
            <p className="text-xs text-slate-300 mb-4">
              Score: <span className="font-bold text-purple-400">{score}</span> | Speed: {wpm} WPM
            </p>
            <button
              onClick={resetGame}
              className="px-5 py-2 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Typing Input Field */}
      <div className="w-full mt-3">
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={handleInputChange}
          placeholder={hasStarted ? 'Type falling words here...' : 'Click Start to begin'}
          disabled={!hasStarted || isGameOver || isPaused}
          className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 focus:border-purple-500 rounded-xl text-white font-mono text-center text-lg outline-none transition disabled:opacity-50"
          autoFocus
        />
      </div>

      {streak > 3 && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400 font-bold animate-bounce">
          <Zap className="w-4 h-4 fill-amber-400" />
          <span>{streak}x Combo Multiplier!</span>
        </div>
      )}
    </div>
  );
}
