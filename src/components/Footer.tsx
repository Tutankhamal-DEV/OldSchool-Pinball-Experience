import { Instagram, Youtube, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

const SOCIAL_LINKS = [
  {
    icon: Instagram,
    label: "Instagram",
    href: "https://www.instagram.com/oldschoolpinball/",
  },
  {
    icon: Youtube,
    label: "Youtube",
    href: "https://www.youtube.com/@oldschoolpinball",
  },
  {
    icon: MapPin,
    label: "Location",
    href: "https://maps.app.goo.gl/227522752275",
  },
];

const FOOTER_NAV = [
  { href: "#home", key: "home" },
  { href: "#sobre", key: "atmosphere" },
  { href: "#bar", key: "bar" },
  { href: "#maquinas", key: "machines" },
  { href: "#midia", key: "media" },
  { href: "#eventos", key: "events" },
  { href: "#ingressos", key: "tickets" },
  { href: "#contato", key: "contact" },
];

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="relative border-t border-pinball-red/20 py-8 md:py-12 px-4 bg-transparent md:bg-black/25 z-50">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-8">
          {/* Brand */}
          <div className="text-center sm:text-left">
            <h3 className="font-pixel text-pinball-yellow text-xs mb-3">
              OLD SCHOOL
            </h3>
            <p className="font-body text-sm text-pinball-cream/80 leading-relaxed">
              {t("footer.brand_description")}
            </p>
          </div>

          {/* Quick Links — all sections */}
          <div className="text-center sm:text-left">
            <h4 className="font-tech text-pinball-cream/70 text-sm mb-3 uppercase tracking-wider">
              {t("footer.links_title")}
            </h4>
            <nav className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {FOOTER_NAV.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="font-body text-sm text-pinball-cream/60 hover:text-pinball-red transition-colors duration-200"
                >
                  {t(`navbar.${link.key}`)}
                </a>
              ))}
            </nav>
          </div>

          {/* Social */}
          <div className="text-center sm:text-left">
            <h4 className="font-tech text-pinball-cream/70 text-sm mb-3 uppercase tracking-wider">
              {t("footer.social_title")}
            </h4>
            <div className="flex justify-center sm:justify-start gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg bg-pinball-dark text-pinball-cream/50
                      hover:text-pinball-red hover:bg-pinball-red/10
                      transition-all duration-300"
                    aria-label={
                      social.label === "Location"
                        ? t("contact.info.address_label", "Localização")
                        : social.label
                    }
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-pinball-red/20 to-transparent mb-6" />

        {/* Copyright & Payment */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="drop-shadow-md">
            <p className="font-mono font-bold text-sm text-pinball-cream/80">
              {t("footer.copyright").replace(
                "2026",
                new Date().getFullYear().toString(),
              )}
            </p>
            <p className="font-mono font-bold text-xs text-pinball-cream/70 mt-1">
              {t("footer.company_info")}
            </p>
          </div>
          <p className="font-mono font-bold text-sm text-pinball-cream/80 drop-shadow-md">
            {t("footer.payment_info")}
          </p>
        </div>
      </div>

      {/* Developer Credit — centered, always last */}
      <div className="flex justify-center mt-8 pt-6 border-t border-white/5">
        <a
          href="https://tutankhamal.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center font-pixel text-[0.5rem] md:text-[0.6rem] text-pinball-cream/50 hover:text-pinball-cream/80 transition-all duration-300 uppercase tracking-wider group"
        >
          <span className="mb-0.5 capitalize text-[0.5rem] md:text-[0.55rem]">
            {String(t("footer.developer_credit")).split(":")[0]?.toLowerCase()}:
          </span>
          <span className="font-tech text-[0.7rem] md:text-xs tracking-widest">
            <span
              className="glitch-text-red text-white group-hover:text-pinball-cream transition-colors duration-300"
              data-text="TUTANKHAMAL"
            >
              TUTANKHAMAL
            </span>
            <span className="text-pinball-cream/60 ml-1">DEV</span>
          </span>
        </a>
      </div>
    </footer>
  );
}
