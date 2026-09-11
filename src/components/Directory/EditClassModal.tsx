import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  getSchools,
  readApiError,
  updateClass,
  type IAdminClassRow,
} from "../../api/admin";
import { CLASS_GRADES, CLASS_LETTER_REGEX } from "../../types/classes";
import { Select } from "../../uikit/Select";
import { ModalShell, fieldClass, labelClass } from "./ModalShell";

interface Props {
  data: IAdminClassRow;
  onClose: () => void;
}

type Inputs = { grade: string; letter: string; schoolId: number };

/**
 * Как называется класс и в какой школе он числится.
 *
 * Школа editable, в отличие от учителя и кода приглашения: учитель, ошибшийся
 * школой при регистрации, и две школы, оказавшиеся одним зданием, — это ровно
 * те ошибки, которые сам он исправить не может. Класс переезжает целиком: код и
 * весь состав остаются при нём, ученики привязаны к классу, а не к школе.
 *
 * Алфавит не спрашивается — он следует из буквы: «А» и "A" разные классы.
 */
export const EditClassModal = ({ data, onClose }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      grade: String(data.grade),
      letter: data.letter,
      schoolId: data.school_id,
    },
  });

  // Школы всей академии, а не одного города: перенос класса бывает и между
  // городами — учитель ошибся при регистрации, а классы уже заведены.
  const { data: schools } = useQuery({
    queryKey: ["admin", "schools"],
    queryFn: getSchools,
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (values: Inputs) =>
      updateClass(data.id, {
        grade: Number(values.grade),
        letter: values.letter.trim(),
        schoolId: values.schoolId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      onClose();
    },
  });

  const onSubmit: SubmitHandler<Inputs> = (values) => mutate(values);

  const serverMessage = error
    ? (readApiError(error).message ?? t("directory.saveError"))
    : null;

  return (
    <ModalShell
      title={t("directory.editClass")}
      subtitle={`${data.school_name}, ${data.city_name}`}
      error={serverMessage}
      isPending={isPending}
      submitLabel={t("common.save")}
      onSubmit={handleSubmit(onSubmit)}
      onClose={onClose}
    >
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>{t("createClass.school")}</span>
        <Controller
          name="schoolId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onChange={(schoolId) => field.onChange(schoolId)}
              options={
                schools?.map((school) => ({
                  id: school.id,
                  label: school.name,
                  hint: school.city_name,
                })) ?? []
              }
              placeholder={t("createClass.schoolPlaceholder")}
              emptyMessage={t("createClass.noSchools")}
            />
          )}
        />
      </label>

      <div className="flex gap-4">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className={labelClass}>{t("createClass.grade")}</span>
          <select
            className={fieldClass}
            {...register("grade", { required: true })}
          >
            {CLASS_GRADES.map((grade) => (
              <option key={grade} value={grade} className="bg-bg-deep">
                {grade}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1.5">
          <span className={labelClass}>{t("createClass.letter")}</span>
          <input
            className={`${fieldClass} text-center uppercase`}
            maxLength={1}
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
