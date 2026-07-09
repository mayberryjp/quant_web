<script setup>
import { ref, computed, onMounted } from 'vue'
import DashboardHeader from '../components/DashboardHeader.vue'
import PositionsSidebar from '../components/PositionsSidebar.vue'
import WatchList from '../components/WatchList.vue'
import { getPositions, getPortfolios } from '../api/positions.js'

const positions = ref([])
const loading = ref(true)
const error = ref(null)
const selectedTicker = ref(null)

const totalRealizedPnL = computed(() =>
  positions.value.reduce((sum, p) => sum + (p.realized_pnl ?? 0), 0)
)
const totalCostBasis = computed(() =>
  positions.value.reduce((sum, p) => sum + (p.quantity ?? 0) * (p.avg_cost ?? 0), 0)
)
const openCount = computed(() => positions.value.filter(p => (p.quantity ?? 0) !== 0).length)

// Total account value: prefer live market value, else cost basis + unrealized P&L.
const totalAccountValue = computed(() =>
  positions.value.reduce((sum, p) => {
    const costBasis = (p.quantity ?? 0) * (p.avg_cost ?? 0)
    const marketValue = p.market_value ?? 0
    return sum + (marketValue || costBasis + (p.unrealized_pnl ?? 0))
  }, 0)
)

async function loadPositions() {
  loading.value = true
  error.value = null
  try {
    const portfolios = await getPortfolios()
    if (portfolios.length) {
      positions.value = await getPositions({ portfolio: portfolios[0].name })
    }
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
        <PositionsSidebar
          :positions="positions"
          :loading="loading"
          :error="error"
          :selected="selectedTicker"
          @select="selectedTicker = $event"
          @refresh="loadPositions"
        />
      </v-col>
      <v-col cols="12" md="8" lg="9">
        <div class="d-flex flex-column ga-4">
          <DashboardHeader
            :totalPnL="totalRealizedPnL"
            :costBasis="totalCostBasis"
            :accountValue="totalAccountValue"
            :openPositions="openCount"
          />
          <WatchList />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

