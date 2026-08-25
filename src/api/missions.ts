import axios from "axios";
import type {
  CreateMissionPayload,
  IMissionData,
  IMissionDetails,
  MissionFactInput,
  UpdateMissionPayload,
} from "../types/missions";

const BASE_URL = "/api/missions";

export const getMissions = async (): Promise<IMissionData[]> => {
  const { data } = await axios.get<IMissionData[]>(BASE_URL);
  return data;
};

export const getMission = async (id: number): Promise<IMissionDetails> => {
  const { data } = await axios.get<IMissionDetails>(`${BASE_URL}/${id}`);
  return data;
};

/**
 * Admin-only on the server: a non-admin caller gets a 403 back.
 *
 * Sent as multipart — the cover, the student documents and the teacher guides
 * travel with the text fields and are uploaded to MinIO by the backend.
 */
const toFormData = (
  payload: CreateMissionPayload | UpdateMissionPayload,
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

    // Facts go as one JSON field; every picked picture rides along under the
    // name the JSON points at.
    if (field === "facts") {
      const facts = (value as MissionFactInput[]).map((fact, index) => {
        const imageField = fact.image ? `factImage_${index}` : null;
        if (fact.image && imageField) {
          form.append(imageField, fact.image);
        }

        return {
          id: fact.id,
          titleRu: fact.titleRu,
          titleUz: fact.titleUz ?? "",
          descriptionRu: fact.descriptionRu,
          descriptionUz: fact.descriptionUz ?? "",
          imageField,
          keepImage: !imageField && Boolean(fact.keepImage),
        };
      });

      form.append("facts", JSON.stringify(facts));
      return;
    }

    // On update an empty link means "clear it", so empty strings are kept.
    if (Array.isArray(value)) {
      value.forEach((item) => form.append(field, String(item)));
      return;
    }

    if (value !== "" || keepEmpty) {
      form.append(field, String(value));
    }
  });

  return form;
};

export const createMission = async (
  payload: CreateMissionPayload,
): Promise<IMissionDetails> => {
  const { data } = await axios.post<IMissionDetails>(
    BASE_URL,
    toFormData(payload, { keepEmpty: false }),
  );
  return data;
};

export const updateMission = async (
  id: number,
  payload: UpdateMissionPayload,
): Promise<IMissionDetails> => {
  const { data } = await axios.patch<IMissionDetails>(
    `${BASE_URL}/${id}`,
    toFormData(payload, { keepEmpty: true }),
  );
  return data;
};

/** Flip a mission's visibility without touching its other fields or files. */
export const setMissionActive = async (
  id: number,
  isActive: boolean,
): Promise<IMissionDetails> => updateMission(id, { isActive });

export const deleteMission = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/${id}`);
};
