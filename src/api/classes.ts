import axios from "axios";
import type { CreateClassPayload, IClass } from "../types/classes";

const BASE_URL = "/api/classes";

/** Classes of the signed-in teacher — the backend takes them from the token. */
export const getMyClasses = async (): Promise<IClass[]> => {
  const { data } = await axios.get<IClass[]>(BASE_URL);
  return data;
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
