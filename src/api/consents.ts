import axios from "axios";

const BASE_URL = "/api/users/me/consents";

export type ConsentDocument = "rules" | "privacy";

export interface ConsentStatus {
  /** Documents whose current edition the user has not accepted yet. */
  pending: ConsentDocument[];
  versions: Record<ConsentDocument, string>;
}

export const getMyConsents = async (): Promise<ConsentStatus> => {
  const { data } = await axios.get<ConsentStatus>(BASE_URL);
  return data;
};

/** Both documents are accepted together — the server rejects anything else. */
export const acceptMyConsents = async (): Promise<ConsentStatus> => {
  const { data } = await axios.post<ConsentStatus>(BASE_URL, {
    acceptRules: true,
    acceptPrivacy: true,
  });
  return data;
};
