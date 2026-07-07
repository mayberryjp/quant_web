import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'

// Dark theme mirroring the original Algo Farm design tokens.
const algoFarmDark = {
  dark: true,
  colors: {
    background: '#0f1117',
    surface: '#1e2130',
    'surface-variant': '#1a1d29',
    'surface-bright': '#2a2d3a',
    primary: '#3b82f6',
    secondary: '#9ca3af',
    success: '#22c55e',
    error: '#ef4444',
    warning: '#eab308',
    info: '#3b82f6',
    'on-background': '#e4e4e7',
    'on-surface': '#e4e4e7',
    'on-surface-variant': '#9ca3af',
  },
  variables: {
    'border-color': '#2a2d3a',
    'border-opacity': 1,
    'theme-on-surface-variant': '#9ca3af',
  },
}

export default createVuetify({
  theme: {
    defaultTheme: 'algoFarmDark',
    themes: { algoFarmDark },
  },
  defaults: {
    VCard: { color: 'surface', variant: 'flat', rounded: 'lg' },
    VBtn: { variant: 'text' },
    VTextField: { variant: 'outlined', density: 'compact', hideDetails: 'auto' },
    VSelect: { variant: 'outlined', density: 'compact', hideDetails: 'auto' },
    VChip: { size: 'small' },
    VDataTable: { density: 'comfortable' },
  },
})
