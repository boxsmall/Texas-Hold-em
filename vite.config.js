import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/Texas-Hold-em/',
  plugins: [vue()],
  server: {
    port: 5173,
    host: true
  }
})
