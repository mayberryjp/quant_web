import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/quant_symbols': {
        target: 'http://quant_symbols.quant.mayberry.farm:8089',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/quant_symbols/, ''),
      },
      '/api/quant_daily_bars': {
        target: 'http://quant_daily_bars.quant.mayberry.farm:8090',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/quant_daily_bars/, ''),
      },
    },
  },
})
