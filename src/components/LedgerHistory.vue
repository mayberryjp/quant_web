<script setup>
import { ref, watch, defineProps } from 'vue'
import { getLedgerEntries } from '../api/positions.js'

const props = defineProps({
  portfolio: { type: String, default: '' },
  refreshKey: { type: Number, default: 0 },
})

const entries = ref([])
const loading = ref(false)
const error = ref(null)
const tickerFilter = ref('')
const eventTypeFilter = ref('')

async function load() {
  if (!props.portfolio) return
  loading.value = true
  error.value = null
  try {
    const params = { portfolio: props.portfolio, limit: '50' }
    if (tickerFilter.value.trim()) params.ticker = tickerFilter.value.trim().toUpperCase()
    if (eventTypeFilter.value) params.event_type = eventTypeFilter.value
    entries.value = await getLedgerEntries(params)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

watch(() => props.portfolio, load, { immediate: true })
watch(() => props.refreshKey, load)

function formatDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleString() } catch { return iso }
}

function applyFilter() {
  load()
}
</script>

<template>
  <section class="card">
    <div class="card-header">
      <h2>Ledger History</h2>
      <span class="badge">{{ entries.length }}</span>
      <div class="filter-row">
        <input v-model="tickerFilter" class="filter-input" placeholder="Ticker" @keyup.enter="applyFilter" />
        <select v-model="eventTypeFilter" class="filter-select" @change="applyFilter">
          <option value="">All events</option>
          <option value="opening_balance">Opening Balance</option>
          <option value="external_position_change">External Change</option>
          <option value="manual_adjustment">Manual Adjustment</option>
          <option value="transfer_in">Transfer In</option>
          <option value="transfer_out">Transfer Out</option>
          <option value="stock_split">Stock Split</option>
          <option value="fee">Fee</option>
          <option value="correction">Correction</option>
        </select>
        <button class="refresh-btn" @click="load">↻</button>
      </div>
    </div>

    <div v-if="loading" class="card-status">Loading…</div>
    <div v-else-if="error" class="card-status error-text">{{ error }}</div>
    <div v-else-if="!entries.length" class="card-status muted">No ledger entries</div>

    <div v-else class="table-scroll">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Ticker</th>
            <th>Event</th>
            <th class="right">Qty Δ</th>
            <th class="right">Price</th>
            <th class="right">Fees</th>
            <th>Source</th>
            <th>Reason</th>
            <th>Occurred</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in entries" :key="entry.id">
            <td class="mono dim">{{ entry.id }}</td>
            <td class="symbol">{{ entry.ticker }}</td>
            <td>
              <span class="event-badge" :class="eventClass(entry.event_type)">
                {{ entry.event_type?.replace(/_/g, ' ') }}
              </span>
            </td>
            <td class="right mono" :class="(entry.quantity_delta ?? 0) >= 0 ? 'positive' : 'negative'">
              {{ (entry.quantity_delta ?? 0) >= 0 ? '+' : '' }}{{ entry.quantity_delta }}
            </td>
            <td class="right mono">{{ entry.price != null ? '$' + Number(entry.price).toFixed(2) : '—' }}</td>
            <td class="right mono">{{ entry.fees != null && Number(entry.fees) > 0 ? '$' + Number(entry.fees).toFixed(2) : '—' }}</td>
            <td class="dim">{{ entry.source ?? '—' }}</td>
            <td class="reason-cell" :title="entry.reason">{{ entry.reason || '—' }}</td>
            <td class="date-cell">{{ formatDate(entry.occurred_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script>
function eventClass(type) {
  if (!type) return ''
  if (type.includes('adjustment') || type.includes('correction')) return 'event-warn'
  if (type.includes('transfer_out') || type.includes('fee')) return 'event-red'
  return 'event-default'
}
</script>

<style scoped>
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.card-header h2 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--yellow-bg);
  color: var(--yellow);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.filter-input {
  width: 80px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 12px;
  font-family: inherit;
}

.filter-select {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 12px;
  font-family: inherit;
}

.refresh-btn {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
}

.refresh-btn:hover {
  color: var(--text-primary);
}

.card-status {
  padding: 24px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
}

.error-text {
  color: var(--red);
}

.muted {
  color: var(--text-muted);
}

.table-scroll {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
}

.table th {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  white-space: nowrap;
}

.table td {
  padding: 8px 12px;
  font-size: 13px;
  border-bottom: 1px solid var(--border);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.right {
  text-align: right;
}

.mono {
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-variant-numeric: tabular-nums;
}

.symbol {
  font-weight: 600;
  color: var(--text-primary);
}

.dim {
  color: var(--text-muted);
  font-size: 12px;
}

.event-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  white-space: nowrap;
}

.event-default {
  background: var(--blue-bg);
  color: var(--blue);
}

.event-warn {
  background: var(--yellow-bg);
  color: var(--yellow);
}

.event-red {
  background: var(--red-bg);
  color: var(--red);
}

.reason-cell {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-secondary);
  font-size: 12px;
}

.date-cell {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}

.positive {
  color: var(--green);
}

.negative {
  color: var(--red);
}
</style>
