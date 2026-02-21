import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'motion/react'
import { Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const TVStaticBackground = ({ isActive }: { isActive: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (!isActive) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let frameId: number;
        let lastTime = 0;

        const draw = (time: number) => {
            // throttle to ~30fps for retro feel and performance
            if (time - lastTime < 33) {
                frameId = requestAnimationFrame(draw);
                return;
            }
            lastTime = time;

            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            // Follow original pattern for dense, small pixels
            for (let i = 0; i < 4000; i++) {
                const x = Math.random() * w;
                const y = Math.random() * h;
                const size = Math.random() * 4 + 1;
                ctx.fillRect(x, y, size, size);
            }
            frameId = requestAnimationFrame(draw);
        };
        frameId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(frameId);
    }, [isActive]);

    if (!isActive) return null;
    return <canvas ref={canvasRef} width={1280} height={720} className="absolute inset-0 w-full h-full object-cover z-[15] pointer-events-none opacity-50 mix-blend-screen" aria-hidden="true" />;
};

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

export default function Media() {
    const { t } = useTranslation()
    const ref = useRef<HTMLElement>(null)
    const inView = useInView(ref, { once: true, margin: '-100px' })
    const [isPlaying, setIsPlaying] = useState(false);
    const [isApiReady, setIsApiReady] = useState(false);
    const playerRef = useRef<any>(null);

    // Initialize YouTube API
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            if (firstScriptTag && firstScriptTag.parentNode) {
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            } else {
                document.head.appendChild(tag);
            }

            window.onYouTubeIframeAPIReady = () => {
                setIsApiReady(true);
            };
        } else {
            setIsApiReady(true);
        }
    }, []);

    // Cleanup player on unmount
    useEffect(() => {
        return () => {
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) {
                    // ignore errors during destruction
                }
            }
        };
    }, []);

    return (
        <section id="midia" ref={ref} className="relative py-24 px-4 overflow-hidden z-1">
            <div className="max-w-6xl mx-auto flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="section-title text-pinball-neon-blue">{t('media.title')}</h2>
                    <p className="font-body text-pinball-cream/70 mt-6 max-w-xl mx-auto">
                        {t('media.description')}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.2, duration: 0.7 }}
                    className="relative w-full max-w-4xl aspect-[4/3] sm:aspect-[16/10] flex items-center justify-center mt-8 group cursor-pointer"
                    onClick={() => {
                        if (!playerRef.current && isApiReady) {
                            // Create player on first click to avoid auto-loading heavy iframe unnecessarily
                            playerRef.current = new window.YT.Player('yt-player-container', {
                                videoId: 'MnEW0hY-T3U',
                                playerVars: {
                                    autoplay: 1,
                                    loop: 1,
                                    playlist: 'MnEW0hY-T3U', // required for loop
                                    controls: 0,
                                    disablekb: 1,
                                    fs: 0,
                                    modestbranding: 1,
                                    rel: 0,
                                    showinfo: 0,
                                    iv_load_policy: 3
                                },
                                events: {
                                    onReady: (event: any) => {
                                        event.target.playVideo();
                                        setIsPlaying(true);
                                    },
                                    onStateChange: (event: any) => {
                                        if (event.data === window.YT.PlayerState.PLAYING) {
                                            setIsPlaying(true);
                                        } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
                                            setIsPlaying(false);
                                        }
                                    }
                                }
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
                    {/* The TV Frame Image */}
                    <img
                        src={isPlaying ? "/images/tv-frame-on.avif" : "/images/tv-frame-off.avif"}
                        alt="TV Retro Frame"
                        className="absolute inset-0 w-full h-full object-contain z-30 drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] pointer-events-none transition-none"
                    />

                    {/* The Video Area (Masked inside the TV) */}
                    {/* Adjusted layout to move mask Right and Up, matching the TV's inner bevel */}
                    <div className="absolute top-[5%] sm:top-[9%] left-[11%] sm:left-[7.5%] right-[23.5%] sm:right-[24.5%] bottom-[16%] sm:bottom-[18%] rounded-[10%] sm:rounded-[30px] overflow-hidden bg-[#050510] z-0 flex items-center justify-center shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]">

                        {/* Fake CRT scanning overlay inside video - Top Z-index so it overlays youtube frame */}
                        <div
                            className="absolute inset-0 pointer-events-none z-20 opacity-40 mix-blend-screen crt-scanline-overlay"
                        />

                        {/* TV Static Overlay (only when stopped/paused) */}
                        <TVStaticBackground isActive={!isPlaying} />

                        {/* Custom Play/Pause visual feedback that disappears when playing */}
                        <div className={`absolute inset-0 z-40 flex items-center justify-center transition-opacity duration-500 pointer-events-none ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
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
    )
}
