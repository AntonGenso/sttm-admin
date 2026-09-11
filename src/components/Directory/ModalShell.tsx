import type { FormEventHandler, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { primaryButtonClass } from "./DetailLayout";

interface Props {
  title: string;
  subtitle?: string;
  /** The server's own message for a rejected write; never swallowed. */
  error?: string | null;
  isPending?: boolean;
  submitLabel: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onClose: () => void;
  children: ReactNode;
}

/** The frame every edit form in the directory shares. */
export const ModalShell = ({
  title,
  subtitle,
  error,
  isPending,
  submitLabel,
  onSubmit,
  onClose,
  children,
}: Props) => {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-[520px] flex-col gap-5 rounded-2xl border border-cyan-bright/40 bg-[rgba(7,21,42,0.9)] p-7 backdrop-blur-xl"
      >
        <div>
          <h2 className="text-3xl font-bold text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-lg text-grey">{subtitle}</p>}
        </div>

        {children}

        {error && <span className="text-base text-error">{error}</span>}

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-5 py-2 text-lg text-grey transition-colors hover:text-white"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className={primaryButtonClass}
          >
            {isPending ? t("common.saving") : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
};

export const fieldClass =
  "w-full rounded-lg border border-cyan-bright/35 bg-[rgba(2,37,51,0.6)] px-4 py-3 text-lg text-white outline-none transition-colors placeholder:text-grey/50 focus:border-cyan-bright";

export const labelClass =
  "font-mono text-xs uppercase tracking-widest text-cyan-bright";
