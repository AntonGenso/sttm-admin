import { useTranslation } from "react-i18next";

interface Props {
  page: number;
  pageCount: number;
  /** The 1-based range of rows on this page, for the "11–20 of 200" label. */
  from: number;
  to: number;
  total: number;
  onChange: (page: number) => void;
}

/** A gap in the page numbers, rendered as an ellipsis. */
const GAP = "gap" as const;

/**
 * The page numbers to offer: the first and last page always, plus a window
 * around the current one. 200 rows are 20 pages, and twenty buttons would be a
 * worse way to move than the arrows next to them.
 */
const pageItems = (
  page: number,
  pageCount: number,
): (number | typeof GAP)[] => {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const window = [page - 1, page, page + 1].filter(
    (candidate) => candidate > 1 && candidate < pageCount,
  );
  const items: (number | typeof GAP)[] = [1];

  if (window[0] > 2) items.push(GAP);
  items.push(...window);
  if (window[window.length - 1] < pageCount - 1) items.push(GAP);
  items.push(pageCount);

  return items;
};

const buttonClass =
  "min-w-9 rounded-full border px-3 py-1 font-mono text-base transition-colors disabled:opacity-40";

const inactiveClass = `${buttonClass} border-white/15 text-grey hover:border-cyan-bright/50 hover:text-cyan-bright`;

const activeClass = `${buttonClass} border-cyan-bright/60 bg-cyan-bright/15 text-cyan-bright`;

/** Page switcher for a table that holds more rows than one page shows. */
export const Pagination = ({
  page,
  pageCount,
  from,
  to,
  total,
  onChange,
}: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3">
      <span className="font-mono text-sm tracking-wide text-grey">
        {t("directory.showing", { from, to, n: total })}
      </span>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className={inactiveClass}
          aria-label={t("directory.prevPage")}
        >
          ←
        </button>

        {pageItems(page, pageCount).map((item, index) =>
          item === GAP ? (
            <span
              key={`gap-${index}`}
              aria-hidden
              className="px-1 font-mono text-base text-grey"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              aria-current={item === page ? "page" : undefined}
              className={item === page ? activeClass : inactiveClass}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === pageCount}
          className={inactiveClass}
          aria-label={t("directory.nextPage")}
        >
          →
        </button>
      </div>
    </div>
  );
};
