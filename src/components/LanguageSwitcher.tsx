import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown } from "lucide-react";
import { loadLanguage } from "../i18n";

const LANGUAGES = [
  { code: "pt", name: "Português" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "ja", name: "日本語" },
  { code: "zh", name: "中文" },
  { code: "ko", name: "한국어" },
  { code: "ru", name: "Русский" },
  { code: "ar", name: "العربية" },
  { code: "hi", name: "हिन्दी" },
  { code: "nl", name: "Nederlands" },
  { code: "tr", name: "Türkçe" },
  { code: "pl", name: "Polski" },
  { code: "sv", name: "Svenska" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "vi", name: "Tiếng Việt" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const changeLanguage = async (lng: string) => {
    await loadLanguage(lng); // Pre-load bundle so resolvedLanguage updates correctly
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  // Outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLang =
    LANGUAGES.find(
      (lang) =>
        lang.code === i18n.resolvedLanguage || lang.code === i18n.language,
    ) || LANGUAGES[0];

  return (
    <div className="relative z-[100]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-retro btn-retro-nav flex items-center gap-1.5"
        aria-label="Select Language"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline-block uppercase">
          {currentLang?.code || "pt"}
        </span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`!absolute right-0 top-full mt-2 min-w-[11rem] max-h-64 overflow-y-auto bg-black/90 backdrop-blur-md border-2 border-pinball-red/40 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.8)] custom-scrollbar transition-all duration-300 origin-top ${isOpen
            ? "opacity-100 scale-y-100"
            : "opacity-0 scale-y-0 pointer-events-none"
          }`}
      >
        <div className="p-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center whitespace-nowrap text-left px-3 py-2 text-xs font-tech rounded transition-colors duration-200 ${(i18n.resolvedLanguage || i18n.language) === lang.code
                  ? "bg-pinball-red/20 text-pinball-yellow"
                  : "text-pinball-cream/70 hover:bg-pinball-red/10 hover:text-white"
                }`}
            >
              <span className="inline-block w-6 text-pinball-red/70">
                {lang.code.toUpperCase()}
              </span>
              {lang.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
