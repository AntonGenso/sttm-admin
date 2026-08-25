import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { createMission, getMission, updateMission } from "../../api/missions";
import { FileField } from "./FileField";
import type {
  IMissionDetails,
  MissionAssetField,
  MissionFactInput,
} from "../../types/missions";

/** One row of the facts repeater. */
type FactInput = {
  /** Set for a fact that is already stored; absent for a freshly added one. */
  id?: number;
  titleRu: string;
  titleUz: string;
  descriptionRu: string;
  descriptionUz: string;
  image: FileList;
  /** Picture already stored, kept unless a new one is picked or it is dropped. */
  existingImage?: string | null;
};

type Inputs = {
  missionName: string;
  xp: string;
  level: string;
  gameLink: string;
  facts: FactInput[];
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
  const { t } = useTranslation();
  const isEdit = missionId !== undefined;
  const queryClient = useQueryClient();

  /** Stored files the admin asked to drop; sent as `remove` on submit. */
  const [removed, setRemoved] = useState<MissionAssetField[]>([]);

  /** The bonus block (instruction + reward) is optional — one per mission. */
  const [showBonus, setShowBonus] = useState(false);

  /** Whether the mission is visible to students; mirrors the card's eye toggle. */
  const [isActive, setIsActive] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: { xp: "0", level: "1", bonusXp: "0", facts: [] },
  });

  const facts = useFieldArray({ control, name: "facts" });

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
        level: String(mission.level ?? 0),
        gameLink: mission.game_link ?? "",
        bonusXp: String(mission.bonus_xp ?? 0),
        facts: (mission.facts ?? []).map((fact) => ({
          id: fact.id,
          titleRu: fact.title.ru,
          titleUz: fact.title.uz ?? "",
          descriptionRu: fact.description.ru,
          descriptionUz: fact.description.uz ?? "",
          image: undefined as unknown as FileList,
          existingImage: fact.image_url,
        })),
      });
      setShowBonus(missionHasBonus(mission));
      setIsActive(mission.is_active !== 0);
    }
  }, [mission, reset]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: (values: Inputs) => {
      const bonusActive = showBonus;

      // The list is authoritative: a fact missing from it is deleted server-side.
      const factPayload: MissionFactInput[] = values.facts.map((fact) => ({
        id: fact.id,
        titleRu: fact.titleRu.trim(),
        titleUz: fact.titleUz?.trim(),
        descriptionRu: fact.descriptionRu.trim(),
        descriptionUz: fact.descriptionUz?.trim(),
        image: fact.image?.[0],
        keepImage: Boolean(fact.existingImage),
      }));

      const payload = {
        missionName: values.missionName.trim(),
        xp: Number(values.xp) || 0,
        level: Number(values.level) || 0,
        facts: factPayload,
        // The current/bonus split is gone; every mission is a "current" one
        // that may carry a bonus. The column is kept for backward compatibility.
        type: "current" as const,
        isActive,
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
        for (const field of [
          "documentRu",
          "documentUz",
        ] as MissionAssetField[]) {
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
      ? t("missionForm.adminOnly")
      : ((error.response?.data as { message?: string } | undefined)?.message ??
        t("missionForm.saveError"))
    : error
      ? t("missionForm.saveError")
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
          {isEdit ? t("missionForm.editTitle") : t("missionForm.newTitle")}
        </h2>

        {isEdit && isMissionLoading && (
          <span className="text-lg text-grey">{t("common.loading")}</span>
        )}

        {/* Visibility — the same flag as the eye toggle on the mission card. */}
        {isEdit && (
          <div
            className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors ${
              isActive
                ? "border-cyan-bright/35 bg-[rgba(2,37,51,0.4)]"
                : "border-grey/25 bg-white/[0.03]"
            }`}
          >
            <div className="flex flex-col">
              <span className={labelClass}>{t("missionForm.visibility")}</span>
              <span className="text-base text-grey">
                {isActive
                  ? t("missionForm.visibleToStudents")
                  : t("missionForm.hiddenFromStudents")}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive((prev) => !prev)}
              className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${
                isActive
                  ? "border-cyan-bright/50 bg-cyan-bright/30"
                  : "border-grey/40 bg-white/10"
              }`}
            >
              <span
                className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all ${
                  isActive ? "left-6 bg-cyan-bright" : "left-1 bg-grey"
                }`}
              />
            </button>
          </div>
        )}

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{t("missionForm.missionName")}</span>
          <input
            placeholder={t("missionForm.missionNamePlaceholder")}
            className={fieldClass}
            {...register("missionName", { required: true })}
          />
          {errors.missionName && (
            <span className="text-sm text-error">
              {t("missionForm.nameRequired")}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{t("missionForm.xp")}</span>
          <input
            type="number"
            min={0}
            step={1}
            className={fieldClass}
            {...register("xp", {
              required: t("missionForm.nameRequired"),
              min: { value: 0, message: t("missionForm.xpNegative") },
            })}
          />
          {errors.xp && (
            <span className="text-sm text-error">{errors.xp.message}</span>
          )}
        </label>

        {/* Number of the mission in the game; its bonus card repeats it. */}
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{t("missionForm.level")}</span>
          <input
            type="number"
            min={0}
            step={1}
            className={fieldClass}
            {...register("level", {
              min: { value: 0, message: t("missionForm.levelNegative") },
            })}
          />
          {errors.level && (
            <span className="text-sm text-error">{errors.level.message}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{t("missionForm.gameLink")}</span>
          <input
            placeholder="https://..."
            className={fieldClass}
            {...register("gameLink")}
          />
        </label>

        <FileField
          label={t("missionForm.coverImage")}
          accept={IMAGE_ACCEPT}
          {...fileFieldProps("cover")}
        />

        <div className="border-t border-white/10 pt-4">
          <span className="text-lg text-grey">
            {t("missionForm.missionVideo")}
          </span>
        </div>

        <FileField
          label={t("missionForm.videoUz")}
          accept={VIDEO_ACCEPT}
          {...fileFieldProps("videoUz")}
        />
        <FileField
          label={t("missionForm.videoRu")}
          accept={VIDEO_ACCEPT}
          {...fileFieldProps("videoRu")}
        />

        <div className="border-t border-white/10 pt-4">
          <span className="text-lg text-grey">
            {t("missionForm.presentationSection")}
          </span>
        </div>

        <FileField
          label={t("missionForm.presentationUz")}
          accept={DOCUMENT_ACCEPT}
          {...fileFieldProps("teacherGuideUz")}
        />
        <FileField
          label={t("missionForm.presentationRu")}
          accept={DOCUMENT_ACCEPT}
          {...fileFieldProps("teacherGuideRu")}
        />

        <div className="border-t border-white/10 pt-4">
          <span className="text-lg text-grey">
            {t("missionForm.notesSection")}
          </span>
        </div>

        <FileField
          label={t("missionForm.notesUz")}
          accept={DOCUMENT_ACCEPT}
          {...fileFieldProps("lessonNotesUz")}
        />
        <FileField
          label={t("missionForm.notesRu")}
          accept={DOCUMENT_ACCEPT}
          {...fileFieldProps("lessonNotesRu")}
        />

        {/* Interesting facts — any number, shown on the mission screen. */}
        <div className="border-t border-white/10 pt-4">
          <span className="text-lg text-grey">
            {t("missionForm.factsSection")}
          </span>
        </div>

        {facts.fields.map((field, index) => (
          <div
            key={field.id}
            className="flex flex-col gap-4 rounded-2xl border border-cyan-bright/25 bg-[rgba(2,37,51,0.35)] p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-lg font-bold text-cyan-bright">
                {t("missionForm.fact", { number: index + 1 })}
              </span>
              <button
                type="button"
                onClick={() => facts.remove(index)}
                className="text-base text-orange-bright transition-opacity hover:opacity-75"
              >
                {t("missionForm.removeFact")}
              </button>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>{t("missionForm.factTitleUz")}</span>
              <input
                className={fieldClass}
                placeholder={t("missionForm.optional")}
                {...register(`facts.${index}.titleUz` as const)}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>{t("missionForm.factTitleRu")}</span>
              <input
                className={fieldClass}
                {...register(`facts.${index}.titleRu` as const, {
                  required: t("missionForm.factTextRequired"),
                })}
              />
              {errors.facts?.[index]?.titleRu && (
                <span className="text-sm text-error">
                  {errors.facts[index]?.titleRu?.message}
                </span>
              )}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>{t("missionForm.factTextUz")}</span>
              <textarea
                rows={3}
                className={fieldClass}
                placeholder={t("missionForm.optional")}
                {...register(`facts.${index}.descriptionUz` as const)}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>{t("missionForm.factTextRu")}</span>
              <textarea
                rows={3}
                className={fieldClass}
                {...register(`facts.${index}.descriptionRu` as const, {
                  required: t("missionForm.factTextRequired"),
                })}
              />
              {errors.facts?.[index]?.descriptionRu && (
                <span className="text-sm text-error">
                  {errors.facts[index]?.descriptionRu?.message}
                </span>
              )}
            </label>

            <FileField
              label={t("missionForm.factImage")}
              accept={IMAGE_ACCEPT}
              fileName={pickedName(watch(`facts.${index}.image`))}
              registration={register(`facts.${index}.image` as const)}
              existingName={
                watch(`facts.${index}.existingImage`)
                  ? t("missionForm.factImageStored")
                  : null
              }
              onRemove={() => setValue(`facts.${index}.existingImage`, null)}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            facts.append({
              titleRu: "",
              titleUz: "",
              descriptionRu: "",
              descriptionUz: "",
              image: undefined as unknown as FileList,
              existingImage: null,
            })
          }
          className="w-fit rounded-full border border-cyan-bright/40 px-5 py-2 text-lg text-cyan-bright transition-colors hover:bg-cyan-bright/10"
        >
          {t("missionForm.addFact")}
        </button>

        {/* Bonus — optional, exactly one per mission. */}
        {!showBonus ? (
          <button
            type="button"
            onClick={() => setShowBonus(true)}
            className="mt-2 w-fit rounded-full border border-[#22c55e]/50 bg-[#22c55e]/10 px-5 py-2 text-lg font-bold text-[#4ade80] transition-colors hover:bg-[#22c55e]/20"
          >
            {t("missionForm.addBonus")}
          </button>
        ) : (
          <div className="flex flex-col gap-5 rounded-2xl border border-[#22c55e]/35 bg-[#22c55e]/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-lg font-bold text-[#4ade80]">
                {t("missionForm.bonusMission")}
              </span>
              <button
                type="button"
                onClick={() => setShowBonus(false)}
                className="text-base text-orange-bright transition-opacity hover:opacity-75"
              >
                {t("missionForm.removeBonus")}
              </button>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>{t("missionForm.bonusXp")}</span>
              <input
                type="number"
                min={0}
                step={1}
                className={fieldClass}
                {...register("bonusXp", {
                  min: { value: 0, message: t("missionForm.bonusXpNegative") },
                })}
              />
              {errors.bonusXp && (
                <span className="text-sm text-error">
                  {errors.bonusXp.message}
                </span>
              )}
            </label>

            <FileField
              label={t("missionForm.instructionUz")}
              accept={DOCUMENT_ACCEPT}
              {...fileFieldProps("documentUz")}
            />
            <FileField
              label={t("missionForm.instructionRu")}
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
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={isPending || (isEdit && isMissionLoading)}
            className="rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] px-6 py-2 text-lg font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {isPending
              ? t("missionForm.saving")
              : isEdit
                ? t("missionForm.save")
                : t("missionForm.add")}
          </button>
        </div>
      </form>
    </div>
  );
};
