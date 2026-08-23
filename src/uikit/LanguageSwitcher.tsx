import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../i18n";

/**
 * Both languages are always shown side by side; the active one is highlighted.
 * The choice is persisted by i18next's language detector (localStorage).
 */
export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  // Normalise "ru-RU" → "ru" so the active pill matches even for regioned tags.
  const current = i18n.resolvedLanguage ?? i18n.language;

  return (
    <div className="flex items-center rounded-full border border-cyan-bright/25 bg-[rgba(2,37,51,0.5)] p-0.5">
      {SUPPORTED_LANGUAGES.map((lang) => {
        const isActive = current === lang;
        return (
          <button
            key={lang}
            type="button"
            aria-pressed={isActive}
            onClick={() => void i18n.changeLanguage(lang)}
            className={`rounded-full px-3 py-1 font-mono text-sm uppercase tracking-widest transition-colors ${
              isActive
                ? "bg-cyan-bright/20 text-cyan-bright"
                : "text-grey hover:text-white"
            }`}
          >
            {lang}
          </button>
        );
      })}
    </div>
  );
};
