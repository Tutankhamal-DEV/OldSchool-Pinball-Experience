import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import pt from './locales/pt/translation.json';
import en from './locales/en/translation.json';
import es from './locales/es/translation.json';
import fr from './locales/fr/translation.json';
import de from './locales/de/translation.json';
import it from './locales/it/translation.json';
import ja from './locales/ja/translation.json';
import zh from './locales/zh/translation.json';
import ko from './locales/ko/translation.json';
import ru from './locales/ru/translation.json';
import ar from './locales/ar/translation.json';
import hi from './locales/hi/translation.json';
import nl from './locales/nl/translation.json';
import tr from './locales/tr/translation.json';
import pl from './locales/pl/translation.json';
import sv from './locales/sv/translation.json';
import id from './locales/id/translation.json';
import vi from './locales/vi/translation.json';

// Configure the resources object
const resources = {
    pt: { translation: pt },
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
    it: { translation: it },
    ja: { translation: ja },
    zh: { translation: zh },
    ko: { translation: ko },
    ru: { translation: ru },
    ar: { translation: ar },
    hi: { translation: hi },
    nl: { translation: nl },
    tr: { translation: tr },
    pl: { translation: pl },
    sv: { translation: sv },
    id: { translation: id },
    vi: { translation: vi },
};

i18n
    // Detect user language
    .use(LanguageDetector)
    // Pass the i18n instance to react-i18next
    .use(initReactI18next)
    // Initialize i18next
    .init({
        resources,
        fallbackLng: 'pt', // Portuguese as the fallback language since the original site is in PT
        supportedLngs: ['pt', 'en', 'es', 'fr', 'de', 'it', 'ja', 'zh', 'ko', 'ru', 'ar', 'hi', 'nl', 'tr', 'pl', 'sv', 'id', 'vi'],

        interpolation: {
            escapeValue: false, // React already safe from xss
        },

        detection: {
            order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage', 'cookie'],
        }
    });

export default i18n;
