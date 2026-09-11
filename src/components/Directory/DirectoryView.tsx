import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DataTable, type DataTableColumn } from "./DataTable";

interface Props<T> {
  title: string;
  subtitle: string;
  icon: string;
  columns: DataTableColumn<T>[];
  rows?: T[];
  getKey: (row: T) => number | string;
  /** The fields the search box matches on — nulls are skipped. */
  searchIn: (row: T) => (string | number | null | undefined)[];
  isLoading?: boolean;
  isError?: boolean;
  /** Кнопка рядом с поиском — есть только у списков, которые можно пополнять. */
  action?: ReactNode;
}

/**
 * The shared shell of every drill-down opened from a dashboard tile.
 *
 * The lists differ only in their columns, so the parts that must not drift —
 * the way back to the tiles, the row count next to the title, the search, the
 * empty and error states — live here once. Sorting stays with the API: each
 * list arrives in the order that answers its own question (teachers by reach,
 * students by score, enrollments by recency), and re-sorting in the browser
 * would only hide that.
 */
export const DirectoryView = <T,>({
  title,
  subtitle,
  icon,
  columns,
  rows,
  getKey,
  searchIn,
  isLoading,
  isError,
  action,
}: Props<T>) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();

  const visible = useMemo(() => {
    if (!rows) return [];
    if (!needle) return rows;
    return rows.filter((row) =>
      searchIn(row).some(
        (field) =>
          field !== null &&
          field !== undefined &&
          String(field).toLowerCase().includes(needle),
      ),
    );
  }, [rows, needle, searchIn]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          to="/"
          className="w-fit font-mono text-xs tracking-widest text-cyan-bright uppercase transition-opacity hover:opacity-75"
        >
          {t("directory.backHome")}
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[rgba(2,37,51,0.6)] text-3xl"
            >
              {icon}
            </span>
            <div>
              <h1 className="text-5xl font-bold tracking-wide text-white">
                {title}
              </h1>
              <p className="mt-1 text-xl text-grey">{subtitle}</p>
            </div>
          </div>

          {rows && (
            <span className="font-mono text-lg text-cyan-bright">
              {needle
                ? t("directory.foundOf", {
                    n: visible.length,
                    total: rows.length,
                  })
                : t("directory.total", { n: rows.length })}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("directory.searchPlaceholder")}
          className="w-full max-w-[420px] rounded-full border border-cyan-bright/25 bg-[rgba(5,20,30,0.7)] px-5 py-2 text-lg text-white placeholder:text-grey/70 focus:border-cyan-bright/60 focus:outline-none"
        />
        {action}
      </div>

      {isLoading && (
        <span className="text-lg text-grey">{t("common.loading")}</span>
      )}

      {isError && (
        <p className="text-lg text-error">{t("directory.loadError")}</p>
      )}

      {rows && visible.length === 0 && (
        <p className="rounded-2xl border border-dashed border-white/15 bg-[rgba(5,20,30,0.5)] px-5 py-10 text-center text-lg text-grey backdrop-blur-md">
          {needle
            ? t("directory.noMatch", { query: query.trim() })
            : t("directory.empty")}
        </p>
      )}

      {rows && visible.length > 0 && (
        <DataTable columns={columns} rows={visible} getKey={getKey} />
      )}
    </div>
  );
};
