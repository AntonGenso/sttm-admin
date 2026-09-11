import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  getCities,
  getSchools,
  getSimilarSchools,
} from "../../api/dictionaries";
import { Combobox } from "../../uikit/Combobox";
import { Select } from "../../uikit/Select";
import { containsProfanity } from "../../utils/profanity";
import {
  SCHOOL_NAME_MAX_LENGTH,
  type CityAndSchoolValue,
} from "./profileValue";

const SIMILAR_MIN_LENGTH = 3;

interface Props {
  value: CityAndSchoolValue;
  onChange: (next: CityAndSchoolValue) => void;
  /** Подпись под парой полей — «необязательно» на регистрации. */
  note?: string;
  labelClass: string;
}

/** Значение, «отстающее» от ввода: запрос похожих школ на каждую букву не нужен. */
const useDebounced = <T,>(value: T, delay = 400): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

/**
 * Город и школа учителя — одна и та же пара полей на регистрации, в профиле и
 * при создании класса в другой школе.
 *
 * Город выбирается строго из справочника: свободный ввод как раз и наплодил
 * «Ташкент», «г. Ташкент» и «Toshkent» тремя разными городами, а школа
 * уникальна внутри города — каждый такой дубль расщеплял и школы.
 *
 * Школу учитель всё ещё может завести сам: справочник школ пустой, школ в
 * стране тысячи, и «дождитесь админа» на входе означало бы, что первым же
 * экраном человек упирается в стену. Дубли здесь ловятся с двух сторон —
 * нормализацией на сервере («Школа №5», «СОШ 5» и «5-мактаб» дают одну строку)
 * и подсказкой похожих школ прямо под полем.
 */
export const CityAndSchoolFields = ({
  value,
  onChange,
  note,
  labelClass,
}: Props) => {
  const { t } = useTranslation();

  const { data: cities, isLoading: isCitiesLoading } = useQuery({
    queryKey: ["cities"],
    queryFn: getCities,
    staleTime: Infinity,
  });

  const { data: schools } = useQuery({
    queryKey: ["schools", value.cityId],
    queryFn: () => getSchools(value.cityId as number),
    enabled: Boolean(value.cityId),
  });

  // Похожие школы спрашиваются, только когда учитель действительно вводит
  // что-то новое: выбранная из списка школа дублем быть не может.
  const debouncedName = useDebounced(value.schoolName.trim());
  const isNewSchool =
    !value.schoolId && debouncedName.length >= SIMILAR_MIN_LENGTH;

  const { data: similar } = useQuery({
    queryKey: ["schools", "similar", value.cityId, debouncedName],
    queryFn: () => getSimilarSchools(value.cityId as number, debouncedName),
    enabled: Boolean(value.cityId) && isNewSchool,
  });

  const cityOptions = useMemo(
    () =>
      cities?.map((city) => ({
        id: city.id,
        label: city.name_ru,
        hint: city.region,
      })) ?? [],
    [cities],
  );

  const schoolNames = useMemo(
    () => schools?.map((school) => school.name) ?? [],
    [schools],
  );

  const handleCity = (cityId: number | null) => {
    // Школа принадлежит городу, поэтому вместе с городом сбрасывается и она —
    // иначе в профиль уехала бы школа из прежнего города.
    onChange({ cityId, schoolId: null, schoolName: "" });
  };

  const handleSchoolText = (text: string) => {
    const picked = schools?.find((school) => school.name === text);
    onChange({
      ...value,
      schoolId: picked?.id ?? null,
      schoolName: text,
    });
  };

  const isTooLong = value.schoolName.length > SCHOOL_NAME_MAX_LENGTH;
  const isProfane = containsProfanity(value.schoolName);

  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>{t("profile.city")}</span>
        <Select
          value={value.cityId}
          onChange={handleCity}
          options={cityOptions}
          placeholder={
            isCitiesLoading
              ? t("profile.cityLoading")
              : t("profile.cityPlaceholder")
          }
          emptyMessage={t("profile.cityNotFound")}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>{t("profile.school")}</span>
        <Combobox
          value={value.schoolName}
          onChange={handleSchoolText}
          options={schoolNames}
          placeholder={
            value.cityId
              ? t("profile.schoolPlaceholder")
              : t("profile.schoolNeedsCity")
          }
          disabled={!value.cityId}
          maxLength={SCHOOL_NAME_MAX_LENGTH}
        />

        {isTooLong && (
          <span className="text-sm text-error">{t("profile.nameTooLong")}</span>
        )}
        {!isTooLong && isProfane && (
          <span className="text-sm text-error">
            {t("profile.nameProfanity")}
          </span>
        )}

        {/* Похожие школы: ровно тот момент, когда дубль ещё можно не создавать. */}
        {isNewSchool && Boolean(similar?.length) && (
          <div className="mt-1 rounded-xl border border-orange-bright/40 bg-orange-bright/10 px-4 py-3">
            <p className="text-base text-orange-bright">
              {t("profile.similarSchools")}
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {similar?.map((school) => (
                <li key={school.id}>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...value,
                        schoolId: school.id,
                        schoolName: school.name,
                      })
                    }
                    className="rounded-full border border-cyan-bright/40 px-3 py-1 text-base text-cyan-bright transition-colors hover:bg-cyan-bright/10"
                  >
                    {school.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isNewSchool && !similar?.length && (
          <span className="text-sm text-grey">
            {t("profile.schoolWillBeNew")}
          </span>
        )}
      </label>

      {note && <p className="-mt-1 text-base text-grey">{note}</p>}
    </>
  );
};
