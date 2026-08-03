import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
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
      '/api/quant_indicators': {
        target: 'http://quant_indicators.quant.mayberry.farm:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/quant_indicators/, ''),
      },
      '/api/quant_momentum': {
        target: 'http://quant_momentum.quant.mayberry.farm:8020',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/quant_momentum/, ''),
      },
      '/api/quant_positions': {
        target: 'http://quant_positions.quant.mayberry.farm:8015',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/quant_positions/, ''),
      },
      '/api/quant_signals': {
        target: 'http://quant_signals.quant.mayberry.farm:8016',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/quant_signals/, ''),
      },
      '/api/quant_cnbc': {
        target: 'http://quant_cnbc.quant.mayberry.farm:8019',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/quant_cnbc/, ''),
      },
      '/api/quant_youtube': {
        target: 'http://quant_youtube.quant.mayberry.farm:8022',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/quant_youtube/, ''),
      },
    },
  },
})
