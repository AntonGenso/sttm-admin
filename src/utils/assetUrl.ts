/**
 * Normalizes the links to mission files (covers, videos, handouts, fact
 * pictures) that the backend hands out.
 *
 * The shape depends on the backend's `MINIO_BROWSER_PREFIX`: with it set the
 * links are same-origin paths (`/uploads/…`), without it they point straight at
 * MinIO (`http://host:9000/…`). The direct form is plain HTTP, and the panel is
 * served over HTTPS in production — the browser then blocks the image as mixed
 * content, which is why mission covers came up empty there.
 *
 * So an insecure absolute link is folded onto the same-origin path this app
 * already proxies (see the `/uploads` proxy in `nginx.conf` and in
 * `vite.config.ts`). Links that are relative, or absolute over HTTPS, are left
 * exactly as they are.
 *
 * Mirrored in step-to-the-moon `src/services/assetUrl.ts`.
 */

/** Path the app proxies to MinIO; must match nginx.conf and vite.config.ts. */
const ASSET_PREFIX = "/uploads";

export const toAssetUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (!url.startsWith("http://")) return url;

  try {
    // The query carries the SigV4 signature of a private file — keep it, and
    // keep the host out of it: the proxy restores the one the signature covers.
    const { pathname, search } = new URL(url);
    return `${ASSET_PREFIX}${pathname}${search}`;
  } catch {
    return url;
  }
};
