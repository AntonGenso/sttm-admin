export type MissionType = "current" | "bonuse";

export interface IMissionData {
  id: number;
  name: string;
  label: string;
  xp?: number;
  type?: MissionType | "";
  /** Public MinIO link to the mission cover; null while none is uploaded. */
  cover_url?: string | null;
  game_link?: string | null;
  /** Public MinIO link to the mission video; null while none is uploaded. */
  video_url?: string | null;
  picture?: string;
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
  type: MissionType;
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
}

/** Same fields, plus the files to drop; everything is optional on update. */
export interface UpdateMissionPayload extends Partial<CreateMissionPayload> {
  remove?: MissionAssetField[];
}
