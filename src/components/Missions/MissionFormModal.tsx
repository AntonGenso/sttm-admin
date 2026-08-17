import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import axios from "axios";
import { createMission, getMission, updateMission } from "../../api/missions";
import { FileField } from "./FileField";
import type { IMissionDetails, MissionAssetField } from "../../types/missions";

type Inputs = {
  missionName: string;
  xp: string;
  gameLink: string;
  bonusXp: string;
  cover: FileList;
  videoRu: FileList;
  videoUz: FileList;
  documentRu: FileList;
  documentUz: FileList;
  teacherGuideRu: FileList;
  teacherGuideUz: FileList;
  lessonNotesRu: FileList;
  lessonNotesUz: FileList;
};

interface Props {
  /** Omitted when creating; the mission being edited otherwise. */
  missionId?: number;
  onClose: () => void;
}

const DOCUMENT_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx";
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const VIDEO_ACCEPT =
  "video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska";

const fieldClass =
  "w-full rounded-lg border border-cyan-bright/35 bg-[rgba(2,37,51,0.6)] px-4 py-3 text-lg text-white outline-none transition-colors placeholder:text-grey/50 focus:border-cyan-bright";

const labelClass =
  "font-mono text-xs uppercase tracking-widest text-cyan-bright";

/** Name shown for the file already stored in a given field. */
const storedName = (
  mission: IMissionDetails | undefined,
  field: MissionAssetField,
): string | null => {
  if (!mission) {
    return null;
  }

  switch (field) {
    case "cover":
      return mission.cover_url ? "Cover uploaded" : null;
    case "videoRu":
      return mission.video.ru.name;
    case "videoUz":
      return mission.video.uz.name;
    case "documentRu":
      return mission.documents.ru.name;
    case "documentUz":
      return mission.documents.uz.name;
    case "teacherGuideRu":
      return mission.teacher_guide.ru.name;
    case "teacherGuideUz":
      return mission.teacher_guide.uz.name;
    case "lessonNotesRu":
      return mission.lesson_notes.ru.name;
    case "lessonNotesUz":
      return mission.lesson_notes.uz.name;
  }
};

/** A mission carries a bonus when its instruction files or reward are set. */
const missionHasBonus = (mission: IMissionDetails): boolean =>
  Boolean(
    mission.documents.ru.name ||
      mission.documents.uz.name ||
      (mission.bonus_xp ?? 0) > 0,
  );

export const MissionFormModal = ({ missionId, onClose }: Props) => {
  const isEdit = missionId !== undefined;
  const queryClient = useQueryClient();

  /** Stored files the admin asked to drop; sent as `remove` on submit. */
  const [removed, setRemoved] = useState<MissionAssetField[]>([]);

  /** The bonus block (instruction + reward) is optional — one per mission. */
  const [showBonus, setShowBonus] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: { xp: "0", bonusXp: "0" },
  });

  const { data: mission, isLoading: isMissionLoading } = useQuery({
    queryKey: ["mission", missionId],
    queryFn: () => getMission(missionId as number),
    enabled: isEdit,
  });

  // The form is filled in once the mission arrives; files stay empty, an
  // untouched file input means "keep what is stored".
  useEffect(() => {
    if (mission) {
      reset({
        missionName: mission.label,
        xp: String(mission.xp ?? 0),
        gameLink: mission.game_link ?? "",
        bonusXp: String(mission.bonus_xp ?? 0),
      });
      setShowBonus(missionHasBonus(mission));
    }
  }, [mission, reset]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: (values: Inputs) => {
      const bonusActive = showBonus;

      const payload = {
        missionName: values.missionName.trim(),
        xp: Number(values.xp) || 0,
        // The current/bonus split is gone; every mission is a "current" one
        // that may carry a bonus. The column is kept for backward compatibility.
        type: "current" as const,
        gameLink: values.gameLink?.trim() ?? "",
        bonusXp: bonusActive ? Number(values.bonusXp) || 0 : 0,
        cover: values.cover?.[0],
        videoRu: values.videoRu?.[0],
        videoUz: values.videoUz?.[0],
        teacherGuideRu: values.teacherGuideRu?.[0],
        teacherGuideUz: values.teacherGuideUz?.[0],
        lessonNotesRu: values.lessonNotesRu?.[0],
        lessonNotesUz: values.lessonNotesUz?.[0],
        // The instruction files are the bonus payload — only sent while the
        // bonus block is on.
        documentRu: bonusActive ? values.documentRu?.[0] : undefined,
        documentUz: bonusActive ? values.documentUz?.[0] : undefined,
      };

      if (!isEdit) {
        return createMission(payload);
      }

      // Dropping the bonus clears its stored instruction files too.
      const remove = [...removed];
      if (!bonusActive) {
        for (const field of ["documentRu", "documentUz"] as MissionAssetField[]) {
          if (!remove.includes(field)) {
            remove.push(field);
          }
        }
      }

      return updateMission(missionId, { ...payload, remove });
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      queryClient.setQueryData(["mission", saved.id], saved);
      onClose();
    },
  });

  const onSubmit: SubmitHandler<Inputs> = (values) => mutate(values);

  const pickedName = (files?: FileList) => files?.[0]?.name;

  const fileFieldProps = (field: MissionAssetField) => ({
    fileName: pickedName(watch(field)),
    registration: register(field),
    existingName: storedName(mission, field),
    isRemoved: removed.includes(field),
    onRemove: () => setRemoved((fields) => [...fields, field]),
    onRestore: () =>
      setRemoved((fields) => fields.filter((item) => item !== field)),
  });

  const errorMessage = axios.isAxiosError(error)
    ? error.response?.status === 403
      ? "Only an admin can change missions"
      : ((error.response?.data as { message?: string } | undefined)?.message ??
        "Could not save the mission")
    : error
      ? "Could not save the mission"
      : null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-[560px] flex-col gap-5 overflow-y-auto rounded-2xl border border-cyan-bright/40 bg-[rgba(7,21,42,0.9)] p-7 backdrop-blur-xl"
      >
        <h2 className="text-3xl font-bold text-white">
          {isEdit ? "Edit mission" : "New mission"}
        </h2>

        {isEdit && isMissionLoading && (
          <span className="text-lg text-grey">Loading...</span>
        )}

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Mission name</span>
          <input
            placeholder="e.g. First orbit"
            className={fieldClass}
            {...register("missionName", { required: true })}
          />
          {errors.missionName && (
            <span className="text-sm text-error">This field is required</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>XP</span>
          <input
            type="number"
            min={0}
            step={1}
            className={fieldClass}
            {...register("xp", {
              required: "This field is required",
              min: { value: 0, message: "XP cannot be negative" },
            })}
          />
          {errors.xp && (
            <span className="text-sm text-error">{errors.xp.message}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Game link</span>
          <input
            placeholder="https://..."
            className={fieldClass}
            {...register("gameLink")}
          />
        </label>

        <FileField
          label="Cover image"
          accept={IMAGE_ACCEPT}
          {...fileFieldProps("cover")}
        />

        <div className="border-t border-white/10 pt-4">
          <span className="text-lg text-grey">Видео миссии</span>
        </div>

        <FileField
          label="Видео (UZ)"
          accept={VIDEO_ACCEPT}
          {...fileFieldProps("videoUz")}
        />
        <FileField
          label="Видео (RU)"
          accept={VIDEO_ACCEPT}
          {...fileFieldProps("videoRu")}
        />

        <div className="border-t border-white/10 pt-4">
          <span className="text-lg text-grey">
            Презентация — private, handed out by signed link
          </span>
        </div>

        <FileField
          label="Презентация (UZ)"
          accept={DOCUMENT_ACCEPT}
          {...fileFieldProps("teacherGuideUz")}
        />
        <FileField
          label="Презентация (RU)"
          accept={DOCUMENT_ACCEPT}
          {...fileFieldProps("teacherGuideRu")}
        />

        <div className="border-t border-white/10 pt-4">
          <span className="text-lg text-grey">
            Конспект урока — private, handed out by signed link
          </span>
        </div>

        <FileField
          label="Конспект урока (UZ)"
          accept={DOCUMENT_ACCEPT}
          {...fileFieldProps("lessonNotesUz")}
        />
        <FileField
          label="Конспект урока (RU)"
          accept={DOCUMENT_ACCEPT}
          {...fileFieldProps("lessonNotesRu")}
        />

        {/* Bonus — optional, exactly one per mission. */}
        {!showBonus ? (
          <button
            type="button"
            onClick={() => setShowBonus(true)}
            className="mt-2 w-fit rounded-full border border-[#22c55e]/50 bg-[#22c55e]/10 px-5 py-2 text-lg font-bold text-[#4ade80] transition-colors hover:bg-[#22c55e]/20"
          >
            + Add bonus
          </button>
        ) : (
          <div className="flex flex-col gap-5 rounded-2xl border border-[#22c55e]/35 bg-[#22c55e]/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-lg font-bold text-[#4ade80]">
                Бонусная миссия
              </span>
              <button
                type="button"
                onClick={() => setShowBonus(false)}
                className="text-base text-orange-bright transition-opacity hover:opacity-75"
              >
                Remove bonus
              </button>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Bonus XP</span>
              <input
                type="number"
                min={0}
                step={1}
                className={fieldClass}
                {...register("bonusXp", {
                  min: { value: 0, message: "Bonus XP cannot be negative" },
                })}
              />
              {errors.bonusXp && (
                <span className="text-sm text-error">
                  {errors.bonusXp.message}
                </span>
              )}
            </label>

            <FileField
              label="Инструкция для ученика (UZ)"
              accept={DOCUMENT_ACCEPT}
              {...fileFieldProps("documentUz")}
            />
            <FileField
              label="Инструкция для ученика (RU)"
              accept={DOCUMENT_ACCEPT}
              {...fileFieldProps("documentRu")}
            />
          </div>
        )}

        {errorMessage && (
          <span className="text-base text-error">{errorMessage}</span>
        )}

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-5 py-2 text-lg text-grey transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || (isEdit && isMissionLoading)}
            className="rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] px-6 py-2 text-lg font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {isPending
              ? "Saving..."
              : isEdit
                ? "Save changes"
                : "Add mission"}
          </button>
        </div>
      </form>
    </div>
  );
};
