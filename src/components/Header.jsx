import React from 'react';
import { Volume2, VolumeX, ShieldAlert, Dice5, Search, Heart, Gamepad2 } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Games' },
  { id: 'arcade', label: 'Arcade' },
  { id: 'puzzle', label: 'Puzzle' },
  { id: 'action', label: 'Action' },
  { id: '2player', label: '2 Player' },
  { id: 'favorites', label: 'Favorites' },
];

export default function Header({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  isMuted,
  onToggleMute,
  onActivateCloak,
  onRandomGame,
  favoritesCount,
}) {
  return (
    <header className="h-20 shrink-0 flex flex-col justify-center border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-40">
      <div className="w-full px-4 sm:px-8 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)] text-white">
            <span className="font-bold text-xl">Ω</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter italic text-white">
              CORE<span className="text-indigo-500">PLAY</span>
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hidden sm:inline">
              UNBLOCKED
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-2 sm:mx-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search unblocked games..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 px-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 opacity-60" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right Tools & Indicators */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          {/* Online Network Indicator */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60">
            <span>Online: 4,219</span>
            <span className="text-emerald-400 animate-pulse">●</span>
          </div>

          {/* Random Game Button */}
          <button
            onClick={onRandomGame}
            className="hidden sm:flex bg-white text-black px-4 sm:px-5 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-indigo-400 transition cursor-pointer items-center gap-1.5"
            title="Launch random game"
          >
            <Dice5 className="w-3.5 h-3.5 text-indigo-900" />
            <span>Random</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:border-indigo-500/50 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Stealth / Panic Mode Button */}
          <button
            onClick={onActivateCloak}
            className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-amber-500/30 hover:border-amber-400 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Instantly disguise screen (Esc)"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Panic</span>
            <kbd className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded border border-white/10 text-slate-400">Esc</kbd>
          </button>
        </div>
      </div>
    </header>
  );
}
