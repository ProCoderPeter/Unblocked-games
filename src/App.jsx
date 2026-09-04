import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  Heart,
  HelpCircle,
  Trophy,
  Sparkles,
  Gamepad2,
  ShieldCheck,
  Zap,
  Info,
  ChevronRight,
  Dice5,
  ExternalLink,
  Play
} from 'lucide-react';
import Header from './components/Header';
import GameCard from './components/GameCard';
import StealthCloak from './components/StealthCloak';
import IframeGame from './components/IframeGame';

import { GAMES_LIST } from './data/gamesList';
import { sounds } from './utils/audio';
import {
  getHighScores,
  getFavorites,
  toggleFavorite,
  recordPlay,
} from './utils/storage';

export default function App() {
  const [selectedGame, setSelectedGame] = useState(() => GAMES_LIST[0] || null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCloaked, setIsCloaked] = useState(false);
  const [isMuted, setIsMuted] = useState(() => sounds.getMuted());
  const [favorites, setFavorites] = useState(() => getFavorites());
  const [highScores, setHighScores] = useState(() => getHighScores());
  const [showControlsModal, setShowControlsModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync high scores on game launch / exit
  const refreshScores = useCallback(() => {
    setHighScores(getHighScores());
  }, []);

  const handlePlayGame = (game) => {
    if (!game) return;
    sounds.playBlip(520, 0.05);
    recordPlay(game.id);
    setSelectedGame(game);
    refreshScores();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLobby = () => {
    sounds.playBlip(380, 0.05);
    setSelectedGame(null);
    refreshScores();
  };

  const handleToggleFavorite = (id) => {
    sounds.playBlip(600, 0.04);
    const updated = toggleFavorite(id);
    setFavorites(updated);
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleRandomGame = () => {
    if (GAMES_LIST.length === 0) return;
    const randomGame = GAMES_LIST[Math.floor(Math.random() * GAMES_LIST.length)];
    handlePlayGame(randomGame);
  };

  // Keyboard shortcut listener for Esc (Panic mode)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsCloaked((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  };

  // Filtered games list
  const filteredGames = useMemo(() => {
    return GAMES_LIST.filter((game) => {
      // Category filter
      if (selectedCategory === 'favorites') {
        if (!favorites.includes(game.id)) return false;
      } else if (selectedCategory !== 'all' && game.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = game.title?.toLowerCase().includes(q);
        const matchesDesc = game.description?.toLowerCase().includes(q);
        const matchesTag = game.tags?.some((t) => t.toLowerCase().includes(q));
        return matchesTitle || matchesDesc || matchesTag;
      }

      return true;
    });
  }, [selectedCategory, searchQuery, favorites]);

  return (
    <div
      className="min-h-screen bg-[#050507] text-slate-200 font-sans flex flex-col selection:bg-indigo-500 selection:text-white"
      style={{ backgroundImage: 'radial-gradient(circle at 50% -20%, #1a1a2e 0%, #050507 80%)' }}
    >
      {/* Stealth Cloak overlay if panic mode triggered */}
      {isCloaked && <StealthCloak onUncloak={() => setIsCloaked(false)} />}

      {/* Main Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onActivateCloak={() => setIsCloaked(true)}
        onRandomGame={handleRandomGame}
        favoritesCount={favorites.length}
      />

      {/* Main Shell with Sidebar & Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Immersive UI Discovery & Category Sidebar (Desktop) */}
        <aside className="w-64 shrink-0 border-r border-white/5 bg-black/10 p-6 flex flex-col gap-8 hidden md:flex">
          <nav className="space-y-8">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">
                Discovery
              </p>
              <ul className="space-y-3 text-sm">
                <li>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedGame(null);
                    }}
                    className={`flex items-center gap-3 w-full text-left font-medium transition cursor-pointer ${
                      !selectedGame && selectedCategory === 'all'
                        ? 'text-indigo-400 font-bold'
                        : 'text-slate-400 hover:text-white opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span className="text-base">⚡</span>
                    <span>All Games</span>
                  </button>
                </li>
                {GAMES_LIST[0] && (
                  <li>
                    <button
                      onClick={() => handlePlayGame(GAMES_LIST[0])}
                      className={`flex items-center gap-3 w-full text-left font-medium transition cursor-pointer ${
                        selectedGame?.id === GAMES_LIST[0].id
                          ? 'text-indigo-400 font-bold'
                          : 'text-slate-400 hover:text-white opacity-70 hover:opacity-100'
                      }`}
                    >
                      <span className="text-base">🕹️</span>
                      <span>{GAMES_LIST[0].title}</span>
                    </button>
                  </li>
                )}
                <li>
                  <button
                    onClick={() => {
                      setSelectedCategory('favorites');
                      setSelectedGame(null);
                    }}
                    className={`flex items-center justify-between w-full text-left font-medium transition cursor-pointer ${
                      selectedCategory === 'favorites'
                        ? 'text-indigo-400 font-bold'
                        : 'text-slate-400 hover:text-white opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">❤️</span>
                      <span>Favorites</span>
                    </div>
                    {favorites.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {favorites.length}
                      </span>
                    )}
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">
                Categories
              </p>
              <ul className="space-y-3 text-sm">
                {[
                  { id: 'arcade', label: 'Arcade & Retro', icon: '🕹️' },
                  { id: 'puzzle', label: 'Puzzle & Logic', icon: '🧩' },
                  { id: 'action', label: 'Action & Shooter', icon: '🚀' },
                  { id: '2player', label: '2-Player Local Duel', icon: '⚔️' },
                ].map((cat) => {
                  const isActive = selectedCategory === cat.id && !selectedGame;
                  return (
                    <li key={cat.id}>
                      <button
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setSelectedGame(null);
                        }}
                        className={`flex items-center gap-3 w-full text-left transition cursor-pointer ${
                          isActive
                            ? 'text-indigo-400 font-bold'
                            : 'text-slate-400 hover:text-white opacity-70 hover:opacity-100'
                        }`}
                      >
                        <span className="text-sm">{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          {/* Network Protection Bypass Indicator */}
          <div className="mt-auto p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-xs font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Embed Online</span>
            </p>
            <p className="text-[10px] text-slate-400 opacity-80 leading-relaxed">
              Google Atari embedded arcade is unlocked and ready to play.
            </p>
          </div>
        </aside>

        {/* Main Center Area */}
        <main className="flex-1 p-4 sm:p-8 lg:p-10 flex flex-col overflow-y-auto">
          {/* Mobile Category Bar */}
          <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar border-b border-white/5">
            {[
              { id: 'all', label: 'All' },
              { id: 'arcade', label: 'Arcade' },
              { id: 'favorites', label: 'Favorites' },
            ].map((cat) => {
              const isActive = selectedCategory === cat.id && !selectedGame;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedGame(null);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {selectedGame ? (
            /* ================= ACTIVE GAME PLAYER VIEW ================= */
            <div className="w-full flex flex-col items-center max-w-6xl mx-auto">
              {/* Game Top Console Bar */}
              <div className="w-full flex items-center justify-between bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3.5 mb-6 shadow-xl">
                <div className="flex items-center gap-3">
                  <button
                    id="back-to-lobby-btn"
                    onClick={handleBackToLobby}
                    className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/10 hover:border-indigo-500/50 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Catalog</span>
                  </button>
                  <div className="h-4 w-px bg-white/10 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-xl font-black italic text-white tracking-tight">
                      {selectedGame.title}
                    </h2>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      {selectedGame.badge || selectedGame.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleToggleFavorite(selectedGame.id)}
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 flex items-center justify-center transition cursor-pointer"
                    title={favorites.includes(selectedGame.id) ? 'Remove Favorite' : 'Add to Favorites'}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        favorites.includes(selectedGame.id)
                          ? 'text-rose-500 fill-rose-500'
                          : 'text-slate-400'
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => setShowControlsModal(true)}
                    className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-white/10 hover:border-indigo-500/50 transition cursor-pointer hidden sm:flex"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Controls</span>
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 flex items-center justify-center transition cursor-pointer"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Render Iframe Game inside Immersive Container */}
              <div className="w-full flex justify-center">
                <IframeGame src={selectedGame.src} title={selectedGame.title} />
              </div>
            </div>
          ) : (
            /* ================= GAMES LOBBY DIRECTORY VIEW ================= */
            <div className="space-y-8">
              {/* Top Banner Row */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 shrink-0 pb-4 border-b border-white/5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {selectedCategory === 'all'
                      ? 'Featured Games'
                      : selectedCategory === 'favorites'
                      ? 'Your Favorite Games'
                      : `${selectedCategory.toUpperCase()} COLLECTION`}
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1">
                    Unblocked Atari and classic arcade web games
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500 mr-2">
                    {filteredGames.length} {filteredGames.length === 1 ? 'Title' : 'Titles'} Available
                  </span>
                  {filteredGames.length > 0 && (
                    <button
                      onClick={handleRandomGame}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-indigo-500/50 text-slate-300 text-xs flex items-center gap-1.5 transition cursor-pointer"
                      title="Play game"
                    >
                      <Dice5 className="w-4 h-4 text-indigo-400" />
                      <span className="hidden sm:inline">Play Now</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Games Grid */}
              {filteredGames.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                  {filteredGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      highScore={highScores[game.id] || 0}
                      isFavorite={favorites.includes(game.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onPlay={handlePlayGame}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center flex flex-col items-center">
                  <Info className="w-10 h-10 text-slate-500 mb-3" />
                  <h3 className="text-base font-bold text-slate-200 mb-1">No games found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-4">
                    {selectedCategory === 'favorites'
                      ? 'You have not added any games to your favorites yet. Click the heart icon on any card to add it!'
                      : `No games match the query "${searchQuery}".`}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="px-5 py-2 bg-white text-black hover:bg-indigo-400 text-xs font-bold uppercase tracking-wider rounded-full transition cursor-pointer"
                  >
                    View All Games
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Controls Info Modal */}
      {showControlsModal && selectedGame && (
        <div
          onClick={() => setShowControlsModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0b0c14] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{selectedGame.title} Controls</span>
              </h3>
              <button
                onClick={() => setShowControlsModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 mb-6">
              {selectedGame.controls?.map((ctrl, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs text-slate-300 flex items-center gap-2"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{ctrl}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowControlsModal(false)}
              className="w-full py-2.5 bg-white text-black hover:bg-indigo-400 font-bold text-xs uppercase tracking-wider rounded-full transition cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Immersive UI Footer */}
      <footer className="h-12 shrink-0 bg-black flex items-center px-6 sm:px-10 border-t border-white/5 text-[10px] text-slate-500 uppercase tracking-widest justify-between">
        <div className="flex gap-6 sm:gap-8 items-center">
          <span>© 2026 COREPLAY UNBLOCKED</span>
          <span className="hover:text-white cursor-pointer transition-colors hidden sm:inline">Terms of Service</span>
          <span className="hover:text-white cursor-pointer transition-colors hidden sm:inline">Privacy</span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            Status: <span className="text-indigo-400">Atari Embed Connected</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        </div>
      </footer>
    </div>
  );
}
