/**
 * What one correct answer is worth. A test's reward follows from its questions
 * — ten points each — so it is shown in the form, never typed into it.
 */
export const POINTS_PER_QUESTION = 10;

/** The four options are fixed: the game renders exactly A–D, one of them right. */
export const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
export type OptionLetter = (typeof OPTION_LETTERS)[number];

/** Text carried in both locales; `uz` empty means "show the Russian one". */
export interface LocalizedText {
  ru: string;
  uz: string | null;
}

/** One row of the test catalog — what the cards are built from. */
export interface ITestData {
  id: number;
  name: string;
  label: string | null;
  /** Ten points per question, derived by the server — never sent by the form. */
  xp: number;
  /** Number of the test in the game («Тест 07»); unique, also its position. */
  level: number;
  /** Kept in step by the server: simply how many questions the test has. */
  question_count: number;
  /** 1 — visible to students, 0 — hidden. Staff see both. */
  is_active: number;
  /**
   * When the test opens for students, UTC ISO 8601; null — right away.
   * Entered and shown in Tashkent time (see `utils/date`).
   */
  opens_at: string | null;
  /** Public MinIO link to the cover; null while none is uploaded. */
  cover_url: string | null;
  created_at?: string;
}

/** A question as it is stored, with the answer key. Staff-only on the server. */
export interface ITestQuestion {
  id: number;
  position: number;
  text: LocalizedText;
  options: Record<OptionLetter, LocalizedText>;
  correct_option: OptionLetter;
}

export interface ITestDetails extends ITestData {
  questions: ITestQuestion[];
}

/** A question as the form sends it. */
export interface TestQuestionInput {
  id?: number;
  textRu: string;
  textUz?: string;
  optionsRu: Record<OptionLetter, string>;
  optionsUz: Record<OptionLetter, string>;
  correctOption: OptionLetter;
}

export interface CreateTestPayload {
  testName: string;
  level: number;
  isActive?: boolean;
  /** UTC ISO 8601; an empty string clears the date on update. */
  opensAt?: string;
  cover?: File;
  /** The complete list: a question missing from it is deleted server-side. */
  questions?: TestQuestionInput[];
}

export interface UpdateTestPayload extends Partial<CreateTestPayload> {
  /** Drops the stored cover without putting a new one in its place. */
  removeCover?: boolean;
}
