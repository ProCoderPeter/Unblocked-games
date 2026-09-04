import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, ExternalLink, Maximize2, Info, Edit3, Check } from 'lucide-react';

export default function IframeGame({
  src = "https://www.gstatic.com/atari/embeds/1a4ef40bee1feb83c2f3523b849fdcfa/intermediate-frame-minified.html?jsh=m%3B%2F_%2Fscs%2Fabc-static%2F_%2Fjs%2Fk%3Dgapi.lb.en.zhTT8Br0Ho8.O%2Fd%3D1%2Frs%3DAHpOoo-7LeULGjNQZRvhdu3G71akb6JY6A%2Fm%3D__features__&r=702721709",
  title = "Custom embed",
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [inputUrl, setInputUrl] = useState(src);
  const containerRef = useRef(null);

  // Sync if prop changes
  useEffect(() => {
    setCurrentSrc(src);
    setInputUrl(src);
    setIframeKey((prev) => prev + 1);
  }, [src]);

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  };

  const handleApplyCustomUrl = (e) => {
    e?.preventDefault();
    if (inputUrl.trim()) {
      setCurrentSrc(inputUrl.trim());
      setIsLoading(true);
      setIframeKey((prev) => prev + 1);
      setShowUrlInput(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col items-center bg-[#07080f] rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative"
    >
      {/* Top Utility Bar */}
      <div className="w-full flex flex-wrap items-center justify-between px-4 py-2.5 bg-black/40 border-b border-white/10 text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-300 tracking-wide text-xs">{title}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono hidden sm:inline">
            Sandbox Active
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer text-xs"
            title="Edit Embed Source URL"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit URL</span>
          </button>

          <button
            onClick={handleReload}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer text-xs"
            title="Reload Game"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reload</span>
          </button>

          <button
            onClick={handleFullscreen}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer text-xs"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>

          <a
            href={currentSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 transition text-xs"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Popout</span>
          </a>
        </div>
      </div>

      {/* URL Edit Dropdown */}
      {showUrlInput && (
        <form
          onSubmit={handleApplyCustomUrl}
          className="w-full bg-black/60 border-b border-white/10 p-3 flex flex-col sm:flex-row items-center gap-2 text-xs"
        >
          <span className="text-slate-400 shrink-0 font-medium">Embed URL:</span>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Paste game embed URL or direct game link..."
            className="flex-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply</span>
            </button>
            <button
              type="button"
              onClick={() => setShowUrlInput(false)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Loading indicator overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07080f]/90 z-10 backdrop-blur-xs">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium text-slate-300">Loading custom embed...</p>
        </div>
      )}

      {/* Iframe Element matching user exact specifications */}
      <div className="w-full relative min-h-[620px] h-[75vh] flex bg-black">
        <iframe
          key={iframeKey}
          jsname="WMhH6e"
          className="YMEQtf w-full h-full flex-1"
          frameBorder="0"
          sandbox="allow-scripts allow-popups allow-forms allow-same-origin allow-popups-to-escape-sandbox allow-downloads allow-storage-access-by-user-activation"
          id="6c94ff0946b8bb18_35"
          name="6c94ff0946b8bb18_35"
          scrolling="no"
          title={title}
          aria-label={title}
          src={currentSrc}
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          style={{ width: '100%', height: '100%', border: 'none', overflow: 'hidden' }}
        />
      </div>

      {/* Helper notice explaining Google Sites embed behavior */}
      <div className="w-full p-3.5 bg-black/50 border-t border-white/5 flex items-start gap-2.5 text-[11px] text-slate-400">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <p className="text-slate-300 font-semibold mb-0.5">Note regarding Google Sites Atari Embeds:</p>
          <p>
            This URL points to Google Sites' intermediate sandbox wrapper (<code className="text-indigo-300 font-mono text-[10px]">intermediate-frame-minified.html</code>).
            If it displays a blank canvas, it is because Google Sites uses an internal parent RPC broker to stream the game into the inner frame.
            To load the game directly, inspect the original site in Chrome DevTools, locate the inner nested <code className="text-indigo-300 font-mono text-[10px]">&lt;iframe id="innerFrame"&gt;</code>, copy its <code className="text-indigo-300 font-mono text-[10px]">src</code>, and click <strong>Edit URL</strong> above to paste it.
          </p>
        </div>
      </div>
    </div>
  );
}
