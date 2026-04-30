import { useRef, useEffect, useState, lazy, Suspense } from "react";
import Hls from "hls.js";
import { Play, Volume2, VolumeX, Maximize, Minimize, Tv, Sun } from "lucide-react";
import Navbar from "../components/Navbar";

const CanvasBackground = lazy(
  () => import("../components/effects/CanvasBackground"),
);

const TVStaticBackground = ({ isActive }: { isActive: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let frameId: number;

    const GRAIN = 3;
    const cells = 96;
    const bufW = cells * GRAIN;
    const bufH = cells * GRAIN;
    const offscreen = document.createElement("canvas");
    offscreen.width = bufW;
    offscreen.height = bufH;
    const oCtx = offscreen.getContext("2d", { alpha: true });
    if (oCtx) {
      const imgData = oCtx.createImageData(bufW, bufH);
      const data = imgData.data;
      for (let cy = 0; cy < cells; cy++) {
        for (let cx = 0; cx < cells; cx++) {
          const light = Math.random() > 0.5 ? 255 : 0;
          const alpha = Math.random() * 60;
          for (let dy = 0; dy < GRAIN; dy++) {
            for (let dx = 0; dx < GRAIN; dx++) {
              const px = (cy * GRAIN + dy) * bufW + (cx * GRAIN + dx);
              const idx = px * 4;
              data[idx] = light;
              data[idx + 1] = light;
              data[idx + 2] = light;
              data[idx + 3] = alpha;
            }
          }
        }
      }
      oCtx.putImageData(imgData, 0, 0);
    }

    let lastTime = 0;
    const pattern = oCtx ? ctx.createPattern(offscreen, "repeat") : null;

    const draw = (time: number) => {
      // Throttle to 30 FPS (33ms)
      if (time - lastTime < 33) {
        frameId = requestAnimationFrame(draw);
        return;
      }
      lastTime = time;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.save();
        ctx.translate(-Math.random() * bufW, -Math.random() * bufH);
        ctx.fillRect(0, 0, width + bufW, height + bufH);
        ctx.restore();
      }
      frameId = requestAnimationFrame(draw);
    };
    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [isActive]);

  if (!isActive) return null;
  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={180}
      style={{ imageRendering: "pixelated" }}
      className="absolute inset-0 w-full h-full object-cover z-[15] pointer-events-none opacity-50 mix-blend-screen"
      aria-hidden="true"
    />
  );
};

export default function TVPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  
  const [isBuffering, setIsBuffering] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTVFrame, setShowTVFrame] = useState(true);
  const [showStatic] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const STREAM_URL = "https://acesso.ecast.site:3239/stream/play.m3u8";

  // Handle fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull && screen.orientation && (screen.orientation as any).unlock) {
        (screen.orientation as any).unlock();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const isTVMode = showTVFrame && !isFullscreen;

  // Hide the global preloader when TVPage mounts
  useEffect(() => {
    document.documentElement.setAttribute("data-loaded", "");
    const preloader = document.getElementById("preloader");
    if (preloader) {
      setTimeout(() => preloader.remove(), 500);
    }
  }, []);

  // Strict aspect-ratio mathematical scaling
  useEffect(() => {
    const container = playerContainerRef.current;
    const parent = container?.parentElement;
    if (!container || !parent) return;

    if (isFullscreen) {
      container.style.width = '100vw';
      container.style.height = '100vh';
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) continue;
        
        const targetRatio = isTVMode ? 981 / 588 : 16 / 9;
        const currentRatio = width / height;

        if (currentRatio > targetRatio) {
          // Parent is wider than needed -> constrain by height
          container.style.height = '100%';
          container.style.width = `${height * targetRatio}px`;
        } else {
          // Parent is taller than needed -> constrain by width
          container.style.width = '100%';
          container.style.height = `${width / targetRatio}px`;
        }
      }
    });

    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, [isTVMode, isFullscreen]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    const handleCanPlay = () => setIsBuffering(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("pause", handlePause);

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(STREAM_URL);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.log("Auto-play prevented", e));
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari support
      video.src = STREAM_URL;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(e => console.log("Auto-play prevented", e));
      });
    }

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("pause", handlePause);
      if (hls) {
        hls.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      const container = playerContainerRef.current as any;
      if (container) {
        try {
          if (container.requestFullscreen) {
            await container.requestFullscreen();
          } else if (container.webkitRequestFullscreen) {
            await container.webkitRequestFullscreen();
          }
          if (screen.orientation && (screen.orientation as any).lock) {
            await (screen.orientation as any).lock('landscape').catch(() => {});
          }
        } catch (err: any) {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        }
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  return (
    <div className="relative h-svh flex flex-col bg-[#050505] overflow-hidden text-pinball-cream font-sans">
      
      {/* Background Magic */}
      <Suspense fallback={null}>
        <CanvasBackground activeSection="midia" />
      </Suspense>
      
      {/* Real Navbar */}
      <Navbar activeSection="midia" className="landscape:max-md:pl-20 sm:pl-20" />

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a0a0a] via-[#050505] to-black opacity-80 z-0 pointer-events-none" />

      {/* Main Content */}
      <main className="flex-1 w-full sm:w-[calc(100%-5rem)] landscape:max-md:w-[calc(100%-5rem)] sm:ml-20 landscape:max-md:ml-20 flex flex-col items-stretch relative z-[40] pt-[80px] min-h-0">
          
          {/* External Control Panel (Vertical Sidemenu on Desktop, Bottom Bar on Mobile) */}
          <div className="w-full bg-[#0a0a0a]/95 backdrop-blur-md border-t sm:border-t-0 sm:border-r border-white/10 py-3 px-4 flex flex-row sm:flex-col items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)] sm:shadow-[30px_0_30px_rgba(0,0,0,0.5)] shrink-0 z-[105] overflow-y-auto scrollbar-hide sm:fixed sm:left-0 sm:top-0 sm:bottom-0 sm:w-20 sm:pt-[84px] sm:pb-6 landscape:max-md:fixed landscape:max-md:left-0 landscape:max-md:top-0 landscape:max-md:bottom-0 landscape:max-md:w-20 landscape:max-md:pt-[76px] landscape:max-md:pb-4 order-2">
            
            <div className="flex flex-row sm:flex-col items-center gap-6 sm:gap-4 landscape:max-md:gap-3 w-full justify-center sm:justify-start">
              <button 
                onClick={() => setShowTVFrame(!showTVFrame)}
                className={`flex flex-col items-center justify-center gap-1 w-10 h-10 rounded-xl transition-colors shrink-0 ${showTVFrame ? 'bg-pinball-neon-blue/20 text-pinball-neon-blue' : 'text-white/50 hover:bg-white/10'}`}
                title={showTVFrame ? "Moldura TV Ligada" : "Moldura TV Desligada"}
              >
                <Tv className="w-5 h-5" />
              </button>

              {/* Brightness (Horizontal Slider) */}
              <div className="flex flex-col items-center gap-2 group relative shrink-0">
                <Sun className="w-4 h-4 text-white/50" />
                <div className="w-16 sm:w-16 h-4 flex items-center justify-center">
                  <input 
                    type="range" 
                    min="50" max="150" value={brightness} 
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-16 h-1.5 accent-pinball-neon-blue bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Volume (Horizontal Slider) */}
              <div className="flex flex-col items-center gap-2 group relative shrink-0">
                <button onClick={() => setIsMuted(!isMuted)} className="text-white/50 hover:text-white transition-colors" title="Mudo">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <div className="w-16 sm:w-16 h-4 flex items-center justify-center">
                  <input 
                    type="range" 
                    min="0" max="1" step="0.05" value={isMuted ? 0 : volume} 
                    onChange={(e) => {
                      setVolume(Number(e.target.value));
                      if (Number(e.target.value) > 0) setIsMuted(false);
                    }}
                    className="w-16 h-1.5 accent-[#ff2a2a] bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <button 
                onClick={toggleFullscreen}
                className={`flex flex-col items-center justify-center gap-1 w-10 h-10 rounded-xl transition-colors shrink-0 ${isFullscreen ? 'bg-[#ff2a2a]/20 text-[#ff2a2a]' : 'text-white/50 hover:bg-white/10'}`}
                title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* TV Area */}
          <div className="flex-1 w-full h-full flex items-center justify-center p-2 lg:p-6 order-1 sm:order-2 overflow-hidden min-h-0">
            <div className="relative w-full h-full max-w-6xl flex items-center justify-center min-h-0 min-w-0">
              {/* Main Video/TV Container - Controlled exclusively by ResizeObserver */}
              <div 
                ref={playerContainerRef}
                className={`relative flex items-center justify-center group mx-auto cursor-pointer ${
                  isFullscreen
                    ? 'bg-black fixed inset-0 z-[110]'
                    : isTVMode 
                      ? '' 
                      : 'overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] bg-black/50 backdrop-blur-sm rounded-2xl'
                }`}
            onClick={() => {
              const video = videoRef.current;
              if (video) {
                if (video.paused) video.play().catch(() => {});
                else video.pause();
              }
            }}
          >
            {/* Fullscreen Exit Button */}
            {isFullscreen && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="absolute top-4 right-4 z-[120] w-12 h-12 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors border border-white/10 backdrop-blur-md"
                title="Sair da Tela Cheia"
              >
                <Minimize className="w-6 h-6" />
              </button>
            )}

            {/* TV Frame (Optional) */}
            {isTVMode && (
              <img
                src={isPlaying ? "/images/tv-frame-on.webp" : "/images/tv-frame-off.webp"}
                alt="TV Retro Frame"
                width={981}
                height={588}
                className="absolute inset-0 w-full h-full object-fill z-30 drop-shadow-[0_0_30px_rgba(255,42,42,0.2)] pointer-events-none"
              />
            )}

            {/* Video Area (Masked inside TV or Full Container) */}
            <div 
              className={isTVMode 
                ? "absolute top-[9%] bottom-[18%] left-[7.5%] right-[23.0%] sm:right-[23.0%] rounded-[5%] sm:rounded-[30px] overflow-hidden bg-[#050510] z-0 flex items-center justify-center shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]"
                : "absolute inset-0 z-0 flex items-center justify-center bg-black"
              }
            >
              {/* Fake CRT scanning overlay */}
              {showStatic && <div className="absolute inset-0 pointer-events-none z-20 opacity-40 mix-blend-screen crt-scanline-overlay" />}

              {/* TV Static Overlay */}
              {showStatic && <TVStaticBackground isActive={!isPlaying || isBuffering} />}

              {/* Native HLS Video Player - ALWAYS ON TOP FOR CLICKS */}
              <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover z-40 pointer-events-none`}
                style={{ filter: `brightness(${brightness}%)` }}
                autoPlay
                playsInline
                muted={isMuted}
              />

              {/* Custom Play Button Overlay (Always show when paused) */}
              {!isPlaying && (
                <div className="absolute inset-0 z-50 flex items-center justify-center transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-br from-pinball-red/20 to-pinball-neon-blue/20 opacity-60 transition-opacity" />
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-pinball-red/90 flex items-center justify-center backdrop-blur-md shadow-[0_0_20px_rgba(255,42,42,0.8)] z-50">
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 text-white fill-current" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>

      {/* Custom Footer */}
      <footer className="w-full sm:w-[calc(100%-5rem)] landscape:max-md:w-[calc(100%-5rem)] sm:ml-20 landscape:max-md:ml-20 bg-black border-t border-white/5 py-2 sm:py-4 px-4 sm:px-6 relative z-[40] shrink-0">
        <div className="max-w-6xl mx-auto flex flex-row items-center justify-between landscape:max-md:justify-center landscape:max-md:gap-16 gap-4 w-full">
          
          <div className="flex flex-col items-start gap-1 sm:gap-2 text-xs text-pinball-cream/60 w-1/2 sm:w-auto">
            <span className="uppercase tracking-widest text-[8px] sm:text-[9px] text-pinball-cream/40 inline">Developed by:</span>
            <a 
              href="https://stream.builders" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src="/square_logo.png" alt="Stream Builders" className="h-6 w-6 sm:h-8 sm:w-8 object-contain rounded" />
              <span className="font-tech text-pinball-cream tracking-wide text-xs sm:text-sm">Stream Builders</span>
            </a>
          </div>

          <div className="flex flex-col items-end gap-1 sm:gap-2 text-xs text-pinball-cream/60 w-1/2 sm:w-auto text-right">
            <span className="uppercase tracking-widest text-[8px] sm:text-[9px] text-pinball-cream/40 inline">Powered by:</span>
            <a 
              href="https://videoclub.tv.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity justify-end"
            >
              <img src="/videoclub-logo-vectorl.svg" alt="VIDEOCLUB" className="h-3 sm:h-5 w-auto object-contain brightness-0 invert opacity-90" />
            </a>
          </div>

        </div>
      </footer>

    </div>
  );
}
