import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getMyClasses } from "../../api/classes";
import { ClassCard } from "./ClassCard";
import { CreateClassModal } from "./CreateClassModal";

/** The teacher's home: their classes, or the prompt to create the first one. */
export const TeacherClasses = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: classes, isLoading } = useQuery({
    queryKey: ["classes", "my"],
    queryFn: getMyClasses,
  });

  const hasClasses = Boolean(classes?.length);

  return (
    <section className="flex flex-col gap-5">
      {hasClasses && (
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-semibold text-white">
            {t("classes.myClasses")}
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] px-6 py-2.5 text-lg font-bold text-white transition-opacity hover:opacity-85"
          >
            {t("classes.createClass")}
          </button>
        </div>
      )}

      {isLoading && <span className="text-lg text-grey">{t("common.loading")}</span>}

      {/* A freshly registered teacher has no classes yet — creating the first
          one is the only thing the home page asks of them. */}
      {!isLoading && !hasClasses && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-cyan-bright/35 bg-[rgba(5,20,30,0.5)] px-6 py-14 text-center backdrop-blur-md">
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-bright">
            {t("classes.noClassesYet")}
          </span>
          <h2 className="text-4xl font-semibold text-white">
            {t("classes.createFirst")}
          </h2>
          <p className="max-w-[460px] text-lg text-grey">
            {t("classes.createFirstDesc")}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] px-7 py-3 text-lg font-bold text-white transition-opacity hover:opacity-85"
          >
            {t("classes.createClass")}
          </button>
        </div>
      )}

      {hasClasses && (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 laptop:grid-cols-3">
          {classes?.map((item) => (
            <li key={item.id}>
              <ClassCard data={item} />
            </li>
          ))}
        </ul>
      )}

      {isModalOpen && (
        <CreateClassModal onClose={() => setIsModalOpen(false)} />
      )}
    </section>
  );
};
