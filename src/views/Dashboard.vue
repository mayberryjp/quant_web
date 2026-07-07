<script setup>
import { ref, computed, onMounted } from 'vue'
import DashboardHeader from '../components/DashboardHeader.vue'
import Positions from '../components/Positions.vue'
import WatchList from '../components/WatchList.vue'
import { getPositions, getPortfolios } from '../api/positions.js'

const positions = ref([])
const loading = ref(true)
const error = ref(null)

const totalRealizedPnL = computed(() =>
  positions.value.reduce((sum, p) => sum + (p.realized_pnl ?? 0), 0)
)
const totalCostBasis = computed(() =>
  positions.value.reduce((sum, p) => sum + (p.quantity ?? 0) * (p.avg_cost ?? 0), 0)
)
const openCount = computed(() => positions.value.filter(p => (p.quantity ?? 0) !== 0).length)

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
  <DashboardHeader
    :totalPnL="totalRealizedPnL"
    :costBasis="totalCostBasis"
    :openPositions="openCount"
  />
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12" md="6">
        <Positions :positions="positions" :loading="loading" :error="error" @refresh="loadPositions" />
      </v-col>
      <v-col cols="12" md="6">
        <WatchList />
      </v-col>
    </v-row>
  </v-container>
</template>

