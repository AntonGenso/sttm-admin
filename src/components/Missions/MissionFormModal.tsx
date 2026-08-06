import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import axios from "axios";
import { createMission, getMission, updateMission } from "../../api/missions";
import { FileField } from "./FileField";
import type {
  IMissionDetails,
  MissionAssetField,
  MissionType,
} from "../../types/missions";

type Inputs = {
  missionName: string;
  xp: string;
  type: MissionType;
  gameLink: string;
  videoLink: string;
  cover: FileList;
  documentRu: FileList;
  documentUz: FileList;
  teacherGuideRu: FileList;
  teacherGuideUz: FileList;
};

interface Props {
  /** Omitted when creating; the mission being edited otherwise. */
  missionId?: number;
  onClose: () => void;
}

const DOCUMENT_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx";
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

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
    case "documentRu":
      return mission.documents.ru.name;
    case "documentUz":
      return mission.documents.uz.name;
    case "teacherGuideRu":
      return mission.teacher_guide.ru.name;
    case "teacherGuideUz":
      return mission.teacher_guide.uz.name;
  }
};

export const MissionFormModal = ({ missionId, onClose }: Props) => {
  const isEdit = missionId !== undefined;
  const queryClient = useQueryClient();

  /** Stored files the admin asked to drop; sent as `remove` on submit. */
  const [removed, setRemoved] = useState<MissionAssetField[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: { xp: "0", type: "current" },
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
        type: (mission.type || "current") as MissionType,
        gameLink: mission.game_link ?? "",
        videoLink: mission.video_link ?? "",
      });
    }
  }, [mission, reset]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: (values: Inputs) => {
      const payload = {
        missionName: values.missionName.trim(),
        xp: Number(values.xp) || 0,
        type: values.type,
        gameLink: values.gameLink?.trim() ?? "",
        videoLink: values.videoLink?.trim() ?? "",
        cover: values.cover?.[0],
        documentRu: values.documentRu?.[0],
        documentUz: values.documentUz?.[0],
        teacherGuideRu: values.teacherGuideRu?.[0],
        teacherGuideUz: values.teacherGuideUz?.[0],
      };

      return isEdit
        ? updateMission(missionId, { ...payload, remove: removed })
        : createMission(payload);
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

        <div className="flex gap-4">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className={labelClass}>XP</span>
            <input
              type="number"
              min={0}
              step={1}
              className={fieldClass}
              {...register("xp", {
                min: { value: 0, message: "XP cannot be negative" },
              })}
            />
            {errors.xp && (
              <span className="text-sm text-error">{errors.xp.message}</span>
            )}
          </label>

          <label className="flex flex-1 flex-col gap-1.5">
            <span className={labelClass}>Type</span>
            <select className={fieldClass} {...register("type")}>
              <option value="current" className="bg-bg-deep">
                Current
              </option>
              <option value="bonuse" className="bg-bg-deep">
                Bonus
              </option>
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Game link</span>
          <input
            placeholder="https://..."
            className={fieldClass}
            {...register("gameLink")}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Video link</span>
          <input
            placeholder="https://..."
            className={fieldClass}
            {...register("videoLink")}
          />
        </label>

        <FileField
          label="Cover image"
          accept={IMAGE_ACCEPT}
          {...fileFieldProps("cover")}
        />

        <div className="border-t border-white/10 pt-4">
          <span className="text-lg text-grey">Materials for students</span>
        </div>

        <FileField
          label="Document (RU)"
          accept={DOCUMENT_ACCEPT}
          {...fileFieldProps("documentRu")}
        />
        <FileField
          label="Document (UZ)"
          accept={DOCUMENT_ACCEPT}
          {...fileFieldProps("documentUz")}
        />

        <div className="border-t border-white/10 pt-4">
          <span className="text-lg text-grey">
            Teacher guide — private, handed out by signed link
          </span>
        </div>

        <FileField
          label="Teacher guide (RU)"
          accept={DOCUMENT_ACCEPT}
          {...fileFieldProps("teacherGuideRu")}
        />
        <FileField
          label="Teacher guide (UZ)"
          accept={DOCUMENT_ACCEPT}
          {...fileFieldProps("teacherGuideUz")}
        />

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
