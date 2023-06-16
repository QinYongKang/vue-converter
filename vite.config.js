import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 将请求代理到的目标地址
        changeOrigin: true, // 修改请求头中的 Origin 为目标地址
        rewrite: (path) => path.replace(/^\/api/, ''), // 重写请求路径，将 '/api' 前缀移除
      },
    },
  },
})
