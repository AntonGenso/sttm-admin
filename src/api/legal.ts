import axios from "axios";

/**
 * Правила участия и политика конфиденциальности.
 *
 * Документов ещё нет: пока на сервере не заданы их адреса и версия, `enabled`
 * приходит false, и ни галочка при регистрации, ни блокирующее окно не
 * показываются. Появятся документы — включится само, без выкатки панели.
 */
export interface ILegalConfig {
  enabled: boolean;
  version: string | null;
  terms_url: string | null;
  privacy_url: string | null;
}

/** Публично: экран регистрации должен знать ссылки ещё до входа. */
export const getLegal = async (): Promise<ILegalConfig> => {
  const { data } = await axios.get<ILegalConfig>("/api/legal");
  return data;
};

export const acceptLegal = async (): Promise<void> => {
  await axios.post("/api/legal/accept");
};
