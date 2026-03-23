import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // 如果后端接口没有 /api 前缀，可以开启 rewrite
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
