/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Seuls les tests du site : .claude/ contient les fichiers d'origine (node --test).
    include: ['src/**/*.test.ts'],
  },
});
