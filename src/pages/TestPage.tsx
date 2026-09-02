import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { deleteTest, getTests, setTestActive } from "../api/tests";
import { TestCard } from "../components/Tests/TestCard";
import { TestFormModal } from "../components/Tests/TestFormModal";
import type { ITestData } from "../types/tests";
import { useAuthStore } from "../store/authStore";

/** `undefined` — closed, `null` — creating, a number — editing that test. */
type ModalState = undefined | null | number;

export default function TestPage() {
  const [modal, setModal] = useState<ModalState>(undefined);
  const { t } = useTranslation();

  // Teachers get the read-only list; only admins may change tests. Hiding the
  // controls is UX — the endpoints enforce the same rule server-side.
  const isAdmin = useAuthStore((state) => state.hasRole("admin"));

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["tests"],
    queryFn: getTests,
  });

  const {
    mutate: removeTest,
    isPending: isDeleting,
    variables: deletingId,
    error: deleteError,
  } = useMutation({
    mutationFn: deleteTest,
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      queryClient.removeQueries({ queryKey: ["test", id] });
    },
  });

  const {
    mutate: toggleActive,
    isPending: isTogglingActive,
    variables: togglingVars,
  } = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      setTestActive(id, isActive),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      queryClient.invalidateQueries({ queryKey: ["test", updated.id] });
    },
  });

  const deleteErrorMessage = axios.isAxiosError(deleteError)
    ? ((deleteError.response?.data as { message?: string } | undefined)
        ?.message ?? t("tests.deleteError"))
    : deleteError
      ? t("tests.deleteError")
      : null;

  return (
    <div className="h-full w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold tracking-wide text-white">
            {t("tests.title")}
          </h1>
          <p className="mt-1 text-xl text-grey">
            {isAdmin ? t("tests.subtitleAdmin") : t("tests.subtitleTeacher")}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setModal(null)}
            className="rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] px-6 py-2.5 text-lg font-bold text-white transition-opacity hover:opacity-85"
          >
            {t("tests.create")}
          </button>
        )}
      </div>

      {isLoading && (
        <span className="text-lg text-grey">{t("common.loading")}</span>
      )}

      {deleteErrorMessage && (
        <p className="mb-4 text-lg text-error">{deleteErrorMessage}</p>
      )}

      {data && data.length === 0 && (
        <p className="text-lg text-grey">{t("tests.empty")}</p>
      )}

      {data && data.length > 0 && (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 laptop:grid-cols-4">
          {data.map((item: ITestData) => (
            <li key={item.id}>
              <TestCard
                data={item}
                onEdit={isAdmin ? () => setModal(item.id) : undefined}
                onDelete={isAdmin ? () => removeTest(item.id) : undefined}
                isDeleting={isDeleting && deletingId === item.id}
                onToggleActive={
                  isAdmin
                    ? () =>
                        toggleActive({
                          id: item.id,
                          isActive: item.is_active === 0,
                        })
                    : undefined
                }
                isTogglingActive={
                  isTogglingActive && togglingVars?.id === item.id
                }
              />
            </li>
          ))}
        </ul>
      )}

      {isAdmin && modal !== undefined && (
        <TestFormModal
          testId={modal ?? undefined}
          onClose={() => setModal(undefined)}
        />
      )}
    </div>
  );
}
