import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  downloadPilotReportCsv,
  getPilotReport,
  type IPilotMissionCell,
  type IPilotRow,
} from "../api/pilot";
import {
  MonoCell,
  MutedCell,
  NumberCell,
  type DataTableColumn,
} from "../components/Directory/DataTable";
import { DirectoryView } from "../components/Directory/DirectoryView";
import { formatLessonDate } from "../utils/date";
import { formatPhoneDisplay } from "../utils/phone";

/**
 * Итоги пилота: одна строка — один класс.
 *
 * Полная выгрузка — это 7 общих колонок плюс по три на каждую миссию, тридцать
 * семь штук; на экране столько не читается, поэтому здесь сводка и полоска
 * миссий, а развёрнутая таблица живёт в CSV. Полоска отвечает на главный
 * вопрос «где урок дошёл до детей», не заставляя листать вбок.
 */

/** Состояние одной миссии в классе — тем же порядком, что и в игре. */
const missionState = (cell: IPilotMissionCell) => {
  if (cell.students_done > 0) return "done";
  if (cell.guide_opened_at) return "opened";
  return "idle";
};

const STATE_CLASS: Record<string, string> = {
  // Тест завершён хотя бы одним учеником — урок дошёл до детей.
  done: "border-cyan-bright/60 bg-cyan-bright/25 text-cyan-bright",
  // Учитель открыл презентацию, но завершений нет.
  opened: "border-orange-bright/50 bg-orange-bright/10 text-orange-bright",
  idle: "border-white/10 bg-white/[0.03] text-grey/40",
};

const MissionStrip = ({ row }: { row: IPilotRow }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-1">
      {row.missions.map((cell) => {
        const state = missionState(cell);
        // По порядку событий: учитель открыл материал → класс впервые завершил
        // тест → сколько учеников всего. Две даты рядом и есть ответ на «дошёл
        // ли урок до детей и как быстро».
        const title = [
          `M${cell.level} ${cell.label}`,
          cell.guide_opened_at
            ? t("pilot.tipOpened", { date: formatLessonDate(cell.guide_opened_at) })
            : t("pilot.tipNotOpened"),
          cell.first_completed_at
            ? t("pilot.tipFirstDone", {
                date: formatLessonDate(cell.first_completed_at),
              })
            : t("pilot.tipNotDone"),
          t("pilot.tipDone", { n: cell.students_done }),
        ].join("\n");

        return (
          <span
            key={cell.mission_id}
            title={title}
            className={`flex h-7 w-7 items-center justify-center rounded-md border font-mono text-xs ${STATE_CLASS[state]}`}
          >
            {cell.level}
          </span>
        );
      })}
    </div>
  );
};

export default function PilotReportPage() {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "pilot-report"],
    queryFn: getPilotReport,
  });

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadFailed(false);
    try {
      await downloadPilotReportCsv();
    } catch {
      setDownloadFailed(true);
    } finally {
      setIsDownloading(false);
    }
  };

  const columns: DataTableColumn<IPilotRow>[] = [
    {
      key: "teacher",
      header: t("pilot.colTeacher"),
      width: "1.3fr",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-xl text-white">{row.teacher_name}</p>
          <p className="truncate font-mono text-sm text-grey">
            {formatPhoneDisplay(row.teacher_phone)}
          </p>
        </div>
      ),
    },
    {
      key: "school",
      header: t("pilot.colSchool"),
      width: "1.2fr",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-lg text-white">{row.school_name}</p>
          <MutedCell>{row.city_name}</MutedCell>
        </div>
      ),
    },
    {
      key: "class",
      header: t("pilot.colClass"),
      width: "5rem",
      render: (row) => <span className="text-xl text-white">{row.class_label}</span>,
    },
    {
      key: "code",
      header: t("pilot.colCode"),
      width: "7rem",
      render: (row) => <MonoCell>{row.join_code}</MonoCell>,
    },
    {
      key: "connected",
      header: t("pilot.colConnected"),
      width: "6rem",
      align: "right",
      render: (row) => <NumberCell value={row.students_connected} />,
    },
    {
      key: "strip",
      header: t("pilot.colMissions"),
      width: "16rem",
      render: (row) => <MissionStrip row={row} />,
    },
    {
      key: "delivered",
      header: t("pilot.colDelivered"),
      width: "7rem",
      align: "right",
      render: (row) => (
        <NumberCell value={row.missions_delivered} accent={row.missions_delivered > 0} />
      ),
    },
    {
      key: "engagement",
      header: t("pilot.colEngagement"),
      width: "8rem",
      align: "right",
      // null — подключённых нет; прочерк честнее нуля, который читался бы как
      // «пробовали, не получилось».
      render: (row) =>
        row.avg_engagement === null ? (
          <MutedCell>—</MutedCell>
        ) : (
          <span className="font-mono text-xl text-white">
            {Math.round(row.avg_engagement * 100)}%
          </span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DirectoryView
        title={t("pilot.title")}
        subtitle={t("pilot.subtitle")}
        icon="🛰️"
        columns={columns}
        rows={data?.rows}
        getKey={(row) => row.class_id}
        searchIn={(row) => [
          row.teacher_name,
          row.teacher_phone,
          row.school_name,
          row.city_name,
          row.class_label,
          row.join_code,
        ]}
        isLoading={isLoading}
        isError={isError}
        action={
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading || !data}
            className="rounded-full border border-cyan-bright/40 px-5 py-2 text-lg text-cyan-bright transition-colors hover:bg-cyan-bright/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isDownloading ? t("pilot.downloading") : t("pilot.download")}
          </button>
        }
      />

      {downloadFailed && (
        <p className="text-lg text-error">{t("pilot.downloadError")}</p>
      )}

      {/* Оговорки к цифрам стоят рядом с цифрами: в отрыве от них отчёт читают
          как точный, а он в трёх местах приблизителен. */}
      <section className="rounded-2xl border border-white/10 bg-[rgba(5,20,30,0.5)] p-5">
        <h2 className="font-mono text-xs tracking-widest text-cyan-bright uppercase">
          {t("pilot.notesTitle")}
        </h2>
        <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-base text-grey">
          <li>{t("pilot.noteGuideByTeacher")}</li>
          <li>{t("pilot.noteUniqueStudents")}</li>
          <li>{t("pilot.noteDenominator")}</li>
          <li>{t("pilot.noteHistory")}</li>
        </ul>
      </section>
    </div>
  );
}
