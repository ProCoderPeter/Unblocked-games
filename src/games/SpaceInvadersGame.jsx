import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Pause, Play, Trophy, Heart, Crosshair } from 'lucide-react';
import { sounds } from '../utils/audio';
import { getHighScore, saveHighScore } from '../utils/storage';

const WIDTH = 480;
const HEIGHT = 460;

export default function SpaceInvadersGame() {
  const canvasRef = useRef(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => getHighScore('invaders'));
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [hasStarted, setHasStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Mutable game state held in refs for 60fps canvas loop
  const playerRef = useRef({ x: WIDTH / 2 - 15, y: HEIGHT - 40, width: 30, height: 16, speed: 5 });
  const keysRef = useRef({ left: false, right: false, shoot: false });
  const bulletsRef = useRef([]);
  const aliensRef = useRef([]);
  const alienDirRef = useRef(1);
  const alienSpeedRef = useRef(1.2);
  const bunkersRef = useRef([]);
  const ufoRef = useRef(null);
  const starsRef = useRef([]);
  const lastShootTimeRef = useRef(0);
  const lastAlienDropTimeRef = useRef(0);

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

  // Initialize stars
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 45; i++) {
      stars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        s: Math.random() * 1.5 + 0.5,
      });
    }
    starsRef.current = stars;
  }, []);

  const initAliens = useCallback((currentWave) => {
    const aliens = [];
    const rows = 4;
    const cols = 8;
    const startX = 50;
    const startY = 60;
    const spacingX = 45;
    const spacingY = 32;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        aliens.push({
          x: startX + c * spacingX,
          y: startY + r * spacingY,
          type: r === 0 ? 0 : r < 2 ? 1 : 2,
          alive: true,
        });
      }
    }
    aliensRef.current = aliens;
    alienDirRef.current = 1;
    alienSpeedRef.current = 0.8 + currentWave * 0.3;
  }, []);

  const initBunkers = useCallback(() => {
    const bunkers = [];
    const bunkerCount = 4;
    const spacing = WIDTH / (bunkerCount + 1);
    for (let i = 1; i <= bunkerCount; i++) {
      bunkers.push({
        x: spacing * i - 22,
        y: HEIGHT - 90,
        health: 4,
      });
    }
    bunkersRef.current = bunkers;
  }, []);

  const resetGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setWave(1);
    setIsGameOver(false);
    setIsPaused(false);
    setHasStarted(true);

    playerRef.current.x = WIDTH / 2 - 15;
    bulletsRef.current = [];
    ufoRef.current = null;
    initAliens(1);
    initBunkers();
    sounds.playBlip(440);
  }, [initAliens, initBunkers]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
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

      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        keysRef.current.right = true;
      }
      if (e.key === ' ') {
        keysRef.current.shoot = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        keysRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        keysRef.current.right = false;
      }
      if (e.key === ' ') {
        keysRef.current.shoot = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetGame]);

  // Game Loop using requestAnimationFrame
  useEffect(() => {
    let animId;

    const loop = (timestamp) => {
      animId = requestAnimationFrame(loop);

      if (!hasStartedRef.current || isPausedRef.current || isGameOverRef.current) return;

      const player = playerRef.current;
      const keys = keysRef.current;
      const bullets = bulletsRef.current;
      const aliens = aliensRef.current;
      const bunkers = bunkersRef.current;

      // 1. Move Player
      if (keys.left) player.x = Math.max(10, player.x - player.speed);
      if (keys.right) player.x = Math.min(WIDTH - player.width - 10, player.x + player.speed);

      // Player firing laser
      if (keys.shoot && timestamp - lastShootTimeRef.current > 300) {
        lastShootTimeRef.current = timestamp;
        bullets.push({
          x: player.x + player.width / 2,
          y: player.y - 4,
          isAlien: false,
        });
        sounds.playLaser();
      }

      // 2. Move & Update Aliens
      let hitEdge = false;
      let livingAliensCount = 0;
      for (const a of aliens) {
        if (!a.alive) continue;
        livingAliensCount++;
        a.x += alienDirRef.current * alienSpeedRef.current;
        if (a.x <= 15 || a.x >= WIDTH - 45) {
          hitEdge = true;
        }
        // Alien reaches bunkers / player
        if (a.y >= HEIGHT - 70) {
          setIsGameOver(true);
          sounds.playGameOver();
          const best = Math.max(scoreRef.current, highScore);
          if (best > highScore) {
            saveHighScore('invaders', best);
            setHighScore(best);
          }
          return;
        }
      }

      if (hitEdge) {
        alienDirRef.current *= -1;
        for (const a of aliens) {
          if (a.alive) a.y += 14;
        }
        // Speed up slightly as they drop
        alienSpeedRef.current = Math.min(3.5, alienSpeedRef.current + 0.15);
      }

      // Check wave win
      if (livingAliensCount === 0) {
        sounds.playScore();
        setWave((w) => {
          const nextW = w + 1;
          initAliens(nextW);
          return nextW;
        });
      }

      // Random alien dropping laser bomb
      if (timestamp - lastAlienDropTimeRef.current > 800) {
        lastAlienDropTimeRef.current = timestamp;
        const livingAliens = aliens.filter((a) => a.alive);
        if (livingAliens.length > 0) {
          const shooter = livingAliens[Math.floor(Math.random() * livingAliens.length)];
          bullets.push({
            x: shooter.x + 12,
            y: shooter.y + 18,
            isAlien: true,
          });
        }
      }

      // 3. UFO Mystery Ship chance
      if (!ufoRef.current && Math.random() < 0.002) {
        ufoRef.current = {
          x: -40,
          y: 35,
          speed: 2.2,
          alive: true,
        };
      }
      if (ufoRef.current) {
        ufoRef.current.x += ufoRef.current.speed;
        if (ufoRef.current.x > WIDTH + 40) {
          ufoRef.current = null;
        }
      }

      // 4. Update Bullets & Collisions
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.isAlien) {
          b.y += 3.5;
          // Check player collision
          if (
            b.x >= player.x &&
            b.x <= player.x + player.width &&
            b.y >= player.y &&
            b.y <= player.y + player.height
          ) {
            bullets.splice(i, 1);
            sounds.playExplosion();
            setLives((l) => {
              const newLives = l - 1;
              if (newLives <= 0) {
                setIsGameOver(true);
                sounds.playGameOver();
                const best = Math.max(scoreRef.current, highScore);
                if (best > highScore) {
                  saveHighScore('invaders', best);
                  setHighScore(best);
                }
              }
              return newLives;
            });
            continue;
          }
        } else {
          b.y -= 7.5;
          // Check alien hit
          let bulletRemoved = false;
          for (const a of aliens) {
            if (a.alive && b.x >= a.x && b.x <= a.x + 28 && b.y >= a.y && b.y <= a.y + 20) {
              a.alive = false;
              bullets.splice(i, 1);
              bulletRemoved = true;
              sounds.playBlip(700, 0.05);
              const points = a.type === 0 ? 30 : a.type === 1 ? 20 : 10;
              setScore((s) => s + points);
              break;
            }
          }
          if (bulletRemoved) continue;

          // Check UFO hit
          if (ufoRef.current && ufoRef.current.alive) {
            const u = ufoRef.current;
            if (b.x >= u.x && b.x <= u.x + 36 && b.y >= u.y && b.y <= u.y + 16) {
              u.alive = false;
              bullets.splice(i, 1);
              sounds.playScore();
              setScore((s) => s + 150);
              ufoRef.current = null;
              continue;
            }
          }
        }

        // Bunker collisions
        for (const bk of bunkers) {
          if (
            bk.health > 0 &&
            b.x >= bk.x &&
            b.x <= bk.x + 44 &&
            b.y >= bk.y &&
            b.y <= bk.y + 24
          ) {
            bk.health--;
            bullets.splice(i, 1);
            sounds.playBlip(200, 0.03);
            break;
          }
        }

        // Off screen cleanup
        if (b.y < 0 || b.y > HEIGHT) {
          bullets.splice(i, 1);
        }
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [highScore, initAliens]);

  // Drawing Canvas loop
  useEffect(() => {
    let animId;

    const render = () => {
      animId = requestAnimationFrame(render);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark space background
      ctx.fillStyle = '#050714';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Starfield
      ctx.fillStyle = '#94a3b8';
      for (const s of starsRef.current) {
        ctx.fillRect(s.x, s.y, s.s, s.s);
      }

      // Draw Mystery UFO
      if (ufoRef.current && ufoRef.current.alive) {
        const u = ufoRef.current;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.ellipse(u.x + 18, u.y + 8, 18, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dome
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(u.x + 18, u.y + 6, 6, Math.PI, 0);
        ctx.fill();
      }

      // Draw Aliens
      for (const a of aliensRef.current) {
        if (!a.alive) continue;
        const colors = ['#f43f5e', '#a855f7', '#38bdf8'];
        ctx.fillStyle = colors[a.type];

        // Pixel retro body
        ctx.fillRect(a.x + 4, a.y, 16, 4);
        ctx.fillRect(a.x + 2, a.y + 4, 20, 8);
        ctx.fillRect(a.x, a.y + 6, 24, 6);
        ctx.fillRect(a.x + 2, a.y + 12, 6, 4);
        ctx.fillRect(a.x + 16, a.y + 12, 6, 4);

        // Eyes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(a.x + 6, a.y + 6, 3, 4);
        ctx.fillRect(a.x + 15, a.y + 6, 3, 4);
      }

      // Draw Bunkers
      for (const bk of bunkersRef.current) {
        if (bk.health <= 0) continue;
        const alpha = bk.health / 4;
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
        ctx.beginPath();
        ctx.roundRect(bk.x, bk.y, 44, 22, [8, 8, 0, 0]);
        ctx.fill();

        // Bunker archway
        ctx.fillStyle = '#050714';
        ctx.beginPath();
        ctx.arc(bk.x + 22, bk.y + 22, 10, Math.PI, 0);
        ctx.fill();
      }

      // Draw Bullets
      for (const b of bulletsRef.current) {
        if (b.isAlien) {
          ctx.fillStyle = '#f87171'; // alien red bomb
          ctx.fillRect(b.x - 1.5, b.y, 3, 8);
        } else {
          ctx.fillStyle = '#38bdf8'; // laser cyan
          ctx.fillRect(b.x - 1.5, b.y, 3, 10);
        }
      }

      // Draw Player Ship
      const p = playerRef.current;
      ctx.fillStyle = '#10b981'; // emerald
      // Ship base
      ctx.fillRect(p.x, p.y + 6, p.width, p.height - 6);
      // Ship middle
      ctx.fillRect(p.x + 6, p.y + 2, p.width - 12, 4);
      // Cannon tip
      ctx.fillRect(p.x + p.width / 2 - 2, p.y - 2, 4, 4);

      // Defense boundary line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, HEIGHT - 15);
      ctx.lineTo(WIDTH, HEIGHT - 15);
      ctx.stroke();
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
            <div className="text-2xl font-bold font-mono text-purple-400">{score}</div>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">Wave</span>
            <div className="text-2xl font-bold font-mono text-cyan-400">{wave}</div>
          </div>
          <div className="flex items-center gap-1.5 pt-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 ${
                  i < lives ? 'text-red-500 fill-red-500' : 'text-slate-700 fill-slate-800'
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

      {/* Game Canvas Box */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="block max-w-full h-auto aspect-[480/460]"
        />

        {!hasStarted && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Space Invaders</h3>
            <p className="text-xs text-slate-300 max-w-xs mb-5">
              Defend Earth against waves of alien invaders. Take cover behind shields and shoot the mystery UFO!
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              Launch Defender
            </button>
          </div>
        )}

        {isPaused && hasStarted && !isGameOver && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center">
            <Pause className="w-10 h-10 text-purple-400 mb-2" />
            <h3 className="text-lg font-bold text-white mb-2">Defense Paused</h3>
            <button
              onClick={() => setIsPaused(false)}
              className="px-4 py-1.5 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-lg transition"
            >
              Resume (P)
            </button>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-5 text-center">
            <div className="text-3xl mb-1">🚀💥</div>
            <h3 className="text-xl font-bold text-red-400 mb-1">Invasion Succeeded</h3>
            <p className="text-xs text-slate-300 mb-4">
              Final Score: <span className="font-bold text-purple-400">{score}</span> | Waves Cleared: {wave - 1}
            </p>
            <button
              onClick={resetGame}
              className="px-5 py-2 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              Defend Again (Space)
            </button>
          </div>
        )}
      </div>

      {/* Mobile Touch Controls */}
      <div className="mt-4 flex items-center justify-between gap-3 sm:hidden w-full max-w-xs">
        <div className="flex gap-2">
          <button
            onTouchStart={() => (keysRef.current.left = true)}
            onTouchEnd={() => (keysRef.current.left = false)}
            onMouseDown={() => (keysRef.current.left = true)}
            onMouseUp={() => (keysRef.current.left = false)}
            className="p-4 bg-slate-800 text-white rounded-xl active:bg-slate-700 text-xl font-bold border border-slate-700"
          >
            ◀
          </button>
          <button
            onTouchStart={() => (keysRef.current.right = true)}
            onTouchEnd={() => (keysRef.current.right = false)}
            onMouseDown={() => (keysRef.current.right = true)}
            onMouseUp={() => (keysRef.current.right = false)}
            className="p-4 bg-slate-800 text-white rounded-xl active:bg-slate-700 text-xl font-bold border border-slate-700"
          >
            ▶
          </button>
        </div>
        <button
          onTouchStart={() => (keysRef.current.shoot = true)}
          onTouchEnd={() => (keysRef.current.shoot = false)}
          onMouseDown={() => (keysRef.current.shoot = true)}
          onMouseUp={() => (keysRef.current.shoot = false)}
          className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl active:scale-95 shadow-md flex items-center gap-1.5"
        >
          <Crosshair className="w-5 h-5" />
          <span>FIRE</span>
        </button>
      </div>
    </div>
  );
}
