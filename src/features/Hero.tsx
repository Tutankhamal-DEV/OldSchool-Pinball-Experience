import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { Award, Ticket, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Hero() {
    const { t } = useTranslation();
    const ref = useRef<HTMLElement>(null)
    const inView = useInView(ref, { once: true })

    return (
        <section
            id="home"
            ref={ref}
            className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
            style={{ zIndex: 1 }}
        >
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">

                {/* ── Logo ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 30, filter: 'blur(10px)' }}
                    animate={inView ? { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' } : {}}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="mb-6 relative"
                >
                    {/* Background glow removed as per user request */}

                    <picture>
                        <source media="(max-width: 767px)" srcSet="/images/hero_logo-sm.webp" type="image/webp" />
                        <img
                            src="/images/hero_logo.webp"
                            alt="Old School Pinball & Arcade"
                            width={800}
                            height={637}
                            fetchPriority="high"
                            loading="eager"
                            decoding="async"
                            className="hero-logo-shadow w-[72%] sm:w-60 md:w-64 lg:w-80 mx-auto relative z-10 animate-float cursor-pointer hover:scale-110 transition-transform duration-300"
                        />
                    </picture>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.5, duration: 0.7, ease: 'easeOut' }}
                    className="mb-6 mt-2"
                >
                    <h1 className="sr-only">Old School Pinball and Arcade Bar</h1>
                    <p className="font-elegant text-pinball-cream tracking-wide text-2xl leading-tight sm:text-3xl md:text-4xl lg:text-5xl px-2">
                        {t('hero.title_part1')}<span>{t('hero.title_highlight')}</span>{t('hero.title_part2', '')}
                    </p>
                </motion.div>

                {/* ── Award Badge ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
                    transition={{ delay: 0.7, duration: 0.6, type: 'spring', bounce: 0.4 }}
                    className="mb-8 w-full max-w-[95vw] sm:max-w-none"
                >
                    <div className="inline-block border border-pinball-gold/30 rounded-full p-[1px] bg-gradient-to-r from-pinball-red/20 via-pinball-gold/20 to-pinball-red/20 mx-auto max-w-full">
                        <div className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 bg-pinball-black/95 backdrop-blur-md rounded-full max-w-full">
                            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-pinball-yellow flex-shrink-0 animate-pulse" />
                            <span className="font-body text-[10px] sm:text-xs md:text-sm text-pinball-cream/80 tracking-normal sm:tracking-wide text-center uppercase sm:normal-case truncate sm:whitespace-nowrap">
                                {t('hero.award_text')}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* ── CTA Buttons ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 1, duration: 0.6 }}
                    className="grid grid-cols-2 gap-2 sm:gap-4 mb-8 w-full max-w-[95vw] sm:max-w-xl mx-auto px-1"
                >
                    <a
                        href={`https://wa.me/5511915620127?text=${encodeURIComponent(t('hero.btn_tickets'))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-retro w-full flex flex-row items-center justify-center text-center text-[9px] sm:!text-base !px-0 !py-3 sm:!px-6 sm:!py-3 leading-tight whitespace-nowrap tracking-tighter sm:tracking-normal"
                    >
                        <Ticket className="w-3 h-3 sm:w-5 sm:h-5 mr-1 sm:mr-1 flex-shrink-0" />
                        <span>{t('hero.btn_tickets')}</span>
                    </a>

                    <a
                        href="#ingressos"
                        className="btn-retro w-full flex flex-row items-center justify-center text-center text-[9px] sm:!text-base !px-0 !py-3 sm:!px-6 sm:!py-3 leading-tight whitespace-nowrap tracking-tighter sm:tracking-normal"
                    >
                        <Info className="w-3 h-3 sm:w-5 sm:h-5 mr-1 sm:mr-1 flex-shrink-0" />
                        <span>{t('hero.btn_more')}</span>
                    </a>
                </motion.div>

                {/* ── Scroll indicator ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: 1.2, duration: 0.6 }}
                    className="mt-4 sm:mt-10 animate-float"
                >
                    <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-pinball-cream/20 rounded-full mx-auto flex justify-center">
                        <div className="w-1.5 h-2.5 sm:h-3 bg-pinball-cream/40 rounded-full mt-1.5 sm:mt-2 animate-pulse" />
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
