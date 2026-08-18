import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        // Имя сервиса бэкенда отличается между стеками: `sttm-server` в
        // sttm-server/docker-compose.yml и `backend` в корневом. Неверное имя
        // не резолвится, и Vite отдаёт 502 на каждый /api-запрос.
        target: process.env.STTM_API_URL || "http://sttm-server:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      // Файлы миссий. Бэкенд отдаёт ссылки на /uploads (MINIO_BROWSER_PREFIX),
      // а сюда подставляется адрес самого MinIO.
      "/uploads": {
        target: process.env.STTM_MINIO_URL || "http://localhost:9000",
        // Обязателен: подпись SigV4 включает Host, и без подмены на хост MinIO
        // придёт 403.
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/uploads/, ""),
      },
    },
  },
});
