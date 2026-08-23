import { useForm, useWatch } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { registerUser } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import {
  validatePassword,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from "../utils/password";
import { validateName, NAME_MIN_LENGTH } from "../utils/name";
import {
  formatPhoneInput,
  normalizePhone,
  validatePhone,
  PHONE_PLACEHOLDER,
  PHONE_PREFIX,
} from "../utils/phone";
import { PasswordInput } from "./PasswordInput";
import { PasswordRequirements } from "./PasswordRequirements";

type Inputs = {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const inputClass =
  "w-full rounded-lg border border-cyan-bright/35 bg-[rgba(2,37,51,0.6)] px-4 py-3 text-lg text-white outline-none transition-colors placeholder:text-grey/50 focus:border-cyan-bright";

const labelClass =
  "mb-1.5 block font-mono text-xs uppercase tracking-widest text-cyan-bright";

export const RegistrationForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<Inputs>({
    mode: "onTouched",
    // The `+998(` prefix is part of the field from the start: it shows the
    // expected format and keeps the country code out of the operator code.
    defaultValues: { phone: PHONE_PREFIX },
  });

  const password = useWatch({ control, name: "password", defaultValue: "" });

  // No `required` rule: the field is never empty thanks to the prefix, so the
  // "is it filled in" check lives in validatePhone.
  const phoneField = register("phone", { validate: validatePhone });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      setAuth(data.token, data.refreshToken, data.user);
      navigate("/");
    },
  });

  const onSubmit = handleSubmit((values) => {
    mutation.mutate({
      name: values.name.trim(),
      // Validation already guarantees the number parses, `?? values.phone`
      // only keeps TypeScript happy.
      phone: normalizePhone(values.phone) ?? values.phone,
      password: values.password,
    });
  });

  const serverError =
    mutation.error instanceof AxiosError
      ? ((mutation.error.response?.data as { message?: string })?.message ??
        t("auth.genericError"))
      : mutation.error
        ? t("auth.genericError")
        : null;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="w-full max-w-[360px] rounded-2xl border border-cyan-bright/40 bg-[rgba(7,21,42,0.75)] p-8 shadow-[0_0_40px_rgba(0,227,255,0.12)] backdrop-blur-xl"
    >
      <h1 className="text-center text-4xl font-bold tracking-wide text-white">
        {t("auth.registerTitle")}
      </h1>
      <p className="mt-1 mb-7 text-center text-base text-grey">
        {t("auth.registerSubtitle")}
      </p>

      <div className="mb-5">
        <label className={labelClass}>{t("auth.fieldName")}</label>
        <input
          type="text"
          placeholder={t("auth.placeholderNameExample")}
          autoComplete="username"
          className={inputClass}
          {...register("name", {
            required: "validation.nameRequired",
            validate: validateName,
          })}
        />
        {errors.name && (
          <span className="mt-1 block text-sm text-error">
            {t(errors.name.message ?? "", { min: NAME_MIN_LENGTH })}
          </span>
        )}
      </div>

      <div className="mb-5">
        <label className={labelClass}>{t("auth.fieldPhone")}</label>
        <input
          type="tel"
          inputMode="tel"
          placeholder={PHONE_PLACEHOLDER}
          autoComplete="tel"
          className={inputClass}
          {...phoneField}
          onChange={(event) => {
            // Re-mask on every keystroke, then hand the field over to RHF.
            event.target.value = formatPhoneInput(event.target.value);
            phoneField.onChange(event);
          }}
          onBlur={(event) => {
            // A pasted number keeps its own punctuation until the field is
            // left — then a valid one snaps back to +998(99)9999999.
            const normalized = normalizePhone(event.target.value);
            if (normalized) {
              setValue("phone", formatPhoneInput(normalized));
            }
            phoneField.onBlur(event);
          }}
        />
        {errors.phone && (
          <span className="mt-1 block text-sm text-error">
            {t(errors.phone.message ?? "", { format: PHONE_PLACEHOLDER })}
          </span>
        )}
      </div>

      <div className="mb-5">
        <label className={labelClass}>{t("auth.fieldPassword")}</label>
        <PasswordInput
          placeholder="••••••••"
          autoComplete="new-password"
          className={inputClass}
          {...register("password", {
            required: "validation.passwordRequired",
            validate: validatePassword,
          })}
        />
        {errors.password && (
          <span className="mt-1 block text-sm text-error">
            {t(errors.password.message ?? "", {
              min: PASSWORD_MIN_LENGTH,
              max: PASSWORD_MAX_LENGTH,
            })}
          </span>
        )}
        <PasswordRequirements value={password} />
      </div>

      <div className="mb-5">
        <label className={labelClass}>{t("auth.fieldConfirm")}</label>
        <PasswordInput
          placeholder="••••••••"
          autoComplete="new-password"
          className={inputClass}
          {...register("confirmPassword", {
            required: "validation.confirmRequired",
            validate: (value) =>
              value === password || "validation.passwordsMismatch",
          })}
        />
        {errors.confirmPassword && (
          <span className="mt-1 block text-sm text-error">
            {t(errors.confirmPassword.message ?? "")}
          </span>
        )}
      </div>

      {serverError && (
        <p className="mb-4 text-center text-sm text-error">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] py-3 text-xl font-bold text-white transition-opacity hover:opacity-85 active:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mutation.isPending ? t("auth.registering") : t("auth.registerSubmit")}
      </button>

      <p className="mt-5 text-center text-base text-grey">
        {t("auth.haveAccount")}{" "}
        <Link to="/login" className="text-cyan-bright hover:underline">
          {t("auth.loginLink")}
        </Link>
      </p>
    </form>
  );
};
