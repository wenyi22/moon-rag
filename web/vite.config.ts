import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" + HashRouter → 建置結果可以放在任何子路徑（GitHub Pages 的 /moon-rag/）
export default defineConfig({
  base: "./",
  plugins: [react()],
});
