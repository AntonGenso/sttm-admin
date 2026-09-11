import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Select, type SelectOption } from "../../uikit/Select";
import { ModalShell, labelClass } from "./ModalShell";

interface Props {
  title: string;
  /** Что исчезнет — строка, в которую сливать нельзя. */
  sourceLabel: string;
  description: string;
  options: SelectOption[];
  emptyMessage: string;
  isPending?: boolean;
  error?: string | null;
  onConfirm: (targetId: number) => void;
  onClose: () => void;
}

/**
 * Слияние дублей справочника — общая форма для городов и школ.
 *
 * Операция необратима и уносит строку целиком, поэтому она отделена от обычной
 * правки: переименование чинит опечатку, слияние чинит то, что одну сущность
 * завели дважды, и последствия у них разные.
 */
export const MergeModal = ({
  title,
  sourceLabel,
  description,
  options,
  emptyMessage,
  isPending,
  error,
  onConfirm,
  onClose,
}: Props) => {
  const { t } = useTranslation();
  const [targetId, setTargetId] = useState<number | null>(null);

  return (
    <ModalShell
      title={title}
      subtitle={sourceLabel}
      error={error}
      isPending={isPending}
      submitLabel={t("directory.merge")}
      onSubmit={(event) => {
        event.preventDefault();
        if (targetId) {
          onConfirm(targetId);
        }
      }}
      onClose={onClose}
    >
      <p className="text-lg text-grey">{description}</p>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>{t("directory.mergeTarget")}</span>
        <Select
          value={targetId}
          onChange={setTargetId}
          options={options}
          placeholder={t("directory.mergeTargetPlaceholder")}
          emptyMessage={emptyMessage}
        />
      </label>
    </ModalShell>
  );
};
