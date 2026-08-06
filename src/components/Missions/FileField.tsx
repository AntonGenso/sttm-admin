import type { UseFormRegisterReturn } from "react-hook-form";

interface Props {
  label: string;
  accept: string;
  /** Name of the newly picked file, taken from the form's `watch` value. */
  fileName?: string;
  registration: UseFormRegisterReturn;
  /** Name of the file already stored for the mission, when editing. */
  existingName?: string | null;
  isRemoved?: boolean;
  onRemove?: () => void;
  onRestore?: () => void;
}

/** File input styled like the rest of the form — the native control is hidden. */
export const FileField = ({
  label,
  accept,
  fileName,
  registration,
  existingName,
  isRemoved,
  onRemove,
  onRestore,
}: Props) => {
  // A newly picked file wins over whatever is stored: it replaces it on submit.
  const status = fileName
    ? { text: fileName, tone: "text-white" }
    : isRemoved
      ? { text: `${existingName ?? "File"} — will be removed`, tone: "text-error" }
      : existingName
        ? { text: existingName, tone: "text-grey" }
        : { text: "No file selected", tone: "text-grey" };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-xs uppercase tracking-widest text-cyan-bright">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <label
          htmlFor={registration.name}
          className="w-fit shrink-0 cursor-pointer rounded-full border border-cyan-bright/40 px-4 py-2 text-base text-cyan-bright transition-colors hover:bg-cyan-bright/10"
        >
          {existingName && !isRemoved ? "Replace" : "Choose file"}
        </label>
        <span className={`truncate text-base ${status.tone}`} title={status.text}>
          {status.text}
        </span>

        {existingName && !fileName && !isRemoved && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-auto shrink-0 text-base text-orange-bright transition-opacity hover:opacity-75"
          >
            Remove
          </button>
        )}
        {isRemoved && onRestore && (
          <button
            type="button"
            onClick={onRestore}
            className="ml-auto shrink-0 text-base text-cyan-bright transition-opacity hover:opacity-75"
          >
            Undo
          </button>
        )}
      </div>
      <input
        id={registration.name}
        type="file"
        accept={accept}
        className="hidden"
        {...registration}
      />
    </div>
  );
};
