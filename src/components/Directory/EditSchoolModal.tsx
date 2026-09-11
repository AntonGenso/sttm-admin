import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  getCities,
  readApiError,
  updateSchool,
  type ISchoolRow,
} from "../../api/admin";
import { containsProfanity } from "../../utils/profanity";
import { Select } from "../../uikit/Select";
import { ModalShell, fieldClass, labelClass } from "./ModalShell";

interface Props {
  data: ISchoolRow;
  onClose: () => void;
}

type Inputs = { name: string; cityId: number; isVerified: boolean };

const SCHOOL_NAME_MAX_LENGTH = 255;

/**
 * Школа: имя, город и отметка о проверке.
 *
 * Школы заводят учителя, поэтому список обрастает и опечатками, и строками в
 * неверном городе. Переименование чинит первое; город editable ради второго —
 * это единственная ошибка, которую учитель сам исправить не может, а
 * «перезаведите заново» осиротило бы классы, уже висящие на этой строке.
 *
 * Отметка о проверке — не свойство школы, а состояние очереди: админ ставит её,
 * когда убедился, что это настоящая школа, а не третье написание соседней.
 * Слить дубль отсюда нельзя — для этого есть отдельное действие на странице
 * школы: слияние необратимо и уносит строку целиком.
 */
export const EditSchoolModal = ({ data, onClose }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      name: data.name,
      cityId: data.city_id,
      isVerified: data.is_verified === 1,
    },
  });

  const { data: cities } = useQuery({
    queryKey: ["admin", "cities"],
    queryFn: getCities,
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (values: Inputs) =>
      updateSchool(data.id, {
        name: values.name.trim(),
        cityId: values.cityId,
        isVerified: values.isVerified,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      // Школа кормит и выбор школы у учителя.
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      onClose();
    },
  });

  const onSubmit: SubmitHandler<Inputs> = (values) => mutate(values);

  const serverMessage = error
    ? (readApiError(error).message ?? t("directory.saveError"))
    : null;

  return (
    <ModalShell
      title={t("directory.editSchool")}
      subtitle={data.city_name}
      error={serverMessage}
      isPending={isPending}
      submitLabel={t("common.save")}
      onSubmit={handleSubmit(onSubmit)}
      onClose={onClose}
    >
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>{t("createClass.school")}</span>
        <input
          className={fieldClass}
          autoComplete="off"
          maxLength={SCHOOL_NAME_MAX_LENGTH}
          {...register("name", {
            required: t("createClass.enterSchool"),
            validate: (value) =>
              !containsProfanity(value) || t("createClass.nameProfanity"),
          })}
        />
        {errors.name && (
          <span className="text-sm text-error">{errors.name.message}</span>
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>{t("directory.colCity")}</span>
        <Controller
          name="cityId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onChange={(cityId) => field.onChange(cityId)}
              options={
                cities?.map((city) => ({
                  id: city.id,
                  label: city.name_ru,
                  hint: city.region,
                })) ?? []
              }
              placeholder={t("profile.cityPlaceholder")}
              emptyMessage={t("profile.cityNotFound")}
            />
          )}
        />
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-5 w-5 accent-cyan-bright"
          {...register("isVerified")}
        />
        <span className="text-lg text-white">
          {t("directory.schoolVerified")}
        </span>
      </label>
      <span className="-mt-3 text-sm text-grey">
        {t("directory.schoolVerifiedHint")}
      </span>
    </ModalShell>
  );
};
