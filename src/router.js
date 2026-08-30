import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './views/Dashboard.vue'
import Health from './views/Health.vue'
import RealPositions from './views/RealPositions.vue'
import Symbols from './views/Symbols.vue'
import StickyNote from './views/StickyNote.vue'
import Trades from './views/Trades.vue'
import TickerDetail from './views/TickerDetail.vue'
import ReplayChart from './views/ReplayChart.vue'
import WatchList from './views/WatchList.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/ticker/:ticker', name: 'TickerDetail', component: TickerDetail },
  { path: '/replaychart/:ticker', name: 'ReplayChart', component: ReplayChart },
  { path: '/symbols', name: 'Symbols', component: Symbols },
  { path: '/watchlist', name: 'WatchList', component: WatchList },
  { path: '/sticky-note', name: 'StickyNote', component: StickyNote },
  { path: '/trades', name: 'Trades', component: Trades },
  { path: '/positions', name: 'Positions', component: RealPositions },
  { path: '/health', name: 'Health', component: Health },
  { path: '/health/:section', name: 'HealthSection', component: Health },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
