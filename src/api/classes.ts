import axios from "axios";
import type {
  CreateClassPayload,
  IClass,
  IClassStudent,
  IClassStudentDetails,
} from "../types/classes";

const BASE_URL = "/api/classes";

/** Classes of the signed-in teacher — the backend takes them from the token. */
export const getMyClasses = async (): Promise<IClass[]> => {
  const { data } = await axios.get<IClass[]>(BASE_URL);
  return data;
};

/** A single class of the signed-in teacher; 404 for someone else's class. */
export const getClass = async (classId: number): Promise<IClass> => {
  const { data } = await axios.get<IClass>(`${BASE_URL}/${classId}`);
  return data;
};

/** The class roster, already sorted by game total — the leaderboard order. */
export const getClassStudents = async (
  classId: number,
): Promise<IClassStudent[]> => {
  const { data } = await axios.get<IClassStudent[]>(
    `${BASE_URL}/${classId}/students`,
  );
  return data;
};

/**
 * One student's full record. Read through the class, so it only resolves for a
 * student of a class the signed-in teacher owns.
 */
export const getClassStudent = async (
  classId: number,
  studentId: number,
): Promise<IClassStudentDetails> => {
  const { data } = await axios.get<IClassStudentDetails>(
    `${BASE_URL}/${classId}/students/${studentId}`,
  );
  return data;
};

/**
 * Takes the student out of the class. Their progress stays as it is — only the
 * membership goes, so they can join another class with its code.
 */
export const removeClassStudent = async (
  classId: number,
  studentId: number,
): Promise<void> => {
  await axios.delete(`${BASE_URL}/${classId}/students/${studentId}`);
};

export const createClass = async (
  payload: CreateClassPayload,
): Promise<IClass> => {
  const { data } = await axios.post<IClass>(BASE_URL, payload);
  return data;
};

/**
 * Issues a new invite code for the class. Students who already joined keep
 * their place — they are tied to the class, not to the code.
 */
export const rotateClassCode = async (classId: number): Promise<IClass> => {
  const { data } = await axios.post<IClass>(`${BASE_URL}/${classId}/code`);
  return data;
};
