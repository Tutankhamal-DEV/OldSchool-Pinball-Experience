import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Only bundle the fallback language (pt) upfront — all others load on demand
import pt from "./locales/pt/translation.json";

const SUPPORTED_LANGS = [
  "pt", "en", "es", "fr", "de", "it", "ja", "zh",
  "ko", "ru", "ar", "hi", "nl", "tr", "pl", "sv", "id", "vi",
] as const;

// Lazy-load map using Vite's dynamic import (each language becomes its own chunk)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LAZY_LOADERS: Record<string, () => Promise<{ default: any }>> = {
  en: () => import("./locales/en/translation.json"),
  es: () => import("./locales/es/translation.json"),
  fr: () => import("./locales/fr/translation.json"),
  de: () => import("./locales/de/translation.json"),
  it: () => import("./locales/it/translation.json"),
  ja: () => import("./locales/ja/translation.json"),
  zh: () => import("./locales/zh/translation.json"),
  ko: () => import("./locales/ko/translation.json"),
  ru: () => import("./locales/ru/translation.json"),
  ar: () => import("./locales/ar/translation.json"),
  hi: () => import("./locales/hi/translation.json"),
  nl: () => import("./locales/nl/translation.json"),
  tr: () => import("./locales/tr/translation.json"),
  pl: () => import("./locales/pl/translation.json"),
  sv: () => import("./locales/sv/translation.json"),
  id: () => import("./locales/id/translation.json"),
  vi: () => import("./locales/vi/translation.json"),
};

// Load a language on demand and add it to i18n
export async function loadLanguage(lng: string | undefined) {
  if (!lng || lng === "pt" || i18n.hasResourceBundle(lng, "translation")) return;
  const loader = LAZY_LOADERS[lng];
  if (!loader) return;
  const mod = await loader();
  i18n.addResourceBundle(lng, "translation", mod.default, true, true);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
    },
    fallbackLng: "pt",
    supportedLngs: [...SUPPORTED_LANGS],

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag"],
      caches: ["localStorage", "cookie"],
    },
  });

// After init, load the detected language if it's not pt
const detected = (i18n.language || "pt").split("-")[0];
if (detected !== "pt") {
  loadLanguage(detected);
}

// Load language bundles on the fly when the user switches languages
i18n.on("languageChanged", (lng) => {
  const base = lng.split("-")[0];
  loadLanguage(base);
});

export default i18n;
