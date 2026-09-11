import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { createClass } from "../../api/classes";
import { getSchools } from "../../api/dictionaries";
import { CLASS_GRADES, CLASS_LETTER_REGEX } from "../../types/classes";
import type { IClass } from "../../types/classes";
import { useAuthStore } from "../../store/authStore";
import { Select } from "../../uikit/Select";
import { ModalShell, fieldClass, labelClass } from "../Directory/ModalShell";

type Inputs = { grade: string; letter: string };

interface Props {
  onClose: () => void;
  onCreated?: (created: IClass) => void;
}

/**
 * Класс — это класс и буква.
 *
 * Город и школа сюда больше не вводятся: они лежат в профиле учителя, который
 * заполняется один раз при регистрации. Школа показана строкой, а не полем —
 * менять её при каждом создании класса не надо, но у совместителей и методистов
 * такая необходимость бывает, поэтому рядом есть «изменить»: выбор другой школы
 * своего города только для этого класса, профиль остаётся прежним.
 */
export const CreateClassModal = ({ onClose, onCreated }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [schoolId, setSchoolId] = useState<number | null>(
    user?.schoolId ?? null,
  );
  const [isPickingSchool, setIsPickingSchool] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({ defaultValues: { grade: "", letter: "" } });

  const { data: schools } = useQuery({
    queryKey: ["schools", user?.cityId],
    queryFn: () => getSchools(user?.cityId as number),
    enabled: isPickingSchool && Boolean(user?.cityId),
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: createClass,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["classes", "my"] });
      onCreated?.(created);
      onClose();
    },
  });

  const onSubmit: SubmitHandler<Inputs> = (values) =>
    mutate({
      grade: Number(values.grade),
      letter: values.letter,
      // Своя школа и так подставится на сервере — шлём id, только если её сменили.
      schoolId: schoolId && schoolId !== user?.schoolId ? schoolId : undefined,
    });

  const serverMessage = axios.isAxiosError(error)
    ? ((error.response?.data as { message?: string } | undefined)?.message ??
      t("createClass.createError"))
    : error
      ? t("createClass.createError")
      : null;

  const selectedSchoolName =
    schools?.find((school) => school.id === schoolId)?.name ??
    (schoolId === user?.schoolId ? user?.schoolName : null);

  return (
    <ModalShell
      title={t("createClass.title")}
      subtitle={t("createClass.subtitle")}
      error={serverMessage}
      isPending={isPending}
      submitLabel={
        isPending ? t("createClass.creating") : t("createClass.create")
      }
      onSubmit={handleSubmit(onSubmit)}
      onClose={onClose}
    >
      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>{t("createClass.school")}</span>

        {isPickingSchool ? (
          <Select
            value={schoolId}
            onChange={setSchoolId}
            options={
              schools?.map((school) => ({
                id: school.id,
                label: school.name,
              })) ?? []
            }
            placeholder={t("createClass.schoolPlaceholder")}
            emptyMessage={t("createClass.noSchools")}
          />
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[rgba(2,37,51,0.4)] px-4 py-3">
            <span className="text-lg text-white">
              {selectedSchoolName ?? "—"}
              <span className="ml-2 text-base text-grey">{user?.cityName}</span>
            </span>
            <button
              type="button"
              onClick={() => setIsPickingSchool(true)}
              className="shrink-0 text-base text-cyan-bright transition-opacity hover:opacity-75"
            >
              {t("createClass.changeSchool")}
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className={labelClass}>{t("createClass.grade")}</span>
          <select
            className={fieldClass}
            defaultValue=""
            {...register("grade", { required: t("createClass.grade") })}
          >
            <option value="" disabled>
              {t("createClass.gradePlaceholder")}
            </option>
            {CLASS_GRADES.map((grade) => (
              <option key={grade} value={grade} className="bg-bg-deep">
                {grade}
              </option>
            ))}
          </select>
          {errors.grade && (
            <span className="text-sm text-error">{errors.grade.message}</span>
          )}
        </label>

        <label className="flex flex-1 flex-col gap-1.5">
          <span className={labelClass}>{t("createClass.letter")}</span>
          {/* Одна латинская или кириллическая буква: «А» и "A" — разные классы. */}
          <input
            className={`${fieldClass} text-center uppercase`}
            maxLength={1}
            placeholder={t("createClass.letterPlaceholder")}
            autoComplete="off"
            {...register("letter", {
              required: t("createClass.enterLetter"),
              pattern: {
                value: CLASS_LETTER_REGEX,
                message: t("createClass.letterInvalid"),
              },
            })}
          />
          {errors.letter && (
            <span className="text-sm text-error">{errors.letter.message}</span>
          )}
        </label>
      </div>
    </ModalShell>
  );
};
