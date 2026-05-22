import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
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
