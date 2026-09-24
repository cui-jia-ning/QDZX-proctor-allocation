import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/QDZX-proctor-allocation/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
