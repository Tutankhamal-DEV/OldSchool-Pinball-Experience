import { useState, useEffect } from 'react'
import { Menu, X, Ticket, Home, Sparkles, Coffee, Gamepad2, PlaySquare, Calendar, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

// Removing labels from here to evaluate them dynamically inside the component via translations
const NAV_LINKS_BASE = [
    { href: '#home', sectionId: 'home', key: 'home', Icon: Home },
    { href: '#sobre', sectionId: 'sobre', key: 'atmosphere', Icon: Sparkles },
    { href: '#bar', sectionId: 'bar', key: 'bar', Icon: Coffee },
    { href: '#maquinas', sectionId: 'maquinas', key: 'machines', Icon: Gamepad2 },
    { href: '#midia', sectionId: 'midia', key: 'media', Icon: PlaySquare },
    { href: '#eventos', sectionId: 'eventos', key: 'events', Icon: Calendar },
    { href: '#ingressos', sectionId: 'ingressos', key: 'tickets', Icon: Ticket },
    { href: '#contato', sectionId: 'contato', key: 'contact', Icon: Mail },
]

type NavbarProps = {
    activeSection?: string;
}

export default function Navbar({ activeSection = 'home' }: NavbarProps) {
    const { t } = useTranslation();
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled
                ? 'bg-pinball-black/90 backdrop-blur-md shadow-lg shadow-pinball-red/10'
                : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 flex-nowrap whitespace-nowrap">
                    {/* Logo */}
                    <a href="#home" className="flex items-center gap-2 group flex-shrink-0">
                        <img
                            src="/images/nav_logo_oldschool.avif"
                            alt="Old School Pinball"
                            className="h-10 w-auto object-contain
                group-hover:brightness-125 transition-all duration-300"
                        />
                    </a>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-1 flex-nowrap whitespace-nowrap overflow-hidden">
                        {NAV_LINKS_BASE.map((link) => {
                            const isActive = activeSection === link.sectionId
                            return (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className={`relative px-3 py-2 font-tech text-sm transition-colors duration-300 group ${isActive
                                        ? 'text-pinball-red'
                                        : 'text-pinball-cream/80 hover:text-white'
                                        }`}
                                >
                                    {t(`navbar.${link.key}`)}
                                    <span
                                        className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-pinball-red rounded-full transition-all duration-300 ${isActive ? 'w-4/5' : 'w-0 group-hover:w-4/5'
                                            }`}
                                    />
                                </a>
                            )
                        })}
                    </div>

                    {/* Right — CTA */}
                    <div className="flex items-center gap-1 sm:gap-3 flex-nowrap whitespace-nowrap flex-shrink-0">
                        <LanguageSwitcher />

                        <a
                            href="https://wa.me/5511915620127"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="max-lg:!hidden lg:!inline-flex btn-retro btn-retro-nav gap-2"
                        >
                            <Ticket className="w-4 h-4 mr-2" />
                            {t('navbar.buy_online')}
                        </a>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="lg:hidden p-2 text-pinball-cream"
                            aria-label={t('navbar.menu')}
                        >
                            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile drawer */}
            <div
                className={`lg:hidden fixed left-0 right-0 top-16 h-[calc(100vh-4rem)] bg-pinball-black/95 backdrop-blur-lg border-t border-pinball-red/20 overflow-y-auto transition-all duration-300 ${mobileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'
                    }`}
            >
                <div className="flex flex-col items-center justify-start py-6 px-6 space-y-2">
                    {NAV_LINKS_BASE.map((link) => {
                        const isActive = activeSection === link.sectionId
                        const Icon = link.Icon;
                        return (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center justify-center w-full max-w-[250px] py-2 px-4 font-tech rounded-lg transition-colors duration-200 ${isActive
                                    ? 'text-pinball-red bg-pinball-red/10'
                                    : 'text-pinball-cream/80 hover:text-pinball-yellow hover:bg-pinball-red/10'
                                    }`}
                            >
                                <Icon className="w-5 h-5 mr-3 opacity-80" />
                                <span>{t(`navbar.${link.key}`)}</span>
                            </a>
                        )
                    })}
                    <div className="w-full max-w-[250px] pt-4 mt-2 border-t border-pinball-red/20">
                        <a
                            href="https://wa.me/5511915620127"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="!flex w-full justify-center btn-retro text-center text-xs py-2"
                        >
                            <Ticket className="w-5 h-5 mr-2 inline-block" />
                            {t('navbar.buy_online')}
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    )
}
