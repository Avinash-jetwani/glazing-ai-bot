import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/main.tsx',
      formats: ['umd'],
      name: 'GlazingWidget',
      fileName: () => 'widget.js',
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
  },
})
