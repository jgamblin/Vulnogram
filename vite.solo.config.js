import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "path";

export default defineConfig({
  root: "src/solo",
  plugins: [tailwindcss(), viteSingleFile()],
  build: {
    outDir: resolve(__dirname, "standalone"),
    emptyOutDir: true,
    cssCodeSplit: false,
  },
});
