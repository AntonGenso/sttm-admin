import axios from "axios";
import type {
  CreateTestPayload,
  ITestData,
  ITestDetails,
  UpdateTestPayload,
} from "../types/tests";

const BASE_URL = "/api/tests";

export const getTests = async (): Promise<ITestData[]> => {
  const { data } = await axios.get<ITestData[]>(BASE_URL);
  return data;
};

/**
 * Carries the answer key, so the server hands it to staff only — a student's
 * token gets a 403 back.
 */
export const getTest = async (id: number): Promise<ITestDetails> => {
  const { data } = await axios.get<ITestDetails>(`${BASE_URL}/${id}`);
  return data;
};

/**
 * Sent as multipart, because the cover travels with the text fields; the
 * questions ride along as one JSON field.
 */
const toFormData = (
  payload: CreateTestPayload | UpdateTestPayload,
  { keepEmpty }: { keepEmpty: boolean },
) => {
  const form = new FormData();

  Object.entries(payload).forEach(([field, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (value instanceof File) {
      form.append(field, value);
      return;
    }

    if (field === "questions") {
      form.append(field, JSON.stringify(value));
      return;
    }

    if (typeof value === "boolean") {
      form.append(field, value ? "1" : "0");
      return;
    }

    // On update an empty date means "clear it", so empty strings are kept.
    if (value !== "" || keepEmpty) {
      form.append(field, String(value));
    }
  });

  return form;
};

export const createTest = async (
  payload: CreateTestPayload,
): Promise<ITestDetails> => {
  const { data } = await axios.post<ITestDetails>(
    BASE_URL,
    toFormData(payload, { keepEmpty: false }),
  );
  return data;
};

export const updateTest = async (
  id: number,
  payload: UpdateTestPayload,
): Promise<ITestDetails> => {
  const { data } = await axios.patch<ITestDetails>(
    `${BASE_URL}/${id}`,
    toFormData(payload, { keepEmpty: true }),
  );
  return data;
};

/** Flip a test's visibility without touching its other fields or questions. */
export const setTestActive = async (
  id: number,
  isActive: boolean,
): Promise<ITestDetails> => updateTest(id, { isActive });

export const deleteTest = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/${id}`);
};
