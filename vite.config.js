import { cpSync, copyFileSync, existsSync } from 'node:fs';
import { defineConfig } from 'vite';

function copyStaticAppFiles() {
  return {
    name: 'copy-linguaturtle-static-files',
    closeBundle() {
      if (existsSync('assets')) cpSync('assets', 'dist/assets', { recursive: true });
      for (const file of ['manifest.webmanifest', 'sw.js']) {
        if (existsSync(file)) copyFileSync(file, `dist/${file}`);
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [copyStaticAppFiles()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
