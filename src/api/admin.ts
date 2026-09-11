import axios from "axios";
import type {
  ClassAlphabet,
  IStudentAttempt,
  IStudentProgressItem,
} from "../types/classes";

const BASE_URL = "/api/admin";

/**
 * The academy-wide directory: the rows behind every dashboard counter, the
 * record behind every row, and the edits an admin may make to them. Admin only
 * — every endpoint here answers 403 to a teacher.
 *
 * `cities` and `class_labels` are comma-separated lists, not single values:
 * they come from the classes a person teaches or belongs to, and those can sit
 * in different towns. A teacher additionally has a city and a school *of their
 * own* — the ones on their profile — and the two answer different questions:
 * `cities` is where they teach, `city_name` is where they said they work.
 */
export interface ITeacherRow {
  id: number;
  name: string;
  phone: string | null;
  created_at: string;
  roles: string | null;
  cities: string | null;
  /** Профиль учителя: город и школа, выбранные им самим. */
  city_id: number | null;
  city_name: string | null;
  school_id: number | null;
  school_name: string | null;
  classes_count: number;
  /** Distinct students across their classes, so nobody is counted twice. */
  students_count: number;
}

export interface IStudentRow {
  id: number;
  name: string;
  phone: string | null;
  created_at: string;
  roles: string | null;
  cities: string | null;
  /** «5А, 6Б» — every class they are in; null for a student who joined none. */
  class_labels: string | null;
  classes_count: number;
  stars: number;
  score: number;
  total: number;
}

export interface IAdminClassRow {
  id: number;
  grade: number;
  letter: string;
  alphabet: ClassAlphabet;
  is_active: number;
  join_code: string;
  created_at: string;
  school_id: number;
  school_name: string;
  city_id: number;
  city_name: string;
  teacher_id: number | null;
  teacher_name: string | null;
  teacher_phone: string | null;
  students_count: number;
}

export interface ISchoolRow {
  id: number;
  name: string;
  created_at: string;
  /** 0 — школу завёл учитель, и она ждёт проверки. */
  is_verified: number;
  city_id: number;
  city_name: string;
  classes_count: number;
  teachers_count: number;
  students_count: number;
}

/**
 * Город справочника со всем, что на нём висит.
 *
 * `teachers_count` считается по профилям, а не по классам: город принадлежит
 * учителю, и именно эти аккаунты осиротеют, если город удалить.
 */
export interface ICityRow {
  id: number;
  name_ru: string;
  name_uz: string | null;
  region: string | null;
  is_active: number;
  schools_count: number;
  classes_count: number;
  teachers_count: number;
  students_count: number;
}

export interface ICityDetail extends ICityRow {
  schools: ISchoolRow[];
}

/** One live class membership; a student in two classes has two of these. */
export interface IEnrollmentRow {
  id: number;
  status: string;
  joined_at: string;
  student_id: number;
  student_name: string;
  student_phone: string | null;
  class_id: number;
  grade: number;
  letter: string;
  alphabet: ClassAlphabet;
  school_id: number;
  school_name: string;
  city_name: string;
  teacher_id: number | null;
  teacher_name: string | null;
  total: number;
}

/** A student on an admin class roster, with the membership id to remove them by. */
export interface IAdminClassStudent {
  id: number;
  name: string;
  phone: string | null;
  enrollment_id: number;
  status: string;
  joined_at: string;
  stars: number;
  score: number;
  total: number;
}

export interface ITeacherDetail extends ITeacherRow {
  classes: IAdminClassRow[];
}

/** The student's record, their memberships, and the full game report. */
export interface IStudentDetail extends IStudentRow {
  memberships: IEnrollmentRow[];
  skin: { headId: number; suitId: number };
  leaderboard: { stars: number; score: number; total: number };
  missions: IStudentProgressItem[];
  tests: IStudentProgressItem[];
  attempts: IStudentAttempt[];
}

export interface IAdminClassDetail extends IAdminClassRow {
  students: IAdminClassStudent[];
}

export interface ISchoolDetail extends ISchoolRow {
  classes: IAdminClassRow[];
}

/* ─────────────────────────────── Reads ─────────────────────────────── */

const list =
  <T>(resource: string) =>
  async (): Promise<T[]> => {
    const { data } = await axios.get<T[]>(`${BASE_URL}/${resource}`);
    return data;
  };

const one =
  <T>(resource: string) =>
  async (id: number): Promise<T> => {
    const { data } = await axios.get<T>(`${BASE_URL}/${resource}/${id}`);
    return data;
  };

export const getTeachers = list<ITeacherRow>("teachers");
export const getStudents = list<IStudentRow>("students");
/** Every class in the academy — unlike `/api/classes`, which is teacher-scoped. */
export const getAllClasses = list<IAdminClassRow>("classes");
export const getSchools = list<ISchoolRow>("schools");
export const getCities = list<ICityRow>("cities");
export const getEnrollments = list<IEnrollmentRow>("enrollments");

export const getTeacher = one<ITeacherDetail>("teachers");
export const getStudent = one<IStudentDetail>("students");
export const getAdminClass = one<IAdminClassDetail>("classes");
export const getSchool = one<ISchoolDetail>("schools");
export const getCity = one<ICityDetail>("cities");

/* ─────────────────────────────── Writes ─────────────────────────────── */

/**
 * Name and phone; a student's phone may be cleared, a teacher's may not.
 *
 * Город и школа — только у учителя: у ученика их не бывает, он там, где его
 * класс. `schoolName` учитывается, лишь когда `schoolId` не прислан.
 */
export interface UserPatch {
  name?: string;
  phone?: string | null;
  cityId?: number | null;
  schoolId?: number | null;
  schoolName?: string;
}

export const updateTeacher = async (
  id: number,
  patch: UserPatch,
): Promise<ITeacherDetail> => {
  const { data } = await axios.patch<ITeacherDetail>(
    `${BASE_URL}/teachers/${id}`,
    patch,
  );
  return data;
};

export const updateStudent = async (
  id: number,
  patch: UserPatch,
): Promise<IStudentDetail> => {
  const { data } = await axios.patch<IStudentDetail>(
    `${BASE_URL}/students/${id}`,
    patch,
  );
  return data;
};

/**
 * Deleting a teacher takes their classes with it — the database cascades — so
 * the API refuses the first attempt with the counts, and only `cascade` goes
 * through with it. The refusal is what the panel turns into its warning.
 */
export const deleteTeacher = async (
  id: number,
  cascade = false,
): Promise<void> => {
  await axios.delete(`${BASE_URL}/teachers/${id}`, {
    params: cascade ? { cascade: 1 } : undefined,
  });
};

export const deleteStudent = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/students/${id}`);
};

export interface ClassPatch {
  grade?: number;
  letter?: string;
  isActive?: boolean;
  /** Перенос класса в другую школу — вместе с кодом и всем составом. */
  schoolId?: number;
}

export const updateClass = async (
  id: number,
  patch: ClassPatch,
): Promise<IAdminClassDetail> => {
  const { data } = await axios.patch<IAdminClassDetail>(
    `${BASE_URL}/classes/${id}`,
    patch,
  );
  return data;
};

export const deleteClass = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/classes/${id}`);
};

export interface SchoolPatch {
  name?: string;
  /** Перенос школы в другой город. */
  cityId?: number;
  isVerified?: boolean;
}

export const updateSchool = async (
  id: number,
  patch: SchoolPatch,
): Promise<ISchoolDetail> => {
  const { data } = await axios.patch<ISchoolDetail>(
    `${BASE_URL}/schools/${id}`,
    patch,
  );
  return data;
};

/**
 * Сливает школу-дубль в другую: классы и профили учителей переезжают, исходная
 * строка исчезает. Отказывает, если в целевой школе уже есть класс с теми же
 * цифрой и буквой того же учителя — такие конфликты разбираются вручную.
 */
export const mergeSchool = async (
  id: number,
  targetId: number,
): Promise<ISchoolDetail> => {
  const { data } = await axios.post<ISchoolDetail>(
    `${BASE_URL}/schools/${id}/merge`,
    { targetId },
  );
  return data;
};

export const deleteSchool = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/schools/${id}`);
};

/* ─────────────────────────────── Cities ─────────────────────────────── */

export interface CityPatch {
  nameRu?: string;
  nameUz?: string | null;
  region?: string | null;
  isActive?: boolean;
}

export const createCity = async (patch: CityPatch): Promise<ICityDetail> => {
  const { data } = await axios.post<ICityDetail>(`${BASE_URL}/cities`, patch);
  return data;
};

export const updateCity = async (
  id: number,
  patch: CityPatch,
): Promise<ICityDetail> => {
  const { data } = await axios.patch<ICityDetail>(
    `${BASE_URL}/cities/${id}`,
    patch,
  );
  return data;
};

/** Школы города-дубля переезжают в целевой, одноимённые — сливаются попарно. */
export const mergeCity = async (
  id: number,
  targetId: number,
): Promise<ICityDetail> => {
  const { data } = await axios.post<ICityDetail>(
    `${BASE_URL}/cities/${id}/merge`,
    { targetId },
  );
  return data;
};

export const deleteCity = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/cities/${id}`);
};

/** Ends the membership; the student and everything they earned stay. */
export const removeEnrollment = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/enrollments/${id}`);
};

/** The numbers a 409 carries: what deleting this row would take down with it. */
export interface ApiErrorDetails {
  classes?: number;
  students?: number;
  schools?: number;
  teachers?: number;
  /** «5А, 6Б» — классы, помешавшие слиянию. */
  conflicts?: string[];
}

/**
 * The server's own message for a failed write, with the counts behind a 409.
 * Every write here can fail for a reason the admin has to read — a name already
 * taken, a school that still has classes — so the panel never swallows it.
 */
export const readApiError = (
  error: unknown,
): {
  message: string | null;
  details: ApiErrorDetails | null;
  status?: number;
} => {
  if (!axios.isAxiosError(error)) {
    return { message: null, details: null };
  }
  const data = error.response?.data as
    { message?: string; details?: ApiErrorDetails } | undefined;
  return {
    message: data?.message ?? null,
    details: data?.details ?? null,
    status: error.response?.status,
  };
};
