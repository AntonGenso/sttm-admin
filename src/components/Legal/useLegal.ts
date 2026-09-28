import { useQuery } from "@tanstack/react-query";
import { getLegal, type ILegalConfig } from "../../api/legal";

/**
 * Конфигурация документов, общая для галочки при регистрации и блокирующего
 * окна. Ссылки и версия меняются раз в жизни, поэтому перезапрашивать их на
 * каждом фокусе окна незачем.
 */
export const useLegal = () =>
  useQuery<ILegalConfig>({
    queryKey: ["legal"],
    queryFn: getLegal,
    staleTime: 5 * 60 * 1000,
  });

/**
 * Можно ли отправлять форму регистрации: пока документов нет — всегда да,
 * иначе кнопка блокировалась бы галочкой, которой на экране нет.
 */
export const useLegalConsentSatisfied = (checked: boolean): boolean => {
  const { data } = useLegal();
  return !data?.enabled || checked;
};
