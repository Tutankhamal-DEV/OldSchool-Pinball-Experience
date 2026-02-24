import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useInView, AnimatePresence } from "motion/react";
import HTMLFlipBook from "react-pageflip";
import { useTranslation } from "react-i18next";

// The 11 pages of the menu
const MENU_PAGES = [
  "/american-bar-menu/page1.webp",
  "/american-bar-menu/page2.webp",
  "/american-bar-menu/page3.webp",
  "/american-bar-menu/page4.webp",
  "/american-bar-menu/page5.webp",
  "/american-bar-menu/page6.webp",
  "/american-bar-menu/page7.webp",
  "/american-bar-menu/page8.webp",
  "/american-bar-menu/page9.webp",
  "/american-bar-menu/page10.webp",
  "/american-bar-menu/page11.webp",
];

// ForwardRef component required by react-pageflip for each page
const Page = React.forwardRef<
  HTMLDivElement,
  { imageUrl: string; number: number }
>((props, ref) => {
  return (
    <div
      ref={ref}
      className="page overflow-hidden h-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] bg-[#111]"
    >
      <img
        src={props.imageUrl}
        alt={`Menu Page ${props.number}`}
        className="w-full h-full object-cover pointer-events-none"
        draggable={false}
        decoding="sync"
      />
    </div>
  );
});

Page.displayName = "Page";

/* ─── PDF-like Fullscreen Modal ─── */
function MenuModal({
  pages,
  onClose,
}: {
  pages: string[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open & support Escape key
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[9999] flex flex-col bg-black/95 backdrop-blur-sm"
    >
      {/* Sticky top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-b border-pinball-red/20 shrink-0">
        <span className="font-pixel text-pinball-cream/60 text-[0.6rem] tracking-widest uppercase">
          {t("american_bar.title", "Cardápio")} — {pages.length}{" "}
          {t("american_bar.zoom_pages", "páginas")}
        </span>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-pinball-cream bg-pinball-red/20 hover:bg-pinball-red/40 transition-colors px-3 py-2 -mr-2 rounded-lg border border-pinball-red/30"
          aria-label="Fechar"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
          <span className="font-pixel text-[0.6rem] tracking-widest uppercase">
            {t("american_bar.zoom_close", "Fechar")}
          </span>
        </button>
      </div>

      {/* Scrollable page list (PDF-like) */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-4 px-2 sm:px-4"
      >
        <div className="max-w-[600px] mx-auto flex flex-col gap-3">
          {pages.map((src, i) => (
            <div key={i} className="relative">
              <img
                src={src}
                alt={`${t("american_bar.title", "Cardápio")} — ${t("american_bar.zoom_page", "Página")} ${i + 1}`}
                className="w-full h-auto rounded-md shadow-lg shadow-black/50"
                loading={i < 3 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
              />
              <span className="absolute bottom-2 right-2 bg-black/70 text-pinball-cream/50 text-[0.5rem] font-pixel px-2 py-0.5 rounded tracking-widest">
                {i + 1}/{pages.length}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky bottom bar — back to top */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/90 border-t border-pinball-red/20 shrink-0">
        <button
          onClick={() =>
            scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
          }
          className="flex items-center gap-2 text-pinball-cream/50 hover:text-pinball-yellow transition-colors font-pixel text-[0.55rem] tracking-widest uppercase"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
          {t("american_bar.zoom_top", "Voltar ao topo")}
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-pinball-cream/60 hover:text-pinball-red transition-colors font-pixel text-[0.55rem] tracking-widest uppercase"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
          {t("american_bar.zoom_close", "Fechar")}
        </button>
      </div>
    </motion.div>
  );
}

export default function AmericanBar() {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [zoomOpen, setZoomOpen] = useState(false);

  return (
    <section id="bar" ref={ref} className="relative py-12 px-4 z-1">
      {/* Gradient divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pinball-red/30 to-transparent" />

      <div className="max-w-6xl mx-auto">
        {/* Neon section title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center justify-center mb-8"
        >
          <div className="mb-3 flex justify-center">
            <h2 className="section-title text-pinball-red">
              {t("american_bar.title")}
            </h2>
          </div>

          <p className="font-body text-pinball-cream/70 text-center max-w-xl mx-auto">
            {t("american_bar.description")}
          </p>
        </motion.div>

        {/* 3D Interactive Magazine Menu */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center max-w-5xl mx-auto w-full relative"
        >
          {/* Zoom / expand button — above the magazine */}
          <div className="mb-6 flex justify-center">
            <button
              onClick={() => setZoomOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg
                                bg-pinball-red/15 border border-pinball-red/30 text-pinball-cream/80
                                hover:bg-pinball-red/25 hover:text-pinball-cream
                                active:scale-95 transition-all duration-200
                                font-pixel text-[0.65rem] tracking-widest uppercase"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              {t("american_bar.zoom_btn", "Ampliar Cardápio")}
            </button>
          </div>

          <motion.div
            className="w-full relative flex justify-center perspective-[1500px] px-2 sm:px-0"
            whileHover={{ y: -10, scale: 1.02 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Visual Hint — large chevron pointing right, lateral bounce */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 1.5, duration: 0.8 }}
              className="hidden md:flex absolute top-1/2 left-[18%] xl:left-[22%] -translate-y-1/2 flex-col items-center gap-1 pointer-events-none z-0"
            >
              <motion.svg
                animate={{ x: [0, -14, 0] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                width="100"
                height="100"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-pinball-yellow/50"
              >
                <path d="m15 18-6-6 6-6" />
              </motion.svg>
              <div className="text-pinball-yellow/50 font-pixel text-[11px] tracking-widest whitespace-nowrap">
                {t("american_bar.hint_desktop")}
              </div>
            </motion.div>

            {/* 
                          We force type overriding because react-pageflip typings are occasionally
                          clunky with React 19+. Wait, TS might complain about HTMLFlipBook. 
                          Using @ts-expect-error as safety bypass for potential mismatched types in this old lib.
                        */}
            {/* @ts-expect-error react-pageflip type mismatch */}
            <HTMLFlipBook
              width={350}
              height={500}
              size="stretch"
              minWidth={140}
              maxWidth={450}
              minHeight={200}
              maxHeight={650}
              maxShadowOpacity={0.6}
              showCover={true}
              usePortrait={false}
              showPageCorners={false}
              flippingTime={1000}
              className="menu-flipbook mx-auto shadow-2xl"
              style={{ margin: "0 auto" }}
            >
              {MENU_PAGES.map((pageImage, index) => (
                <Page key={index} number={index + 1} imageUrl={pageImage} />
              ))}
            </HTMLFlipBook>
          </motion.div>
        </motion.div>
      </div>

      {/* PDF-like menu modal — rendered via Portal to escape z-index stacking */}
      {createPortal(
        <AnimatePresence>
          {zoomOpen && (
            <MenuModal pages={MENU_PAGES} onClose={() => setZoomOpen(false)} />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  );
}
