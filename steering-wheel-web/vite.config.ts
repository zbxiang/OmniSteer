import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import eslintPlugin from 'vite-plugin-eslint'
import viteImagemin from 'vite-plugin-imagemin'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const proxyPrefix = env.VITE_API_PROXY_PREFIX || '/api'
  const proxyTarget = env.VITE_API_PROXY_TARGET || ''

  return {
    plugins: [
      vue(),
      tailwindcss(),
      eslintPlugin({
        include: ['src/**/*.ts', 'src/**/*.vue'],
        exclude: ['node_modules', 'dist'],
        cache: false,
        fix: true,
      }),
      viteImagemin({
        disable: false,
        verbose: true,
        gifsicle: {
          optimizationLevel: 7,
          interlaced: false,
        },
        optipng: {
          optimizationLevel: 7,
        },
        pngquant: {
          quality: [0.8, 0.9],
          speed: 4,
        },
        svgo: {
          plugins: [
            {
              name: 'removeViewBox',
              active: false,
            },
          ],
        },
      }),
    ],
    server: {
      host: '0.0.0.0',
      port: 9000,
      proxy: proxyTarget
        ? {
            [proxyPrefix]: {
              target: proxyTarget,
              changeOrigin: true,
            },
          }
        : undefined,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      assetsDir: 'assets',
      assetsInlineLimit: 0,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (['vue-router', 'pinia'].some(chunk => id.includes(chunk))) {
              return 'chunk-vendor';
            } else if (id.includes('element-plus')) {
              return 'chunk-element-plus';
            } else {
              if (id.includes('node_modules')) {
                return id.toString().split('node_modules/')[1].split('/')[0].toString();
              } else {
                return 'chunk-app';
              }
            }
          },
          assetFileNames: (assetInfo) => {
            let extType = assetInfo.name?.split('.')[1] || '';
            if (/png|jpeg|svg|jpg|gif|webp|ico/i.test(extType)) {
              extType = 'img'
            }
            return `static/${extType}/[name]-[hash].[ext]`;  
          },
          chunkFileNames: (chunkInfo) => {
            const name = chunkInfo.name
            if (name.includes('chunk-monaco')) {
              return `static/js/monaco/${name}.js`;
            }
            return `static/js/[name]-[hash].js`;
          },
          entryFileNames: 'static/js/[name]-[hash].js',
          maxSize: '1000Kb'
        },
      },
      esbuild: {
        drop: ['console', 'debugger'],
        pure: ['console.log', 'debugger'],
      },
      // 超过1024提示
      chunkSizeWarningLimit: 1024,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          loadPaths: [path.resolve(__dirname, './src/styles')],
          additionalData: '@use "@/styles/variables.scss" as v;',
        },
      },
    },
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_APP_ENV),
    },
  }
})
