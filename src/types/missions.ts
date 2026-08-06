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
  video_link?: string | null;
  picture?: string;
}

/** Short-lived signed link to a file in the private bucket. */
export interface IMissionFile {
  url: string | null;
  name: string | null;
}

export interface IMissionDetails extends IMissionData {
  documents: { ru: IMissionFile; uz: IMissionFile };
  teacher_guide: { ru: IMissionFile; uz: IMissionFile };
}

/** Asset fields the edit form can clear on the server. */
export type MissionAssetField =
  | "cover"
  | "documentRu"
  | "documentUz"
  | "teacherGuideRu"
  | "teacherGuideUz";

export interface CreateMissionPayload {
  missionName: string;
  xp: number;
  type: MissionType;
  gameLink?: string;
  videoLink?: string;
  cover?: File;
  documentRu?: File;
  documentUz?: File;
  teacherGuideRu?: File;
  teacherGuideUz?: File;
}

/** Same fields, plus the files to drop; everything is optional on update. */
export interface UpdateMissionPayload extends Partial<CreateMissionPayload> {
  remove?: MissionAssetField[];
}
