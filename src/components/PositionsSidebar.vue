<script setup>
import { ref, computed, watch } from 'vue'
import { getDailyChanges } from '../api/dailyChanges.js'

const props = defineProps({
  positions: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  selected: { type: String, default: null },
})
const emit = defineEmits(['select', 'refresh'])

const dailyChangesMap = ref({})
const dailyChangesLoading = ref({})
const searchTerm = ref('')

function totalPnL(p) {
  return (p.realized_pnl ?? 0) + (p.unrealized_pnl ?? 0)
}

function costBasis(p) {
  return (p.quantity ?? 0) * (p.avg_cost ?? 0)
}

function money(v) {
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function displayName(p) {
  return p.ticker ?? p.submitted_ticker ?? '—'
}

/**
 * Get CSS class for bar based on close_change_percent.
 * Symmetric ranges on both sides.
 */
function getDailyChangeClass(closeChangePercent) {
  if (closeChangePercent == null || Number.isNaN(closeChangePercent)) return 'bar-neutral'
  if (closeChangePercent > 3) return 'bar-positive-high'
  if (closeChangePercent > 1.5) return 'bar-positive-medium'
  if (closeChangePercent > 0.5) return 'bar-positive-low'
  if (closeChangePercent > -0.5) return 'bar-neutral'
  if (closeChangePercent > -1.5) return 'bar-negative-low'
  if (closeChangePercent > -3) return 'bar-negative-medium'
  return 'bar-negative-high'
}

/**
 * Fetch daily changes for a ticker (cached).
 */
async function fetchDailyChanges(ticker) {
  if (dailyChangesMap.value[ticker] !== undefined) {
    console.log('Daily changes already cached for:', ticker)
    return
  }
  console.log('Fetching daily changes for:', ticker)
  dailyChangesLoading.value[ticker] = true
  try {
    const data = await getDailyChanges(ticker, 15)
    console.log('Stored daily changes for', ticker, ':', data)
    dailyChangesMap.value[ticker] = data
  } catch (e) {
    console.error(`Failed to fetch daily changes for ${ticker}:`, e)
    dailyChangesMap.value[ticker] = []
  } finally {
    dailyChangesLoading.value[ticker] = false
  }
}

function getDailyChangesForTicker(ticker) {
  const changes = dailyChangesMap.value[ticker] || []
  // Reverse so oldest is on left, newest is on right
  return [...changes].reverse()
}

// Color a value based on P&L.
function pnlColor(v) {
  if (v > 0) return '#00C853'
  if (v === 0) return '#8b949e'
  const loss = Math.abs(v)
  if (loss <= 250) return '#FFD600'
  if (loss <= 1000) return '#FF9800'
  if (loss <= 5000) return '#F44336'
  return '#B71C1C'
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

// Auto-fetch daily changes for filtered positions
watch(
  () => filteredPositions.value,
  (positions) => {
    console.log('Filtered positions changed, count:', positions.length)
    positions.forEach(p => {
      const name = displayName(p)
      if (dailyChangesMap.value[name] === undefined) {
        console.log('Triggering fetch for:', name)
        fetchDailyChanges(name)
      }
    })
  },
  { immediate: true }
)

// Portfolio-level P&L drives the header.
const portfolioPnL = computed(() =>
  props.positions.reduce((sum, p) => sum + totalPnL(p), 0)
)

const portfolioLevel = computed(() => {
  const v = portfolioPnL.value
  if (v > 0) return 'PROFIT'
  if (v < 0) return 'LOSS'
  return 'FLAT'
})

function isSelected(p) {
  return props.selected === displayName(p)
}

function selectPosition(p) {
  const name = displayName(p)
  const isCurrentlySelected = props.selected === name
  emit('select', isCurrentlySelected ? null : name)
  
  // Fetch daily changes when selecting position
  if (!isCurrentlySelected) {
    fetchDailyChanges(name)
  }
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
          <!-- Position name -->
          <div class="position-info">{{ displayName(p) }}</div>

          <!-- Daily changes bars (colored by close_change_percent) -->
          <div class="daily-bars ml-auto mr-2">
            <span
              v-for="(change, i) in getDailyChangesForTicker(displayName(p))"
              :key="i"
              class="daily-bar"
              :class="getDailyChangeClass(change.close_change_percent)"
              :style="{ 
                maxWidth: '5px',
                height: '16px'
              }"
              :title="`${change.bar_date}: ${change.close_change_percent > 0 ? '+' : ''}${change.close_change_percent.toFixed(2)}%`"
            />
          </div>

          <!-- Loading state for daily changes -->
          <div v-if="dailyChangesLoading[displayName(p)]" class="ml-2">
            <v-progress-circular indeterminate size="16" width="2" color="primary" />
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

.daily-bars {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  width: 120px;
  align-items: center;
  overflow: hidden;
}

.daily-bar {
  /* Share container width equally so all bars show (no scroll), capped at maxWidth */
  flex: 1 1 0;
  min-width: 2px;
  margin: 1px;
  border-radius: 50rem;
  box-sizing: border-box;
  transition: transform 0.2s ease;
  cursor: pointer;
}

.daily-bar:hover {
  transform: scale(1.5);
}

.bar-positive-low {
  background-color: #29B6F6;
}

.bar-positive-medium {
  background-color: #1565C0;
}

.bar-positive-high {
  background-color: #5CDD8B;
}

.bar-negative-low {
  background-color: #FFD600;
}

.bar-negative-medium {
  background-color: #FF9800;
}

.bar-negative-high {
  background-color: #F44336;
}

.bar-neutral {
  background-color: #8b949e;
}

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
