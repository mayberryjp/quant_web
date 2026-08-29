// Primary navigation, shared by the desktop app-bar (AppHeader) and the mobile
// slide-out drawer (App.vue) so both stay in sync.
export const navItems = [
  { title: 'Dashboard', to: '/', icon: 'mdi-view-dashboard-outline' },
  { title: 'Watch List', to: '/watchlist', icon: 'mdi-eye-outline' },
  { title: 'Sticky Note', to: '/sticky-note', icon: 'mdi-note-outline' },
  { title: 'Trades', to: '/trades', icon: 'mdi-swap-horizontal' },
  { title: 'Health', to: '/health', icon: 'mdi-heart-pulse' },
]
