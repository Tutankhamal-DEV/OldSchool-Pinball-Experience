import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'motion/react'
import { Gamepad2, Music, Zap, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const AREAS = [
    {
        id: 'batman',
        title: 'Cantinho do Batman',
        description: 'Um canto dedicado ao Cavaleiro das Trevas com colecionáveis, artes e a atmosfera sombria de Gotham City.',
        icon: Zap,
        accent: 'text-pinball-yellow',
        image: '/images/ambiente_01.webp',
    },
    {
        id: 'geek',
        title: 'Ambiente Geek & Star Wars',
        description: 'Action figures, pôsteres vintage, luminosos neon e toda a cultura pop dos anos 80 e 90 reunida num espaço temático intergaláctico.',
        icon: Gamepad2,
        accent: 'text-pinball-red',
        image: '/images/ambiente_05.webp',
        hoverImage: '/images/ambiente-retro-starwars.webp'
    },
    {
        id: 'dance',
        title: 'Pista de Dança & DJ',
        description: 'Dance ao som dos maiores hits dos anos 80 e 90 comandados pelo nosso DJ ao vivo! Iluminação retrô e muita energia na batida certa.',
        icon: Music,
        accent: 'text-pinball-neon-pink',
        image: '/images/dj-na-pista.avif',
    },
]

export default function Atmosphere() {
    const { t } = useTranslation();
    const ref = useRef<HTMLElement>(null)
    const inView = useInView(ref, { once: true, margin: '-100px' })

    const [selectedArea, setSelectedArea] = useState<typeof AREAS[0] | null>(null)

    return (
        <section id="sobre" ref={ref} className="relative py-24 px-4 z-1">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="section-title text-pinball-red">{t('atmosphere.title')}</h2>
                    <p className="font-body text-pinball-cream/70 mt-6 max-w-xl mx-auto">
                        {t('atmosphere.description')}
                    </p>
                </motion.div>

                <div className="space-y-6">
                    {AREAS.map((area, i) => {
                        const Icon = area.icon
                        return (
                            <motion.div
                                key={area.id}
                                onClick={() => setSelectedArea(area)}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                                animate={inView ? { opacity: 1, x: 0 } : {}}
                                transition={{ delay: 0.2 + i * 0.2, duration: 0.7 }}
                                className="relative group transition-transform duration-500 glass-panel cursor-pointer"
                            >
                                {/* Background photo */}
                                <div className="absolute inset-0 overflow-hidden rounded-lg z-0">
                                    <picture>
                                        {!area.image.endsWith('.avif') && (
                                            <source media="(max-width: 768px)" srcSet={area.image.replace('.webp', '-sm.webp')} />
                                        )}
                                        <img
                                            src={area.image}
                                            alt={t(`atmosphere.areas.${area.id}.title`)}
                                            width={800}
                                            height={600}
                                            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${area.hoverImage ? 'transition-all duration-700 group-hover:opacity-0' : ''}`}
                                            loading="lazy"
                                        />
                                    </picture>
                                    {area.hoverImage && (
                                        <picture>
                                            {!area.hoverImage.endsWith('.avif') && (
                                                <source media="(max-width: 768px)" srcSet={area.hoverImage.replace('.webp', '-sm.webp')} />
                                            )}
                                            <img
                                                src={area.hoverImage}
                                                alt={`${t(`atmosphere.areas.${area.id}.title`)} - alternativo`}
                                                width={800}
                                                height={600}
                                                className="absolute inset-0 w-full h-full object-cover transition-all duration-700 opacity-0 group-hover:opacity-100 group-hover:scale-110"
                                                loading="lazy"
                                            />
                                        </picture>
                                    )}
                                    {/* Dark overlay for text readability */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-pinball-black/85 via-pinball-black/70 to-pinball-black/50" />
                                </div>

                                {/* Content */}
                                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center gap-6">
                                    <div className={`p-4 rounded-lg bg-pinball-black/50 border-2 border-current/20 backdrop-blur-sm ${area.accent}`}>
                                        <Icon className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <h3 className={`font-pixel text-sm md:text-base mb-3 ${area.accent}`}>
                                            {t(`atmosphere.areas.${area.id}.title`)}
                                        </h3>
                                        <p className="font-body text-pinball-cream/80 max-w-lg">
                                            {t(`atmosphere.areas.${area.id}.desc`)}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Modal for expanded view */}
                <AnimatePresence>
                    {selectedArea && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedArea(null)}
                                className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer"
                            />

                            {/* Modal Content */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="relative w-full max-w-5xl bg-[#0a0a0a] glass-panel z-10 flex flex-col md:flex-row max-h-[90vh] shadow-[0_0_50px_rgba(0,0,0,0.8)]"
                            >
                                {/* We need a wrapper for overflow hidden to not clip the glass-panel border */}
                                <div className="absolute inset-0 overflow-hidden rounded-lg z-0 pointer-events-none"></div>
                                <button
                                    onClick={() => setSelectedArea(null)}
                                    aria-label="Fechar modal"
                                    className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-pinball-red text-white rounded-full transition-colors flex items-center justify-center backdrop-blur-md"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Image Half */}
                                <div className="w-full md:w-3/5 h-[35vh] md:h-auto min-h-[40vh] relative overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-tr-none z-10">
                                    <picture>
                                        {!(selectedArea.hoverImage || selectedArea.image).endsWith('.avif') && (
                                            <source media="(max-width: 768px)" srcSet={(selectedArea.hoverImage || selectedArea.image).replace('.webp', '-sm.webp')} />
                                        )}
                                        <img
                                            src={selectedArea.hoverImage || selectedArea.image}
                                            alt={t(`atmosphere.areas.${selectedArea.id}.title`)}
                                            width={800}
                                            height={600}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </picture>
                                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent md:hidden" />
                                    <div className="hidden md:block absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
                                </div>

                                {/* Content Half */}
                                <div className="w-full md:w-2/5 p-6 md:p-10 flex flex-col justify-center overflow-y-auto">
                                    <div className={`w-14 h-14 rounded-lg bg-black/50 border-2 border-current/20 flex items-center justify-center mb-6 shadow-lg ${selectedArea.accent}`}>
                                        <selectedArea.icon className="w-7 h-7" />
                                    </div>
                                    <h3 className={`font-pixel text-xl md:text-2xl lg:text-3xl mb-6 ${selectedArea.accent} drop-shadow-[0_0_10px_currentColor]`}>
                                        {t(`atmosphere.areas.${selectedArea.id}.title`)}
                                    </h3>
                                    <p className="font-body text-pinball-cream/90 text-base md:text-lg leading-relaxed">
                                        {t(`atmosphere.areas.${selectedArea.id}.desc`)}
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    )
}
