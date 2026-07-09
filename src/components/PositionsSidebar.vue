<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  positions: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  selected: { type: String, default: null },
})
const emit = defineEmits(['select', 'refresh'])

const searchTerm = ref('')

function totalPnL(p) {
  return (p.realized_pnl ?? 0) + (p.unrealized_pnl ?? 0)
}

function costBasis(p) {
  return (p.quantity ?? 0) * (p.avg_cost ?? 0)
}

// Color a value the way the reference colors threat scores: profit green, flat
// grey, loss escalating yellow -> orange -> red -> crimson by magnitude.
function pnlColor(v) {
  if (v > 0) return '#00C853'
  if (v === 0) return '#8b949e'
  const loss = Math.abs(v)
  if (loss <= 250) return '#FFD600'
  if (loss <= 1000) return '#FF9800'
  if (loss <= 5000) return '#F44336'
  return '#B71C1C'
}

function positionIcon(v) {
  if (v > 0) return 'mdi-trending-up'
  if (v < 0) return 'mdi-trending-down'
  return 'mdi-trending-neutral'
}

function money(v) {
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function displayName(p) {
  return p.ticker ?? p.submitted_ticker ?? '—'
}

// Sorted by P&L descending: biggest winners on top, biggest losers at the bottom.
const sortedPositions = computed(() =>
  [...props.positions].sort((a, b) => totalPnL(b) - totalPnL(a))
)

const filteredPositions = computed(() => {
  const q = searchTerm.value?.trim().toLowerCase()
  if (!q) return sortedPositions.value
  return sortedPositions.value.filter(p => displayName(p).toLowerCase().includes(q))
})

const totalCostBasis = computed(() =>
  props.positions.reduce((sum, p) => sum + costBasis(p), 0)
)

// Portfolio-level P&L drives the header, mirroring the "SITE RISK" summary.
const portfolioPnL = computed(() =>
  props.positions.reduce((sum, p) => sum + totalPnL(p), 0)
)

const portfolioLevel = computed(() => {
  const v = portfolioPnL.value
  if (v > 0) return 'PROFIT'
  if (v < 0) return 'LOSS'
  return 'FLAT'
})

// Signal-strength style spark bars encoding how heavy this position weighs.
function sparkLevels(p) {
  const weight = totalCostBasis.value ? costBasis(p) / totalCostBasis.value : 0
  const filled = Math.min(5, Math.max(1, Math.ceil(weight * 5)))
  return [1, 2, 3, 4, 5].map(i => i <= filled)
}

function isSelected(p) {
  return props.selected === displayName(p)
}

function selectPosition(p) {
  const name = displayName(p)
  emit('select', props.selected === name ? null : name)
}
</script>

<template>
  <v-sheet rounded="lg" height="100%" color="#0d1117" class="position-list custom-scrollbar">
    <!-- Portfolio P&L header (mirrors the reference "SITE RISK" banner) -->
    <div class="portfolio-header pa-6">
      <div class="portfolio-header-content">
        <span class="portfolio-label">PORTFOLIO P&amp;L: </span>
        <span class="portfolio-desc" :style="{ color: pnlColor(portfolioPnL) }">
          {{ portfolioLevel }} ({{ portfolioPnL >= 0 ? '+' : '-' }}${{ money(Math.abs(portfolioPnL)) }})
        </span>
      </div>
    </div>

    <!-- Search filter -->
    <div class="search-container pa-3">
      <v-text-field
        v-model="searchTerm"
        density="compact"
        variant="outlined"
        placeholder="Search positions..."
        prepend-inner-icon="mdi-magnify"
        hide-details
        class="search-field"
        clearable
        @click:clear="searchTerm = ''"
      />
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="ma-3">
      {{ error }}
    </v-alert>

    <div v-else-if="loading" class="d-flex justify-center pa-6">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-list v-else class="py-0">
      <v-list-item
        v-for="p in filteredPositions"
        :key="displayName(p)"
        class="position-list-item"
        :class="{ 'selected-position': isSelected(p) }"
        @click="selectPosition(p)"
      >
        <div class="d-flex align-center w-100">
          <!-- Icon container with fixed width for alignment -->
          <div class="icon-container">
            <v-icon :color="pnlColor(totalPnL(p))" size="24">{{ positionIcon(totalPnL(p)) }}</v-icon>
          </div>

          <!-- Position name -->
          <div class="position-info">{{ displayName(p) }}</div>

          <!-- Weight spark bars -->
          <div class="spark-bars ml-auto mr-2">
            <span
              v-for="(on, i) in sparkLevels(p)"
              :key="i"
              class="spark-bar"
              :class="`lvl-${i + 1}`"
              :style="on ? { backgroundColor: pnlColor(totalPnL(p)) } : {}"
            />
          </div>

          <!-- P&L value -->
          <div class="pnl-text" :style="{ color: pnlColor(totalPnL(p)) }">
            {{ totalPnL(p) >= 0 ? '+' : '-' }}${{ money(Math.abs(totalPnL(p))) }}
          </div>
        </div>
      </v-list-item>

      <v-list-item v-if="!filteredPositions.length">
        <div class="position-info text-medium-emphasis">No positions</div>
      </v-list-item>
    </v-list>
  </v-sheet>
</template>

<style scoped>
.v-list {
  background-color: transparent;
}

.position-list {
  overflow-y: auto;
}

.position-list-item {
  margin-bottom: 8px;
  padding: 8px 16px;
  color: #b1b8c0;
  text-transform: uppercase;
  transition: background-color 0.2s ease;
}

.position-list-item.selected-position {
  background-color: rgba(66, 165, 245, 0.2);
  border-left: 3px solid #42a5f5;
}

.position-info {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  min-width: 40px;
}

.spark-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 18px;
}

.spark-bar {
  width: 3px;
  border-radius: 1px;
  background-color: rgba(255, 255, 255, 0.12);
}

.spark-bar.lvl-1 { height: 6px; }
.spark-bar.lvl-2 { height: 9px; }
.spark-bar.lvl-3 { height: 12px; }
.spark-bar.lvl-4 { height: 15px; }
.spark-bar.lvl-5 { height: 18px; }

.pnl-text {
  font-size: 13px;
  font-weight: bold;
  min-width: 92px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
}

.search-container {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: #0d1117;
}

.search-field {
  background-color: #161b22;
}

.search-field :deep(.v-field__input) {
  color: #b1b8c0;
}

.search-field :deep(.v-field__outline) {
  opacity: 0.3;
}

.portfolio-header {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #161b22;
  border-radius: 12px 12px 0 0;
  justify-content: center;
}

.portfolio-label {
  font-size: 24px;
  font-weight: 700;
  color: #b1b8c0;
  letter-spacing: 1px;
  margin-right: 8px;
}

.portfolio-desc {
  font-size: 24px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  border: none;
}
</style>
