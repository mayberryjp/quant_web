import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './views/Dashboard.vue'
import Health from './views/Health.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/health', name: 'Health', component: Health },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
