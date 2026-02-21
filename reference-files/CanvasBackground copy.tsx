"use client";

import { useEffect, useRef, useCallback } from "react";

const PIXEL = 16;

// ── Scene list (cycles on logo click) ──
const SCENES = [
    "standard",
    "platformer",
    "spaceship",
    "racing",
    "sports",
    "fps",
] as const;

// ── Persistent soccer match state ──
const soccerState = {
    inited: false,
    ball: { x: 0, y: 0, vx: 0, vy: 0 },
    scoreA: 0,
    scoreB: 0,
    resetTimer: 0,
    kickCD: 0,
    players: [] as { x: number; y: number; team: number; role: number }[],
};

// ── Persistent racing state ──
interface RacingOpponent {
    z: number; // 0 = at player, 1 = at horizon; decreases as player overtakes
    lane: number; // -1 left, 0 center, 1 right (float for smooth transitions)
    laneTarget: number;
    speed: number; // relative to player (< 1 = slower = being overtaken)
    color: string;
    bodyColor: string;
    laneTimer: number;
}
const racingState = {
    inited: false,
    playerLane: 0,
    playerLaneTarget: 0,
    playerLaneTimer: 0,
    steerSmooth: 0,
    opponents: [] as RacingOpponent[],
    curveOffset: 0,
    curveTarget: 0,
    curveTimer: 0,
    speedPulse: 0,
};
type Scene = (typeof SCENES)[number];

// ══════════════════════════════════════════
//  STANDARD – Fire / phosphor particles
// ══════════════════════════════════════════
function renderStandard(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: number,
    grid: Float32Array,
    shapeGrid: Uint8Array,
    cols: number,
    rows: number,
    mouse: { x: number; y: number },
) {
    ctx.clearRect(0, 0, w, h);

    // Mouse force
    if (mouse.x >= 0) {
        const gx = Math.floor(mouse.x / PIXEL);
        const gy = Math.floor(mouse.y / PIXEL);
        const r = 4;
        for (let i = -r; i <= r; i++) {
            for (let j = -r; j <= r; j++) {
                const nx = gx + i,
                    ny = gy + j;
                if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
                const dist = Math.sqrt(i * i + j * j);
                if (dist > r) continue;
                const idx = ny * cols + nx;
                grid[idx] = Math.min(
                    grid[idx] + Math.max(0, 1 - dist / (r + 1)) * 0.6,
                    1,
                );
            }
        }
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const idx = row * cols + col;
            grid[idx] *= 0.97;
            const w1 =
                Math.sin(col * 0.15 + time * 0.5) * Math.sin(row * 0.1 + time * 0.3);
            const w2 =
                Math.cos(col * 0.08 - time * 0.4) * Math.cos(row * 0.12 + time * 0.6);
            const ambient =
                (w1 + w2 + Math.sin((col + row) * 0.05 + time * 0.2)) * 0.02;
            if (ambient > 0) grid[idx] = Math.min(grid[idx] + ambient * 0.3, 1);
            if (Math.random() > 0.997)
                grid[idx] = Math.min(grid[idx] + 0.3 + Math.random() * 0.4, 1);
        }
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const idx = row * cols + col;
            const val = grid[idx];
            if (val < 0.01) continue;
            const x = col * PIXEL,
                y = row * PIXEL;
            if (val > 0.4) {
                const hue = ((time * 30 + (col + row) * 0.5) % 40) - 10;
                ctx.fillStyle = `hsla(${hue},90%,${40 + val * 20}%,${val * 0.45})`;
            } else if (val > 0.15) {
                ctx.fillStyle = `rgba(${Math.floor(120 + (val / 0.4) * 100)},${Math.floor(val * 30)},0,${val * 0.6})`;
            } else {
                ctx.fillStyle = `rgba(${Math.floor(80 + val * 200)},0,5,${val})`;
            }
            drawTileShape(ctx, x, y, PIXEL, shapeGrid[idx]);
        }
    }

    const scanY = (time * 80) % h;
    ctx.fillStyle = "rgba(220,38,38,0.03)";
    ctx.fillRect(0, scanY, w, 2);
}

function drawTileShape(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    shape: number,
) {
    const half = size / 2,
        cx = x + half,
        cy = y + half,
        s = half - 1;
    ctx.beginPath();
    switch (shape) {
        case 0:
            ctx.rect(x + 1, y + 1, size - 2, size - 2);
            break;
        case 1:
            ctx.moveTo(cx, cy - s);
            ctx.lineTo(cx + s, cy);
            ctx.lineTo(cx, cy + s);
            ctx.lineTo(cx - s, cy);
            ctx.closePath();
            break;
        case 2: {
            const t = s * 0.35;
            ctx.moveTo(cx - t, cy - s);
            ctx.lineTo(cx + t, cy - s);
            ctx.lineTo(cx + t, cy - t);
            ctx.lineTo(cx + s, cy - t);
            ctx.lineTo(cx + s, cy + t);
            ctx.lineTo(cx + t, cy + t);
            ctx.lineTo(cx + t, cy + s);
            ctx.lineTo(cx - t, cy + s);
            ctx.lineTo(cx - t, cy + t);
            ctx.lineTo(cx - s, cy + t);
            ctx.lineTo(cx - s, cy - t);
            ctx.lineTo(cx - t, cy - t);
            ctx.closePath();
            break;
        }
        case 3:
            ctx.arc(cx, cy, s * 0.6, 0, Math.PI * 2);
            break;
    }
    ctx.fill();
}

// ══════════════════════════════════════════
//  PLATFORMER – DKC3-style jungle
// ══════════════════════════════════════════
function renderPlatformer(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
) {
    // All sizes relative to viewport
    const scrollSpeed = 50;
    const scrollT = t * scrollSpeed;

    // ── DEEP JUNGLE SKY ──
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#061206");
    sky.addColorStop(0.3, "#0a1e0a");
    sky.addColorStop(0.6, "#0e280e");
    sky.addColorStop(1, "#081808");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // ── DAPPLED LIGHT (sun breaking through canopy) ──
    for (let i = 0; i < 18; i++) {
        const cycle = w * 2;
        const lx =
            ((((i * w * 0.13 + w * 0.05 + scrollT * 0.04) % cycle) + cycle) % cycle) -
            w * 0.25;
        const ly = h * 0.1 + ((i * 71) % (h * 0.65));
        const lr = w * 0.04 + (i % 4) * w * 0.02;
        const pulse = Math.sin(t * 0.5 + i * 1.1) * 0.015 + 0.035;
        const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
        grad.addColorStop(0, `rgba(100,150,50,${pulse})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
    }

    // ── Simple hash for stable per-element variation ──
    const pHash = (n: number) => ((n * 2654435761) >>> 0) / 4294967296;

    // ── FAR TREE LAYER (parallax ×0.08, seamless) ──
    const farSpacing = w * 0.12;
    const farScroll = scrollT * 0.08;
    const farStart = Math.floor(farScroll / farSpacing) - 1;
    const farVisible = Math.ceil(w / farSpacing) + 3;
    for (let slot = farStart; slot < farStart + farVisible; slot++) {
        const tx = slot * farSpacing - farScroll + farSpacing * 0.5;
        const h0 = pHash(slot * 137);
        const h1 = pHash(slot * 251);
        const trunkW = w * 0.025 + Math.floor(h0 * 3) * w * 0.01;
        ctx.fillStyle = "#120c04";
        ctx.fillRect(tx, 0, trunkW, h);
        ctx.fillStyle = "#0e0a03";
        for (let by = 0; by < h; by += h * 0.03) {
            ctx.fillRect(tx + 2, by, trunkW - 4, 1);
        }
        ctx.fillStyle = "#0a200a";
        const canR = w * 0.06 + Math.floor(h0 * 3) * w * 0.025;
        ctx.beginPath();
        ctx.arc(
            tx + trunkW / 2,
            h * 0.08 + Math.floor(h1 * 2) * h * 0.04,
            canR,
            0,
            Math.PI * 2,
        );
        ctx.fill();
    }

    // ── MID TREE LAYER (parallax ×0.2, seamless) ──
    const midSpacing = w * 0.16;
    const midScroll = scrollT * 0.2;
    const midStart = Math.floor(midScroll / midSpacing) - 1;
    const midVisible = Math.ceil(w / midSpacing) + 3;
    for (let slot = midStart; slot < midStart + midVisible; slot++) {
        const tx = slot * midSpacing - midScroll + midSpacing * 0.3;
        const h0 = pHash(slot * 173);
        const h1 = pHash(slot * 311);
        const trunkW = w * 0.045 + Math.floor(h0 * 3) * w * 0.015;
        ctx.fillStyle = "#2a1c0e";
        ctx.fillRect(tx, 0, trunkW, h);
        ctx.fillStyle = "#22160a";
        for (let by = 0; by < h; by += h * 0.02) {
            ctx.fillRect(tx + 3, by, trunkW * 0.7, 2);
        }
        ctx.fillStyle = "#332010";
        for (let by = h * 0.02; by < h; by += h * 0.035) {
            ctx.fillRect(tx + trunkW * 0.3, by, trunkW * 0.5, 1);
        }
        const groundY0 = h * 0.72;
        ctx.fillStyle = "#2a1c0e";
        ctx.fillRect(tx - w * 0.015, groundY0 - h * 0.02, w * 0.02, h * 0.04);
        ctx.fillRect(
            tx + trunkW - w * 0.005,
            groundY0 - h * 0.015,
            w * 0.02,
            h * 0.035,
        );
        ctx.fillStyle = "#143a14";
        const fR = w * 0.07 + Math.floor(h0 * 3) * w * 0.02;
        ctx.beginPath();
        ctx.arc(
            tx + trunkW / 2,
            h * 0.05 + Math.floor(h1 * 2) * h * 0.06,
            fR,
            0,
            Math.PI * 2,
        );
        ctx.fill();
        ctx.fillStyle = "#1a4a1a";
        ctx.beginPath();
        ctx.arc(
            tx + trunkW / 2 - fR * 0.3,
            h * 0.1 + Math.floor(h1 * 2) * h * 0.04,
            fR * 0.7,
            0,
            Math.PI * 2,
        );
        ctx.fill();
    }

    // ── STONE PILLARS (DKC ruins, parallax ×0.35, seamless) ──
    const pillarSpacing = w * 0.35;
    const pillarScroll = scrollT * 0.35;
    const pillarStart = Math.floor(pillarScroll / pillarSpacing) - 1;
    const pillarVisible = Math.ceil(w / pillarSpacing) + 3;
    for (let slot = pillarStart; slot < pillarStart + pillarVisible; slot++) {
        const px = slot * pillarSpacing - pillarScroll + pillarSpacing * 0.5;
        const pW = w * 0.04;
        const pH = h * 0.35;
        const pY = h * 0.42;
        ctx.fillStyle = "#4a5a6a";
        ctx.fillRect(px, pY, pW, pH);
        ctx.fillStyle = "#3e4e5e";
        for (let sy = pY; sy < pY + pH; sy += h * 0.02) {
            ctx.fillRect(px + 3, sy, pW - 6, 2);
        }
        ctx.fillStyle = "#566878";
        ctx.fillRect(px + 2, pY, pW - 4, 4);
        ctx.fillStyle = "#5a6a7a";
        ctx.fillRect(px - pW * 0.2, pY - h * 0.012, pW * 1.4, h * 0.015);
        ctx.fillRect(px - pW * 0.1, pY + h * 0.005, pW * 1.2, h * 0.008);
        ctx.fillRect(px - pW * 0.2, pY + pH - h * 0.005, pW * 1.4, h * 0.015);
        ctx.fillStyle = "#2a5a2a";
        ctx.fillRect(px, pY, pW * 0.35, h * 0.015);
        ctx.fillRect(px + pW * 0.6, pY + h * 0.03, pW * 0.3, h * 0.01);
        ctx.fillStyle = "#3a6a3a";
        ctx.fillRect(px + 3, pY + 2, pW * 0.2, h * 0.008);
    }

    // ── GROUND ──
    const groundY = Math.floor(h * 0.72);

    const groundGrad = ctx.createLinearGradient(0, groundY, 0, h);
    groundGrad.addColorStop(0, "#2a4420");
    groundGrad.addColorStop(0.06, "#1e3518");
    groundGrad.addColorStop(0.15, "#1a2810");
    groundGrad.addColorStop(0.35, "#14200c");
    groundGrad.addColorStop(1, "#0a0e06");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, w, h - groundY);

    const groundScroll = scrollT * 0.5;
    ctx.globalAlpha = 0.15;
    for (let y = groundY + 3; y < h; y += h * 0.012) {
        const depth = (y - groundY) / (h - groundY);
        const lineOff = (groundScroll * (0.3 + depth * 0.4)) % w;
        ctx.strokeStyle = depth < 0.15 ? "#3a5a2a" : "#1a1408";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-lineOff % 60, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (let x = 0; x < w; x += w * 0.008) {
        const sway = Math.sin(x * 0.15 + t * 1.2) * h * 0.003;
        const grassH = h * 0.008 + Math.sin(x * 0.1 + t * 0.5) * h * 0.004;
        ctx.fillStyle = Math.floor(x * 0.05) % 2 === 0 ? "#2a5a20" : "#306828";
        ctx.fillRect(x, groundY - grassH + sway, w * 0.009, grassH + 2);
    }

    // ── NEAR FOLIAGE (parallax ×0.5, seamless) ──
    const nearSpacing = w * 0.08;
    const nearScroll = scrollT * 0.5;
    const nearStart = Math.floor(nearScroll / nearSpacing) - 1;
    const nearVisible = Math.ceil(w / nearSpacing) + 4;

    for (let slot = nearStart; slot < nearStart + nearVisible; slot++) {
        const sx = slot * nearSpacing - nearScroll;
        const seed = Math.floor(pHash(slot * 71 + 3) * 6);

        // ── FERNS ──
        if (seed === 0 || seed === 4) {
            const fernY = groundY;
            const fernScale = w * 0.004;
            for (let f = 0; f < 7; f++) {
                const fAngle = -0.7 + f * 0.22;
                const fLen = fernScale * (8 + (f % 3) * 5);
                const fx = sx + nearSpacing * 0.5 + Math.cos(fAngle) * fLen;
                const fy = fernY - Math.abs(Math.sin(fAngle)) * fLen;
                ctx.fillStyle = f % 2 === 0 ? "#2a6a2a" : "#358a35";
                ctx.beginPath();
                ctx.moveTo(sx + nearSpacing * 0.5, fernY);
                ctx.lineTo(fx - fernScale * 2, fy);
                ctx.lineTo(fx + fernScale * 2, fy - fernScale * 3);
                ctx.lineTo(sx + nearSpacing * 0.5 + fernScale, fernY - fernScale);
                ctx.closePath();
                ctx.fill();
            }
        }

        // ── BUSHES ──
        if (seed === 1 || seed === 5) {
            const bushY = groundY;
            const bR = w * 0.025;
            ctx.fillStyle = "#1e5018";
            ctx.beginPath();
            ctx.arc(sx + nearSpacing * 0.5, bushY - bR * 0.6, bR, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#2a6a24";
            ctx.beginPath();
            ctx.arc(
                sx + nearSpacing * 0.5 - bR * 0.5,
                bushY - bR * 0.4,
                bR * 0.75,
                0,
                Math.PI * 2,
            );
            ctx.fill();
            ctx.fillStyle = "#347a2e";
            ctx.beginPath();
            ctx.arc(
                sx + nearSpacing * 0.5 + bR * 0.6,
                bushY - bR * 0.8,
                bR * 0.8,
                0,
                Math.PI * 2,
            );
            ctx.fill();
        }

        // ── BARREL ──
        if (seed === 2) {
            const bW = w * 0.03;
            const bH = h * 0.05;
            const bx = sx + nearSpacing * 0.4;
            const by = groundY - bH;
            ctx.fillStyle = "#5a3a1a";
            ctx.fillRect(bx, by, bW, bH);
            ctx.fillStyle = "#3a2a10";
            ctx.fillRect(bx, by + bH * 0.1, bW, bH * 0.12);
            ctx.fillRect(bx, by + bH * 0.78, bW, bH * 0.12);
            ctx.fillStyle = "#7a5a2a";
            ctx.fillRect(bx + bW * 0.15, by + bH * 0.3, bW * 0.7, bH * 0.4);
        }

        // ── MUSHROOMS ──
        if (seed === 3) {
            const mR = w * 0.015;
            const mCenterX = sx + nearSpacing * 0.5;
            const mCapY = groundY - mR * 2.0;
            ctx.fillStyle = "#c8b890";
            ctx.fillRect(mCenterX - mR * 0.3, mCapY, mR * 0.6, groundY - mCapY);
            ctx.fillStyle = "#8a3020";
            ctx.beginPath();
            ctx.arc(mCenterX, mCapY, mR, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = "#e8d8a0";
            ctx.fillRect(mCenterX - mR * 0.5, mCapY - mR * 0.5, mR * 0.3, mR * 0.3);
            ctx.fillRect(mCenterX + mR * 0.2, mCapY - mR * 0.7, mR * 0.3, mR * 0.3);
        }
    }

    // ── HANGING VINES (parallax ×0.25, seamless) ──
    const vineSpacing = w * 0.1;
    const vineScroll = scrollT * 0.25;
    const vineStart = Math.floor(vineScroll / vineSpacing) - 1;
    const vineVisible = Math.ceil(w / vineSpacing) + 3;
    for (let slot = vineStart; slot < vineStart + vineVisible; slot++) {
        const vx = slot * vineSpacing - vineScroll + vineSpacing * 0.5;
        const vh0 = pHash(slot * 197);
        const vh1 = pHash(slot * 313);
        const vineLen = h * 0.2 + Math.floor(vh0 * 4) * h * 0.12;
        const sway = Math.sin(t * 1.0 + vh1 * 20) * w * 0.008;
        ctx.strokeStyle = Math.floor(vh0 * 2) === 0 ? "#1a4a1a" : "#2a5a2a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(vx, 0);
        ctx.quadraticCurveTo(vx + sway, vineLen * 0.5, vx + sway * 0.5, vineLen);
        ctx.stroke();
        ctx.fillStyle = "#2a6a2a";
        ctx.beginPath();
        ctx.ellipse(
            vx + sway * 0.5,
            vineLen,
            w * 0.006,
            h * 0.02,
            0.3,
            0,
            Math.PI * 2,
        );
        ctx.fill();
    }

    // ── UPPER CANOPY (dense, fills top 25%, seamless) ──
    // Layer 1 – big dark blobs
    const can1Spacing = w * 0.1;
    const can1Scroll = scrollT * 0.12;
    const can1Start = Math.floor(can1Scroll / can1Spacing) - 2;
    const can1Visible = Math.ceil(w / can1Spacing) + 5;
    for (let slot = can1Start; slot < can1Start + can1Visible; slot++) {
        const cx = slot * can1Spacing - can1Scroll;
        const ch0 = pHash(slot * 131);
        const ch1 = pHash(slot * 257);
        const cy = -h * 0.02 + Math.floor(ch0 * 4) * h * 0.03;
        const cw = w * 0.12 + Math.floor(ch1 * 3) * w * 0.04;
        const ch = h * 0.1 + Math.floor(ch1 * 3) * h * 0.04;
        ctx.fillStyle = "#0a200a";
        ctx.beginPath();
        ctx.ellipse(cx + cw / 2, cy + ch / 2, cw / 2, ch / 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    // Layer 2 – lighter clusters
    const can2Spacing = w * 0.1;
    const can2Scroll = scrollT * 0.132;
    const can2Start = Math.floor(can2Scroll / can2Spacing) - 2;
    const can2Visible = Math.ceil(w / can2Spacing) + 5;
    for (let slot = can2Start; slot < can2Start + can2Visible; slot++) {
        const cx = slot * can2Spacing - can2Scroll;
        const ch0 = pHash(slot * 179);
        const cy = h * 0.01 + Math.floor(ch0 * 3) * h * 0.035;
        const cr = w * 0.05 + Math.floor(ch0 * 3) * w * 0.02;
        ctx.fillStyle = "#144014";
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
    }
    // Leaf fringe at canopy bottom edge (static, no scroll needed)
    for (let x = 0; x < w; x += w * 0.012) {
        const leafY =
            h * 0.12 +
            Math.sin(x * 0.06 + t * 0.3) * h * 0.02 +
            Math.sin(x * 0.12) * h * 0.012;
        ctx.fillStyle = x % (w * 0.024) < w * 0.012 ? "#1a4a1a" : "#145014";
        ctx.beginPath();
        ctx.moveTo(x, leafY - h * 0.025);
        ctx.lineTo(x + w * 0.006, leafY + h * 0.015);
        ctx.lineTo(x + w * 0.012, leafY - h * 0.02);
        ctx.closePath();
        ctx.fill();
    }

    // ── FIREFLIES ──
    for (let f = 0; f < 20; f++) {
        const fx = (f * 131 + t * 10 + Math.sin(t * 1.5 + f * 3) * w * 0.04) % w;
        const fy =
            h * 0.12 + ((f * 97) % (h * 0.55)) + Math.cos(t * 2 + f * 2) * h * 0.02;
        const glow = Math.sin(t * 3 + f * 1.7) * 0.3 + 0.5;
        const glowR = w * 0.01;
        const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, glowR);
        grad.addColorStop(0, `rgba(180,220,80,${glow * 0.4})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(fx - glowR, fy - glowR, glowR * 2, glowR * 2);
        ctx.fillStyle = `rgba(220,255,120,${glow})`;
        ctx.fillRect(fx - 1, fy - 1, 3, 3);
    }

    // ── ATMOSPHERIC FOG ──
    const fogGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
    fogGrad.addColorStop(0, "rgba(15,30,15,0)");
    fogGrad.addColorStop(1, "rgba(10,20,10,0.35)");
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);
}

// ══════════════════════════════════════════
//  SPACESHIP – Vertical space shooter
// ══════════════════════════════════════════
function renderSpaceship(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
) {
    // ── DEEP SPACE GRADIENT ──
    const sky = ctx.createLinearGradient(0, 0, w * 0.5, h);
    sky.addColorStop(0, "#020208");
    sky.addColorStop(0.4, "#06061a");
    sky.addColorStop(0.7, "#0a0520");
    sky.addColorStop(1, "#030310");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const sHash = (n: number) => ((n * 2654435761) >>> 0) / 4294967296;

    // ── MULTI-LAYER STAR FIELD ──
    for (let layer = 0; layer < 4; layer++) {
        const speed = (layer + 1) * 20;
        const count = 50 + layer * 25;
        const maxSize = layer + 1;
        for (let i = 0; i < count; i++) {
            const sx = sHash(i * 173 + layer * 5003) * w;
            const sy =
                ((sHash(i * 311 + layer * 7919) * h + t * speed) % (h + 10)) - 5;
            const sz = Math.max(
                1,
                Math.floor(sHash(i * 431 + layer * 137) * maxSize) + 1,
            );
            const twinkle =
                Math.sin(t * (2 + layer) + i * 0.7) * 0.2 + 0.4 + layer * 0.12;
            const hue =
                sHash(i * 97 + layer * 11) > 0.7
                    ? `rgba(180,200,255,${twinkle})`
                    : sHash(i * 97 + layer * 11) > 0.4
                        ? `rgba(255,220,180,${twinkle})`
                        : `rgba(200,210,255,${twinkle})`;
            ctx.fillStyle = hue;
            if (sz >= 3) {
                ctx.beginPath();
                ctx.arc(sx, sy, sz * 0.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(sx, sy, sz, sz);
            }
        }
    }

    // ── DISTANT NEBULAE (colorful, animated) ──
    for (let i = 0; i < 5; i++) {
        const nx = sHash(i * 777) * w;
        const ny = ((sHash(i * 999) * h * 1.5 + t * 5) % (h + 400)) - 200;
        const nr = w * 0.12 + sHash(i * 333) * w * 0.08;
        const r = Math.floor(40 + sHash(i * 123) * 60);
        const g = Math.floor(10 + sHash(i * 456) * 30);
        const b = Math.floor(80 + sHash(i * 789) * 80);
        const pulse = Math.sin(t * 0.5 + i * 2) * 0.015 + 0.04;
        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        grad.addColorStop(0, `rgba(${r},${g},${b},${pulse * 1.5})`);
        grad.addColorStop(
            0.5,
            `rgba(${r * 0.6},${g * 0.5},${b * 0.7},${pulse * 0.6})`,
        );
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(nx - nr, ny - nr, nr * 2, nr * 2);
    }

    // ── DISTANT PLANET ──
    const planetX = w * 0.82;
    const planetY = h * 0.18;
    const planetR = w * 0.06;
    const planetGrad = ctx.createRadialGradient(
        planetX - planetR * 0.3,
        planetY - planetR * 0.3,
        planetR * 0.1,
        planetX,
        planetY,
        planetR,
    );
    planetGrad.addColorStop(0, "rgba(60,90,140,0.5)");
    planetGrad.addColorStop(0.6, "rgba(30,50,100,0.3)");
    planetGrad.addColorStop(1, "rgba(10,15,40,0)");
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
    ctx.fill();
    // Planet ring
    ctx.save();
    ctx.translate(planetX, planetY);
    ctx.scale(1, 0.3);
    ctx.strokeStyle = "rgba(100,140,200,0.15)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, planetR * 1.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // ── AUTONOMOUS PLAYER SHIP ──
    const shipX =
        w * 0.5 + Math.sin(t * 0.7) * w * 0.15 + Math.sin(t * 1.3) * w * 0.08;
    const shipY =
        h * 0.72 + Math.sin(t * 0.5) * h * 0.04 + Math.cos(t * 1.1) * h * 0.02;
    const shipTilt = Math.cos(t * 0.7) * 0.15;

    // Engine trail
    for (let p = 0; p < 12; p++) {
        const trailX =
            shipX -
            Math.sin(t * 0.7 - p * 0.08) * w * 0.15 -
            Math.sin(t * 1.3 - p * 0.08) * w * 0.08;
        const trailY = shipY + p * 4 + Math.sin(t * 10 + p) * 2;
        const alpha = (1 - p / 12) * 0.3;
        ctx.fillStyle = `rgba(80,160,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(trailX, trailY, 3 - p * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw player ship
    ctx.save();
    ctx.translate(shipX, shipY);
    ctx.rotate(shipTilt);
    // Ship body
    ctx.fillStyle = "#4488cc";
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(-10, 10);
    ctx.lineTo(-4, 6);
    ctx.lineTo(0, 8);
    ctx.lineTo(4, 6);
    ctx.lineTo(10, 10);
    ctx.closePath();
    ctx.fill();
    // Cockpit
    ctx.fillStyle = "#88ccff";
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();
    // Engine glow
    const flameH = 6 + Math.sin(t * 20) * 3;
    ctx.fillStyle = "#4488ff";
    ctx.fillRect(-4, 8, 8, flameH);
    ctx.fillStyle = "#88ccff";
    ctx.fillRect(-2, 8, 4, flameH * 0.7);
    ctx.restore();

    // ── PLAYER LASERS (auto-fire) ──
    const fireRate = 0.15;
    for (let b = 0; b < 8; b++) {
        const fireTime = t - b * fireRate;
        if (fireTime < 0) continue;
        const laserAge = (t - fireTime) % 2.0;
        if (laserAge > 0.8) continue;
        const lx =
            w * 0.5 +
            Math.sin(fireTime * 0.7) * w * 0.15 +
            Math.sin(fireTime * 1.3) * w * 0.08;
        const ly = shipY - 14 - laserAge * h * 1.2;
        if (ly < -20) continue;
        // Laser beam
        ctx.fillStyle = "rgba(80,200,255,0.9)";
        ctx.fillRect(lx - 1, ly, 2, 12);
        // Laser glow
        const glow = ctx.createRadialGradient(lx, ly + 6, 0, lx, ly + 6, 8);
        glow.addColorStop(0, "rgba(80,200,255,0.3)");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(lx - 8, ly - 2, 16, 16);
    }

    // ── ENEMY SHIPS (autonomous formations, varied patterns) ──
    for (let e = 0; e < 10; e++) {
        const formation = e % 3;
        let ex: number, ey: number;
        const ePhase = sHash(e * 431) * Math.PI * 2;

        if (formation === 0) {
            // Zigzag descent
            ex =
                w * 0.2 +
                sHash(e * 173) * w * 0.6 +
                Math.sin(t * 1.5 + ePhase) * w * 0.1;
            ey = ((t * 45 + sHash(e * 311) * h * 3) % (h * 1.2)) - h * 0.15;
        } else if (formation === 1) {
            // Circle patrol
            const circleR = w * 0.15 + sHash(e * 199) * w * 0.1;
            const circleSpeed = 0.5 + sHash(e * 277) * 0.5;
            ex =
                w * (0.3 + sHash(e * 137) * 0.4) +
                Math.cos(t * circleSpeed + ePhase) * circleR;
            ey =
                h * 0.15 +
                sHash(e * 353) * h * 0.35 +
                Math.sin(t * circleSpeed + ePhase) * circleR * 0.4;
        } else {
            // Sweep across
            ex = ((t * 60 + sHash(e * 509) * w * 4) % (w * 1.4)) - w * 0.2;
            ey =
                h * 0.1 +
                sHash(e * 613) * h * 0.4 +
                Math.sin(t * 2 + ePhase) * h * 0.05;
        }

        // Enemy ship body (retro pixel style)
        ctx.fillStyle = "#cc3333";
        ctx.beginPath();
        ctx.moveTo(ex, ey + 10);
        ctx.lineTo(ex - 8, ey - 6);
        ctx.lineTo(ex - 12, ey - 2);
        ctx.lineTo(ex - 4, ey + 2);
        ctx.lineTo(ex + 4, ey + 2);
        ctx.lineTo(ex + 12, ey - 2);
        ctx.lineTo(ex + 8, ey - 6);
        ctx.closePath();
        ctx.fill();
        // Enemy cockpit
        ctx.fillStyle = "#ff6644";
        ctx.fillRect(ex - 3, ey - 2, 6, 6);
        // Enemy engine glow
        ctx.fillStyle = "#ff4422";
        ctx.fillRect(ex - 3, ey - 8, 2, 4 + Math.sin(t * 15 + e) * 2);
        ctx.fillRect(ex + 1, ey - 8, 2, 4 + Math.cos(t * 15 + e) * 2);

        // Enemy return fire (some enemies shoot)
        if (e % 3 === 0) {
            const shootInterval = 1.5;
            const shootPhase = (t + sHash(e * 719) * shootInterval) % shootInterval;
            if (shootPhase < 0.5) {
                const bulletY = ey + 10 + shootPhase * h * 0.8;
                ctx.fillStyle = "rgba(255,80,40,0.8)";
                ctx.fillRect(ex - 1, bulletY, 2, 8);
                const bGlow = ctx.createRadialGradient(
                    ex,
                    bulletY + 4,
                    0,
                    ex,
                    bulletY + 4,
                    6,
                );
                bGlow.addColorStop(0, "rgba(255,100,40,0.3)");
                bGlow.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = bGlow;
                ctx.fillRect(ex - 6, bulletY - 2, 12, 12);
            }
        }
    }

    // ── EXPLOSION PARTICLES (timed, cycling) ──
    for (let x = 0; x < 6; x++) {
        const explCycle = 3.0 + sHash(x * 337) * 2.0;
        const explAge = (t + sHash(x * 503) * explCycle) % explCycle;
        if (explAge > 0.8) continue;
        const explX = sHash(x * 631 + Math.floor(t / explCycle) * 73) * w;
        const explY = sHash(x * 787 + Math.floor(t / explCycle) * 131) * h * 0.65;
        const progress = explAge / 0.8;

        for (let p = 0; p < 10; p++) {
            const angle = sHash(p * 97 + x * 41) * Math.PI * 2;
            const dist = progress * (w * 0.03 + sHash(p * 53 + x * 67) * w * 0.02);
            const px = explX + Math.cos(angle) * dist;
            const py = explY + Math.sin(angle) * dist;
            const alpha = (1 - progress) * 0.8;
            const size = (1 - progress * 0.5) * 4;
            const r = Math.floor(255 - progress * 100);
            const g = Math.floor(200 * (1 - progress));
            const b = Math.floor(50 * (1 - progress));
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
        // Explosion flash
        if (progress < 0.2) {
            const flashR = w * 0.02 * (1 - progress / 0.2);
            const flash = ctx.createRadialGradient(
                explX,
                explY,
                0,
                explX,
                explY,
                flashR,
            );
            flash.addColorStop(0, `rgba(255,255,200,${0.6 * (1 - progress / 0.2)})`);
            flash.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = flash;
            ctx.fillRect(explX - flashR, explY - flashR, flashR * 2, flashR * 2);
        }
    }

    // ── ASTEROID FIELD (drifting, rotating) ──
    for (let a = 0; a < 7; a++) {
        const ax =
            ((sHash(a * 211) * w * 3 + t * (15 + sHash(a * 137) * 10)) % (w + 60)) -
            30;
        const ay =
            ((sHash(a * 349) * h * 3 + t * (8 + sHash(a * 193) * 6)) % (h + 60)) - 30;
        const as = 8 + sHash(a * 571) * 16;
        const rot = t * (0.3 + sHash(a * 431) * 0.8) + a;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(rot);
        // Irregular asteroid shape
        ctx.fillStyle = `rgb(${50 + Math.floor(sHash(a * 67) * 30)},${40 + Math.floor(sHash(a * 89) * 20)},${35 + Math.floor(sHash(a * 101) * 15)})`;
        ctx.beginPath();
        for (let v = 0; v < 7; v++) {
            const vAngle = (v / 7) * Math.PI * 2;
            const vr = as * (0.7 + sHash(a * 41 + v * 31) * 0.3);
            const vx = Math.cos(vAngle) * vr;
            const vy = Math.sin(vAngle) * vr;
            if (v === 0) ctx.moveTo(vx, vy);
            else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.fill();
        // Crater detail
        ctx.fillStyle = `rgba(0,0,0,0.3)`;
        ctx.beginPath();
        ctx.arc(as * 0.2, -as * 0.1, as * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ── ATMOSPHERIC SCAN LINES (subtle CRT effect) ──
    ctx.globalAlpha = 0.03;
    for (let y = 0; y < h; y += 3) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, y, w, 1);
    }
    ctx.globalAlpha = 1;
}

// ══════════════════════════════════════════
//  RACING – Top Gear-style night city (Fully Autonomous)
// ══════════════════════════════════════════
function renderRacing(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
) {
    const dt = 0.016;
    const horizonY = h * 0.42;
    const RS = racingState;

    // ── INIT ──
    if (!RS.inited) {
        const carColors = [
            { color: "#3388ff", bodyColor: "#2266cc" },
            { color: "#ff8833", bodyColor: "#cc6622" },
            { color: "#33cc55", bodyColor: "#229944" },
            { color: "#cc33cc", bodyColor: "#aa22aa" },
            { color: "#ffcc22", bodyColor: "#ccaa11" },
            { color: "#22cccc", bodyColor: "#119999" },
            { color: "#ff5555", bodyColor: "#cc3333" },
            { color: "#8866ff", bodyColor: "#6644cc" },
        ];
        RS.opponents = [];
        for (let i = 0; i < 8; i++) {
            RS.opponents.push({
                z: 0.15 + (i / 8) * 0.8,
                lane: (i % 3) - 1,
                laneTarget: (i % 3) - 1,
                speed: 0.6 + Math.random() * 0.35,
                laneTimer: 2 + Math.random() * 5,
                ...carColors[i],
            });
        }
        RS.playerLane = 0;
        RS.playerLaneTarget = 0;
        RS.playerLaneTimer = 2;
        RS.curveOffset = 0;
        RS.curveTarget = 0;
        RS.curveTimer = 3;
        RS.speedPulse = 0;
        RS.inited = true;
    }

    // ── UPDATE LOGIC ──
    // Player autonomous lane switching
    RS.playerLaneTimer -= dt;
    if (RS.playerLaneTimer <= 0) {
        const lanes = [-1, 0, 1];
        const available = lanes.filter((l) => l !== RS.playerLaneTarget);
        RS.playerLaneTarget =
            available[Math.floor(Math.random() * available.length)];
        RS.playerLaneTimer = 2 + Math.random() * 3;
    }
    RS.playerLane += (RS.playerLaneTarget - RS.playerLane) * 3 * dt;

    // Road curve dynamics
    RS.curveTimer -= dt;
    if (RS.curveTimer <= 0) {
        RS.curveTarget = (Math.random() - 0.5) * 80;
        RS.curveTimer = 3 + Math.random() * 4;
    }
    RS.curveOffset += (RS.curveTarget - RS.curveOffset) * 1.5 * dt;

    // Speed variation
    RS.speedPulse = Math.sin(t * 0.6) * 0.15 + 1;

    // Update opponents
    for (const opp of RS.opponents) {
        // Move opponent toward player (z decreases = getting closer)
        opp.z -= (1 - opp.speed) * RS.speedPulse * dt * 0.35;

        // Lane change AI
        opp.laneTimer -= dt;
        if (opp.laneTimer <= 0) {
            const lanes = [-1, 0, 1];
            const available = lanes.filter((l) => l !== opp.laneTarget);
            opp.laneTarget = available[Math.floor(Math.random() * available.length)];
            opp.laneTimer = 2.5 + Math.random() * 4;
        }
        opp.lane += (opp.laneTarget - opp.lane) * 2.5 * dt;

        // Respawn when behind the player or too far
        if (opp.z <= -0.05 || opp.z > 1.2) {
            opp.z = 0.95 + Math.random() * 0.15;
            opp.speed = 0.55 + Math.random() * 0.4;
            opp.laneTarget = Math.floor(Math.random() * 3) - 1;
            opp.lane = opp.laneTarget;
        }
    }

    // ── NIGHT SKY ──
    const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
    sky.addColorStop(0, "#010210");
    sky.addColorStop(0.3, "#030618");
    sky.addColorStop(0.6, "#060c28");
    sky.addColorStop(1, "#0c1638");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, horizonY);

    // ── MOON ──
    const moonX = w * 0.82;
    const moonY = horizonY * 0.22;
    const moonR = Math.min(w, h) * 0.035;
    const moonHalo = ctx.createRadialGradient(
        moonX,
        moonY,
        moonR * 0.5,
        moonX,
        moonY,
        moonR * 5,
    );
    moonHalo.addColorStop(0, "rgba(180,200,255,0.08)");
    moonHalo.addColorStop(0.4, "rgba(120,140,200,0.03)");
    moonHalo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = moonHalo;
    ctx.fillRect(moonX - moonR * 5, moonY - moonR * 5, moonR * 10, moonR * 10);
    const moonGrad = ctx.createRadialGradient(
        moonX - moonR * 0.25,
        moonY - moonR * 0.2,
        moonR * 0.1,
        moonX,
        moonY,
        moonR,
    );
    moonGrad.addColorStop(0, "rgba(240,245,255,0.95)");
    moonGrad.addColorStop(0.7, "rgba(200,210,240,0.85)");
    moonGrad.addColorStop(1, "rgba(160,175,210,0.7)");
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(140,155,190,0.3)";
    ctx.beginPath();
    ctx.arc(
        moonX + moonR * 0.2,
        moonY - moonR * 0.15,
        moonR * 0.18,
        0,
        Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
        moonX - moonR * 0.3,
        moonY + moonR * 0.25,
        moonR * 0.12,
        0,
        Math.PI * 2,
    );
    ctx.fill();

    // Stars
    for (let i = 0; i < 80; i++) {
        const sx = (i * 173 + 31) % w;
        const sy = (i * 97 + 11) % (horizonY * 0.75);
        const twinkle = Math.sin(t * 2.5 + i * 1.3) * 0.25 + 0.55;
        const sz = i % 7 === 0 ? 2 : 1;
        ctx.fillStyle = `rgba(255,255,255,${twinkle})`;
        ctx.fillRect(sx, sy, sz, sz);
    }

    // Shooting stars
    for (let s = 0; s < 3; s++) {
        const cycle = 5 + s * 3.7;
        const age = (t + s * 17.3) % cycle;
        if (age < 0.6) {
            const progress = age / 0.6;
            const ssX = ((s * 347 + 50) % (w * 0.7)) + w * 0.1;
            const ssY = (s * 191 + 20) % (horizonY * 0.4);
            const dx = w * 0.15;
            const dy = horizonY * 0.12;
            const headX = ssX + dx * progress;
            const headY = ssY + dy * progress;
            const tailLen = 30 + progress * 20;
            const alpha = progress < 0.2 ? progress / 0.2 : (1 - progress) * 1.25;
            const grad = ctx.createLinearGradient(
                headX,
                headY,
                headX - tailLen * 0.7,
                headY - tailLen * 0.35,
            );
            grad.addColorStop(0, `rgba(255,255,255,${alpha * 0.9})`);
            grad.addColorStop(1, "rgba(180,200,255,0)");
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(headX, headY);
            ctx.lineTo(headX - tailLen * 0.7, headY - tailLen * 0.35);
            ctx.stroke();
        }
    }

    // ── CITY SKYLINE ──
    const cityScroll = t * 12;
    const farBuildings = [
        { x: 0, w: 60, h: 110 },
        { x: 65, w: 45, h: 80 },
        { x: 115, w: 70, h: 140 },
        { x: 190, w: 50, h: 95 },
        { x: 245, w: 80, h: 125 },
        { x: 330, w: 55, h: 70 },
        { x: 390, w: 65, h: 155 },
        { x: 460, w: 45, h: 85 },
        { x: 510, w: 75, h: 120 },
        { x: 590, w: 55, h: 100 },
        { x: 650, w: 60, h: 130 },
        { x: 715, w: 50, h: 75 },
        { x: 770, w: 70, h: 145 },
        { x: 845, w: 45, h: 90 },
        { x: 895, w: 65, h: 110 },
        { x: 965, w: 55, h: 80 },
        { x: 1025, w: 60, h: 135 },
    ];
    const farCycle = Math.max(1100, w + 200);
    const farBuildingsExpanded: typeof farBuildings = [];
    for (let copy = 0; copy * 1100 < farCycle + 1100; copy++) {
        for (const b of farBuildings)
            farBuildingsExpanded.push({ x: b.x + copy * 1100, w: b.w, h: b.h });
    }
    for (const b of farBuildingsExpanded) {
        const bx =
            ((((b.x - cityScroll * 0.3) % farCycle) + farCycle) % farCycle) - 40;
        if (bx < -b.w || bx > w + 40) continue;
        const by = horizonY - b.h * 0.55;
        const bh = b.h * 0.55;
        ctx.fillStyle = "#0a0e20";
        ctx.fillRect(bx, by, b.w * 0.9, bh);
        for (let wy = by + 6; wy < by + bh - 4; wy += 8) {
            for (let wx = bx + 4; wx < bx + b.w * 0.9 - 4; wx += 10) {
                if ((wx * 7 + wy * 3) % 11 > 5) {
                    ctx.fillStyle = `rgba(200,180,60,${0.15 + Math.sin(t + wx * 0.1 + wy * 0.2) * 0.05})`;
                    ctx.fillRect(wx, wy, 4, 3);
                }
            }
        }
    }

    // Near buildings with neon signs
    const nearBuildings = [
        { x: 0, w: 50, h: 90 },
        { x: 55, w: 70, h: 130 },
        { x: 130, w: 40, h: 75 },
        { x: 175, w: 65, h: 160 },
        { x: 245, w: 55, h: 100 },
        { x: 305, w: 50, h: 85 },
        { x: 360, w: 75, h: 145 },
        { x: 440, w: 45, h: 65 },
        { x: 490, w: 60, h: 120 },
        { x: 555, w: 50, h: 95 },
        { x: 610, w: 70, h: 150 },
        { x: 685, w: 55, h: 80 },
        { x: 745, w: 65, h: 110 },
        { x: 815, w: 45, h: 135 },
        { x: 865, w: 60, h: 70 },
        { x: 930, w: 75, h: 140 },
        { x: 1010, w: 50, h: 90 },
    ];
    const nearCycle = Math.max(1080, w + 200);
    const nearBuildingsExpanded: typeof nearBuildings = [];
    for (let copy = 0; copy * 1080 < nearCycle + 1080; copy++) {
        for (const b of nearBuildings)
            nearBuildingsExpanded.push({ x: b.x + copy * 1080, w: b.w, h: b.h });
    }
    const neonColors = [
        "255,50,120",
        "0,220,255",
        "80,255,80",
        "255,180,0",
        "180,80,255",
    ];
    let nbIdx = 0;
    for (const b of nearBuildingsExpanded) {
        const bx =
            ((((b.x - cityScroll * 0.6) % nearCycle) + nearCycle) % nearCycle) - 40;
        if (bx < -b.w || bx > w + 40) {
            nbIdx++;
            continue;
        }
        const bh = b.h * 0.7;
        const by = horizonY - bh;
        ctx.fillStyle = "#0f1428";
        ctx.fillRect(bx, by, b.w, bh);
        ctx.fillStyle = "#141a35";
        ctx.fillRect(bx, by, b.w, 3);
        for (let wy = by + 6; wy < horizonY - 5; wy += 9) {
            for (let wx = bx + 5; wx < bx + b.w - 5; wx += 11) {
                const lit = (wx * 13 + wy * 7) % 10 > 3;
                if (lit) {
                    const flicker = Math.sin(t * 0.8 + wx * 0.3 + wy * 0.5) * 0.1;
                    const hue =
                        (wx + wy) % 3 === 0
                            ? "255,200,60"
                            : (wx + wy) % 3 === 1
                                ? "255,180,40"
                                : "220,200,80";
                    ctx.fillStyle = `rgba(${hue},${0.55 + flicker})`;
                    ctx.fillRect(wx, wy, 5, 4);
                }
            }
        }
        if (nbIdx % 3 === 0 && b.w > 45) {
            const nc = neonColors[nbIdx % neonColors.length];
            const np = Math.sin(t * 3 + nbIdx * 2.1) * 0.2 + 0.7;
            const nf = Math.sin(t * 17 + nbIdx * 5) > 0.85 ? 0.3 : 0;
            const na = np + nf;
            const sw = b.w * 0.6,
                sH = 6;
            const sx = bx + (b.w - sw) / 2,
                sy = by + bh * 0.25;
            const ng = ctx.createRadialGradient(
                sx + sw / 2,
                sy + sH / 2,
                2,
                sx + sw / 2,
                sy + sH / 2,
                sw * 0.7,
            );
            ng.addColorStop(0, `rgba(${nc},${na * 0.25})`);
            ng.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = ng;
            ctx.fillRect(sx - sw * 0.3, sy - sw * 0.4, sw * 1.6, sw * 1.2);
            ctx.fillStyle = `rgba(${nc},${na})`;
            ctx.fillRect(sx, sy, sw, sH);
            ctx.fillStyle = `rgba(${nc},${na * 0.6})`;
            ctx.fillRect(sx + sw * 0.15, sy + sH + 3, sw * 0.7, 3);
        }
        nbIdx++;
    }

    // ── ATMOSPHERIC HORIZON HAZE ──
    const hazeGrad = ctx.createLinearGradient(0, horizonY - 30, 0, horizonY + 25);
    hazeGrad.addColorStop(0, "rgba(20,15,50,0)");
    hazeGrad.addColorStop(0.4, "rgba(30,25,60,0.4)");
    hazeGrad.addColorStop(0.7, "rgba(25,20,55,0.6)");
    hazeGrad.addColorStop(1, "rgba(15,12,35,0.3)");
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, horizonY - 30, w, 55);
    const cgp = Math.sin(t * 0.3) * 0.03 + 0.07;
    const cg = ctx.createRadialGradient(
        w * 0.5,
        horizonY,
        w * 0.05,
        w * 0.5,
        horizonY,
        w * 0.5,
    );
    cg.addColorStop(0, `rgba(255,200,80,${cgp})`);
    cg.addColorStop(0.5, `rgba(200,120,60,${cgp * 0.4})`);
    cg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = cg;
    ctx.fillRect(0, horizonY - 40, w, 80);

    // ── ROAD WITH PERSPECTIVE & DYNAMIC CURVES ──
    const roadW = w * 0.08;
    const roadWBottom = w * 0.85;
    const baseCenterX = w / 2 + RS.curveOffset;
    const speed = t * 220;

    // Helper: get road center at given progress (0=horizon, 1=bottom)
    const getCenterX = (progress: number) => {
        return (
            baseCenterX + Math.sin(progress * Math.PI * 0.5) * RS.curveOffset * 0.3
        );
    };

    for (let y = horizonY; y < h; y += 2) {
        const progress = (y - horizonY) / (h - horizonY);
        const eased = progress * progress;
        const rw = roadW + (roadWBottom - roadW) * eased;
        const centerX = getCenterX(progress);
        const rx = centerX - rw / 2;

        const groundStripe = (y + Math.floor(speed)) % 36 < 18;
        ctx.fillStyle = groundStripe ? "#0a2a18" : "#082414";
        ctx.fillRect(0, y, w, 2);

        const roadStripe = (y + Math.floor(speed)) % 28 < 14;
        ctx.fillStyle = roadStripe ? "#222230" : "#1a1a28";
        ctx.fillRect(rx, y, rw, 2);

        // Wet road reflections
        if (eased > 0.1) {
            const reflBand = (y + Math.floor(speed * 0.7)) % 60;
            if (reflBand < 6) {
                const reflAlpha = (1 - reflBand / 6) * eased * 0.12;
                ctx.fillStyle = `rgba(160,180,255,${reflAlpha})`;
                ctx.fillRect(rx, y, rw, 2);
            }
        }

        // Curb stripes
        const curbW = 4 + eased * 10;
        const curbPat = (y + Math.floor(speed)) % 16 < 8;
        ctx.fillStyle = curbPat ? "#cc2020" : "#e8e8e8";
        ctx.fillRect(rx - curbW, y, curbW, 2);
        ctx.fillRect(rx + rw, y, curbW, 2);

        // Lane dividers
        for (let lane = 1; lane < 3; lane++) {
            const laneX = rx + (rw * lane) / 3;
            if ((y + Math.floor(speed)) % 32 < 16) {
                const lineW = Math.max(1, eased * 3);
                ctx.fillStyle = `rgba(255,255,255,${0.3 + eased * 0.4})`;
                ctx.fillRect(laneX - lineW / 2, y, lineW, 2);
            }
        }

        // Center yellow line
        if ((y + Math.floor(speed)) % 40 < 20) {
            const cLineW = Math.max(1, eased * 3);
            ctx.fillStyle = `rgba(255,210,50,${0.3 + eased * 0.35})`;
            ctx.fillRect(centerX - cLineW / 2, y, cLineW, 2);
        }
    }

    // ── STREET LAMPS ──
    for (let i = 0; i < 6; i++) {
        const lampP = (t * 0.45 + i * 0.18) % 1;
        const lampY = horizonY + lampP * (h - horizonY);
        const eased = lampP * lampP;
        if (eased < 0.03) continue;
        const rw = roadW + (roadWBottom - roadW) * eased;
        const cx = getCenterX(lampP);
        const lx1 = cx - rw / 2 - 8 - eased * 22;
        const lx2 = cx + rw / 2 + 8 + eased * 22;
        const poleH = eased * 28,
            poleW = Math.max(1, eased * 3),
            bulbR = Math.max(1, eased * 3);
        for (const lx of [lx1, lx2]) {
            ctx.fillStyle = "#555";
            ctx.fillRect(lx, lampY - poleH, poleW, poleH);
            const armDir = lx < cx ? 1 : -1;
            ctx.fillRect(
                lx,
                lampY - poleH,
                armDir * eased * 10,
                Math.max(1, eased * 2),
            );
            ctx.fillStyle = "#ffdd88";
            ctx.beginPath();
            ctx.arc(lx + armDir * eased * 10, lampY - poleH, bulbR, 0, Math.PI * 2);
            ctx.fill();
            const poolR = eased * 50;
            const poolX = lx + armDir * eased * 15;
            const pool = ctx.createRadialGradient(
                poolX,
                lampY,
                0,
                poolX,
                lampY,
                poolR,
            );
            pool.addColorStop(0, `rgba(255,220,120,${eased * 0.12})`);
            pool.addColorStop(0.5, `rgba(255,200,80,${eased * 0.05})`);
            pool.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = pool;
            ctx.fillRect(poolX - poolR, lampY - poolR * 0.5, poolR * 2, poolR);
        }
    }

    // ── ROADSIDE POSTS ──
    for (let i = 0; i < 8; i++) {
        const objP = (t * 0.6 + i * 0.14) % 1;
        const objY = horizonY + objP * (h - horizonY);
        const eased = objP * objP;
        if (eased < 0.04) continue;
        const rw = roadW + (roadWBottom - roadW) * eased;
        const cx = getCenterX(objP);
        const postH = eased * 18,
            postW = Math.max(1, eased * 4);
        const px1 = cx - rw / 2 - 4 - eased * 16;
        const px2 = cx + rw / 2 + 4 + eased * 16;
        ctx.fillStyle = "#888";
        ctx.fillRect(px1, objY - postH, postW, postH);
        ctx.fillRect(px2, objY - postH, postW, postH);
        ctx.fillStyle = "#ff3030";
        ctx.fillRect(px1, objY - postH, postW, Math.max(1, eased * 3));
        ctx.fillRect(px2, objY - postH, postW, Math.max(1, eased * 3));
    }

    // ── SPEED LINES ──
    for (let sl = 0; sl < 12; sl++) {
        const slP = (t * 1.8 + sl * 0.09) % 1;
        const slY = horizonY + slP * (h - horizonY);
        const eased = slP * slP;
        if (eased < 0.15) continue;
        const rw = roadW + (roadWBottom - roadW) * eased;
        const cx = getCenterX(slP);
        const slLen = eased * 25;
        ctx.fillStyle = `rgba(255,255,255,${eased * 0.25})`;
        ctx.fillRect(cx - rw / 2 + 3, slY, 1, slLen);
        ctx.fillRect(cx + rw / 2 - 4, slY, 1, slLen);
    }

    // ── OPPONENT CARS (sorted back to front) ──
    const sortedOpps = [...RS.opponents].sort((a, b) => b.z - a.z);
    for (const opp of sortedOpps) {
        if (opp.z < 0 || opp.z > 1) continue;
        const progress = opp.z; // z maps to visual progress (1=horizon, 0=player)
        const screenProgress = 1 - progress; // 0=horizon, 1=bottom
        const eased = screenProgress * screenProgress;
        const objY = horizonY + screenProgress * (h - horizonY);
        const rw = roadW + (roadWBottom - roadW) * eased;
        const cx = getCenterX(screenProgress);
        const scale = Math.max(0.1, eased * 1.3);
        const laneOffset = opp.lane * (rw / 3) * 0.35;
        const carX = cx + laneOffset;

        if (scale < 0.05) continue;
        ctx.globalAlpha = Math.min(1, scale * 4);

        // Car body (colored)
        const s = scale;
        ctx.fillStyle = opp.color;
        ctx.fillRect(carX - 12 * s, objY - 8 * s, 24 * s, 20 * s);
        ctx.fillStyle = opp.bodyColor;
        ctx.fillRect(carX - 8 * s, objY - 14 * s, 16 * s, 8 * s);
        ctx.fillStyle = "#333";
        ctx.fillRect(carX - 14 * s, objY + 8 * s, 8 * s, 6 * s);
        ctx.fillRect(carX + 6 * s, objY + 8 * s, 8 * s, 6 * s);
        ctx.fillStyle = "#aaddff";
        ctx.fillRect(carX - 6 * s, objY - 12 * s, 12 * s, 5 * s);

        // Tail lights
        ctx.fillStyle = "#ff2020";
        ctx.fillRect(carX - 10 * s, objY + 10 * s, 4 * s, 3 * s);
        ctx.fillRect(carX + 6 * s, objY + 10 * s, 4 * s, 3 * s);
        // Tail light glow
        if (scale > 0.2) {
            const tg = ctx.createRadialGradient(
                carX,
                objY + 12 * s,
                0,
                carX,
                objY + 12 * s,
                18 * s,
            );
            tg.addColorStop(0, `rgba(255,30,20,${scale * 0.15})`);
            tg.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = tg;
            ctx.fillRect(carX - 20 * s, objY + 2 * s, 40 * s, 24 * s);
        }
        ctx.globalAlpha = 1;
    }

    // ── PLAYER CAR (autonomous) ──
    const playerY = h * 0.83;
    const playerCX = getCenterX(0.92);
    const playerRW = roadW + (roadWBottom - roadW) * 0.85;
    const playerLaneOff = RS.playerLane * (playerRW / 3) * 0.35;
    const playerX = playerCX + playerLaneOff;

    // Headlight road glow
    const hlReach = (h - horizonY) * 0.4;
    const hlPoolY = playerY - hlReach * 0.5;
    const hlPoolRX = 55;
    const hlPoolRY = hlReach * 0.4;
    const hlPool = ctx.createRadialGradient(
        playerX,
        hlPoolY,
        5,
        playerX,
        hlPoolY,
        Math.max(hlPoolRX, hlPoolRY),
    );
    hlPool.addColorStop(0, "rgba(255,240,180,0.14)");
    hlPool.addColorStop(0.4, "rgba(255,235,170,0.07)");
    hlPool.addColorStop(0.7, "rgba(255,230,160,0.03)");
    hlPool.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.translate(playerX, hlPoolY);
    ctx.scale(1, hlPoolRY / hlPoolRX);
    ctx.fillStyle = hlPool;
    ctx.beginPath();
    ctx.arc(0, 0, hlPoolRX, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Headlight bright spots
    ctx.fillStyle = "rgba(255,250,200,0.6)";
    ctx.fillRect(playerX - 10, playerY - 16, 4, 2);
    ctx.fillRect(playerX + 6, playerY - 16, 4, 2);
    // Subtle light streak
    const strG = ctx.createLinearGradient(
        playerX,
        playerY - 14,
        playerX,
        hlPoolY,
    );
    strG.addColorStop(0, "rgba(255,240,180,0.1)");
    strG.addColorStop(0.5, "rgba(255,240,180,0.04)");
    strG.addColorStop(1, "rgba(255,240,180,0)");
    ctx.fillStyle = strG;
    ctx.fillRect(playerX - 12, hlPoolY, 24, playerY - 14 - hlPoolY);

    // Draw player car (bigger, red)
    drawCar(ctx, playerX, playerY, 1.4);

    ctx.globalAlpha = 1;
}

/** Home positions for soccer players – single source of truth */
function getSoccerHomes(w: number, h: number, M: number) {
    const homesA = [
        [M + 30, h * 0.5],
        [w * 0.18, h * 0.2],
        [w * 0.18, h * 0.4],
        [w * 0.18, h * 0.6],
        [w * 0.18, h * 0.8],
        [w * 0.35, h * 0.25],
        [w * 0.35, h * 0.5],
        [w * 0.35, h * 0.75],
        [w * 0.46, h * 0.2],
        [w * 0.46, h * 0.5],
        [w * 0.46, h * 0.8],
    ];
    const homesB = [
        [w - M - 30, h * 0.5],
        [w * 0.82, h * 0.2],
        [w * 0.82, h * 0.4],
        [w * 0.82, h * 0.6],
        [w * 0.82, h * 0.8],
        [w * 0.65, h * 0.25],
        [w * 0.65, h * 0.5],
        [w * 0.65, h * 0.75],
        [w * 0.54, h * 0.2],
        [w * 0.54, h * 0.5],
        [w * 0.54, h * 0.8],
    ];
    return { homesA, homesB };
}

// ══════════════════════════════════════════
//  SPORTS – Soccer/football field top-down
// ══════════════════════════════════════════
function renderSports(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _t: number,
) {
    const M = 40; // field margin
    const dt = 1 / 60;
    const goalW = 80,
        goalH = h * 0.3;
    const B = soccerState.ball;

    // ── INIT ──
    if (!soccerState.inited) {
        B.x = w / 2;
        B.y = h / 2;
        B.vx = 80;
        B.vy = 30;
        const { homesA, homesB } = getSoccerHomes(w, h, M);
        soccerState.players = [];
        for (let i = 0; i < 11; i++)
            soccerState.players.push({
                x: homesA[i][0],
                y: homesA[i][1],
                team: 0,
                role: i,
            });
        for (let i = 0; i < 11; i++)
            soccerState.players.push({
                x: homesB[i][0],
                y: homesB[i][1],
                team: 1,
                role: i,
            });
        soccerState.inited = true;
    }

    // ── DRAW FIELD ──
    ctx.fillStyle = "#1a5a1a";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 === 0 ? "#1a5a1a" : "#1d6a1d";
        ctx.fillRect(0, (i * h) / 10, w, h / 10);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(M, M, w - M * 2, h - M * 2);
    ctx.beginPath();
    ctx.moveTo(w / 2, M);
    ctx.lineTo(w / 2, h - M);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, h * 0.15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeRect(M, h / 2 - goalH / 2, goalW, goalH);
    ctx.strokeRect(w - M - goalW, h / 2 - goalH / 2, goalW, goalH);
    ctx.beginPath();
    ctx.arc(M + goalW, h / 2, goalH * 0.35, -0.5, 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w - M - goalW, h / 2, goalH * 0.35, Math.PI - 0.5, Math.PI + 0.5);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(M, h / 2 - goalH / 2, goalW, goalH);
    ctx.fillRect(w - M - goalW, h / 2 - goalH / 2, goalW, goalH);

    // ── BALL PHYSICS ──
    if (soccerState.resetTimer > 0) {
        soccerState.resetTimer -= dt;
        if (soccerState.resetTimer <= 0) {
            B.x = w / 2;
            B.y = h / 2;
            B.vx = (Math.random() > 0.5 ? 1 : -1) * (60 + Math.random() * 40);
            B.vy = (Math.random() - 0.5) * 60;
            // Reset players to home
            const { homesA, homesB } = getSoccerHomes(w, h, M);
            for (let i = 0; i < 22; i++) {
                const home = i < 11 ? homesA[i] : homesB[i - 11];
                soccerState.players[i].x = home[0];
                soccerState.players[i].y = home[1];
            }
        }
    }
    if (soccerState.kickCD > 0) soccerState.kickCD -= dt;

    B.x += B.vx * dt;
    B.y += B.vy * dt;
    B.vx *= 0.995;
    B.vy *= 0.995;
    if (Math.abs(B.vx) < 2) B.vx = 0;
    if (Math.abs(B.vy) < 2) B.vy = 0;

    // Wall bounces
    if (B.y < M + 5) {
        B.y = M + 5;
        B.vy = Math.abs(B.vy) * 0.7;
    }
    if (B.y > h - M - 5) {
        B.y = h - M - 5;
        B.vy = -Math.abs(B.vy) * 0.7;
    }
    const inGoalY = B.y > h / 2 - goalH / 2 && B.y < h / 2 + goalH / 2;
    if (B.x < M + 5 && inGoalY) {
        soccerState.scoreB++;
        soccerState.resetTimer = 1.2;
        B.vx = 0;
        B.vy = 0;
    } else if (B.x > w - M - 5 && inGoalY) {
        soccerState.scoreA++;
        soccerState.resetTimer = 1.2;
        B.vx = 0;
        B.vy = 0;
    }
    if (B.x < M + 5) {
        B.x = M + 5;
        B.vx = Math.abs(B.vx) * 0.7;
    }
    if (B.x > w - M - 5) {
        B.x = w - M - 5;
        B.vx = -Math.abs(B.vx) * 0.7;
    }

    // ── PLAYER AI & MOVEMENT ──
    const { homesA, homesB } = getSoccerHomes(w, h, M);

    // Find closest outfield player per team
    let runA = -1,
        runAD = Infinity,
        runB = -1,
        runBD = Infinity;
    for (let i = 0; i < 22; i++) {
        const p = soccerState.players[i];
        if (p.role === 0) continue; // skip GK
        const d = Math.hypot(p.x - B.x, p.y - B.y);
        if (p.team === 0 && d < runAD) {
            runA = i;
            runAD = d;
        }
        if (p.team === 1 && d < runBD) {
            runB = i;
            runBD = d;
        }
    }

    const PLAYER_SPEED = 120; // px/s base
    const colors = ["#dc2626", "#2a5aaa"];

    for (let i = 0; i < 22; i++) {
        const p = soccerState.players[i];
        const home = p.team === 0 ? homesA[p.role] : homesB[p.role];
        const isRunner = i === runA || i === runB;

        // Decide target: runner goes to ball, others drift toward tactical position
        let tx: number, ty: number, speed: number;
        if (isRunner) {
            tx = B.x;
            ty = B.y;
            speed = PLAYER_SPEED * 1.1;
        } else if (p.role === 0) {
            // GK tracks ball Y but stays on goal line
            tx = home[0];
            ty = home[1] + (B.y - h / 2) * 0.4;
            speed = PLAYER_SPEED * 0.7;
        } else {
            // Others: shift toward ball but anchored to home
            const pull = p.role < 5 ? 0.15 : p.role < 8 ? 0.25 : 0.35;
            tx = home[0] + (B.x - home[0]) * pull;
            ty = home[1] + (B.y - home[1]) * pull;
            speed = PLAYER_SPEED * 0.5;
        }

        // Move toward target at fixed speed
        const dx = tx - p.x,
            dy = ty - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 2) {
            const step = Math.min(speed * dt, dist);
            p.x += (dx / dist) * step;
            p.y += (dy / dist) * step;
        }

        // Clamp to field
        p.x = Math.max(M + 5, Math.min(w - M - 5, p.x));
        p.y = Math.max(M + 5, Math.min(h - M - 5, p.y));

        // ── KICK ──
        const ballDist = Math.hypot(p.x - B.x, p.y - B.y);
        if (
            ballDist < 11 &&
            soccerState.kickCD <= 0 &&
            soccerState.resetTimer <= 0
        ) {
            const dir = p.team === 0 ? 1 : -1;
            const action = Math.random();
            if (action < 0.4) {
                // Shoot at goal
                const gx = p.team === 0 ? w - M : M;
                const gy = h / 2 + (Math.random() - 0.5) * goalH * 0.7;
                const sdx = gx - B.x,
                    sdy = gy - B.y;
                const sl = Math.hypot(sdx, sdy) || 1;
                const pw = 250 + Math.random() * 100;
                B.vx = (sdx / sl) * pw;
                B.vy = (sdy / sl) * pw * 0.4;
            } else if (action < 0.75) {
                // Pass (angled forward)
                const ang =
                    dir * (0.2 + Math.random() * 0.8) + (Math.random() - 0.5) * 1.2;
                const pw = 100 + Math.random() * 80;
                B.vx = Math.cos(ang) * pw;
                B.vy = Math.sin(ang) * pw;
            } else {
                // Dribble (short kick)
                const ang =
                    (Math.random() - 0.5) * Math.PI * 0.6 + (dir > 0 ? 0 : Math.PI);
                const pw = 50 + Math.random() * 40;
                B.vx = Math.cos(ang) * pw;
                B.vy = Math.sin(ang) * pw;
            }
            soccerState.kickCD = 0.3 + Math.random() * 0.15;
        }

        // ── DRAW PLAYER ──
        ctx.fillStyle = colors[p.team];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── DRAW BALL ──
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath();
    ctx.ellipse(B.x + 3, B.y + 4, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(B.x, B.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(B.x, B.y, 5, 0, Math.PI * 2);
    ctx.stroke();

    // ── SCORE HUD ──
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(w / 2 - 60, 8, 120, 28);
    ctx.fillStyle = "#dc2626";
    ctx.font = '18px "Jersey 10", monospace';
    ctx.textAlign = "right";
    ctx.fillText(String(soccerState.scoreA), w / 2 - 12, 29);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText("×", w / 2, 28);
    ctx.fillStyle = "#5588dd";
    ctx.textAlign = "left";
    ctx.fillText(String(soccerState.scoreB), w / 2 + 12, 29);
    ctx.textAlign = "start";
}

// ══════════════════════════════════════════
//  FPS – Retro Vaporwave / Synthwave
// ══════════════════════════════════════════
function renderFPS(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
) {
    const horizon = h * 0.52;

    // ── SKY GRADIENT (deep purple → pink → orange) ──
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, "#0a0020");
    sky.addColorStop(0.25, "#1a0a40");
    sky.addColorStop(0.5, "#4a1060");
    sky.addColorStop(0.7, "#8a2070");
    sky.addColorStop(0.85, "#d04878");
    sky.addColorStop(0.95, "#e88040");
    sky.addColorStop(1, "#f0b848");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, horizon);

    // ── STARS ──
    for (let i = 0; i < 80; i++) {
        const sx = (i * 137.5 + 23) % w;
        const sy = (i * 97.3 + 11) % (horizon * 0.7);
        const twinkle = Math.sin(t * 2 + i * 3.1) * 0.3 + 0.7;
        const size = i % 3 === 0 ? 2 : 1;
        ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.6})`;
        ctx.fillRect(sx, sy, size, size);
    }

    // ── SUN (large, on horizon) ──
    const sunX = w / 2;
    const sunY = horizon - h * 0.02;
    const sunR = w * 0.09;

    // Sun glow (outer)
    const sunGlow = ctx.createRadialGradient(
        sunX,
        sunY,
        sunR * 0.5,
        sunX,
        sunY,
        sunR * 3,
    );
    sunGlow.addColorStop(0, "rgba(255,200,100,0.3)");
    sunGlow.addColorStop(0.5, "rgba(255,100,80,0.1)");
    sunGlow.addColorStop(1, "rgba(255,50,100,0)");
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, horizon * 0.3, w, horizon * 0.8);

    // Sun body (with horizontal stripe cut-outs for retro feel)
    ctx.save();
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.clip();

    const sunBody = ctx.createLinearGradient(
        sunX,
        sunY - sunR,
        sunX,
        sunY + sunR,
    );
    sunBody.addColorStop(0, "#ffe080");
    sunBody.addColorStop(0.4, "#ff8060");
    sunBody.addColorStop(0.7, "#e04090");
    sunBody.addColorStop(1, "#a030a0");
    ctx.fillStyle = sunBody;
    ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);

    // Retro stripes across the sun
    ctx.fillStyle = "#0a0020";
    const stripeCount = 6;
    for (let s = 0; s < stripeCount; s++) {
        const stripeY = sunY + sunR * 0.1 + s * sunR * 0.15;
        const stripeH = 2 + s * 1.5;
        ctx.fillRect(sunX - sunR, stripeY, sunR * 2, stripeH);
    }
    ctx.restore();

    // ── MOUNTAINS (layered silhouettes) ──
    // Far mountain layer
    ctx.fillStyle = "#2a1048";
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    const farMountains = [
        0, 0.08, 0.18, 0.28, 0.35, 0.45, 0.52, 0.6, 0.7, 0.78, 0.88, 0.95, 1.0,
    ];
    const farHeights = [
        0.12, 0.22, 0.14, 0.3, 0.18, 0.35, 0.25, 0.38, 0.2, 0.32, 0.15, 0.25, 0.1,
    ];
    for (let i = 0; i < farMountains.length; i++) {
        ctx.lineTo(w * farMountains[i], horizon - h * farHeights[i]);
    }
    ctx.lineTo(w, horizon);
    ctx.closePath();
    ctx.fill();

    // Near mountain layer
    ctx.fillStyle = "#1a0830";
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    const nearMountains = [
        0, 0.1, 0.2, 0.32, 0.42, 0.55, 0.65, 0.75, 0.85, 0.92, 1.0,
    ];
    const nearHeights = [
        0.06, 0.14, 0.08, 0.18, 0.1, 0.06, 0.15, 0.22, 0.12, 0.08, 0.05,
    ];
    for (let i = 0; i < nearMountains.length; i++) {
        ctx.lineTo(w * nearMountains[i], horizon - h * nearHeights[i]);
    }
    ctx.lineTo(w, horizon);
    ctx.closePath();
    ctx.fill();

    // ── FLOOR (dark reflective base) ──
    const floorGrad = ctx.createLinearGradient(0, horizon, 0, h);
    floorGrad.addColorStop(0, "#180828");
    floorGrad.addColorStop(0.3, "#0e0418");
    floorGrad.addColorStop(1, "#060210");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, horizon, w, h - horizon);

    // ── SUN REFLECTION on floor ──
    const reflGrad = ctx.createRadialGradient(
        sunX,
        horizon + h * 0.05,
        0,
        sunX,
        horizon + h * 0.1,
        w * 0.3,
    );
    reflGrad.addColorStop(0, "rgba(255,150,80,0.15)");
    reflGrad.addColorStop(0.5, "rgba(200,60,120,0.06)");
    reflGrad.addColorStop(1, "rgba(100,20,100,0)");
    ctx.fillStyle = reflGrad;
    ctx.fillRect(0, horizon, w, h - horizon);

    // ── NEON PERSPECTIVE GRID ──
    const gridScroll = t * 1.2;
    const vanishX = w / 2;

    // Horizontal grid lines (perspective, scrolling toward viewer)
    // Generate all perspective positions, then draw only those with enough spacing
    const hLines = 25;
    const floorH = h - horizon;
    const gridSpeed = gridScroll * 0.12;
    const minGap = 12; // minimum pixel gap between adjacent lines

    // Collect all line Y positions (sorted ascending = horizon → bottom)
    const lineYs: number[] = [];
    for (let i = 0; i < hLines; i++) {
        const baseT = i / hLines;
        const scrollFract = ((baseT + gridSpeed) % 1.0 + 1.0) % 1.0;
        const perspT = Math.pow(scrollFract, 1.8);
        const perspY = horizon + floorH * perspT;
        if (perspY > horizon + 1 && perspY < h - 1) lineYs.push(perspY);
    }
    lineYs.sort((a, b) => a - b);

    // Draw lines enforcing minimum gap
    let prevY = -Infinity;
    for (const perspY of lineYs) {
        if (perspY - prevY < minGap) continue;
        prevY = perspY;
        const depth = (perspY - horizon) / floorH;
        ctx.strokeStyle = `rgba(255,50,180,${0.06 + depth * 0.55})`;
        ctx.lineWidth = 0.5 + depth * 1.8;
        ctx.beginPath();
        ctx.moveTo(0, perspY);
        ctx.lineTo(w, perspY);
        ctx.stroke();
    }

    // Vertical grid lines (converging to vanishing point)
    const vLines = 16;
    for (let i = -vLines / 2; i <= vLines / 2; i++) {
        const xBottom = vanishX + i * (w * 0.08);
        const alpha = 0.15 + Math.abs(i) * 0.02;
        ctx.strokeStyle = `rgba(100,200,255,${Math.min(alpha, 0.5)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(vanishX, horizon);
        ctx.lineTo(xBottom, h);
        ctx.stroke();
    }

    // ── PALM TREES (silhouettes) ──
    // Left palm
    drawVaporPalm(ctx, w * 0.08, horizon, w * 0.15, h * 0.55, -0.15, t);
    // Right palm
    drawVaporPalm(ctx, w * 0.92, horizon, w * 0.15, h * 0.55, 0.15, t);
    // Smaller palms
    drawVaporPalm(ctx, w * 0.18, horizon, w * 0.08, h * 0.35, -0.1, t);
    drawVaporPalm(ctx, w * 0.82, horizon, w * 0.08, h * 0.35, 0.1, t);

    // ── Horizon glow line ──
    ctx.strokeStyle = "rgba(255,100,200,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(w, horizon);
    ctx.stroke();

    // ── Edge vignette ──
    const vig = ctx.createRadialGradient(
        vanishX,
        horizon,
        w * 0.3,
        vanishX,
        horizon,
        w * 0.75,
    );
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,10,0.4)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
}

/** Draw a vaporwave palm tree silhouette */
function drawVaporPalm(
    ctx: CanvasRenderingContext2D,
    x: number,
    groundY: number,
    spread: number,
    height: number,
    lean: number,
    t: number,
) {
    const topX = x + lean * height;
    const topY = groundY - height;
    const sway = Math.sin(t * 0.8) * spread * 0.03;

    // Trunk (curved)
    ctx.strokeStyle = "#1a0830";
    ctx.lineWidth = spread * 0.15;
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.quadraticCurveTo(
        x + lean * height * 0.4,
        groundY - height * 0.5,
        topX + sway,
        topY,
    );
    ctx.stroke();

    // Fronds
    ctx.fillStyle = "#1a0830";
    const frondCount = 7;
    for (let f = 0; f < frondCount; f++) {
        const angle = -Math.PI * 0.8 + f * ((Math.PI * 1.6) / (frondCount - 1));
        const frondLen = spread * (0.7 + (f % 2) * 0.3);
        const fSway = Math.sin(t * 1.2 + f * 0.8) * spread * 0.04;
        const fx = topX + sway + Math.cos(angle) * frondLen + fSway;
        const fy = topY + Math.sin(angle) * frondLen * 0.5;

        ctx.beginPath();
        ctx.moveTo(topX + sway, topY);
        // Curved frond
        const cpx = topX + sway + Math.cos(angle) * frondLen * 0.5 + fSway * 0.5;
        const cpy = topY + Math.sin(angle) * frondLen * 0.3 - spread * 0.05;
        ctx.quadraticCurveTo(cpx, cpy, fx, fy);
        // Return stroke for leaf width
        ctx.quadraticCurveTo(
            cpx + spread * 0.02,
            cpy + spread * 0.03,
            topX + sway,
            topY,
        );
        ctx.fill();
    }
}

// ══════════════════════════════════════════
//  HELPER DRAWING FUNCTIONS (used by scenes)
// ══════════════════════════════════════════

function drawCar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale = 1,
) {
    const s = scale;
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(x - 12 * s, y - 8 * s, 24 * s, 20 * s);
    ctx.fillStyle = "#aa1111";
    ctx.fillRect(x - 8 * s, y - 14 * s, 16 * s, 8 * s);
    ctx.fillStyle = "#333";
    ctx.fillRect(x - 14 * s, y + 8 * s, 8 * s, 6 * s);
    ctx.fillRect(x + 6 * s, y + 8 * s, 8 * s, 6 * s);
    ctx.fillStyle = "#aaddff";
    ctx.fillRect(x - 6 * s, y - 12 * s, 12 * s, 5 * s);
}

// ══════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════
export default function CanvasBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const gridRef = useRef<Float32Array | null>(null);
    const shapeGridRef = useRef<Uint8Array | null>(null);
    const dimensionsRef = useRef({ cols: 0, rows: 0 });
    const timeRef = useRef(0);
    const lastFrameRef = useRef(0);
    const mouseRef = useRef({ x: -1, y: -1 });
    const sceneIndexRef = useRef(0);

    const getScene = useCallback(
        (): Scene => SCENES[sceneIndexRef.current % SCENES.length],
        [],
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        const handleToggle = () => {
            sceneIndexRef.current = (sceneIndexRef.current + 1) % SCENES.length;
        };
        const handleSetScene = (e: Event) => {
            const idx = (e as CustomEvent).detail;
            if (typeof idx === "number" && idx >= 0 && idx < SCENES.length) {
                sceneIndexRef.current = idx;
            }
        };
        window.addEventListener("toggle-canvas-scene", handleToggle);
        window.addEventListener("set-canvas-scene", handleSetScene);

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const cols = Math.ceil(window.innerWidth / PIXEL);
            const rows = Math.ceil(window.innerHeight / PIXEL);
            dimensionsRef.current = { cols, rows };

            const newGrid = new Float32Array(cols * rows);
            const newShapes = new Uint8Array(cols * rows);
            for (let i = 0; i < newShapes.length; i++)
                newShapes[i] = Math.floor(Math.random() * 4);

            if (gridRef.current) {
                const len = Math.min(gridRef.current.length, newGrid.length);
                for (let i = 0; i < len; i++) newGrid[i] = gridRef.current[i];
            }
            gridRef.current = newGrid;
            shapeGridRef.current = newShapes;
        };

        resize();
        window.addEventListener("resize", resize);

        const onMM = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        const onML = () => {
            mouseRef.current = { x: -1, y: -1 };
        };
        window.addEventListener("mousemove", onMM);
        window.addEventListener("mouseleave", onML);

        const render = () => {
            // Skip rendering when tab is hidden — saves 100% CPU
            if (document.hidden) {
                lastFrameRef.current = 0; // reset so we don't get a huge delta on resume
                animationRef.current = requestAnimationFrame(render);
                return;
            }
            const now = performance.now();
            const delta = lastFrameRef.current ? Math.min((now - lastFrameRef.current) / 1000, 0.05) : 0.016;
            lastFrameRef.current = now;
            timeRef.current += delta;
            const w = window.innerWidth,
                h = window.innerHeight;
            const scene = getScene();

            switch (scene) {
                case "standard":
                    renderStandard(
                        ctx,
                        w,
                        h,
                        timeRef.current,
                        gridRef.current!,
                        shapeGridRef.current!,
                        dimensionsRef.current.cols,
                        dimensionsRef.current.rows,
                        mouseRef.current,
                    );
                    break;
                case "platformer":
                    ctx.clearRect(0, 0, w, h);
                    renderPlatformer(ctx, w, h, timeRef.current);
                    break;
                case "spaceship":
                    renderSpaceship(ctx, w, h, timeRef.current);
                    break;
                case "racing":
                    renderRacing(ctx, w, h, timeRef.current);
                    break;

                case "sports":
                    renderSports(ctx, w, h, timeRef.current);
                    break;
                case "fps":
                    renderFPS(ctx, w, h, timeRef.current);
                    break;
            }

            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", onMM);
            window.removeEventListener("mouseleave", onML);
            window.removeEventListener("toggle-canvas-scene", handleToggle);
            window.removeEventListener("set-canvas-scene", handleSetScene);
        };
    }, [getScene]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full canvas-bg"
            aria-hidden="true"
        />
    );
}
