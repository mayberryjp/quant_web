import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'

// Dark theme mirroring the original Algo Farm design tokens.
const algoFarmDark = {
  dark: true,
  colors: {
    background: '#0a0c10',
    surface: '#161b22',
    'surface-variant': '#0d1117',
    'surface-bright': '#30363d',
    primary: '#1f6feb',
    secondary: '#8b949e',
    success: '#5cdd8b',
    error: '#dc3545',
    warning: '#cf8e13',
    info: '#58a6ff',
    'on-background': '#e6edf3',
    'on-surface': '#e6edf3',
    'on-surface-variant': '#b1b8c0',
  },
  variables: {
    'border-color': '#30363d',
    'border-opacity': 1,
    'theme-on-surface-variant': '#b1b8c0',
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
    VDataTable: { density: 'comfortable', hover: true, itemsPerPage: 10 },
  },
})
