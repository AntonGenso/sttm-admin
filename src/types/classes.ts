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

export interface CreateClassPayload {
  cityId: number;
  schoolName: string;
  grade: number;
  letter: string;
}

export const CLASS_GRADES = [1, 2, 3, 4];

export const CYRILLIC_LETTERS = ["А", "Б", "В", "Г", "Д"];
export const LATIN_LETTERS = ["A", "B", "C", "D", "E", "F", "G"];
