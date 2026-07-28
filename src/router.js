import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './views/Dashboard.vue'
import Health from './views/Health.vue'
import RealPositions from './views/RealPositions.vue'
import Symbols from './views/Symbols.vue'
import TickerDetail from './views/TickerDetail.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/ticker/:ticker', name: 'TickerDetail', component: TickerDetail },
  { path: '/symbols', name: 'Symbols', component: Symbols },
  { path: '/positions', name: 'Positions', component: RealPositions },
  { path: '/health', name: 'Health', component: Health },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
