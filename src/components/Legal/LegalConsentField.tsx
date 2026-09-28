import { useTranslation } from "react-i18next";
import { useLegal } from "./useLegal";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Галочка «ознакомлен» на экране регистрации.
 *
 * Пока документы не опубликованы, сервер отдаёт `enabled: false`, и поле не
 * рисуется вовсе — форма выглядит ровно как раньше. Появятся адреса и версия в
 * окружении сервера — поле появится само, без выкатки панели.
 *
 * Обязательность держится не только здесь: регистрацию без согласия отклоняет
 * сервер, потому что клиент может и соврать.
 */
export const LegalConsentField = ({ checked, onChange }: Props) => {
  const { t } = useTranslation();

  const { data: legal } = useLegal();

  if (!legal?.enabled) {
    return null;
  }

  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1.5 h-5 w-5 shrink-0 accent-cyan-bright"
      />
      <span className="text-lg text-white">
        {t("legal.consentPrefix")}{" "}
        <a
          href={legal.terms_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-bright underline underline-offset-4"
        >
          {t("legal.terms")}
        </a>{" "}
        {t("legal.and")}{" "}
        <a
          href={legal.privacy_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-bright underline underline-offset-4"
        >
          {t("legal.privacy")}
        </a>
      </span>
    </label>
  );
};
