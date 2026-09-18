import axios from "axios";

const BASE_URL = "/api/admin/pilot-report";

/** Одна миссия в шапке отчёта. */
export interface IPilotMission {
  id: number;
  level: number;
  label: string;
  /** false — у миссии нет теста, колонка «завершили» всегда пустая. */
  has_test: boolean;
}

/** Ячейка «класс × миссия». */
export interface IPilotMissionCell {
  mission_id: number;
  level: number;
  label: string;
  /**
   * Дата первого открытия презентации — по УЧИТЕЛЮ, не по классу: презентацию
   * открывают на странице миссии, где класс не выбран. У всех классов одного
   * учителя она поэтому одинаковая.
   */
  guide_opened_at: string | null;
  /** Уникальные ученики класса, завершившие тест; перепрохождения не считаются. */
  students_done: number;
  first_completed_at: string | null;
}

export interface IPilotRow {
  class_id: number;
  teacher_name: string;
  teacher_phone: string | null;
  city_name: string;
  school_name: string;
  class_label: string;
  join_code: string;
  students_connected: number;
  missions: IPilotMissionCell[];
  /** Миссия считается проведённой, если тест завершил хотя бы один ученик. */
  missions_delivered: number;
  /** Доля 0..1; null — подключённых учеников нет, делить не на что. */
  avg_engagement: number | null;
}

export interface IPilotReport {
  generated_at: string;
  missions: IPilotMission[];
  rows: IPilotRow[];
}

export const getPilotReport = async (): Promise<IPilotReport> => {
  const { data } = await axios.get<IPilotReport>(BASE_URL);
  return data;
};

/**
 * Тот же отчёт файлом.
 *
 * Не `<a href>`: эндпоинт админский, а токен живёт в перехватчике axios и в
 * обычный переход по ссылке не попадёт. Поэтому файл забирается запросом и
 * отдаётся браузеру blob-ссылкой.
 */
export const downloadPilotReportCsv = async (): Promise<void> => {
  const response = await axios.get<Blob>(`${BASE_URL}.csv`, {
    responseType: "blob",
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sttm-pilot-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Освобождаем сразу: blob держит файл в памяти вкладки до конца сессии.
  URL.revokeObjectURL(url);
};
