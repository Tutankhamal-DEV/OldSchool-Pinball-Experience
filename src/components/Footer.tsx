import { Instagram, Youtube, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const SOCIAL_LINKS = [
    { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/oldschoolpinball/' },
    { icon: Youtube, label: 'Youtube', href: 'https://www.youtube.com/@oldschoolpinball' },
    { icon: MapPin, label: 'Location', href: 'https://maps.app.goo.gl/227522752275' },
]

export default function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="relative border-t border-pinball-red/20 py-8 md:py-12 px-4 bg-transparent md:bg-black/25 z-50">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8 text-center sm:text-left">
                    {/* Brand */}
                    <div className="col-span-1 sm:col-span-2 md:col-span-1">
                        <h3 className="font-pixel text-pinball-yellow text-xs mb-3 md:mb-4">OLD SCHOOL</h3>
                        <p className="font-body text-sm text-pinball-cream/80 leading-relaxed max-w-md mx-auto sm:mx-0">
                            {t('footer.brand_description')}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-tech text-pinball-cream/70 text-sm mb-3 md:mb-4 uppercase tracking-wider">{t('footer.links_title')}</h4>
                        <nav className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <a
                                href="#ingressos"
                                className="block font-body text-sm text-pinball-cream/70
                    hover:text-pinball-red transition-colors duration-200"
                            >
                                {t('navbar.tickets')}
                            </a>
                            <a
                                href="#maquinas"
                                className="block font-body text-sm text-pinball-cream/70
                    hover:text-pinball-red transition-colors duration-200"
                            >
                                {t('navbar.machines')}
                            </a>
                            <a
                                href="#bar"
                                className="block font-body text-sm text-pinball-cream/70
                    hover:text-pinball-red transition-colors duration-200"
                            >
                                {t('navbar.bar')}
                            </a>
                            <a
                                href="#eventos"
                                className="block font-body text-sm text-pinball-cream/70
                    hover:text-pinball-red transition-colors duration-200"
                            >
                                {t('navbar.events', 'Eventos')}
                            </a>
                            <a
                                href="#contato"
                                className="col-span-2 block font-body text-sm text-pinball-cream/70
                    hover:text-pinball-red transition-colors duration-200"
                            >
                                {t('navbar.contact')}
                            </a>
                        </nav>
                    </div>

                    {/* Social */}
                    <div>
                        <h4 className="font-tech text-pinball-cream/70 text-sm mb-3 md:mb-4 uppercase tracking-wider">{t('footer.social_title')}</h4>
                        <div className="flex justify-center sm:justify-start gap-3">
                            {SOCIAL_LINKS.map((social) => {
                                const Icon = social.icon
                                return (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 rounded-lg bg-pinball-dark text-pinball-cream/50
                      hover:text-pinball-red hover:bg-pinball-red/10
                      transition-all duration-300"
                                        aria-label={social.label === 'Location' ? t('contact.info.address_label', 'Localização') : social.label}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </a>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-pinball-red/20 to-transparent mb-6" />

                {/* Copyright */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left drop-shadow-md">
                        <p className="font-mono font-bold text-sm md:text-base text-pinball-cream/80">
                            {t('footer.copyright').replace('2026', new Date().getFullYear().toString())}
                        </p>
                        <p className="font-mono font-bold text-xs md:text-sm text-pinball-cream/70 mt-2">
                            {t('footer.company_info')}
                        </p>
                    </div>
                    <div className="text-center sm:text-right flex flex-col items-center sm:items-end gap-2 drop-shadow-md mt-4 sm:mt-0">
                        <p className="font-mono font-bold text-sm md:text-base text-pinball-cream/80">
                            {t('footer.payment_info')}
                        </p>
                        <a
                            href="https://tutankhamal.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center sm:items-end font-pixel text-[0.5rem] md:text-[0.6rem] text-pinball-cream/40 hover:text-pinball-cream/60 transition-all duration-300 uppercase tracking-wider mt-2 group"
                        >
                            <span className="opacity-60 group-hover:opacity-80 transition-opacity mb-0.5 capitalize text-[0.45rem] md:text-[0.55rem]">
                                {String(t('footer.developer_credit')).split(':')[0]?.toLowerCase()}:
                            </span>
                            <span className="font-tech text-[0.65rem] md:text-xs tracking-widest">
                                <span className="glitch-text-red text-white group-hover:text-pinball-cream transition-colors duration-300" data-text="TUTANKHAMAL">TUTANKHAMAL</span>
                                <span className="text-pinball-cream/50 ml-1">DEV</span>
                            </span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
