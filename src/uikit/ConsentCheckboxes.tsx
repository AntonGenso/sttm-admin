import type { ReactElement } from "react";
import { Trans } from "react-i18next";

/**
 * PDF documents of the Mission Moon pilot program (bilingual UZ + RU, one file
 * each). Served from `public/docs`; a new edition of a document also needs its
 * version bumped in sttm-server `consentService.CURRENT_VERSIONS`.
 */
export const RULES_PDF_URL = "/docs/mission-moon-rules.pdf";
export const PRIVACY_PDF_URL = "/docs/mission-moon-privacy.pdf";

export interface ConsentValue {
  rules: boolean;
  privacy: boolean;
}

interface Props {
  value: ConsentValue;
  onChange: (value: ConsentValue) => void;
  /** Wording differs between the registration form and the cabinet modal. */
  variant: "register" | "modal";
}

const docLink = (href: string): ReactElement => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-cyan-bright underline underline-offset-2 hover:opacity-80"
  />
);

/** Two separate, initially unchecked consent boxes with links to the PDFs. */
export const ConsentCheckboxes = ({ value, onChange, variant }: Props) => {
  const items: { key: keyof ConsentValue; i18nKey: string }[] = [
    { key: "rules", i18nKey: `consent.${variant}.rules` },
    { key: "privacy", i18nKey: `consent.${variant}.privacy` },
  ];

  return (
    <div className="flex flex-col gap-3">
      {items.map(({ key, i18nKey }) => (
        <label
          key={key}
          className="flex cursor-pointer items-start gap-3 text-base leading-snug text-grey"
        >
          <input
            type="checkbox"
            checked={value[key]}
            onChange={(event) =>
              onChange({ ...value, [key]: event.target.checked })
            }
            className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-cyan-bright"
          />
          <span>
            <Trans
              i18nKey={i18nKey}
              components={{
                rules: docLink(RULES_PDF_URL),
                privacy: docLink(PRIVACY_PDF_URL),
              }}
            />
          </span>
        </label>
      ))}
    </div>
  );
};
