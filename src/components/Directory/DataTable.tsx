import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Pagination } from "./Pagination";

/**
 * Ten rows a page. Two hundred students are a scrollbar nobody can aim with,
 * and the panel is read a screenful at a time — a page is the unit people
 * actually work in.
 */
const PAGE_SIZE = 10;

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** A grid track: `1fr` for the columns that may grow, `6rem` for numbers. */
  width: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
}

interface Props<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getKey: (row: T) => number | string;
  /** Narrower tables (a roster inside a card) do not need the list minimum. */
  minWidth?: string;
  /** Rows per page; the switcher only appears once there are more than that. */
  pageSize?: number;
}

/**
 * The one table the directory uses — for a whole list and for the sections
 * inside a record alike, so a roster and the students list read the same.
 *
 * Rows are not links: several cells in a row lead to different records (the
 * class, its school, its teacher), and wrapping the row would swallow them.
 */
export const DataTable = <T,>({
  columns,
  rows,
  getKey,
  minWidth = "860px",
  pageSize = PAGE_SIZE,
}: Props<T>) => {
  const [page, setPage] = useState(1);
  const [rowCount, setRowCount] = useState(rows.length);

  // A new set of rows (a search narrowing the list, a row deleted) is a new
  // list, and page 5 of the old one means nothing in it. Adjusted during the
  // render that brings the new rows in, not in an effect: an effect would first
  // paint the stale page and only then correct it.
  if (rowCount !== rows.length) {
    setRowCount(rows.length);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  // The reset above lands on the next render, so the page can be out of range
  // for this one — clamping keeps rows on screen instead of a blank body.
  const current = Math.min(page, pageCount);
  const from = (current - 1) * pageSize;
  const visible = rows.slice(from, from + pageSize);

  // One grid template for the header and every row, so the columns line up.
  const template = columns.map((column) => column.width).join(" ");

  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-bright/25 bg-[rgba(5,20,30,0.7)] backdrop-blur-md">
      {/* Keeps its column widths on a narrow screen and scrolls sideways
          instead of squeezing phone numbers onto two lines. The page switcher
          stays outside that scroller, where it is always in reach. */}
      <div className="overflow-x-auto">
        <div style={{ minWidth }}>
          <div
            className="grid items-center gap-3 border-b border-white/10 px-5 py-3 font-mono text-xs tracking-widest text-grey uppercase"
            style={{ gridTemplateColumns: template }}
          >
            {columns.map((column) => (
              <span
                key={column.key}
                className={column.align === "right" ? "text-right" : ""}
              >
                {column.header}
              </span>
            ))}
          </div>

          <ul>
            {visible.map((row) => (
              <li
                key={getKey(row)}
                className="border-b border-white/5 last:border-b-0"
              >
                <div
                  className="grid items-center gap-3 px-5 py-3 transition-colors hover:bg-cyan-bright/[0.06]"
                  style={{ gridTemplateColumns: template }}
                >
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      className={`min-w-0 ${column.align === "right" ? "text-right" : ""}`}
                    >
                      {column.render(row)}
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {rows.length > pageSize && (
        <Pagination
          page={current}
          pageCount={pageCount}
          from={from + 1}
          to={from + visible.length}
          total={rows.length}
          onChange={setPage}
        />
      )}
    </div>
  );
};

/** The plain text cell every list uses for schools and cities. */
export const TextCell = ({ children }: { children: ReactNode }) => (
  <p className="truncate text-xl text-white">{children}</p>
);

/**
 * The cell that opens the record it names. Only the text is the target, not the
 * cell — a wide empty column that navigates on click is a trap.
 */
export const LinkCell = ({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) => (
  <p className="truncate">
    <Link
      to={to}
      className="text-xl text-white underline decoration-cyan-bright/40 underline-offset-4 transition-colors hover:text-cyan-bright"
    >
      {children}
    </Link>
  </p>
);

/** A number cell — monospaced so the column reads as a column of figures. */
export const NumberCell = ({
  value,
  accent,
}: {
  value: ReactNode;
  accent?: boolean;
}) => (
  <span
    className={`font-mono text-lg ${accent ? "font-bold text-cyan-bright" : "text-grey"}`}
  >
    {value}
  </span>
);

/** A muted cell for the columns that only add context (city, school, dates). */
export const MutedCell = ({ children }: { children: ReactNode }) => (
  <p className="truncate text-lg text-grey">{children}</p>
);

/** Phone numbers and dates: monospaced so digits line up down the column. */
export const MonoCell = ({ children }: { children: ReactNode }) => (
  <span className="font-mono text-base text-grey">{children}</span>
);
