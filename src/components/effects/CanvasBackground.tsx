"use client";

import { useEffect, useRef, useState } from "react";

// ══════════════════════════════════════════
//  Background images per section (responsive: sm / lg)
// ══════════════════════════════════════════
type BgEntry = { sm: string; lg: string } | null;

const BG_MAP: Record<string, BgEntry> = {
  home: {
    sm: "/images/ambiente_04_bg-sm.webp",
    lg: "/images/ambiente_04_bg.webp",
  },
  sobre: { sm: "/images/ambiente_05-sm.webp", lg: "/images/ambiente_05.webp" },
  maquinas: {
    sm: "/images/ambiente_04_bg-sm.webp",
    lg: "/images/ambiente_04_bg.webp",
  },
  bar: {
    sm: "/images/ambiente_do_bar-sm.webp",
    lg: "/images/ambiente_do_bar.webp",
  },
  midia: { sm: "/images/ambiente_03-sm.webp", lg: "/images/ambiente_03.webp" },
  eventos: {
    sm: "/images/ambiente_02-sm.webp",
    lg: "/images/ambiente_02.webp",
  },
  ingressos: {
    sm: "/images/ambiente_01-sm.webp",
    lg: "/images/ambiente_01.webp",
  },
  contato: {
    sm: "/images/ambiente_04_bg-sm.webp",
    lg: "/images/ambiente_04_bg.webp",
  },
  footer: null,
};

const MOBILE_MQ = "(max-width: 767px)";

function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(MOBILE_MQ).matches
      : false,
  );
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_MQ);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return mobile;
}

// On-demand preloader — only fetches images as needed (current + adjacent sections)
const preloadedImages = new Set<string>();
function preloadImage(src: string | null) {
  if (!src || preloadedImages.has(src)) return;
  preloadedImages.add(src);
  const img = new Image();
  img.src = src;
}

// ══════════════════════════════════════════
//  ARCADE ALLEY – 3D Perspective Checkerboard (Classic B&W)
//  Fades in from vanishing point: dim far, bright near screen
// ══════════════════════════════════════════
function renderArcadeAlley(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) {
  ctx.clearRect(0, 0, w, h);

  const vanishX = w / 2;
  const vanishY = h * 0.53;

  const speed = 2;
  const scrollZ = (t * speed) % 1;
  const baseRowIndex = Math.floor(t * speed);

  // Draw cells — fade in: nearly invisible at vanishing point, bright near screen
  for (let j = 0; j < 15; j++) {
    const d0 = Math.pow((j + scrollZ) / 15, 2);
    const d1 = Math.pow((j + 1 + scrollZ) / 15, 2);

    const y0 = vanishY + d0 * (h - vanishY);
    const y1 = vanishY + d1 * (h - vanishY);

    if (y0 < vanishY) continue;

    // d0 ranges 0→1: 0 at vanishing point, 1 at screen edge
    // Alpha: starts near 0 at far end, ramps up to full near screen
    const alpha = d0 * d0 * 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;

    const rowIndex = j - baseRowIndex;

    for (let i = -30; i <= 30; i++) {
      if (Math.abs((i + rowIndex) % 2) === 0) continue;

      const xTL = vanishX + i * (w * 0.1) * d0;
      const xTR = vanishX + (i + 1) * (w * 0.1) * d0;
      const xBR = vanishX + (i + 1) * (w * 0.1) * d1;
      const xBL = vanishX + i * (w * 0.1) * d1;

      ctx.beginPath();
      ctx.moveTo(xTL, y0);
      ctx.lineTo(xTR, y0);
      ctx.lineTo(xBR, y1);
      ctx.lineTo(xBL, y1);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Perspective lines
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.beginPath();
  for (let i = -30; i <= 30; i++) {
    const xAtBottom = vanishX + i * (w * 0.1);
    ctx.moveTo(vanishX, vanishY);
    ctx.lineTo(xAtBottom, h);
  }
  ctx.stroke();

  // Horizontal floor lines — also fade in
  for (let j = 0; j < 15; j++) {
    const depth = Math.pow((j + scrollZ) / 15, 2);
    const y = vanishY + depth * (h - vanishY);
    if (y > vanishY) {
      const lineAlpha = depth * depth * 0.5;
      ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }
}

// ══════════════════════════════════════════
//  Crossfade Background Image Component
//  Renders two layers — outgoing fades out while incoming fades in
// ══════════════════════════════════════════
const FADE_DURATION = 800; // ms

function CrossfadeImage({ entry }: { entry: BgEntry }) {
  const [layers, setLayers] = useState<
    { entry: { sm: string; lg: string }; opacity: number; key: number }[]
  >([]);
  const keyCounterRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Use lg src as the identity key (dedup)
  const identityKey = entry?.lg ?? null;

  useEffect(() => {
    // On src change: add new layer at opacity 0, then animate
    if (!entry) {
      // Fade out all existing layers
      setLayers((prev) => prev.map((layer) => ({ ...layer, opacity: 0 })));
      // Remove after transition completes
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setLayers([]), FADE_DURATION + 50);
      return;
    }

    // Already showing this image? Skip
    const currentIdent = layers[layers.length - 1]?.entry.lg;
    if (currentIdent === entry.lg) return;

    const newKey = ++keyCounterRef.current;

    setLayers((prev) => {
      // Fade out previous layers, add new one at opacity 0
      const fading = prev.map((layer) => ({ ...layer, opacity: 0 }));
      return [...fading, { entry, opacity: 0, key: newKey }];
    });

    // After a brief paint cycle, fade in the new layer
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setLayers((prev) =>
          prev.map((layer) =>
            layer.key === newKey ? { ...layer, opacity: 1 } : layer,
          ),
        );
      });
    });

    // Clean up fully-faded layers after the transition
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setLayers((prev) => prev.filter((layer) => layer.opacity > 0));
    }, FADE_DURATION + 100);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identityKey]);

  return (
    <>
      {layers.map((layer) => (
        <picture key={layer.key}>
          <source media={MOBILE_MQ} srcSet={layer.entry.sm} type="image/webp" />
          <img
            src={layer.entry.lg}
            alt=""
            aria-hidden="true"
            className="fixed inset-0 w-full h-full object-cover pointer-events-none z-[20] will-change-transform transform-gpu"
            style={{
              opacity: layer.opacity,
              transition: `opacity ${FADE_DURATION}ms ease-in-out`,
              transform: 'translateZ(0)'
            }}
          />
        </picture>
      ))}
    </>
  );
}

export default function CanvasBackground({
  activeSection,
}: {
  activeSection: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const lastFrameRef = useRef(0);
  const isMobile = useIsMobile();

  const bgEntry = BG_MAP[activeSection] ?? null;

  // Pre-load current + adjacent section images on demand
  useEffect(() => {
    const variant = isMobile ? "sm" : "lg";
    const sections = Object.keys(BG_MAP);
    const idx = sections.indexOf(activeSection);
    // Preload current
    const cur = BG_MAP[activeSection];
    if (cur) preloadImage(cur[variant]);
    // Preload adjacent
    const prev = idx > 0 ? sections[idx - 1] : undefined;
    const next = idx < sections.length - 1 ? sections[idx + 1] : undefined;
    if (prev) {
      const e = BG_MAP[prev];
      if (e) preloadImage(e[variant]);
    }
    if (next) {
      const e = BG_MAP[next];
      if (e) preloadImage(e[variant]);
    }
  }, [activeSection, isMobile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Cache dimensions to avoid forced reflow on every frame
    let cachedW = window.innerWidth;
    let cachedH = window.innerHeight;

    const resize = () => {
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      // Skip height-only changes (mobile address bar show/hide)
      // This prevents expensive canvas re-dimensioning during normal scroll
      if (newW === cachedW && newH !== cachedH) {
        return;
      }
      cachedW = newW;
      cachedH = newH;
      // Cap DPR at 1.25 to drastically improve performance on Retina/4K screens
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = cachedW * dpr;
      canvas.height = cachedH * dpr;
      canvas.style.width = `${cachedW}px`;
      canvas.style.height = `${cachedH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    // Debounced resize to avoid forced-reflow storms
    let resizeTimer: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };
    window.addEventListener("resize", debouncedResize);

    const render = () => {
      if (document.hidden) {
        lastFrameRef.current = 0;
        animationRef.current = requestAnimationFrame(render);
        return;
      }
      const now = performance.now();
      // Throttle to roughly 30 FPS for the background to save CPU/GPU cycles
      if (lastFrameRef.current && now - lastFrameRef.current < 33) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      const delta = lastFrameRef.current
        ? Math.min((now - lastFrameRef.current) / 1000, 0.05)
        : 0.016;
      lastFrameRef.current = now;
      timeRef.current += delta;

      renderArcadeAlley(ctx, cachedW, cachedH, timeRef.current);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", debouncedResize);
    };
  }, []);

  // Layer order: image (z-20) → center shadow (z-25) → canvas (z-35) → content (z-50)
  return (
    <>
      {/* 1. Background image — crossfade between sections */}
      <CrossfadeImage entry={bgEntry} />

      {/* 2. Center shadow — darker center fading to transparent edges */}
      <div
        className="fixed inset-0 w-full h-full pointer-events-none z-[25]"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, rgba(8,3,5,0.15) 0%, rgba(8,3,5,0.65) 30%, rgba(8,3,5,0.8) 50%, rgba(8,3,5,0.65) 70%, rgba(8,3,5,0.15) 100%)",
        }}
      />

      {/* 3. Canvas animation — checkerboard pattern */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none mix-blend-screen transition-opacity duration-1000 ease-in-out z-[22] will-change-transform transform-gpu"
        aria-hidden="true"
        style={{ transform: 'translateZ(0)' }}
      />
    </>
  );
}
