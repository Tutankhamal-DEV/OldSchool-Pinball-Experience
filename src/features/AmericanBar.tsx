import React, { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import HTMLFlipBook from 'react-pageflip'

// The 11 pages of the menu
const MENU_PAGES = [
    '/american-bar-menu/page1.avif',
    '/american-bar-menu/page2.avif',
    '/american-bar-menu/page3.avif',
    '/american-bar-menu/page4.avif',
    '/american-bar-menu/page5.avif',
    '/american-bar-menu/page6.avif',
    '/american-bar-menu/page7.avif',
    '/american-bar-menu/page8.avif',
    '/american-bar-menu/page9.avif',
    '/american-bar-menu/page10.avif',
    '/american-bar-menu/page11.avif',
]

// ForwardRef component required by react-pageflip for each page
const Page = React.forwardRef<HTMLDivElement, { imageUrl: string, number: number }>((props, ref) => {
    return (
        <div ref={ref} className="page overflow-hidden h-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] bg-[#111]">
            <img
                src={props.imageUrl}
                alt={`Menu Page ${props.number}`}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
            />
        </div>
    )
})

Page.displayName = 'Page'

import { useTranslation } from 'react-i18next'

export default function AmericanBar() {
    const { t } = useTranslation();
    const ref = useRef<HTMLElement>(null)
    const inView = useInView(ref, { once: true, margin: '-100px' })

    return (
        <section id="bar" ref={ref} className="relative py-24 px-4 z-1">
            {/* Gradient divider */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pinball-red/30 to-transparent" />

            <div className="max-w-6xl mx-auto">
                {/* Neon section title */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col items-center justify-center mb-16"
                >
                    <div className="mb-6 flex justify-center">
                        <h2 className="section-title text-pinball-red">
                            {t('american_bar.title')}
                        </h2>
                    </div>

                    <p className="font-body text-pinball-cream/70 text-center max-w-xl mx-auto">
                        {t('american_bar.description')}
                    </p>
                </motion.div>

                {/* 3D Interactive Magazine Menu */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center max-w-5xl mx-auto w-full relative"
                >
                    {/* Visual Hint for Desktop */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 1, duration: 0.8 }}
                        className={`hidden md:flex absolute top-1/2 left-[5%] xl:left-0 -translate-y-1/2 flex-col items-center gap-2 pointer-events-none z-10 transition-opacity duration-500`}
                    >
                        <div className="text-pinball-yellow/80 font-pixel text-xs tracking-widest animate-pulse whitespace-nowrap rotate-180" style={{ writingMode: 'vertical-rl' }}>
                            {t('american_bar.hint_desktop')}
                        </div>
                        <div className="animate-bounce mt-2 text-pinball-yellow/80">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                            </svg>
                        </div>
                    </motion.div>

                    <motion.div
                        className="w-full relative flex justify-center perspective-[1500px] px-2 sm:px-0"
                        whileHover={{ y: -10, scale: 1.02 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
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

                    {/* Interaction instruction */}
                    <div className="mt-8 text-pinball-cream/50 font-pixel text-xs tracking-widest animate-pulse flex items-center gap-3">
                        <span className="w-8 h-px bg-pinball-red/50" />
                        {t('american_bar.hint_mobile')}
                        <span className="w-8 h-px bg-pinball-red/50" />
                    </div>
                </motion.div>

                {/* Retro checkerboard accent */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="mt-12 h-4 mx-auto max-w-md"
                    style={{
                        background: `repeating-linear-gradient(
              90deg,
              #C41E2A 0px, #C41E2A 16px,
              #FFD700 16px, #FFD700 32px
            )`,
                        opacity: 0.3,
                    }}
                />
            </div>
        </section>
    )
}
