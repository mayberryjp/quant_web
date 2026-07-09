import { createApp } from 'vue'
import './style.css'
import './assets/app-table.css'
import App from './App.vue'
import router from './router.js'
import vuetify from './plugins/vuetify.js'
import VueApexCharts from 'vue3-apexcharts'

createApp(App).use(router).use(vuetify).use(VueApexCharts).mount('#app')
