<script setup>
import { ref } from 'vue'
import PortfolioSelector from '../components/PortfolioSelector.vue'
import RealPositionsList from '../components/RealPositionsList.vue'
import LedgerImportForm from '../components/LedgerImportForm.vue'
import LedgerHistory from '../components/LedgerHistory.vue'

const selectedPortfolio = ref('')
const activeTab = ref('positions')
const refreshKey = ref(0)

const tabs = [
  { id: 'positions', label: 'Positions' },
  { id: 'import', label: 'Import' },
  { id: 'ledger', label: 'Ledger' },
]

function onImported() {
  refreshKey.value++
  activeTab.value = 'positions'
}
</script>

<template>
  <div class="real-positions-page">
    <div class="page-toolbar">
      <h2>Position Tracker</h2>
      <PortfolioSelector v-model="selectedPortfolio" />
    </div>

    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="tab-content">
      <RealPositionsList
        v-if="activeTab === 'positions'"
        :portfolio="selectedPortfolio"
        :key="'pos-' + refreshKey"
      />
      <LedgerImportForm
        v-if="activeTab === 'import'"
        :portfolio="selectedPortfolio"
        @imported="onImported"
      />
      <LedgerHistory
        v-if="activeTab === 'ledger'"
        :portfolio="selectedPortfolio"
        :refreshKey="refreshKey"
      />
    </div>
  </div>
</template>

<style scoped>
.real-positions-page {
  padding: 16px 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-toolbar {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.page-toolbar h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.tab-bar {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0;
}

.tab-btn {
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--blue);
  border-bottom-color: var(--blue);
}

.tab-content {
  flex: 1;
}
</style>
