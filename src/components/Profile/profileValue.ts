import { containsProfanity } from "../../utils/profanity";

/**
 * Значение пары «город + школа» и его правила — отдельно от компонента: их
 * читают и форма регистрации, и профиль, и админская карточка учителя.
 */
export interface CityAndSchoolValue {
  cityId: number | null;
  /** Выбранная школа справочника; null — вводится новая. */
  schoolId: number | null;
  /** Текст в поле школы; он же имя новой школы, когда `schoolId` пуст. */
  schoolName: string;
}

export const SCHOOL_NAME_MAX_LENGTH = 255;

/** Что из этой пары уходит на сервер: имя школы — только для новой. */
export const toProfilePayload = (value: CityAndSchoolValue) => ({
  cityId: value.cityId,
  schoolId: value.schoolId,
  schoolName: value.schoolId ? undefined : value.schoolName.trim() || undefined,
});

export const isProfileValueValid = (value: CityAndSchoolValue) =>
  Boolean(value.cityId) &&
  Boolean(value.schoolId || value.schoolName.trim()) &&
  value.schoolName.length <= SCHOOL_NAME_MAX_LENGTH &&
  !containsProfanity(value.schoolName);

export const EMPTY_CITY_AND_SCHOOL: CityAndSchoolValue = {
  cityId: null,
  schoolId: null,
  schoolName: "",
};
