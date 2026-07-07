<script setup>
import { ref } from 'vue'
import PortfolioSelector from '../components/PortfolioSelector.vue'
import RealPositionsList from '../components/RealPositionsList.vue'
import LedgerImportForm from '../components/LedgerImportForm.vue'
import LedgerHistory from '../components/LedgerHistory.vue'

const selectedPortfolio = ref('')
const activeTab = ref('positions')
const refreshKey = ref(0)

function onImported() {
  refreshKey.value++
  activeTab.value = 'positions'
}
</script>

<template>
  <v-container fluid class="pa-4">
    <div class="d-flex align-center flex-wrap ga-6 mb-4">
      <span class="text-h6 font-weight-bold">Position Tracker</span>
      <PortfolioSelector v-model="selectedPortfolio" />
    </div>

    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab value="positions">Positions</v-tab>
      <v-tab value="import">Import</v-tab>
      <v-tab value="ledger">Ledger</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <v-window-item value="positions">
        <RealPositionsList :portfolio="selectedPortfolio" :key="'pos-' + refreshKey" />
      </v-window-item>
      <v-window-item value="import">
        <LedgerImportForm :portfolio="selectedPortfolio" @imported="onImported" />
      </v-window-item>
      <v-window-item value="ledger">
        <LedgerHistory :portfolio="selectedPortfolio" :refreshKey="refreshKey" />
      </v-window-item>
    </v-window>
  </v-container>
</template>

