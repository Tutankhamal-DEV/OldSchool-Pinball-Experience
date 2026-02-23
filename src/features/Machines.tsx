import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'motion/react'
import { useTranslation } from 'react-i18next'

interface Machine {
    name: string
    category: 'pinball' | 'arcade'
    year?: number
    detail?: string
}

const MACHINES: Machine[] = [
    // ── Pinball (from production site) ──
    { name: 'A.G. Football', category: 'pinball', year: 1991 },
    { name: 'Batman', category: 'pinball', year: 2016 },
    { name: 'Baseball', category: 'pinball', year: 1957 },
    { name: 'Cavaleiro Negro', category: 'pinball', year: 1980 },
    { name: 'Cirqus Voltaire', category: 'pinball', year: 1997 },
    { name: 'Fire Action', category: 'pinball', year: 1980 },
    { name: 'Game of Thrones', category: 'pinball', year: 2015 },
    { name: 'Guardians of the Galaxy', category: 'pinball', year: 2017 },
    { name: 'Hawkman', category: 'pinball', year: 1981 },
    { name: 'Jack Bot', category: 'pinball', year: 1995 },
    { name: 'Jack in the Box', category: 'pinball', year: 1973 },
    { name: 'Jet Spin', category: 'pinball', year: 1977 },
    { name: 'Junk Yard', category: 'pinball', year: 1996 },
    { name: 'Medieval Madness', category: 'pinball', year: 1997 },
    { name: 'Metallica', category: 'pinball', year: 2013 },
    { name: 'Oba-Oba', category: 'pinball', year: 1978 },
    { name: 'OXO', category: 'pinball', year: 1973 },
    { name: 'Revenge From Mars', category: 'pinball', year: 1999 },
    { name: 'Royal Flush', category: 'pinball', year: 1976 },
    { name: 'Scared Stiff', category: 'pinball', year: 1996 },
    { name: 'Stargate', category: 'pinball', year: 1995 },
    { name: 'Star Wars SEGA', category: 'pinball', year: 1997 },
    { name: 'Sure Shot', category: 'pinball', year: 1981 },
    { name: 'The Wizard of Oz', category: 'pinball', year: 2013 },
    { name: 'The Beatles', category: 'pinball', year: 2018 },
    { name: 'Vortex', category: 'pinball', year: 1980 },
    // ── Arcades & Other Games ──
    { name: 'Bebometro', category: 'arcade', detail: 'machines.machine_details.sobriety_test' },
    { name: 'Lucky & Wild', category: 'arcade', year: 1993, detail: 'machines.machine_details.shooting_arcade' },
    { name: 'Mini Arcade Classics', category: 'arcade', detail: 'machines.machine_details.multi_game_3x' },
    { name: 'Pandora 6', category: 'arcade', detail: 'machines.machine_details.multi_game_2x' },
    { name: 'Pandora Alpha Plus', category: 'arcade', detail: 'machines.machine_details.multi_game' },
    { name: 'Pebolim', category: 'arcade', detail: 'machines.machine_details.foosball' },
    { name: 'Pong', category: 'arcade', detail: 'machines.machine_details.digital_ping_pong' },
    { name: 'Real Puncher', category: 'arcade', detail: 'machines.machine_details.punch' },
    { name: 'Super Monaco GP SEGA', category: 'arcade', year: 1989 },
    { name: 'Terminator 2', category: 'arcade', detail: 'machines.machine_details.shooting_arcade' },
    { name: 'Vortex', category: 'arcade', detail: 'machines.machine_details.reflex_test' },
]

const BANNER_SLIDES = [
    { src: '/images/ambiente_04.webp', mobile: '/images/ambiente_04-sm.webp' },
    { src: '/images/pinball_machines_1.webp' },
    { src: '/images/ambiente_do_bar-sm.webp' },
];

export default function Machines() {
    const { t } = useTranslation();
    const ref = useRef<HTMLElement>(null)
    const inView = useInView(ref, { once: true, margin: '-100px' })

    const [currentSlide, setCurrentSlide] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [])

    const sortedMachines = [...MACHINES].sort((a, b) => a.name.localeCompare(b.name))

    const groupedMachines = {
        [t('machines.groups.arcades')]: sortedMachines.filter(m => m.category === 'arcade'),
        [t('machines.groups.pinballs')]: sortedMachines.filter(m => m.category === 'pinball'),
    }

    return (
        <section id="maquinas" ref={ref} className="relative py-24 px-4 z-1">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="section-title text-pinball-yellow">{t('machines.title')}</h2>
                    <p className="font-body text-pinball-cream/70 mt-6 max-w-xl mx-auto">
                        {t('machines.description')}
                    </p>
                </motion.div>

                {/* Hero Banner Carousel */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.2, duration: 0.7 }}
                    className="relative overflow-hidden rounded-lg border-2 border-pinball-red/20 mb-10 group bg-pinball-black"
                >
                    <div className="aspect-[21/9] relative">
                        {BANNER_SLIDES.map((slide, index) => (
                            <div
                                key={index}
                                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                                    }`}
                            >
                                <picture>
                                    {slide.mobile && (
                                        <source media="(max-width: 768px)" srcSet={slide.mobile} />
                                    )}
                                    <img
                                        src={slide.src}
                                        alt={`Pinball and Arcade Area - Slide ${index + 1}`}
                                        className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-linear ${index === currentSlide ? 'scale-110' : 'scale-100'
                                            }`}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </picture>
                            </div>
                        ))}
                        <div className="absolute inset-0 bg-gradient-to-t from-pinball-black/60 via-transparent to-pinball-black/30 z-20 pointer-events-none" />

                        {/* Carousel Indicators */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-30">
                            {BANNER_SLIDES.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentSlide(i)}
                                    className={`h-2 rounded-full transition-all duration-300 ${currentSlide === i ? 'bg-pinball-red w-6' : 'w-2 bg-white/40 hover:bg-white/70'
                                        }`}
                                    aria-label={`Ver slide ${i + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Static label */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="flex justify-center mb-10"
                >
                    <span className="px-5 py-2 rounded-full font-tech text-sm bg-pinball-red text-white shadow-lg shadow-pinball-red/30">
                        {t('machines.list_label', 'Lista de Máquinas')}
                    </span>
                </motion.div>

                {/* Machine List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.1, duration: 0.6 }}
                    className="glass-panel p-4 md:p-8 max-w-5xl w-full mx-auto"
                >
                    {Object.entries(groupedMachines).map(([catName, machines]) => machines.length > 0 && (
                        <div key={catName} className="mb-6 last:mb-0">
                            <h3 className="font-pixel text-sm sm:text-base text-pinball-yellow mb-3 border-b border-white/10 pb-2">
                                {catName}
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-2 sm:gap-x-6 gap-y-1">
                                {machines.map((machine, i) => (
                                    <div
                                        key={`${machine.name}-${machine.category}-${i}`}
                                        className="flex items-center justify-between group py-1 px-1 sm:px-2 rounded hover:bg-white/5 transition-colors overflow-hidden"
                                    >
                                        <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden w-full">
                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${machine.category === 'pinball' ? 'bg-pinball-red' : 'bg-pinball-neon-blue'
                                                } shadow-[0_0_8px_currentColor] opacity-50 group-hover:opacity-100 transition-opacity`} />
                                            <p className="font-tech text-xs sm:text-sm text-pinball-cream/80 group-hover:text-pinball-yellow transition-colors duration-300 truncate">
                                                {machine.name} {machine.detail && <span className="opacity-50 text-[9px] sm:text-[10px] ml-1 uppercase">{t(machine.detail)}</span>}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Count */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: 1, duration: 0.4 }}
                    className="text-center mt-8 font-mono text-sm text-pinball-cream/40"
                >
                    {sortedMachines.length} {t('machines.count_machines')} {t('machines.count_total')}
                </motion.p>
            </div>
        </section>
    )
}
