export interface ICity {
  id: number;
  name_ru: string;
  name_uz: string | null;
  region: string | null;
}

export interface ISchool {
  id: number;
  city_id: number;
  name: string;
}

/** Which set the class letter comes from — «А» and "A" are different classes. */
export type ClassAlphabet = "cyrillic" | "latin";

export interface IClass {
  id: number;
  teacher_id: number;
  grade: number;
  letter: string;
  alphabet: ClassAlphabet;
  /** The code that is live right now; changes when the teacher re-issues it. */
  join_code: string;
  is_active: number;
  created_at: string;
  school_id: number;
  school_name: string;
  city_id: number;
  city_name: string;
  students_count: number;
}

/** A student on the class roster, with the game totals the leaderboard ranks by. */
export interface IClassStudent {
  id: number;
  name: string;
  phone: string | null;
  status: string;
  joined_at: string;
  head_id: number;
  suit_id: number;
  /** Sum of the best scores over missions. */
  stars: number;
  /** Sum of the best scores over tests. */
  score: number;
  /** stars + score — what the leaderboard is sorted by. */
  total: number;
}

/** How far a student got with one mission or test. */
export type ProgressStatus = "open" | "in_progress" | "done";

/** A catalog item plus this student's progress on it; untouched items are `open`. */
export interface IStudentProgressItem {
  id: number;
  name: string;
  label: string | null;
  xp: number;
  /** Missions only — `current` or `bonuse`. */
  type?: string;
  /** Tests only. */
  question_count?: number;
  status: ProgressStatus;
  best_score: number;
  attempts: number;
  started_at: string | null;
  completed_at: string | null;
}

/** One logged run; `finished_at` is null while the attempt is still open. */
export interface IStudentAttempt {
  id: number;
  kind: "mission" | "test";
  item_id: number;
  item_label: string | null;
  score: number;
  started_at: string;
  finished_at: string | null;
}

/** The full teacher-facing record of one student in one class. */
export interface IClassStudentDetails extends IClassStudent {
  /** Place in this class's leaderboard; equal totals share a place. */
  class_rank: number;
  skin: { headId: number; suitId: number };
  leaderboard: { stars: number; score: number; total: number };
  missions: IStudentProgressItem[];
  tests: IStudentProgressItem[];
  /** The most recent runs, newest first. */
  attempts: IStudentAttempt[];
}

export interface CreateClassPayload {
  cityId: number;
  schoolName: string;
  grade: number;
  letter: string;
}

export const CLASS_GRADES = [1, 2, 3, 4];

export const CYRILLIC_LETTERS = ["А", "Б", "В", "Г", "Д"];
export const LATIN_LETTERS = ["A", "B", "C", "D", "E", "F", "G"];
