import { useEffect, useMemo, useRef, useState } from "react";

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Suggestions of already-known values; the user may still type a new one. */
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  id?: string;
}

const inputClass =
  "w-full rounded-lg border border-cyan-bright/35 bg-[rgba(2,37,51,0.6)] px-4 py-3 pr-10 text-lg text-white outline-none transition-colors placeholder:text-grey/50 focus:border-cyan-bright disabled:opacity-50";

/**
 * A free-text field with a styled suggestion list. It replaces the native
 * `<input list>` + `<datalist>`, whose dropdown the browser draws itself and
 * cannot be themed to match the dark modal. Typing filters the suggestions;
 * picking one fills the field, but any new value is still allowed.
 */
export const Combobox = ({
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  disabled,
  maxLength,
  id,
}: ComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter by substring so "таш" surfaces "Ташкент"; an empty field shows all.
  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.toLowerCase().includes(query));
  }, [options, value]);

  const showList = isOpen && filtered.length > 0;

  // A click anywhere outside closes the list and reports blur to the form.
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlighted(-1);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onBlur]);

  const commit = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setHighlighted(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) {
      if (event.key === "ArrowDown") setIsOpen(true);
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlighted((prev) => (prev + 1) % filtered.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlighted((prev) => (prev - 1 + filtered.length) % filtered.length);
        break;
      case "Enter":
        if (highlighted >= 0) {
          event.preventDefault();
          commit(filtered[highlighted]);
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
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        autoComplete="off"
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        className={inputClass}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
          setHighlighted(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {/* Chevron cue that the field carries suggestions. */}
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className={`pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-bright/70 transition-transform ${showList ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="m6 8 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {showList && (
        <ul
          role="listbox"
          className="absolute z-40 mt-1.5 max-h-56 w-full overflow-y-auto rounded-lg border border-cyan-bright/35 bg-bg-deep py-1 shadow-xl shadow-black/40 backdrop-blur-xl"
        >
          {filtered.map((option, index) => (
            <li
              key={option}
              role="option"
              aria-selected={index === highlighted}
              // onMouseDown fires before the input's blur, so the pick lands.
              onMouseDown={(event) => {
                event.preventDefault();
                commit(option);
              }}
              onMouseEnter={() => setHighlighted(index)}
              className={`cursor-pointer px-4 py-2.5 text-lg transition-colors ${
                index === highlighted
                  ? "bg-cyan-bright/15 text-white"
                  : "text-grey hover:bg-cyan-bright/10 hover:text-white"
              }`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
