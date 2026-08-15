<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PositionsSidebar from '../components/PositionsSidebar.vue'
import DailyPriceChart from '../components/DailyPriceChart.vue'
import { getPositions, getPortfolios } from '../api/positions.js'

const route = useRoute()
const ticker = ref(route.params.ticker.toUpperCase())

// Vue Router reuses this component instance across /ticker/:ticker navigations.
watch(() => route.params.ticker, (t) => {
  ticker.value = t.toUpperCase()
})

const positions = ref([])
const loading = ref(false)
const error = ref(null)

async function loadPositions() {
  loading.value = true
  error.value = null
  try {
    const [portfolios, allPositions] = await Promise.all([
      getPortfolios(),
      getPositions(),
    ])
    positions.value = allPositions.map((p) => ({
      ...p,
      portfolio: portfolios.find((pf) => pf.id === p.portfolio_id),
    }))
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadPositions)
</script>

<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12" md="4" lg="3">
        <div class="portfolio-sticky">
          <PositionsSidebar
            :positions="positions"
            :loading="loading"
            :error="error"
            @refresh="loadPositions"
          />
        </div>
      </v-col>
      <v-col cols="12" md="8" lg="9">
        <DailyPriceChart :ticker="ticker" :default-range="30" />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
@media (min-width: 960px) {
  .portfolio-sticky {
    position: sticky;
    top: 0;
  }
}
</style>
