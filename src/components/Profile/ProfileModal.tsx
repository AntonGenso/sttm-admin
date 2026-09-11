import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { updateMyProfile } from "../../api/profile";
import { useAuthStore } from "../../store/authStore";
import { ModalShell, labelClass } from "../Directory/ModalShell";
import { CityAndSchoolFields } from "./CityAndSchoolFields";
import {
  isProfileValueValid,
  toProfilePayload,
  type CityAndSchoolValue,
} from "./profileValue";

interface Props {
  onClose: () => void;
  /** Куда идти дальше — например, сразу открыть создание класса. */
  onSaved?: () => void;
}

/**
 * Город и школа учителя.
 *
 * Открывается и как обычная правка профиля, и как то, что стоит между пустым
 * профилем и первым классом: `POST /classes` отвечает `PROFILE_INCOMPLETE`, и
 * приложение приводит человека сюда, а не подсвечивает поле, которого нет.
 */
export const ProfileModal = ({ onClose, onSaved }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [value, setValue] = useState<CityAndSchoolValue>({
    cityId: user?.cityId ?? null,
    schoolId: user?.schoolId ?? null,
    schoolName: user?.schoolName ?? "",
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => updateMyProfile(toProfilePayload(value)),
    onSuccess: (updated) => {
      setUser(updated);
      // Школа могла быть только что заведена — списки школ города устарели.
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      onSaved?.();
      onClose();
    },
  });

  const serverMessage = axios.isAxiosError(error)
    ? ((error.response?.data as { message?: string } | undefined)?.message ??
      t("profile.saveError"))
    : error
      ? t("profile.saveError")
      : null;

  return (
    <ModalShell
      title={t("profile.title")}
      subtitle={t("profile.subtitle")}
      error={serverMessage}
      isPending={isPending}
      submitLabel={t("common.save")}
      onSubmit={(event) => {
        event.preventDefault();
        if (isProfileValueValid(value)) {
          mutate();
        }
      }}
      onClose={onClose}
    >
      <CityAndSchoolFields
        value={value}
        onChange={setValue}
        labelClass={labelClass}
      />

      {!isProfileValueValid(value) && (
        <span className="text-sm text-grey">{t("profile.bothRequired")}</span>
      )}
    </ModalShell>
  );
};
