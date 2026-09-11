import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { readApiError, updateStudent, updateTeacher } from "../../api/admin";
import { validateName } from "../../utils/name";
import { validateNickname } from "../../utils/nickname";
import {
  formatPhoneInput,
  normalizePhone,
  PHONE_PLACEHOLDER,
} from "../../utils/phone";
import { ModalShell, fieldClass, labelClass } from "./ModalShell";
import { CityAndSchoolFields } from "../Profile/CityAndSchoolFields";
import {
  toProfilePayload,
  type CityAndSchoolValue,
} from "../Profile/profileValue";

type Kind = "teacher" | "student";

interface Props {
  kind: Kind;
  user: {
    id: number;
    name: string;
    phone: string | null;
    /** Профиль учителя; у ученика этих полей нет. */
    city_id?: number | null;
    school_id?: number | null;
    school_name?: string | null;
  };
  onClose: () => void;
}

type Inputs = { name: string; phone: string };

/**
 * The editable half of an account: what it is called and how to reach it.
 *
 * A teacher signs up with a real name and a student picks a game nickname, so
 * the field is validated by the rule that account's own registration applies —
 * the server does the same, and a form that were stricter or looser than it
 * would only mislead. Passwords and roles are not here: neither belongs in a
 * rename dialog.
 *
 * Город и школа есть только у учителя — и правит их админ ровно тем же полем,
 * что и сам учитель: правила («школа принадлежит городу», «смена города
 * сбрасывает школу») должны держаться независимо от того, кто нажал «сохранить».
 */
export const EditUserModal = ({ kind, user, onClose }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isTeacher = kind === "teacher";

  const [profile, setProfile] = useState<CityAndSchoolValue>({
    cityId: user.city_id ?? null,
    schoolId: user.school_id ?? null,
    schoolName: user.school_name ?? "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      name: user.name,
      phone: user.phone ? formatPhoneInput(user.phone) : "",
    },
  });

  const { mutate, isPending, error } = useMutation({
    // The updated record is not read back: the whole directory is invalidated
    // below, so every view of this account refetches it.
    mutationFn: async (values: Inputs) => {
      const phone = values.phone.trim();
      const patch = {
        name: values.name.trim(),
        // An empty field clears a student's phone; teachers must keep theirs,
        // which the field itself enforces below.
        phone: phone ? (normalizePhone(phone) ?? phone) : null,
      };
      if (isTeacher) {
        await updateTeacher(user.id, {
          ...patch,
          ...toProfilePayload(profile),
        });
      } else {
        await updateStudent(user.id, patch);
      }
    },
    onSuccess: () => {
      // The account shows up in its own record, in its list, and in every list
      // that names it (classes, enrollments), so the whole directory refetches.
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      // Учителю могли завести новую школу прямо отсюда.
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      onClose();
    },
  });

  const onSubmit: SubmitHandler<Inputs> = (values) => mutate(values);

  const phoneField = register("phone", {
    validate: (value) => {
      const trimmed = value.trim();
      // Students register without a phone, so an empty field is a valid
      // "no number" for them — but a half-typed one never is.
      if (!trimmed) {
        return isTeacher ? t("validation.phoneRequired") : true;
      }
      return (
        Boolean(normalizePhone(trimmed)) ||
        t("validation.phoneInvalid", { format: PHONE_PLACEHOLDER })
      );
    },
  });

  const serverMessage = error
    ? (readApiError(error).message ?? t("directory.saveError"))
    : null;

  return (
    <ModalShell
      title={t("directory.editAccount")}
      subtitle={isTeacher ? t("dashboard.teachers") : t("dashboard.students")}
      error={serverMessage}
      isPending={isPending}
      submitLabel={t("common.save")}
      onSubmit={handleSubmit(onSubmit)}
      onClose={onClose}
    >
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>
          {isTeacher ? t("directory.colName") : t("directory.nickname")}
        </span>
        <input
          className={fieldClass}
          autoComplete="off"
          {...register("name", {
            required: t("validation.nameRequired"),
            validate: (value) => {
              const result = isTeacher
                ? validateName(value)
                : validateNickname(value);
              return result === true ? true : t(result, { min: 3, max: 32 });
            },
          })}
        />
        {errors.name && (
          <span className="text-sm text-error">{errors.name.message}</span>
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>{t("directory.colPhone")}</span>
        <input
          className={fieldClass}
          placeholder={PHONE_PLACEHOLDER}
          autoComplete="tel"
          {...phoneField}
          onChange={(event) => {
            // Re-mask on every keystroke — except when the field was emptied,
            // which is how a student's phone is cleared: masking "" back into
            // the +998 prefix would make the field impossible to empty.
            if (/\d/.test(event.target.value)) {
              event.target.value = formatPhoneInput(event.target.value);
            }
            phoneField.onChange(event);
          }}
        />
        {errors.phone && (
          <span className="text-sm text-error">{errors.phone.message}</span>
        )}
        {!isTeacher && (
          <span className="text-sm text-grey">
            {t("directory.phoneOptional")}
          </span>
        )}
      </label>

      {isTeacher && (
        <CityAndSchoolFields
          value={profile}
          onChange={setProfile}
          labelClass={labelClass}
        />
      )}
    </ModalShell>
  );
};
