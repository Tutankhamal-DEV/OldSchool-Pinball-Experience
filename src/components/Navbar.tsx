import { useState, useEffect, useRef, useCallback } from "react";
import {
  Menu,
  X,
  Ticket,
  Home,
  Sparkles,
  Coffee,
  Gamepad2,
  PlaySquare,
  Calendar,
  Mail,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

// Removing labels from here to evaluate them dynamically inside the component via translations
const NAV_LINKS_BASE = [
  { href: "#home", sectionId: "home", key: "home", Icon: Home },
  { href: "#sobre", sectionId: "sobre", key: "atmosphere", Icon: Sparkles },
  { href: "#bar", sectionId: "bar", key: "bar", Icon: Coffee },
  { href: "#maquinas", sectionId: "maquinas", key: "machines", Icon: Gamepad2 },
  { href: "#midia", sectionId: "midia", key: "media", Icon: PlaySquare },
  { href: "#eventos", sectionId: "eventos", key: "events", Icon: Calendar },
  { href: "#ingressos", sectionId: "ingressos", key: "tickets", Icon: Ticket },
  { href: "#contato", sectionId: "contato", key: "contact", Icon: Mail },
];

type NavbarProps = {
  activeSection?: string;
};

export default function Navbar({ activeSection = "home" }: NavbarProps) {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [overflowed, setOverflowed] = useState(false);

  // Refs for overflow detection
  const barRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Dynamic overflow detection — switches to hamburger when items don't fit
  const checkOverflow = useCallback(() => {
    // Defer measurement to next frame to batch reads/writes and avoid forced reflow
    requestAnimationFrame(() => {
      const bar = barRef.current;
      const links = linksRef.current;
      if (!bar || !links) return;

      // Temporarily show links to measure their natural width
      const wasHidden = links.style.display;
      links.style.display = "flex";
      links.style.visibility = "hidden";
      links.style.position = "absolute";

      // Total width consumed by: logo (~60px gap) + links + right side elements
      const logoEl = bar.querySelector("[data-nav-logo]") as HTMLElement | null;
      const rightEl = bar.querySelector(
        "[data-nav-right]",
      ) as HTMLElement | null;

      const logoWidth = logoEl ? logoEl.offsetWidth + 16 : 80; // 16px gap
      const rightWidth = rightEl ? rightEl.offsetWidth + 16 : 200;
      const linksWidth = links.scrollWidth;
      const availableWidth = bar.clientWidth;

      // Add a safety margin (24px) to prevent any visual collision
      const totalNeeded = logoWidth + linksWidth + rightWidth + 24;

      // Restore original state
      links.style.display = wasHidden;
      links.style.visibility = "";
      links.style.position = "";

      setOverflowed(totalNeeded > availableWidth);
    });
  }, []);

  // Observe for resize and language changes
  useEffect(() => {
    checkOverflow();

    const ro = new ResizeObserver(() => {
      checkOverflow();
    });

    if (barRef.current) {
      ro.observe(barRef.current);
    }

    window.addEventListener("resize", checkOverflow);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", checkOverflow);
    };
  }, [checkOverflow]);

  // Re-check when language changes (translated labels may have different widths)
  useEffect(() => {
    // Small delay to let the DOM update with new text
    const timer = setTimeout(checkOverflow, 50);
    return () => clearTimeout(timer);
  }, [i18n.language, checkOverflow]);

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        scrolled
          ? "bg-pinball-black/90 backdrop-blur-md shadow-lg shadow-pinball-red/10"
          : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={barRef}
          className="flex items-center justify-between h-16 flex-nowrap whitespace-nowrap"
        >
          {/* Logo */}
          <a
            href="#home"
            className="flex items-center gap-2 group flex-shrink-0"
            data-nav-logo
          >
            <img
              src="/images/logo_oldschool_vector_600p.svg"
              alt="Old School Pinball"
              width={600}
              height={478}
              className="h-10 w-auto object-contain
                group-hover:brightness-125 transition-all duration-300"
            />
          </a>

          {/* Desktop Nav — hidden when overflowed */}
          <div
            ref={linksRef}
            className={`items-center gap-1 flex-nowrap whitespace-nowrap overflow-hidden ${
              overflowed ? "hidden" : "flex"
            }`}
          >
            {NAV_LINKS_BASE.map((link) => {
              const isActive = activeSection === link.sectionId;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-2 font-tech text-sm transition-colors duration-300 group ${
                    isActive
                      ? "text-pinball-red"
                      : "text-pinball-cream/80 hover:text-white"
                  }`}
                >
                  {t(`navbar.${link.key}`)}
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-pinball-red rounded-full transition-all duration-300 ${
                      isActive ? "w-4/5" : "w-0 group-hover:w-4/5"
                    }`}
                  />
                </a>
              );
            })}
          </div>

          {/* Right — CTA */}
          <div
            className="flex items-center gap-1 sm:gap-3 flex-nowrap whitespace-nowrap flex-shrink-0"
            data-nav-right
          >
            <LanguageSwitcher />

            <a
              href="#ingressos"
              className={`btn-retro btn-retro-nav gap-2 ${overflowed ? "!hidden" : "!inline-flex"}`}
            >
              <Ticket className="w-4 h-4 mr-2" />
              {t("navbar.buy_online")}
            </a>

            {/* Mobile hamburger — visible when overflowed */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`p-2 text-pinball-cream ${overflowed ? "" : "hidden"}`}
              aria-label={t("navbar.menu")}
            >
              {mobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer — visible when overflowed */}
      <div
        className={`fixed left-0 right-0 top-16 h-[calc(100vh-4rem)] bg-pinball-black/95 backdrop-blur-lg border-t border-pinball-red/20 overflow-y-auto transition-all duration-300 ${
          !overflowed ? "hidden" : ""
        } ${
          mobileOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-8 pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center justify-start py-6 px-6 space-y-2">
          {NAV_LINKS_BASE.map((link) => {
            const isActive = activeSection === link.sectionId;
            const Icon = link.Icon;
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-center w-full max-w-[250px] py-2 px-4 font-tech rounded-lg transition-colors duration-200 ${
                  isActive
                    ? "text-pinball-red bg-pinball-red/10"
                    : "text-pinball-cream/80 hover:text-pinball-yellow hover:bg-pinball-red/10"
                }`}
              >
                <Icon className="w-5 h-5 mr-3 opacity-80" />
                <span>{t(`navbar.${link.key}`)}</span>
              </a>
            );
          })}
          <div className="w-full max-w-[250px] pt-4 mt-2 border-t border-pinball-red/20">
            <a
              href="#ingressos"
              className="!flex w-full justify-center btn-retro text-center text-xs py-2"
            >
              <Ticket className="w-5 h-5 mr-2 inline-block" />
              {t("navbar.buy_online")}
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
