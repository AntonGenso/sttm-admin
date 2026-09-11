import { useEffect, useMemo, useRef, useState } from "react";

export interface SelectOption {
  id: number;
  label: string;
  /** Второй строкой в списке — область, город школы и тому подобное. */
  hint?: string | null;
}

interface Props {
  value: number | null;
  onChange: (id: number | null) => void;
  options: SelectOption[];
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  id?: string;
}

const fieldClass =
  "flex w-full items-center justify-between gap-2 rounded-lg border border-cyan-bright/35 bg-[rgba(2,37,51,0.6)] px-4 py-3 text-left text-lg text-white outline-none transition-colors focus:border-cyan-bright disabled:opacity-50";

/**
 * Выбор из справочника — и только из него.
 *
 * В отличие от `Combobox`, здесь нельзя ввести своё значение: города заводит
 * админ, а свободный ввод как раз и наплодил в справочнике «Ташкент», «г.
 * Ташкент» и «Toshkent» как три разных города. Поле поиска внутри списка есть —
 * городов под сотню, и листать их мышью было бы издевательством.
 */
export const Select = ({
  value,
  onChange,
  options,
  placeholder,
  emptyMessage,
  disabled,
  id,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.id === value) ?? null;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) =>
      `${option.label} ${option.hint ?? ""}`.toLowerCase().includes(needle),
    );
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) return;
    // Открыли — курсор сразу в поиске: почти всегда следующим действием печатают.
    searchRef.current?.focus();

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const commit = (optionId: number) => {
    onChange(optionId);
    setIsOpen(false);
    setQuery("");
    setHighlighted(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlighted((prev) =>
          filtered.length ? (prev + 1) % filtered.length : -1,
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlighted((prev) =>
          filtered.length ? (prev - 1 + filtered.length) % filtered.length : -1,
        );
        break;
      case "Enter":
        if (highlighted >= 0 && filtered[highlighted]) {
          event.preventDefault();
          commit(filtered[highlighted].id);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlighted(-1);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={fieldClass}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className={selected ? "" : "text-grey/60"}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className={`h-5 w-5 shrink-0 text-cyan-bright/70 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="m6 8 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-40 mt-1.5 w-full overflow-hidden rounded-lg border border-cyan-bright/35 bg-bg-deep shadow-xl shadow-black/40">
          <input
            ref={searchRef}
            type="text"
            value={query}
            placeholder={placeholder}
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value);
              setHighlighted(-1);
            }}
            onKeyDown={handleKeyDown}
            className="w-full border-b border-cyan-bright/20 bg-transparent px-4 py-2.5 text-lg text-white outline-none placeholder:text-grey/50"
          />

          <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.map((option, index) => (
              <li
                key={option.id}
                role="option"
                aria-selected={option.id === value}
                onMouseDown={(event) => {
                  event.preventDefault();
                  commit(option.id);
                }}
                onMouseEnter={() => setHighlighted(index)}
                className={`cursor-pointer px-4 py-2.5 text-lg transition-colors ${
                  index === highlighted || option.id === value
                    ? "bg-cyan-bright/15 text-white"
                    : "text-grey hover:bg-cyan-bright/10 hover:text-white"
                }`}
              >
                {option.label}
                {option.hint && (
                  <span className="ml-2 text-sm text-grey/70">
                    {option.hint}
                  </span>
                )}
              </li>
            ))}

            {!filtered.length && (
              <li className="px-4 py-3 text-base text-grey/70">
                {emptyMessage}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
