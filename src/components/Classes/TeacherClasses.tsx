import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getMyClasses } from "../../api/classes";
import { hasCompleteProfile, useAuthStore } from "../../store/authStore";
import { ProfileModal } from "../Profile/ProfileModal";
import { ClassCard } from "./ClassCard";
import { CreateClassModal } from "./CreateClassModal";

const primaryButtonClass =
  "rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] px-6 py-2.5 text-lg font-bold text-white transition-opacity hover:opacity-85";

/** The teacher's home: their classes, or the prompt to create the first one. */
export const TeacherClasses = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const isProfileComplete = hasCompleteProfile(user);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { data: classes, isLoading } = useQuery({
    queryKey: ["classes", "my"],
    queryFn: getMyClasses,
  });

  const hasClasses = Boolean(classes?.length);

  // Класс живёт в школе, а школа берётся из профиля, поэтому пустой профиль —
  // это не поле, которое можно подсветить в форме, а шаг перед ней. Кнопка
  // ведёт в профиль и, сохранив его, сразу открывает создание класса: с точки
  // зрения учителя это по-прежнему одно действие.
  const openCreate = () =>
    isProfileComplete ? setIsCreateOpen(true) : setIsProfileOpen(true);

  return (
    <section className="flex flex-col gap-5">
      {!isProfileComplete && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-bright/40 bg-orange-bright/10 px-6 py-5 backdrop-blur-md">
          <div>
            <p className="font-mono text-xs tracking-widest text-orange-bright uppercase">
              {t("profile.incompleteTitle")}
            </p>
            <p className="mt-1 text-lg text-white">
              {t("profile.incompleteDesc")}
            </p>
          </div>
          <button
            onClick={() => setIsProfileOpen(true)}
            className={primaryButtonClass}
          >
            {t("profile.fillIn")}
          </button>
        </div>
      )}

      {hasClasses && (
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-semibold text-white">
            {t("classes.myClasses")}
          </h2>
          <button onClick={openCreate} className={primaryButtonClass}>
            {t("classes.createClass")}
          </button>
        </div>
      )}

      {isLoading && (
        <span className="text-lg text-grey">{t("common.loading")}</span>
      )}

      {/* A freshly registered teacher has no classes yet — creating the first
          one is the only thing the home page asks of them. */}
      {!isLoading && !hasClasses && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-cyan-bright/35 bg-[rgba(5,20,30,0.5)] px-6 py-14 text-center backdrop-blur-md">
          <span className="font-mono text-xs tracking-widest text-cyan-bright uppercase">
            {t("classes.noClassesYet")}
          </span>
          <h2 className="text-4xl font-semibold text-white">
            {t("classes.createFirst")}
          </h2>
          <p className="max-w-[460px] text-lg text-grey">
            {t("classes.createFirstDesc")}
          </p>
          <button
            onClick={openCreate}
            className="mt-2 rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] px-7 py-3 text-lg font-bold text-white transition-opacity hover:opacity-85"
          >
            {t("classes.createClass")}
          </button>
        </div>
      )}

      {hasClasses && (
        <ul className="laptop:grid-cols-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {classes?.map((item) => (
            <li key={item.id}>
              <ClassCard data={item} />
            </li>
          ))}
        </ul>
      )}

      {isCreateOpen && (
        <CreateClassModal onClose={() => setIsCreateOpen(false)} />
      )}

      {isProfileOpen && (
        <ProfileModal
          onClose={() => setIsProfileOpen(false)}
          onSaved={() => setIsCreateOpen(true)}
        />
      )}
    </section>
  );
};
