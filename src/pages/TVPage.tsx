import { useRef, useEffect, useState, lazy, Suspense } from "react";
import Hls from "hls.js";
import { Play, Volume2, VolumeX, Maximize, Monitor, Tv, Sun } from "lucide-react";
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

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const pattern = ctx.createPattern(offscreen, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.save();
        ctx.translate(-Math.random() * bufW, -Math.random() * bufH);
        ctx.fillRect(0, 0, width + bufW, height + bufH);
        ctx.restore();
      }
      frameId = requestAnimationFrame(draw);
    };
    draw();
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
  const [showStatic, setShowStatic] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [brightness, setBrightness] = useState(100);

  const STREAM_URL = "https://acesso.ecast.site:3239/stream/play.m3u8";

  // Hide the global preloader when TVPage mounts
  useEffect(() => {
    document.documentElement.setAttribute("data-loaded", "");
    const preloader = document.getElementById("preloader");
    if (preloader) {
      setTimeout(() => preloader.remove(), 500);
    }
  }, []);

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="relative h-svh flex flex-col bg-[#050505] overflow-hidden text-pinball-cream font-sans">
      
      {/* Background Magic */}
      <Suspense fallback={null}>
        <CanvasBackground activeSection="midia" />
      </Suspense>
      
      {/* Real Navbar */}
      <Navbar activeSection="midia" />

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a0a0a] via-[#050505] to-black opacity-80 z-0 pointer-events-none" />

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-row items-stretch relative z-[40] pt-[80px] min-h-0">
          
          {/* External Control Panel (Vertical Sidemenu) */}
          <div className="w-16 bg-[#0a0a0a]/95 backdrop-blur-md border-r border-white/10 py-6 px-2 flex flex-col items-center justify-between shadow-[30px_0_30px_rgba(0,0,0,0.5)] shrink-0 z-[45]">
            
            <div className="flex flex-col items-center gap-8 w-full">
              <button 
                onClick={() => setShowTVFrame(!showTVFrame)}
                className={`flex flex-col items-center justify-center gap-1 w-10 h-10 rounded-lg transition-colors ${showTVFrame ? 'bg-pinball-neon-blue/20 text-pinball-neon-blue' : 'text-white/50 hover:bg-white/10'}`}
                title={showTVFrame ? "Moldura TV Ligada" : "Moldura TV Desligada"}
              >
                <Tv className="w-5 h-5" />
              </button>

              <button 
                onClick={() => setShowStatic(!showStatic)}
                className={`flex flex-col items-center justify-center gap-1 w-10 h-10 rounded-lg transition-colors ${showStatic ? 'bg-pinball-neon-blue/20 text-pinball-neon-blue' : 'text-white/50 hover:bg-white/10'}`}
                title={showStatic ? "Efeito CRT Ligado" : "Vídeo Limpo"}
              >
                <Monitor className="w-5 h-5" />
              </button>

              {/* Brightness (Vertical Slider) */}
              <div className="flex flex-col items-center gap-3 group relative">
                <Sun className="w-4 h-4 text-white/50" />
                <div className="flex h-24 w-4 items-center justify-center">
                  <input 
                    type="range" 
                    min="50" max="150" value={brightness} 
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="h-24 accent-pinball-neon-blue bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                  />
                </div>
              </div>

              {/* Volume (Vertical Slider) */}
              <div className="flex flex-col items-center gap-3 group relative">
                <button onClick={() => setIsMuted(!isMuted)} className="text-white/50 hover:text-white transition-colors" title="Mudo">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <div className="flex h-24 w-4 items-center justify-center">
                  <input 
                    type="range" 
                    min="0" max="1" step="0.05" value={isMuted ? 0 : volume} 
                    onChange={(e) => {
                      setVolume(Number(e.target.value));
                      if (Number(e.target.value) > 0) setIsMuted(false);
                    }}
                    className="h-24 accent-pinball-red bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={toggleFullscreen}
              className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors mt-auto"
              title="Tela Cheia"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>

          {/* TV Area */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl flex items-center justify-center">
              {/* Main Video/TV Container */}
              <div 
                ref={playerContainerRef}
                className={`relative flex-1 max-h-[80vh] aspect-video flex items-center justify-center group ${showTVFrame ? 'cursor-pointer' : 'overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] bg-black/50 backdrop-blur-sm rounded-2xl'}`}
            onClick={() => {
              if (showTVFrame) {
                const video = videoRef.current;
                if (video) {
                  if (video.paused) video.play().catch(() => {});
                  else video.pause();
                }
              }
            }}
          >
            {/* TV Frame (Optional) */}
            {showTVFrame && (
              <img
                src={isPlaying ? "/images/tv-frame-on.webp" : "/images/tv-frame-off.webp"}
                alt="TV Retro Frame"
                width={981}
                height={588}
                className="absolute inset-0 w-full h-full object-contain z-30 drop-shadow-[0_0_30px_rgba(255,42,42,0.2)] pointer-events-none"
              />
            )}

            {/* Video Area (Masked inside TV or Full Container) */}
            <div 
              className={showTVFrame 
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
                className={`absolute inset-0 w-full ${showTVFrame ? 'h-[110%] pointer-events-none' : 'h-full'} object-cover top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40`}
                style={{ filter: `brightness(${brightness}%)` }}
                controls={!showTVFrame} // Show native controls if TV frame is off
                autoPlay
                playsInline
                muted={isMuted}
              />

              {/* Custom Play Button Overlay (Only when TV Frame is ON and video is paused) */}
              {showTVFrame && !isPlaying && (
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
      <footer className="w-full bg-black border-t border-white/5 py-4 px-6 relative z-[40] shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs text-pinball-cream/60">
            <span className="uppercase tracking-widest text-[9px] text-pinball-cream/40 hidden sm:inline">Developed by:</span>
            <a 
              href="https://stream.builders" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src="/square_logo.png" alt="Stream Builders" className="h-8 w-8 object-contain rounded" />
              <span className="font-tech text-pinball-cream tracking-wide text-sm">Stream Builders</span>
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs text-pinball-cream/60">
            <span className="uppercase tracking-widest text-[9px] text-pinball-cream/40 hidden sm:inline">Powered by:</span>
            <a 
              href="https://videoclub.tv.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src="/videoclub-logo-vectorl.svg" alt="VIDEOCLUB" className="h-8 w-auto object-contain brightness-0 invert opacity-90" />
            </a>
          </div>

        </div>
      </footer>

    </div>
  );
}
