import { useTranslation } from "react-i18next";

/**
 * Метка «на проверке» у школы, заведённой учителем.
 *
 * Школы всё ещё заводят учителя — иначе первым же экраном человек упирался бы в
 * пустой справочник, — но каждая такая строка видна админу как очередь: её
 * переименовывают, сливают с дублем или подтверждают.
 */
export const VerifiedBadge = ({ isVerified }: { isVerified: number }) => {
  const { t } = useTranslation();

  if (isVerified) return null;

  return (
    <span className="ml-2 rounded-full border border-orange-bright/50 px-2 py-0.5 align-middle font-mono text-xs tracking-wide text-orange-bright uppercase">
      {t("directory.unverified")}
    </span>
  );
};
