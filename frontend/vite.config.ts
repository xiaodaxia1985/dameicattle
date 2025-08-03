import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: [
        'vue',
        'vue-router',
        'pinia',
        {
          axios: [
            ['default', 'axios'],
          ],
        },
      ],
      dts: true,
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    open: true,
    cors: true,
    proxy: {
      // 健康检查代理
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // 认证服务直接代理（临时解决方案）
      '/api/v1/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      // 其他API通过网关代理
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // 微服务直接代理
      '/microservice/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/microservice\/auth/, '')
      },
      '/microservice/base': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/microservice\/base/, '')
      },
      '/microservice/cattle': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/microservice\/cattle/, '')
      },
      '/microservice/health': {
        target: 'http://localhost:3004',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/microservice\/health/, '')
      },
      '/microservice/feeding': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/microservice\/feeding/, '')
      },
      '/microservice/equipment': {
        target: 'http://localhost:3006',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/microservice\/equipment/, '')
      },
      '/microservice/procurement': {
        target: 'http://localhost:3007',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/microservice\/procurement/, '')
      },
      '/microservice/sales': {
        target: 'http://localhost:3008',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/microservice\/sales/, '')
      },
      '/microservice/material': {
        target: 'http://localhost:3009',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/microservice\/material/, '')
      },
      '/microservice/notification': {
        target: 'http://localhost:3010',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/microservice\/notification/, '')
      },
      '/microservice/file': {
        target: 'http://localhost:3011',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/microservice\/file/, '')
      },
      '/microservice/monitoring': {
        target: 'http://localhost:3012',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/microservice\/monitoring/, '')
      },
      '/microservice/news': {
        target: 'http://localhost:3013',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/microservice\/news/, '')
      },
    },
    hmr: {
      overlay: true,
    },
  },
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    css: true,
    deps: {
      inline: ['element-plus']
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
})