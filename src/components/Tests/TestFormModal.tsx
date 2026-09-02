import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { createTest, getTest, updateTest } from "../../api/tests";
import { FileField } from "../Missions/FileField";
import { fromDateTimeLocal, toDateTimeLocal } from "../../utils/date";
import { OPTION_LETTERS, POINTS_PER_QUESTION } from "../../types/tests";
import type { OptionLetter, TestQuestionInput } from "../../types/tests";

/** One row of the questions repeater. */
type QuestionInput = {
  /** Set for a question that is already stored; absent for a fresh one. */
  id?: number;
  textRu: string;
  textUz: string;
  optionsRu: Record<OptionLetter, string>;
  optionsUz: Record<OptionLetter, string>;
  correctOption: OptionLetter;
};

type Inputs = {
  testName: string;
  level: string;
  /** `datetime-local` value, read as Tashkent wall time; empty = opens at once. */
  opensAt: string;
  cover: FileList;
  questions: QuestionInput[];
};

interface Props {
  /** Omitted when creating; the test being edited otherwise. */
  testId?: number;
  onClose: () => void;
}

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

const fieldClass =
  "w-full rounded-lg border border-cyan-bright/35 bg-[rgba(2,37,51,0.6)] px-4 py-3 text-lg text-white outline-none transition-colors placeholder:text-grey/50 focus:border-cyan-bright";

const labelClass =
  "font-mono text-xs uppercase tracking-widest text-cyan-bright";

const emptyOptions = (): Record<OptionLetter, string> => ({
  A: "",
  B: "",
  C: "",
  D: "",
});

const blankQuestion = (): QuestionInput => ({
  textRu: "",
  textUz: "",
  optionsRu: emptyOptions(),
  optionsUz: emptyOptions(),
  correctOption: "A",
});

export const TestFormModal = ({ testId, onClose }: Props) => {
  const { t } = useTranslation();
  const isEdit = testId !== undefined;
  const queryClient = useQueryClient();

  /** Whether the test is visible to students; mirrors the card's eye toggle. */
  const [isActive, setIsActive] = useState(true);

  /** The stored cover the admin asked to drop; sent as `removeCover`. */
  const [coverRemoved, setCoverRemoved] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      level: "1",
      opensAt: "",
      questions: [blankQuestion()],
    },
  });

  const questions = useFieldArray({ control, name: "questions" });

  /** Drives the reward readout: it follows the rows, not a stored value. */
  const questionCount = questions.fields.length;

  const { data: test, isLoading: isTestLoading } = useQuery({
    queryKey: ["test", testId],
    queryFn: () => getTest(testId as number),
    enabled: isEdit,
  });

  // The form is filled in once the test arrives; the file input stays empty,
  // an untouched one means "keep the stored cover".
  useEffect(() => {
    if (test) {
      reset({
        testName: test.label ?? test.name,
        level: String(test.level ?? 0),
        opensAt: toDateTimeLocal(test.opens_at),
        questions: (test.questions ?? []).map((question) => ({
          id: question.id,
          textRu: question.text.ru,
          textUz: question.text.uz ?? "",
          optionsRu: Object.fromEntries(
            OPTION_LETTERS.map((letter) => [letter, question.options[letter].ru]),
          ) as Record<OptionLetter, string>,
          optionsUz: Object.fromEntries(
            OPTION_LETTERS.map((letter) => [
              letter,
              question.options[letter].uz ?? "",
            ]),
          ) as Record<OptionLetter, string>,
          correctOption: question.correct_option,
        })),
      });
      setIsActive(test.is_active !== 0);
      setCoverRemoved(false);
    }
  }, [test, reset]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: (values: Inputs) => {
      // The list is authoritative: a question missing from it is deleted.
      const questionPayload: TestQuestionInput[] = values.questions.map(
        (question) => ({
          id: question.id,
          textRu: question.textRu.trim(),
          textUz: question.textUz?.trim(),
          optionsRu: Object.fromEntries(
            OPTION_LETTERS.map((letter) => [
              letter,
              question.optionsRu[letter].trim(),
            ]),
          ) as Record<OptionLetter, string>,
          optionsUz: Object.fromEntries(
            OPTION_LETTERS.map((letter) => [
              letter,
              question.optionsUz[letter]?.trim() ?? "",
            ]),
          ) as Record<OptionLetter, string>,
          correctOption: question.correctOption,
        }),
      );

      const payload = {
        testName: values.testName.trim(),
        level: Number(values.level) || 0,
        isActive,
        // Sent as UTC; an empty field clears the date, which update keeps.
        opensAt: fromDateTimeLocal(values.opensAt ?? ""),
        cover: values.cover?.[0],
        questions: questionPayload,
      };

      if (!isEdit) {
        return createTest(payload);
      }

      return updateTest(testId, { ...payload, removeCover: coverRemoved });
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      queryClient.setQueryData(["test", saved.id], saved);
      onClose();
    },
  });

  const onSubmit: SubmitHandler<Inputs> = (values) => mutate(values);

  const response = axios.isAxiosError(error)
    ? (error.response?.data as { message?: string; field?: string } | undefined)
    : undefined;

  const errorMessage = axios.isAxiosError(error)
    ? error.response?.status === 403
      ? t("testForm.adminOnly")
      : // A clash on the number is the one failure worth naming outright.
        error.response?.status === 409
        ? t("testForm.levelTaken")
        : (response?.message ?? t("testForm.saveError"))
    : error
      ? t("testForm.saveError")
      : null;

  /** The server names the field it rejected, so it can be marked in place. */
  const serverField = response?.field;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-[640px] flex-col gap-5 overflow-y-auto rounded-2xl border border-cyan-bright/40 bg-[rgba(7,21,42,0.9)] p-7 backdrop-blur-xl"
      >
        <h2 className="text-3xl font-bold text-white">
          {isEdit ? t("testForm.editTitle") : t("testForm.newTitle")}
        </h2>

        {isEdit && isTestLoading && (
          <span className="text-lg text-grey">{t("common.loading")}</span>
        )}

        {/* Visibility — the same flag as the eye toggle on the test card. */}
        {isEdit && (
          <div
            className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors ${
              isActive
                ? "border-cyan-bright/35 bg-[rgba(2,37,51,0.4)]"
                : "border-grey/25 bg-white/[0.03]"
            }`}
          >
            <div className="flex flex-col">
              <span className={labelClass}>{t("testForm.visibility")}</span>
              <span className="text-base text-grey">
                {isActive
                  ? t("testForm.visibleToStudents")
                  : t("testForm.hiddenFromStudents")}
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
          <span className={labelClass}>{t("testForm.testName")}</span>
          <input
            placeholder={t("testForm.testNamePlaceholder")}
            className={fieldClass}
            {...register("testName", { required: t("testForm.required") })}
          />
          {errors.testName && (
            <span className="text-sm text-error">{errors.testName.message}</span>
          )}
        </label>

        {/*
          The reward is not an input: it is ten points per question, so it moves
          on its own as questions are added and removed below.
        */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-cyan-bright/25 bg-[rgba(2,37,51,0.4)] px-4 py-3">
          <div className="flex flex-col">
            <span className={labelClass}>{t("testForm.reward")}</span>
            <span className="text-base text-grey">
              {t("testForm.rewardHint", { points: POINTS_PER_QUESTION })}
            </span>
          </div>
          <span className="shrink-0 font-mono text-2xl font-bold text-cyan-bright">
            {questionCount * POINTS_PER_QUESTION} XP
          </span>
        </div>

        {/* Number of the test in the game — unique across all tests. */}
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{t("testForm.level")}</span>
          <input
            type="number"
            min={0}
            step={1}
            className={`${fieldClass} ${serverField === "level" ? "border-error" : ""}`}
            {...register("level", {
              required: t("testForm.required"),
              min: { value: 0, message: t("testForm.levelNegative") },
            })}
          />
          <span className="text-sm text-grey">{t("testForm.levelHint")}</span>
          {errors.level && (
            <span className="text-sm text-error">{errors.level.message}</span>
          )}
        </label>

        {/* Opening date — until it passes the test stays closed for students. */}
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{t("testForm.opensAt")}</span>
          <input
            type="datetime-local"
            className={`${fieldClass} [color-scheme:dark]`}
            {...register("opensAt")}
          />
          <span className="text-sm text-grey">
            {watch("opensAt")
              ? t("testForm.opensAtHint")
              : t("testForm.opensAtEmptyHint")}
          </span>
        </label>

        <FileField
          label={t("testForm.coverImage")}
          accept={IMAGE_ACCEPT}
          fileName={watch("cover")?.[0]?.name}
          registration={register("cover")}
          existingName={test?.cover_url ? t("testForm.coverStored") : null}
          isRemoved={coverRemoved}
          onRemove={() => setCoverRemoved(true)}
          onRestore={() => setCoverRemoved(false)}
        />

        <div className="border-t border-white/10 pt-4">
          <span className="text-lg text-grey">
            {t("testForm.questionsSection")}
          </span>
        </div>

        {questions.fields.map((field, index) => (
          <div
            key={field.id}
            className="flex flex-col gap-4 rounded-2xl border border-cyan-bright/25 bg-[rgba(2,37,51,0.35)] p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-lg font-bold text-cyan-bright">
                {t("testForm.question", { number: index + 1 })}
              </span>
              <button
                type="button"
                onClick={() => questions.remove(index)}
                className="text-base text-orange-bright transition-opacity hover:opacity-75"
              >
                {t("testForm.removeQuestion")}
              </button>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>{t("testForm.questionTextUz")}</span>
              <textarea
                rows={2}
                className={fieldClass}
                placeholder={t("testForm.optional")}
                {...register(`questions.${index}.textUz` as const)}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>{t("testForm.questionTextRu")}</span>
              <textarea
                rows={2}
                className={fieldClass}
                {...register(`questions.${index}.textRu` as const, {
                  required: t("testForm.questionTextRequired"),
                })}
              />
              {errors.questions?.[index]?.textRu && (
                <span className="text-sm text-error">
                  {errors.questions[index]?.textRu?.message}
                </span>
              )}
            </label>

            {/*
              The four options, each with its radio: picking the radio is how
              the right answer is set, so the choice sits next to the text it
              refers to rather than in a separate dropdown.
            */}
            <div className="flex flex-col gap-3">
              <span className={labelClass}>{t("testForm.options")}</span>
              {OPTION_LETTERS.map((letter) => {
                const isCorrect = watch(`questions.${index}.correctOption`) === letter;
                return (
                  <div
                    key={letter}
                    className={`flex flex-col gap-2 rounded-xl border p-3 transition-colors ${
                      isCorrect
                        ? "border-[#22c55e]/50 bg-[#22c55e]/10"
                        : "border-white/10 bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          value={letter}
                          className="h-4 w-4 accent-[#22c55e]"
                          {...register(`questions.${index}.correctOption` as const, {
                            required: true,
                          })}
                        />
                        <span
                          className={`font-mono text-base font-bold ${
                            isCorrect ? "text-[#4ade80]" : "text-cyan-bright"
                          }`}
                        >
                          {letter}
                        </span>
                      </label>
                      {isCorrect && (
                        <span className="rounded-full bg-[#22c55e]/20 px-2.5 py-0.5 font-mono text-xs uppercase tracking-widest text-[#4ade80]">
                          {t("testForm.correct")}
                        </span>
                      )}
                    </div>
                    <input
                      className={fieldClass}
                      placeholder={t("testForm.optionUzPlaceholder", { letter })}
                      {...register(`questions.${index}.optionsUz.${letter}` as const)}
                    />
                    <input
                      className={fieldClass}
                      placeholder={t("testForm.optionRuPlaceholder", { letter })}
                      {...register(`questions.${index}.optionsRu.${letter}` as const, {
                        required: t("testForm.optionsRequired"),
                      })}
                    />
                    {errors.questions?.[index]?.optionsRu?.[letter] && (
                      <span className="text-sm text-error">
                        {errors.questions[index]?.optionsRu?.[letter]?.message}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => questions.append(blankQuestion())}
          className="w-fit rounded-full border border-cyan-bright/40 px-5 py-2 text-lg text-cyan-bright transition-colors hover:bg-cyan-bright/10"
        >
          {t("testForm.addQuestion")}
        </button>

        {questions.fields.length === 0 && (
          <span className="text-base text-grey">{t("testForm.noQuestions")}</span>
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
            disabled={isPending || (isEdit && isTestLoading)}
            className="rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] px-6 py-2 text-lg font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {isPending
              ? t("testForm.saving")
              : isEdit
                ? t("testForm.save")
                : t("testForm.add")}
          </button>
        </div>
      </form>
    </div>
  );
};
