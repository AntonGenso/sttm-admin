import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { acceptLegal } from "../../api/legal";
import { useLegal } from "./useLegal";
import { useAuthStore } from "../../store/authStore";

/**
 * Согласие с правилами для тех, кто зарегистрировался раньше, чем документы
 * появились.
 *
 * Окно намеренно без крестика и без закрытия по Escape или клику мимо: пока
 * согласие не дано, пользоваться панелью нельзя. Это не всплывающая подсказка,
 * а условие доступа.
 *
 * Пока документы не опубликованы, `enabled` приходит false и окно не
 * показывается вовсе — механизм лежит выключенным.
 */
export const LegalGate = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const markAccepted = useAuthStore((state) => state.markTermsAccepted);
  const [checked, setChecked] = useState(false);

  const { data: legal } = useLegal();

  const accept = useMutation({
    mutationFn: acceptLegal,
    onSuccess: markAccepted,
  });

  // undefined у поля — сессия сохранена до его появления; блокировать такую
  // нельзя, значение приедет с обновлением токена.
  const needsConsent =
    Boolean(legal?.enabled) && user != null && user.termsAccepted === false;

  if (!needsConsent) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-[520px] flex-col gap-5 rounded-2xl border border-cyan-bright/40 bg-[rgba(7,21,42,0.97)] p-7">
        <div>
          <h2 className="text-3xl font-bold text-white">{t("legal.title")}</h2>
          <p className="mt-2 text-lg text-grey">{t("legal.intro")}</p>
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-1.5 h-5 w-5 shrink-0 accent-cyan-bright"
          />
          <span className="text-lg text-white">
            {t("legal.consentPrefix")}{" "}
            <a
              href={legal?.terms_url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-bright underline underline-offset-4"
            >
              {t("legal.terms")}
            </a>{" "}
            {t("legal.and")}{" "}
            <a
              href={legal?.privacy_url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-bright underline underline-offset-4"
            >
              {t("legal.privacy")}
            </a>
          </span>
        </label>

        {accept.isError && (
          <span className="text-base text-error">{t("legal.error")}</span>
        )}

        <button
          type="button"
          disabled={!checked || accept.isPending}
          onClick={() => accept.mutate()}
          className="rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] py-3 text-lg font-bold text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {accept.isPending ? t("legal.accepting") : t("legal.accept")}
        </button>
      </div>
    </div>
  );
};
