import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Trophy, Award } from 'lucide-react';
import { sounds } from '../utils/audio';
import { getHighScore, saveHighScore } from '../utils/storage';

const WIDTH = 380;
const HEIGHT = 500;
const GRAVITY = 0.38;
const JUMP_STRENGTH = -7.2;
const PIPE_WIDTH = 55;
const PIPE_GAP = 125;
const PIPE_SPEED = 2.4;

export default function FlappyGame() {
  const canvasRef = useRef(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => getHighScore('flappy'));
  const [hasStarted, setHasStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Mutable refs for physics
  const birdRef = useRef({
    x: 75,
    y: HEIGHT / 2,
    vy: 0,
    radius: 13,
    rotation: 0,
  });
  const pipesRef = useRef([]);
  const cloudsRef = useRef([]);
  const lastPipeSpawnRef = useRef(0);

  const scoreRef = useRef(score);
  scoreRef.current = score;
  const isGameOverRef = useRef(isGameOver);
  isGameOverRef.current = isGameOver;
  const hasStartedRef = useRef(hasStarted);
  hasStartedRef.current = hasStarted;

  // Initialize background clouds
  useEffect(() => {
    const clouds = [];
    for (let i = 0; i < 4; i++) {
      clouds.push({
        x: Math.random() * WIDTH,
        y: Math.random() * 200 + 30,
        speed: Math.random() * 0.4 + 0.2,
      });
    }
    cloudsRef.current = clouds;
  }, []);

  const flap = useCallback(() => {
    if (isGameOverRef.current) return;

    if (!hasStartedRef.current) {
      setHasStarted(true);
      hasStartedRef.current = true;
    }

    birdRef.current.vy = JUMP_STRENGTH;
    sounds.playJump();
  }, []);

  const resetGame = useCallback(() => {
    birdRef.current = {
      x: 75,
      y: HEIGHT / 2,
      vy: 0,
      radius: 13,
      rotation: 0,
    };
    pipesRef.current = [];
    setScore(0);
    setIsGameOver(false);
    setHasStarted(false);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ([' ', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        if (isGameOverRef.current) {
          resetGame();
        } else {
          flap();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flap, resetGame]);

  // Physics animation loop
  useEffect(() => {
    let animId;

    const loop = (timestamp) => {
      animId = requestAnimationFrame(loop);

      // Animate background clouds even when idle
      for (const cl of cloudsRef.current) {
        cl.x -= cl.speed;
        if (cl.x < -60) cl.x = WIDTH + 60;
      }

      if (!hasStartedRef.current || isGameOverRef.current) return;

      const bird = birdRef.current;
      const pipes = pipesRef.current;

      // Apply Gravity to bird
      bird.vy += GRAVITY;
      bird.y += bird.vy;
      bird.rotation = Math.min(Math.PI / 3, Math.max(-Math.PI / 4, (bird.vy / 10) * 0.8));

      // Floor and Ceiling collision
      if (bird.y + bird.radius >= HEIGHT - 20) {
        // Hit ground
        bird.y = HEIGHT - 20 - bird.radius;
        handleDeath();
        return;
      }
      if (bird.y - bird.radius <= 0) {
        bird.y = bird.radius;
        bird.vy = 0;
      }

      // Spawn pipes
      if (timestamp - lastPipeSpawnRef.current > 1600) {
        lastPipeSpawnRef.current = timestamp;
        const topHeight = Math.floor(Math.random() * (HEIGHT - PIPE_GAP - 120)) + 40;
        pipes.push({
          x: WIDTH,
          topHeight,
          bottomY: topHeight + PIPE_GAP,
          passed: false,
        });
      }

      // Update pipes & check collision
      for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= PIPE_SPEED;

        // Score pass
        if (!p.passed && p.x + PIPE_WIDTH < bird.x) {
          p.passed = true;
          sounds.playScore();
          const newScore = scoreRef.current + 1;
          setScore(newScore);
          if (newScore > highScore) {
            saveHighScore('flappy', newScore);
            setHighScore(newScore);
          }
        }

        // Collision box check
        const inHorizontal = bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + PIPE_WIDTH;
        const inTopPipe = bird.y - bird.radius < p.topHeight;
        const inBottomPipe = bird.y + bird.radius > p.bottomY;

        if (inHorizontal && (inTopPipe || inBottomPipe)) {
          handleDeath();
          return;
        }

        // Offscreen cleanup
        if (p.x + PIPE_WIDTH < -10) {
          pipes.splice(i, 1);
        }
      }
    };

    const handleDeath = () => {
      setIsGameOver(true);
      sounds.playGameOver();
      const best = Math.max(scoreRef.current, highScore);
      if (best > highScore) {
        saveHighScore('flappy', best);
        setHighScore(best);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [highScore]);

  // Drawing Canvas loop
  useEffect(() => {
    let animId;

    const render = () => {
      animId = requestAnimationFrame(render);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      skyGrad.addColorStop(0, '#0c1a30');
      skyGrad.addColorStop(0.7, '#1e3a8a');
      skyGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Draw Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (const cl of cloudsRef.current) {
        ctx.beginPath();
        ctx.arc(cl.x, cl.y, 22, 0, Math.PI * 2);
        ctx.arc(cl.x + 18, cl.y - 8, 16, 0, Math.PI * 2);
        ctx.arc(cl.x + 36, cl.y, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Pipes
      for (const p of pipesRef.current) {
        // Top Pipe
        ctx.fillStyle = '#22c55e'; // green-500
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topHeight);
        // Top Pipe Rim
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(p.x - 3, p.topHeight - 16, PIPE_WIDTH + 6, 16);

        // Bottom Pipe
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(p.x, p.bottomY, PIPE_WIDTH, HEIGHT - p.bottomY);
        // Bottom Pipe Rim
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(p.x - 3, p.bottomY, PIPE_WIDTH + 6, 16);

        // Pipe highlight stripe
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(p.x + 6, 0, 8, p.topHeight);
        ctx.fillRect(p.x + 6, p.bottomY, 8, HEIGHT - p.bottomY);
      }

      // Ground Grass
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, HEIGHT - 20, WIDTH, 20);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(0, HEIGHT - 20, WIDTH, 3);

      // Draw Bird
      const bird = birdRef.current;
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(bird.rotation);

      // Body (Golden Yellow)
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.ellipse(0, 0, bird.radius, bird.radius * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wing
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.ellipse(-4, 2, 7, 5, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(6, -4, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(7.5, -4, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Beak (Orange)
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(11, -1);
      ctx.lineTo(19, 2);
      ctx.lineTo(11, 5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto select-none">
      {/* Top Header stats */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-5 py-3 mb-4 backdrop-blur">
        <div>
          <span className="text-xs font-semibold text-slate-400">Score</span>
          <div className="text-2xl font-bold font-mono text-yellow-400">{score}</div>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <div>
            <span className="text-xs font-semibold text-slate-400">Best</span>
            <div className="text-2xl font-bold font-mono text-amber-400">{Math.max(score, highScore)}</div>
          </div>
        </div>

        <button
          onClick={resetGame}
          className="px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Main Canvas with Click-to-Flap */}
      <div
        onClick={isGameOver ? resetGame : flap}
        className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950 cursor-pointer"
      >
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="block max-w-full h-auto aspect-[380/500]"
        />

        {/* Start Overlay */}
        {!hasStarted && !isGameOver && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-extrabold text-yellow-400 mb-2">Flappy Bird</h3>
            <p className="text-xs text-slate-200 max-w-xs mb-5">
              Click, tap, or press Spacebar to flap wings and glide through green pipes!
            </p>
            <div className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl shadow-lg transition">
              Tap / Space to Flap
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-5 text-center">
            <Award className="w-12 h-12 text-yellow-400 mb-1" />
            <h3 className="text-xl font-bold text-red-400 mb-1">Game Over</h3>
            <p className="text-xs text-slate-300 mb-4">
              Pipes Cleared: <span className="font-bold text-yellow-400">{score}</span> | Best: {Math.max(score, highScore)}
            </p>
            <div className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl shadow-lg transition">
              Play Again
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 mt-3 text-center">
        Tip: Press <span className="text-slate-200 font-bold">Spacebar</span> or tap the game window to flap.
      </p>
    </div>
  );
}
