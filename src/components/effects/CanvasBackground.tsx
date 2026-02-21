"use client";

import { useEffect, useRef, useCallback } from "react";

const PIXEL = 16;

// ── Scene list ──
const SCENES = [
    "arcade-alley",
    "standard",
    "spaceship",
    "fps",
    "stars",
    "pulse",
    "static",
    "racing",
    "empty"
] as const;

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
//  ARCADE ALLEY – 3D Perspective Corridor
// ══════════════════════════════════════════
function renderArcadeAlley(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    ctx.clearRect(0, 0, w, h);

    const vanishX = w / 2;
    const vanishY = h * 0.53; // Raised to better align with the hero title

    // Checkerboard Grid floor
    const speed = 2;
    const scrollZ = (t * speed) % 1;
    const baseRowIndex = Math.floor(t * speed);

    // Draw cells (checkerboard)
    for (let j = 0; j < 15; j++) {
        const d0 = Math.pow((j + scrollZ) / 15, 2);
        const d1 = Math.pow((j + 1 + scrollZ) / 15, 2);

        const y0 = vanishY + d0 * (h - vanishY);
        const y1 = vanishY + d1 * (h - vanishY);

        if (y0 < vanishY) continue;

        const alpha = 0.05 + d0 * 0.3;
        ctx.fillStyle = `rgba(255, 42, 42, ${alpha * 0.6})`; // Red filled boxes

        const rowIndex = j - baseRowIndex;

        for (let i = -30; i <= 30; i++) {
            // Checker alternating logic
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

    // Keep the geometric perspective lines on top for definition
    ctx.strokeStyle = "rgba(255, 42, 42, 0.2)";
    ctx.lineWidth = 1;
    for (let i = -30; i <= 30; i++) {
        const xAtBottom = vanishX + i * (w * 0.1);
        ctx.beginPath();
        ctx.moveTo(vanishX, vanishY);
        ctx.lineTo(xAtBottom, h);
        ctx.stroke();
    }

    // Horizontal floor lines 
    for (let j = 0; j < 15; j++) {
        const depth = Math.pow((j + scrollZ) / 15, 2);
        const y = vanishY + depth * (h - vanishY);
        if (y > vanishY) {
            ctx.strokeStyle = `rgba(255, 42, 42, ${0.1 + depth * 0.4})`;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }

}

// ══════════════════════════════════════════
//  STANDARD – Fire / phosphor particles
// ══════════════════════════════════════════
function renderStandard(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: number,
    grid: Float32Array,
    cols: number,
    rows: number
) {
    ctx.clearRect(0, 0, w, h);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const idx = row * cols + col;
            grid[idx] = (grid[idx] || 0) * 0.97;
            const w1 = Math.sin(col * 0.15 + time * 0.5) * Math.sin(row * 0.1 + time * 0.3);
            const w2 = Math.cos(col * 0.08 - time * 0.4) * Math.cos(row * 0.12 + time * 0.6);
            const ambient = (w1 + w2 + Math.sin((col + row) * 0.05 + time * 0.2)) * 0.02;
            if (ambient > 0) grid[idx] = Math.min((grid[idx] || 0) + ambient * 0.3, 1);
            if (Math.random() > 0.997) grid[idx] = Math.min((grid[idx] || 0) + 0.3 + Math.random() * 0.4, 1);
        }
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const idx = row * cols + col;
            const val = grid[idx] || 0;
            if (val < 0.01) continue;
            const x = col * PIXEL, y = row * PIXEL;
            if (val > 0.4) {
                // Golden hue
                const hue = 45 + (Math.sin(time * 2 + col * 0.1) * 10);
                ctx.fillStyle = `hsla(${hue},90%,${50 + val * 20}%,${val * 0.5})`;
            } else if (val > 0.15) {
                ctx.fillStyle = `rgba(${Math.floor(200 + (val / 0.4) * 55)},${Math.floor(150 + val * 50)},0,${val * 0.4})`;
            } else {
                ctx.fillStyle = `rgba(${Math.floor(150 + val * 100)},100,20,${val * 0.3})`;
            }
            drawTileShape(ctx, x, y, PIXEL);
        }
    }

    const scanY = (time * 80) % h;
    ctx.fillStyle = "rgba(220,38,38,0.03)";
    ctx.fillRect(0, scanY, w, 2);
}

function drawTileShape(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    const half = size / 2, cx = x + half, cy = y + half, s = half - 1;
    ctx.beginPath();

    // Draw a 5-point star regardless of the shape index
    const spikes = 5;
    const outerRadius = s;
    const innerRadius = s * 0.4;
    let rot = Math.PI / 2 * 3;
    let xC;
    let yC;
    const step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        xC = cx + Math.cos(rot) * outerRadius;
        yC = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(xC, yC);
        rot += step;

        xC = cx + Math.cos(rot) * innerRadius;
        yC = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(xC, yC);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
}

// ══════════════════════════════════════════
//  FPS – Retro Vaporwave / Synthwave (Transparent Version)
// ══════════════════════════════════════════
function renderFPS(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    const horizon = h * 0.65;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#05001a");
    bg.addColorStop(0.65, "#1a0033");
    bg.addColorStop(1, "#0a0020");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // ── STARS ──
    for (let i = 0; i < 80; i++) {
        const sx = (i * 137.5 + 23) % w;
        const sy = (i * 97.3 + 11) % (horizon * 0.7);
        const twinkle = Math.sin(t * 2 + i * 3.1) * 0.3 + 0.7;
        const size = i % 3 === 0 ? 2 : 1;
        ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.4})`; // more transparent
        ctx.fillRect(sx, sy, size, size);
    }

    // ── NEON PERSPECTIVE GRID ──
    const gridScroll = t * 1.2;
    const vanishX = w / 2;
    const hLines = 25;
    const floorH = h - horizon;
    const gridSpeed = gridScroll * 0.12;
    const minGap = 12;

    const lineYs: number[] = [];
    for (let i = 0; i < hLines; i++) {
        const baseT = i / hLines;
        const scrollFract = ((baseT + gridSpeed) % 1.0 + 1.0) % 1.0;
        const perspT = Math.pow(scrollFract, 1.8);
        const perspY = horizon + floorH * perspT;
        if (perspY > horizon + 1 && perspY < h - 1) lineYs.push(perspY);
    }
    lineYs.sort((a, b) => a - b);

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
                bGlow.addColorStop(0, "rgba(255,80,40,0.4)");
                bGlow.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = bGlow;
                ctx.fillRect(ex - 6, bulletY - 2, 12, 12);
            }
        }
    }
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
            { color: "#ff3333", bodyColor: "#cc2222" },
            { color: "#ffaa33", bodyColor: "#cc8822" },
            { color: "#ee2222", bodyColor: "#dd1111" },
            { color: "#ffcc22", bodyColor: "#ccaa11" },
            { color: "#ff5555", bodyColor: "#cc3333" },
            { color: "#ffdd44", bodyColor: "#ddbb22" },
            { color: "#dd2222", bodyColor: "#aa1111" },
            { color: "#ffee55", bodyColor: "#ccaa33" },
        ];
        RS.opponents = [];
        for (let i = 0; i < 8; i++) {
            RS.opponents.push({
                z: 0.15 + (i / 8) * 0.8,
                lane: (i % 3) - 1,
                laneTarget: (i % 3) - 1,
                speed: 0.6 + Math.random() * 0.35,
                laneTimer: 2 + Math.random() * 5,
                color: carColors[i]?.color ?? "#ffffff",
                bodyColor: carColors[i]?.bodyColor ?? "#ffffff",
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
            available[Math.floor(Math.random() * available.length)] ?? 0;
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
            opp.laneTarget = available[Math.floor(Math.random() * available.length)] ?? 0;
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
    sky.addColorStop(0, "#0a0101");
    sky.addColorStop(0.3, "#100202");
    sky.addColorStop(0.6, "#180303");
    sky.addColorStop(1, "#260505");
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
        "255,42,42",
        "255,200,42",
        "220,30,30",
        "255,220,100",
        "255,80,80",
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
        ctx.fillStyle = groundStripe ? "#330505" : "#220202";
        ctx.fillRect(0, y, w, 2);

        const roadStripe = (y + Math.floor(speed)) % 28 < 14;
        ctx.fillStyle = roadStripe ? "#222230" : "#1a1a28";
        ctx.fillRect(rx, y, rw, 2);

        // Wet road reflections
        if (eased > 0.1) {
            const reflBand = (y + Math.floor(speed * 0.7)) % 60;
            if (reflBand < 6) {
                const reflAlpha = (1 - reflBand / 6) * eased * 0.12;
                ctx.fillStyle = `rgba(255,200,42,${reflAlpha})`;
                ctx.fillRect(rx, y, rw, 2);
            }
        }

        // Curb stripes
        const curbW = 4 + eased * 10;
        const curbPat = (y + Math.floor(speed)) % 16 < 8;
        ctx.fillStyle = curbPat ? "#220505" : "#e8e8e8";
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
        ctx.fillStyle = "#330505";
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

    // Dim intensity of entire scene by 20%
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 1;
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
// ══════════════════════════════════════════
//  STARS – Warp Speed Starfield
// ══════════════════════════════════════════
function renderStars(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    ctx.fillStyle = "rgba(5, 5, 20, 1)";
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h * 0.65;

    const numStars = 400;
    for (let i = 0; i < numStars; i++) {
        const seed1 = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
        const seed2 = Math.abs(Math.sin(i * 78.233) * 43758.5453) % 1;

        const angle = seed1 * Math.PI * 2;
        const dist = (seed2 + t * 0.15) % 1;

        const x = cx + Math.cos(angle) * (w > h ? w : h) * dist * 1.5;
        const y = cy + Math.sin(angle) * (w > h ? w : h) * dist * 1.5;

        const size = Math.max(1.5, dist * 5);
        const alpha = Math.min(1, dist * dist * 2);

        if (x > 0 && x < w && y > 0 && y < h) {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ══════════════════════════════════════════
//  PULSE – Concentric Glow
// ══════════════════════════════════════════
function renderPulse(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    ctx.fillStyle = "rgba(15, 0, 0, 1)";
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h * 0.65;

    const numCircles = 8;
    for (let i = 0; i < numCircles; i++) {
        const progress = (i / numCircles + t * 0.1) % 1;
        const radius = progress * Math.max(w, h);

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);

        const alpha = Math.sin(progress * Math.PI);
        ctx.strokeStyle = `rgba(255, 42, 42, ${alpha * 0.6})`;
        ctx.lineWidth = 2 + progress * 6;
        ctx.stroke();
    }
}

// ══════════════════════════════════════════
//  STATIC – TV Noise
// ══════════════════════════════════════════
function renderStatic(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    for (let i = 0; i < 4000; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const size = Math.random() * 4 + 1;
        ctx.fillRect(x, y, size, size);
    }
}

type CanvasBackgroundProps = {
    activeSection?: string;
};

export default function CanvasBackground({ activeSection = 'home' }: CanvasBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const gridRef = useRef<Float32Array | null>(null);
    const shapeGridRef = useRef<Uint8Array | null>(null);
    const dimensionsRef = useRef({ cols: 0, rows: 0 });
    const timeRef = useRef(0);
    const lastFrameRef = useRef(0);
    const sceneIndexRef = useRef(7); // Default to Racing Scene (index 7)
    const manualSceneRef = useRef(7); // Remembers user's toggle choices

    const getScene = useCallback(
        (): Scene => SCENES[sceneIndexRef.current % SCENES.length] || "standard",
        [],
    );

    // Determine which background image to show based on the active section
    const getBackgroundImage = () => {
        switch (activeSection) {
            case 'home':
                return null;
            case 'sobre':
                return '/images/ambiente_02.webp';
            case 'bar':
                return '/images/american_bar.webp';
            case 'maquinas':
                return '/images/pinball_machines_room.webp';
            case 'midia':
                return '/images/ambiente_05.webp';
            case 'ingressos':
            case 'eventos':
                return '/images/ambiente_04.webp';
            case 'contato':
            case 'footer':
                return null; // As expected, no static image
            default:
                return null;
        }
    };

    // Centralized Canvas Scene Routing
    useEffect(() => {
        let nextScene = manualSceneRef.current;
        switch (activeSection) {
            case 'sobre':
            case 'bar':
                nextScene = 2; // Spaceship
                break;
            case 'eventos':
            case 'ingressos':
                nextScene = 1; // Standard (Tiles e estrelinhas)
                break;
            case 'midia':
                nextScene = 6; // Static (TV noise / chuvisco)
                break;
            case 'home':
            case 'contato':
            case 'footer':
                nextScene = 7; // Racing
                break;
            default:
                // Maquinas inherits manual selection
                nextScene = manualSceneRef.current;
                break;
        }
        sceneIndexRef.current = nextScene;
    }, [activeSection]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        const handleToggle = () => {
            let next = (manualSceneRef.current + 1) % SCENES.length;
            if (SCENES[next] === "empty") {
                next = (next + 1) % SCENES.length;
            }
            manualSceneRef.current = next;
            sceneIndexRef.current = next;
        };
        const handleSetScene = (e: Event) => {
            const idx = (e as CustomEvent).detail;
            if (typeof idx === "number" && idx >= 0 && idx < SCENES.length) {
                manualSceneRef.current = idx;
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
                for (let i = 0; i < len; i++) newGrid[i] = gridRef.current[i] || 0;
            }
            gridRef.current = newGrid;
            shapeGridRef.current = newShapes;
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
            const scene = getScene();

            switch (scene) {
                case "arcade-alley":
                    renderArcadeAlley(ctx, w, h, timeRef.current);
                    break;
                case "standard":
                    renderStandard(
                        ctx, w, h, timeRef.current,
                        gridRef.current!,
                        dimensionsRef.current.cols, dimensionsRef.current.rows
                    );
                    break;
                case "spaceship":
                    renderSpaceship(ctx, w, h, timeRef.current);
                    break;
                case "fps":
                    renderFPS(ctx, w, h, timeRef.current);
                    break;
                case "racing":
                    renderRacing(ctx, w, h, timeRef.current);
                    break;
                case "stars":
                    renderStars(ctx, w, h, timeRef.current);
                    break;
                case "pulse":
                    renderPulse(ctx, w, h, timeRef.current);
                    break;
                case "static":
                    renderStatic(ctx, w, h);
                    break;
                case "empty":
                    ctx.clearRect(0, 0, w, h);
                    break;
            }

            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener("resize", resize);
            window.removeEventListener("toggle-canvas-scene", handleToggle);
            window.removeEventListener("set-canvas-scene", handleSetScene);
        };
    }, [getScene]);

    const bgImages = [
        '/images/ambiente_02.webp',
        '/images/american_bar.webp',
        '/images/pinball_machines_room.webp',
        '/images/ambiente_05.webp',
        '/images/ambiente_04.webp'
    ];

    return (
        <>
            {/* Section bg images — far behind canvas, for non-hero sections */}
            {bgImages.map((src) => {
                const isActive = getBackgroundImage() === src;
                return (
                    <picture
                        key={src}
                        className={`fixed inset-0 w-full h-full pointer-events-none transition-opacity ease-in-out ${isActive ? 'opacity-40' : 'opacity-0'}`}
                        style={{
                            zIndex: 5,
                            transitionDuration: isActive ? '1000ms' : '3000ms'
                        }}
                        aria-hidden="true"
                    >
                        <source media="(max-width: 768px)" srcSet={src.replace('.webp', '-sm.webp')} />
                        <img
                            src={src}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    </picture>
                );
            })}

            {/* Feathered shadow — dark center strip to boost text readability (below canvas) */}
            <div
                className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-6xl pointer-events-none bg-feathered-shadow z-[25]"
                aria-hidden="true"
            />

            {/* Canvas animation — glows above backdrop, z-35 ensures it covers the Home AVIF (z-31) */}
            <canvas
                ref={canvasRef}
                className="fixed inset-0 w-full h-full pointer-events-none mix-blend-screen transition-opacity duration-1000 ease-in-out z-[35]"
                style={{
                    opacity: ['home', 'contato', 'footer', 'eventos', 'ingressos'].includes(activeSection) ? 1 : 0.6
                }}
                aria-hidden="true"
            />

            {/* Radial vignette — darkens screen edges, above canvas */}
            <div
                className="fixed inset-0 w-full h-full pointer-events-none bg-radial-vignette z-[35]"
                aria-hidden="true"
            />
        </>
    );
}
