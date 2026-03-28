import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: resolve(__dirname, "public/dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        editor: resolve(__dirname, "src/team/editor.js"),
        list: resolve(__dirname, "src/team/list.js"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
});
