import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Props {
  /** Where the record came from — its list. */
  backTo: string;
  backLabel: string;
  icon: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Edit / delete controls; they sit with the title, not with the data. */
  actions?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  children?: ReactNode;
}

/** The shared frame of every record page: teacher, student, class, school. */
export const DetailLayout = ({
  backTo,
  backLabel,
  icon,
  title,
  subtitle,
  actions,
  isLoading,
  isError,
  errorMessage,
  children,
}: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <Link
        to={backTo}
        className="w-fit font-mono text-xs tracking-widest text-cyan-bright uppercase transition-opacity hover:opacity-75"
      >
        {backLabel}
      </Link>

      {isLoading && (
        <span className="text-lg text-grey">{t("common.loading")}</span>
      )}

      {isError && (
        <p className="text-lg text-error">
          {errorMessage ?? t("directory.loadError")}
        </p>
      )}

      {!isLoading && !isError && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span
                aria-hidden
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[rgba(2,37,51,0.6)] text-3xl"
              >
                {icon}
              </span>
              <div className="min-w-0">
                <h1 className="text-5xl font-bold tracking-wide text-white">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1 text-xl text-grey">{subtitle}</p>
                )}
              </div>
            </div>

            {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
          </div>

          {children}
        </>
      )}
    </div>
  );
};

/** The record's own fields, as a card of label/value pairs. */
export const InfoGrid = ({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) => (
  <dl className="grid grid-cols-1 gap-5 rounded-2xl border border-cyan-bright/25 bg-[rgba(5,20,30,0.7)] p-6 backdrop-blur-md sm:grid-cols-2 lg:grid-cols-4">
    {items.map((item) => (
      <div key={item.label} className="min-w-0">
        <dt className="font-mono text-xs tracking-widest text-cyan-bright uppercase">
          {item.label}
        </dt>
        <dd className="mt-1 truncate text-2xl text-white">{item.value}</dd>
      </div>
    ))}
  </dl>
);

/** A titled block below the header — the classes of a teacher, a class roster. */
export const Section = ({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count?: number;
  empty?: string;
  children?: ReactNode;
}) => (
  <section className="flex flex-col gap-4">
    <div className="flex items-baseline gap-3">
      <h2 className="text-3xl font-semibold text-white">{title}</h2>
      {count !== undefined && (
        <span className="font-mono text-lg text-cyan-bright">{count}</span>
      )}
    </div>

    {count === 0 && empty ? (
      <p className="rounded-2xl border border-dashed border-white/15 bg-[rgba(5,20,30,0.5)] px-5 py-8 text-center text-lg text-grey backdrop-blur-md">
        {empty}
      </p>
    ) : (
      children
    )}
  </section>
);

/** The panel's two button shapes, so every page spells them the same. */
export const primaryButtonClass =
  "rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] px-6 py-2.5 text-lg font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50";

export const ghostButtonClass =
  "rounded-full border border-cyan-bright/40 px-5 py-2 text-base text-cyan-bright transition-colors hover:bg-cyan-bright/10 disabled:opacity-50";

export const dangerButtonClass =
  "rounded-full border border-error/50 px-5 py-2 text-base text-error transition-colors hover:bg-error/10 disabled:opacity-50";
