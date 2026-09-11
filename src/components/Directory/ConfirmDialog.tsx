import { useTranslation } from "react-i18next";
import { dangerButtonClass } from "./DetailLayout";

interface Props {
  title: string;
  message: string;
  /**
   * What the deletion takes down with it, when it takes down more than the
   * record itself. The server decides this — the panel only shows what came
   * back with the refusal, so it can never promise less than will happen.
   */
  warning?: string | null;
  confirmLabel: string;
  isPending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

/** The last step before a delete. Nothing here is undoable, so nothing is implied. */
export const ConfirmDialog = ({
  title,
  message,
  warning,
  confirmLabel,
  isPending,
  error,
  onConfirm,
  onClose,
}: Props) => {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-[480px] flex-col gap-4 rounded-2xl border border-error/40 bg-[rgba(7,21,42,0.9)] p-7 backdrop-blur-xl"
      >
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        <p className="text-lg text-grey">{message}</p>

        {warning && (
          <p className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-lg text-error">
            {warning}
          </p>
        )}

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
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={dangerButtonClass}
          >
            {isPending ? t("common.deleting") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
