import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { createClass } from "../../api/classes";
import { getCities, getSchools } from "../../api/dictionaries";
import { CLASS_GRADES, CLASS_LETTER_REGEX } from "../../types/classes";
import type { IClass } from "../../types/classes";
import { Combobox } from "../../uikit/Combobox";
import { containsProfanity } from "../../utils/profanity";

type Inputs = {
  cityName: string;
  schoolName: string;
  grade: string;
  letter: string;
};

const CITY_NAME_MAX_LENGTH = 100;

interface Props {
  onClose: () => void;
  onCreated?: (created: IClass) => void;
}

const fieldClass =
  "w-full rounded-lg border border-cyan-bright/35 bg-[rgba(2,37,51,0.6)] px-4 py-3 text-lg text-white outline-none transition-colors placeholder:text-grey/50 focus:border-cyan-bright";

const labelClass =
  "font-mono text-xs uppercase tracking-widest text-cyan-bright";

export const CreateClassModal = ({ onClose, onCreated }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: { cityName: "", schoolName: "", grade: "", letter: "" },
  });

  const cityName = watch("cityName");

  const { data: cities, isLoading: isCitiesLoading } = useQuery({
    queryKey: ["cities"],
    queryFn: getCities,
    staleTime: Infinity,
  });

  // The city is typed by hand; when it matches an already-known city we can pull
  // that city's schools as suggestions. A brand-new city simply has none yet.
  const matchedCityId = useMemo(() => {
    const target = cityName.trim().toLowerCase();
    if (!target) return undefined;
    return cities?.find((city) => city.name_ru.toLowerCase() === target)?.id;
  }, [cities, cityName]);

  // Suggestions only make sense once a known city is entered: schools are unique per city.
  const { data: schools } = useQuery({
    queryKey: ["schools", matchedCityId],
    queryFn: () => getSchools(matchedCityId as number),
    enabled: Boolean(matchedCityId),
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: createClass,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["classes", "my"] });
      // A new city and/or school may have just been created.
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      onCreated?.(created);
      onClose();
    },
  });

  const onSubmit: SubmitHandler<Inputs> = (values) =>
    mutate({
      cityName: values.cityName.trim(),
      schoolName: values.schoolName.trim(),
      grade: Number(values.grade),
      letter: values.letter,
    });

  const serverMessage = axios.isAxiosError(error)
    ? ((error.response?.data as { message?: string } | undefined)?.message ??
      t("createClass.createError"))
    : error
      ? t("createClass.createError")
      : null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-[520px] flex-col gap-5 rounded-2xl border border-cyan-bright/40 bg-[rgba(7,21,42,0.9)] p-7 backdrop-blur-xl"
      >
        <div>
          <h2 className="text-3xl font-bold text-white">
            {t("createClass.title")}
          </h2>
          <p className="mt-1 text-lg text-grey">{t("createClass.subtitle")}</p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{t("createClass.city")}</span>
          {/* Type any city; the list only suggests ones already added. */}
          <Controller
            name="cityName"
            control={control}
            rules={{
              required: t("createClass.enterCity"),
              maxLength: {
                value: CITY_NAME_MAX_LENGTH,
                message: t("createClass.nameTooLong"),
              },
              validate: (value: string) =>
                !containsProfanity(value) || t("createClass.nameProfanity"),
            }}
            render={({ field }) => (
              <Combobox
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={cities?.map((city) => city.name_ru) ?? []}
                placeholder={
                  isCitiesLoading
                    ? t("createClass.cityLoading")
                    : t("createClass.cityPlaceholder")
                }
                maxLength={CITY_NAME_MAX_LENGTH}
              />
            )}
          />
          {errors.cityName && (
            <span className="text-sm text-error">
              {errors.cityName.message}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{t("createClass.school")}</span>
          {/* Picking an existing name keeps one school from being created twice. */}
          <Controller
            name="schoolName"
            control={control}
            rules={{
              required: t("createClass.enterSchool"),
              maxLength: { value: 255, message: t("createClass.nameTooLong") },
              validate: (value: string) =>
                !containsProfanity(value) || t("createClass.nameProfanity"),
            }}
            render={({ field }) => (
              <Combobox
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={schools?.map((school) => school.name) ?? []}
                placeholder={t("createClass.schoolPlaceholder")}
                maxLength={255}
              />
            )}
          />
          {errors.schoolName && (
            <span className="text-sm text-error">
              {errors.schoolName.message}
            </span>
          )}
        </label>

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
            {/* One latin or cyrillic letter, e.g. «А» or "A". */}
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
              <span className="text-sm text-error">
                {errors.letter.message}
              </span>
            )}
          </label>
        </div>

        {serverMessage && (
          <span className="text-base text-error">{serverMessage}</span>
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
            disabled={isPending}
            className="rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] px-6 py-2 text-lg font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {isPending ? t("createClass.creating") : t("createClass.create")}
          </button>
        </div>
      </form>
    </div>
  );
};
