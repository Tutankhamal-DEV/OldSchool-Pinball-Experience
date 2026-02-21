"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useInView, useMotionValue, useTransform, useSpring } from "motion/react";
import { useTranslations } from "next-intl";

export default function MagazineSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });
    const [isOpen, setIsOpen] = useState(false);
    const t = useTranslations("Magazine");

    /* ── 3D Mouse-follow tilt ── */
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { stiffness: 150, damping: 20, mass: 0.5 };
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (isOpen) return; // Don't tilt when open
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            mouseX.set(x);
            mouseY.set(y);
        },
        [isOpen, mouseX, mouseY],
    );

    const handleMouseLeave = useCallback(() => {
        mouseX.set(0);
        mouseY.set(0);
    }, [mouseX, mouseY]);

    return (
        <section
            id="magazine"
            ref={ref}
            className="relative z-10 min-h-screen flex flex-col justify-center py-16 sm:py-24"
        >
            <div className="site-container">
                {/* Section Header — same pattern as LatestVideos */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-10 flex flex-col items-center"
                >
                    <h2
                        className="section-title hero-glitch text-white text-center"
                        data-text={t("title")}
                    >
                        {t("title")}
                    </h2>
                </motion.div>

                {/* Magazine + Description — centered column */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="flex flex-col items-center gap-3"
                >
                    {/* 3D Magazine with mouse-follow tilt */}
                    <div
                        className="magazine-container"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <motion.div
                            className="magazine-wrapper"
                            style={{
                                rotateX: isOpen ? 0 : rotateX,
                                rotateY: isOpen ? 0 : rotateY,
                            }}
                        >
                            {/* Inside page — QR Code (sits underneath the cover) */}
                            <div className="magazine-back">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/assets/revista_superup_qrcode.png"
                                    alt={t("qrAlt")}
                                    width={180}
                                    height={180}
                                    draggable={false}
                                />
                            </div>

                            {/* Cover — pivots from left spine */}
                            <div className={`magazine-front ${isOpen ? "magazine-cover-open" : ""}`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/assets/superupjogos.png"
                                    alt={t("imageAlt")}
                                    width={220}
                                    height={300}
                                    draggable={false}
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Click hint */}
                    <div className="magazine-click-hint">
                        {isOpen ? t("clickToClose") : t("clickToOpen")}
                    </div>

                    {/* Description box — all text consolidated here */}
                    <div className="glow-card magazine-desc-card">
                        <div className="glow-card-fill magazine-desc-fill">
                            <p className="font-mono magazine-desc-text">
                                {t("description")}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
