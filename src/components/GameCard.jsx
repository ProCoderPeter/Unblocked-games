import React from 'react';
import { Play, Trophy, Heart, Gamepad2, Blocks, Rocket, Swords, Grid3X3, Bird, ShieldAlert, Bomb, Keyboard } from 'lucide-react';

const ICON_COMPONENTS = {
  Gamepad2,
  Blocks,
  Rocket,
  Swords,
  Grid3X3,
  Bird,
  ShieldAlert,
  Bomb,
  Keyboard,
};

export default function GameCard({
  game,
  highScore,
  isFavorite,
  onToggleFavorite,
  onPlay,
}) {
  const IconComponent = ICON_COMPONENTS[game.iconName] || Gamepad2;

  return (
    <div
      onClick={() => onPlay(game)}
      className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:border-indigo-500/50 hover:bg-white/[0.08] transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(79,70,229,0.2)] flex flex-col justify-between"
    >
      {/* Visual Aspect-Video Header Thumbnail */}
      <div className="relative aspect-video w-full bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-black/90 flex items-center justify-center overflow-hidden border-b border-white/5">
        {/* Ambient Glow effect */}
        <div
          className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-300 blur-xl"
          style={{ backgroundColor: game.themeColor }}
        />

        {/* Big Centered Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform duration-300 group-hover:scale-110 z-10"
          style={{ backgroundColor: `${game.themeColor}dd` }}
        >
          <IconComponent className="w-7 h-7" />
        </div>

        {/* Top Badges & Favorite Toggle */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          {game.badge ? (
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-md"
              style={{
                backgroundColor: `${game.themeColor}22`,
                color: game.themeColor,
                border: `1px solid ${game.themeColor}55`,
              }}
            >
              {game.badge}
            </span>
          ) : (
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-black/40 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-md">
              {game.category}
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(game.id);
            }}
            className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:border-white/30 flex items-center justify-center text-slate-400 hover:text-rose-400 transition"
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? 'text-rose-500 fill-rose-500' : 'text-slate-300'}`}
            />
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
              {game.title}
            </h3>
            {highScore > 0 && (
              <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 font-bold">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>{highScore}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {game.description}
          </p>
        </div>

        {/* Bottom Bar: Tags and Action Button */}
        <div>
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium text-slate-400">Ready to play</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPlay(game);
              }}
              className="px-4 py-1.5 rounded-full bg-white text-black group-hover:bg-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors shadow-xs"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Play</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1 mt-3">
            {game.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium text-slate-400 bg-black/40 px-2 py-0.5 rounded-md border border-white/5"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
