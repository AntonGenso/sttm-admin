import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  createCity,
  readApiError,
  updateCity,
  type ICityRow,
} from "../../api/admin";
import { containsProfanity } from "../../utils/profanity";
import { ModalShell, fieldClass, labelClass } from "./ModalShell";

interface Props {
  /** Пусто — заведение нового города. */
  data?: ICityRow;
  onClose: () => void;
}

type Inputs = {
  nameRu: string;
  nameUz: string;
  region: string;
  isActive: boolean;
};

const CITY_NAME_MAX_LENGTH = 100;

/**
 * Единственное место, где заводится город.
 *
 * Свободного ввода города в приложении не осталось — именно он наплодил
 * «Ташкент», «г. Ташкент» и «Toshkent» тремя строками, а школа уникальна
 * внутри города, так что каждый такой дубль расщеплял ещё и школы.
 *
 * `is_active` — мягкая альтернатива удалению: город исчезает из выбора при
 * регистрации, но всё, что к нему привязано, остаётся на месте.
 */
export const EditCityModal = ({ data, onClose }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      nameRu: data?.name_ru ?? "",
      nameUz: data?.name_uz ?? "",
      region: data?.region ?? "",
      isActive: data ? data.is_active === 1 : true,
    },
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (values: Inputs) => {
      const patch = {
        nameRu: values.nameRu.trim(),
        nameUz: values.nameUz.trim() || null,
        region: values.region.trim() || null,
        isActive: values.isActive,
      };
      return data ? updateCity(data.id, patch) : createCity(patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      // Справочник городов читает и форма регистрации.
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      onClose();
    },
  });

  const onSubmit: SubmitHandler<Inputs> = (values) => mutate(values);

  const serverMessage = error
    ? (readApiError(error).message ?? t("directory.saveError"))
    : null;

  return (
    <ModalShell
      title={data ? t("directory.editCity") : t("directory.newCity")}
      subtitle={data ? undefined : t("directory.newCityHint")}
      error={serverMessage}
      isPending={isPending}
      submitLabel={t("common.save")}
      onSubmit={handleSubmit(onSubmit)}
      onClose={onClose}
    >
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>{t("directory.cityNameRu")}</span>
        <input
          className={fieldClass}
          autoComplete="off"
          maxLength={CITY_NAME_MAX_LENGTH}
          {...register("nameRu", {
            required: t("directory.cityNameRequired"),
            validate: (value) =>
              !containsProfanity(value) || t("createClass.nameProfanity"),
          })}
        />
        {errors.nameRu && (
          <span className="text-sm text-error">{errors.nameRu.message}</span>
        )}
      </label>

      <div className="flex gap-4">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className={labelClass}>{t("directory.cityNameUz")}</span>
          <input
            className={fieldClass}
            autoComplete="off"
            maxLength={CITY_NAME_MAX_LENGTH}
            {...register("nameUz")}
          />
        </label>

        <label className="flex flex-1 flex-col gap-1.5">
          <span className={labelClass}>{t("directory.cityRegion")}</span>
          <input
            className={fieldClass}
            autoComplete="off"
            maxLength={CITY_NAME_MAX_LENGTH}
            {...register("region")}
          />
        </label>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-5 w-5 accent-cyan-bright"
          {...register("isActive")}
        />
        <span className="text-lg text-white">{t("directory.cityActive")}</span>
      </label>
      <span className="-mt-3 text-sm text-grey">
        {t("directory.cityActiveHint")}
      </span>
    </ModalShell>
  );
};
