import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "motion/react";
import { Play } from "lucide-react";
import { useTranslation } from "react-i18next";

const TVStaticBackground = ({ isActive }: { isActive: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let frameId: number;

    // Pre-render noise with physically larger grains (each noise cell = GRAIN×GRAIN pixels)
    const GRAIN = 3; // each noise dot is 3×3 pixels
    const cells = 96; // number of noise cells per axis
    const bufW = cells * GRAIN; // actual pixel width (288)
    const bufH = cells * GRAIN;
    const offscreen = document.createElement("canvas");
    offscreen.width = bufW;
    offscreen.height = bufH;
    const oCtx = offscreen.getContext("2d", { alpha: true });
    if (oCtx) {
      const imgData = oCtx.createImageData(bufW, bufH);
      const data = imgData.data;
      // Write each noise cell as a GRAIN×GRAIN block
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
      // Throttle to 20 FPS (50ms) — matches TVPage for consistency
      if (time - lastTime < 50) {
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
    return () => {
      cancelAnimationFrame(frameId);
      // Clean up offscreen canvas to prevent memory leak
      offscreen.width = 0;
      offscreen.height = 0;
    };
  }, [isActive]);

  if (!isActive) return null;
  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={180}
      style={{ imageRendering: "pixelated", transform: "translateZ(0)" }}
      className="absolute inset-0 w-full h-full object-cover z-[15] pointer-events-none opacity-50 mix-blend-screen will-change-transform transform-gpu"
      aria-hidden="true"
    />
  );
};

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
}

interface YTEvent {
  target: YTPlayer;
  data: number;
}

declare global {
  interface Window {
    YT: {
      Player: new (el: string, opts: Record<string, unknown>) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function Media() {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isApiReady, setIsApiReady] = useState(() => !!window.YT);
  const playerRef = useRef<YTPlayer | null>(null);

  // Load YouTube API if not already present
  useEffect(() => {
    if (isApiReady) return;

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true);
    };
  }, [isApiReady]);

  // Cleanup player on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore errors during destruction
        }
      }
    };
  }, []);

  return (
    <section
      id="midia"
      ref={ref}
      className="relative py-24 px-4 overflow-hidden z-1"
    >
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <h2 className="section-title text-pinball-neon-blue">
            {t("media.title")}
          </h2>
          <p className="font-body text-pinball-cream/70 mt-6 max-w-xl mx-auto">
            {t("media.description")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="relative w-full max-w-4xl flex items-center justify-center mt-2 group cursor-pointer"
          onClick={() => {
            if (!playerRef.current && isApiReady) {
              // Create player on first click to avoid auto-loading heavy iframe unnecessarily
              playerRef.current = new window.YT.Player("yt-player-container", {
                videoId: "atA3FOKr8C8",
                playerVars: {
                  autoplay: 1,
                  loop: 1,
                  playlist: "atA3FOKr8C8", // required for loop
                  controls: 0,
                  disablekb: 1,
                  fs: 0,
                  modestbranding: 1,
                  rel: 0,
                  showinfo: 0,
                  iv_load_policy: 3,
                },
                events: {
                  onReady: (event: YTEvent) => {
                    event.target.playVideo();
                    setIsPlaying(true);
                  },
                  onStateChange: (event: YTEvent) => {
                    if (event.data === window.YT.PlayerState.PLAYING) {
                      setIsPlaying(true);
                    } else if (
                      event.data === window.YT.PlayerState.PAUSED ||
                      event.data === window.YT.PlayerState.ENDED
                    ) {
                      setIsPlaying(false);
                    }
                  },
                },
              });
            } else if (playerRef.current) {
              // Toggle play/pause
              if (isPlaying) {
                playerRef.current.pauseVideo();
              } else {
                playerRef.current.playVideo();
              }
            }
          }}
        >
          <img
            src={
              isPlaying
                ? "/images/tv-frame-on.webp"
                : "/images/tv-frame-off.webp"
            }
            alt="TV Retro Frame"
            width={981}
            height={588}
            className="relative block w-full h-auto z-30 drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] pointer-events-none transition-none"
          />

          {/* The Video Area (Masked inside the TV) */}
          {/* Adjusted layout to move mask Right and Up, matching the TV's inner bevel */}
          <div className="absolute top-[9%] bottom-[18%] left-[7.5%] right-[23.0%] sm:right-[23.0%] rounded-[5%] sm:rounded-[30px] overflow-hidden bg-[#050510] z-0 flex items-center justify-center shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]">
            {/* Fake CRT scanning overlay inside video - Top Z-index so it overlays youtube frame */}
            <div className="absolute inset-0 pointer-events-none z-20 opacity-40 mix-blend-screen crt-scanline-overlay" />

            {/* TV Static Overlay (only when stopped/paused) */}
            <TVStaticBackground isActive={!isPlaying} />

            {/* Custom Play/Pause visual feedback that disappears when playing */}
            <div
              className={`absolute inset-0 z-40 flex items-center justify-center transition-opacity duration-500 pointer-events-none ${isPlaying ? "opacity-0" : "opacity-100"}`}
            >
              {/* Inner video glow based on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-pinball-red/20 to-pinball-neon-blue/20 group-hover:opacity-100 opacity-60 transition-opacity" />

              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-pinball-red/90 flex items-center justify-center backdrop-blur-md shadow-[0_0_20px_rgba(255,42,42,0.8)] z-50 group-hover:bg-pinball-yellow group-hover:shadow-[0_0_30px_rgba(255,200,42,0.8)] transition-all duration-300 scale-100 group-hover:scale-110">
                <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 text-white fill-current" />
              </div>
            </div>

            {/* YouTube Player Container - enlarged slightly to hide borders/watermarks and fit properly */}
            <div className="absolute inset-0 w-[135%] h-[135%] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <div id="yt-player-container" className="w-full h-full" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
