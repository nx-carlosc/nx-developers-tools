import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        'jira-script': resolve(__dirname, 'src/jira-script.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'utils/[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  test: {
    environment: 'node',
  },
})

