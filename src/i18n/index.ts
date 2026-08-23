import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ru from "./locales/ru.json";
import uz from "./locales/uz.json";

/** The languages the admin panel ships with; also drives the switcher. */
export const SUPPORTED_LANGUAGES = ["ru", "uz"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      uz: { translation: uz },
    },
    fallbackLng: "ru",
    supportedLngs: SUPPORTED_LANGUAGES,
    // The choice is remembered across sessions under this key.
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "sttm-admin-lang",
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
