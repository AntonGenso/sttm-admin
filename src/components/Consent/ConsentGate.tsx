import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { acceptMyConsents, getMyConsents } from "../../api/consents";
import {
  ConsentCheckboxes,
  type ConsentValue,
} from "../../uikit/ConsentCheckboxes";

interface Props {
  onLogout: () => void;
}

/**
 * Blocking modal for already registered users who have not yet accepted the
 * current editions of the pilot program rules and privacy policy. There is no
 * way to dismiss it other than accepting both — or logging out.
 *
 * Asks the server instead of reading a flag off the stored user: sessions
 * persisted before this feature carry no such flag and would never see it.
 */
export const ConsentGate = ({ onLogout }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [consent, setConsent] = useState<ConsentValue>({
    rules: false,
    privacy: false,
  });

  const { data } = useQuery({
    queryKey: ["consents"],
    queryFn: getMyConsents,
    staleTime: Infinity,
  });

  const mutation = useMutation({
    mutationFn: acceptMyConsents,
    onSuccess: (status) => queryClient.setQueryData(["consents"], status),
  });

  if (!data || data.pending.length === 0) {
    return null;
  }

  const consentGiven = consent.rules && consent.privacy;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-full w-full max-w-[560px] flex-col gap-5 overflow-y-auto rounded-2xl border border-cyan-bright/40 bg-[rgba(7,21,42,0.95)] p-7 backdrop-blur-xl">
        <div>
          <h2 id="consent-title" className="text-3xl font-bold text-white">
            {t("consent.modal.title")}
          </h2>
          <p className="mt-2 text-lg leading-snug text-grey">
            {t("consent.modal.text")}
          </p>
        </div>

        <ConsentCheckboxes
          variant="modal"
          value={consent}
          onChange={setConsent}
        />

        {mutation.isError && (
          <p className="text-center text-sm text-error">
            {t("auth.genericError")}
          </p>
        )}

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            disabled={!consentGiven || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="w-full rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] py-3 text-xl font-bold text-white transition-opacity hover:opacity-85 active:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("consent.modal.submit")}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="text-base text-grey hover:text-white"
          >
            {t("auth.logout")}
          </button>
        </div>
      </div>
    </div>
  );
};
