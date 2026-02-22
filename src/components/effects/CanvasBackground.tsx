"use client";

import { useEffect, useRef, useState } from "react";

// ══════════════════════════════════════════
//  Background images per section
// ══════════════════════════════════════════
const BG_MAP: Record<string, string | null> = {
    home: '/images/background.webp',
    sobre: '/images/ambiente_05.webp',
    maquinas: '/images/ambiente_04.webp',
    bar: '/images/ambiente_do_bar.webp',
    midia: '/images/ambiente_03.webp',
    eventos: '/images/ambiente_02.webp',
    ingressos: '/images/ambiente_01.webp',
    contato: null,
    footer: null,
};

// Preload all background images so crossfade is instant
if (typeof window !== 'undefined') {
    Object.values(BG_MAP).forEach(src => {
        if (src) {
            const img = new Image();
            img.src = src;
        }
    });
}

// ══════════════════════════════════════════
//  ARCADE ALLEY – 3D Perspective Checkerboard (Classic B&W)
//  Fades in from vanishing point: dim far, bright near screen
// ══════════════════════════════════════════
function renderArcadeAlley(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
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

    // Perspective lines — also fade in from vanishing point
    ctx.lineWidth = 1;
    for (let i = -30; i <= 30; i++) {
        const xAtBottom = vanishX + i * (w * 0.1);
        // Use gradient stroke: dim at vanish, bright at bottom
        const grad = ctx.createLinearGradient(vanishX, vanishY, xAtBottom, h);
        grad.addColorStop(0, "rgba(255, 255, 255, 0)");
        grad.addColorStop(0.3, "rgba(255, 255, 255, 0.05)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0.25)");
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(vanishX, vanishY);
        ctx.lineTo(xAtBottom, h);
        ctx.stroke();
    }

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

function CrossfadeImage({ src }: { src: string | null }) {
    const [layers, setLayers] = useState<{ src: string; opacity: number; key: number }[]>([]);
    const keyCounterRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
        // On src change: add new layer at opacity 0, then animate
        if (!src) {
            // Fade out all existing layers
            setLayers(prev =>
                prev.map(layer => ({ ...layer, opacity: 0 }))
            );
            // Remove after transition completes
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setLayers([]), FADE_DURATION + 50);
            return;
        }

        // Already showing this image? Skip
        const currentSrc = layers[layers.length - 1]?.src;
        if (currentSrc === src) return;

        const newKey = ++keyCounterRef.current;

        setLayers(prev => {
            // Fade out previous layers, add new one at opacity 0
            const fading = prev.map(layer => ({ ...layer, opacity: 0 }));
            return [...fading, { src, opacity: 0, key: newKey }];
        });

        // After a brief paint cycle, fade in the new layer
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setLayers(prev =>
                    prev.map(layer =>
                        layer.key === newKey ? { ...layer, opacity: 1 } : layer
                    )
                );
            });
        });

        // Clean up fully-faded layers after the transition
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setLayers(prev => prev.filter(layer => layer.opacity > 0));
        }, FADE_DURATION + 100);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src]);

    return (
        <>
            {layers.map(layer => (
                <img
                    key={layer.key}
                    src={layer.src}
                    alt=""
                    aria-hidden="true"
                    className="fixed inset-0 w-full h-full object-cover pointer-events-none z-[20]"
                    style={{
                        opacity: layer.opacity,
                        transition: `opacity ${FADE_DURATION}ms ease-in-out`,
                    }}
                />
            ))}
        </>
    );
}

export default function CanvasBackground({ activeSection }: { activeSection: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const timeRef = useRef(0);
    const lastFrameRef = useRef(0);

    const bgSrc = BG_MAP[activeSection] ?? null;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        resize();
        window.addEventListener("resize", resize);

        const render = () => {
            if (document.hidden) {
                lastFrameRef.current = 0;
                animationRef.current = requestAnimationFrame(render);
                return;
            }
            const now = performance.now();
            const delta = lastFrameRef.current ? Math.min((now - lastFrameRef.current) / 1000, 0.05) : 0.016;
            lastFrameRef.current = now;
            timeRef.current += delta;
            const w = window.innerWidth, h = window.innerHeight;

            renderArcadeAlley(ctx, w, h, timeRef.current);

            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener("resize", resize);
        };
    }, []);

    // Layer order: image (z-20) → dark shadow (z-25) → canvas (z-35) → vignette (z-39) → content (z-50)
    return (
        <>
            {/* 1. Background image — crossfade between sections */}
            <CrossfadeImage src={bgSrc} />

            {/* 2. Feathered shadow — dark center strip between image and canvas */}
            <div
                className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-6xl pointer-events-none bg-feathered-shadow z-[25]"
                aria-hidden="true"
            />

            {/* 3. Canvas animation — checkerboard pattern */}
            <canvas
                ref={canvasRef}
                className="fixed inset-0 w-full h-full pointer-events-none mix-blend-screen transition-opacity duration-1000 ease-in-out z-[35]"
                aria-hidden="true"
            />

            {/* 4. Radial vignette — darkens screen edges */}
            <div
                className="fixed inset-0 w-full h-full pointer-events-none bg-radial-vignette z-[39]"
                aria-hidden="true"
            />
        </>
    );
}
