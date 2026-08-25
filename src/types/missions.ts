export type MissionType = "current" | "bonuse";

export interface IMissionData {
  id: number;
  name: string;
  label: string;
  xp?: number;
  /** Number of the mission in the game ("Миссия 07"); also its position. */
  level?: number;
  type?: MissionType | "";
  /** 1 — visible to students, 0 — hidden. Admins see both. */
  is_active?: number;
  /** Public MinIO link to the mission cover; null while none is uploaded. */
  cover_url?: string | null;
  game_link?: string | null;
  /** Public MinIO link to the mission video; null while none is uploaded. */
  video_url?: string | null;
  picture?: string;
}

/** «Интересный факт» as it is stored: text in the database, picture in MinIO. */
export interface IMissionFact {
  id: number;
  position: number;
  title: { ru: string; uz: string | null };
  description: { ru: string; uz: string | null };
  image_url: string | null;
}

/**
 * A fact as the form sends it. `image` is a newly picked file; `keepImage`
 * says the stored picture stays. Neither means the fact has no picture.
 */
export interface MissionFactInput {
  id?: number;
  titleRu: string;
  titleUz?: string;
  descriptionRu: string;
  descriptionUz?: string;
  image?: File;
  keepImage?: boolean;
}

/** Short-lived signed link to a file in the private bucket. */
export interface IMissionFile {
  url: string | null;
  name: string | null;
}

export interface IMissionDetails extends IMissionData {
  /** Reward for the bonus part; the bonus exists when instruction files are set. */
  bonus_xp: number;
  /** Localized mission videos, public MinIO links. */
  video: { ru: IMissionFile; uz: IMissionFile };
  /** «Инструкция для ученика» — private, handed out by signed link. */
  documents: { ru: IMissionFile; uz: IMissionFile };
  /** «Презентация» — private, handed out by signed link. */
  teacher_guide: { ru: IMissionFile; uz: IMissionFile };
  /** «Конспект урока» — private, handed out by signed link. */
  lesson_notes: { ru: IMissionFile; uz: IMissionFile };
  /** «Интересные факты», in the order they are shown. */
  facts: IMissionFact[];
}

/** Asset fields the edit form can clear on the server. */
export type MissionAssetField =
  | "cover"
  | "videoRu"
  | "videoUz"
  | "documentRu"
  | "documentUz"
  | "teacherGuideRu"
  | "teacherGuideUz"
  | "lessonNotesRu"
  | "lessonNotesUz";

export interface CreateMissionPayload {
  missionName: string;
  xp: number;
  level?: number;
  type: MissionType;
  isActive?: boolean;
  gameLink?: string;
  bonusXp?: number;
  cover?: File;
  videoRu?: File;
  videoUz?: File;
  documentRu?: File;
  documentUz?: File;
  teacherGuideRu?: File;
  teacherGuideUz?: File;
  lessonNotesRu?: File;
  lessonNotesUz?: File;
  /** The complete list of facts: what is missing from it gets deleted. */
  facts?: MissionFactInput[];
}

/** Same fields, plus the files to drop; everything is optional on update. */
export interface UpdateMissionPayload extends Partial<CreateMissionPayload> {
  remove?: MissionAssetField[];
}
