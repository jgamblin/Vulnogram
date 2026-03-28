import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/solo',
  plugins: [tailwindcss()],
  build: {
    outDir: resolve(__dirname, 'standalone'),
    emptyOutDir: true,
  },
});
