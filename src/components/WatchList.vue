<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const watchlist = ref([])
const loading = ref(false)
const error = ref(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 10000)
    const res = await fetch('/api/quant_signals/watchlist?active=true&page_size=100', {
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    watchlist.value = data.items ?? []
  } catch (e) {
    if (e.name !== 'AbortError') error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)

function directionClass(dir) {
  if (dir === 'long') return 'direction-long'
  if (dir === 'short') return 'direction-short'
  return ''
}

function formatDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString() } catch { return iso }
}

function displayTicker(entry) {
  return entry.canonical_ticker || entry.submitted_ticker
}
</script>

<template>
  <section class="card">
    <div class="card-header">
      <h2>Watch List</h2>
      <span class="badge">{{ watchlist.length }}</span>
      <button class="refresh-btn" @click="load">↻</button>
    </div>

    <div v-if="loading" class="card-status">Loading…</div>
    <div v-else-if="error" class="card-status error-text">{{ error }}</div>
    <div v-else-if="!watchlist.length" class="card-status muted">No watchlist entries</div>

    <table v-else class="table">
      <colgroup>
        <col style="width: 10%" />
        <col style="width: 8%" />
        <col style="width: 12%" />
        <col style="width: 12%" />
        <col style="width: 9%" />
        <col style="width: 9%" />
        <col style="width: 10%" />
        <col style="width: 18%" />
        <col style="width: 12%" />
      </colgroup>
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Market</th>
          <th>Source</th>
          <th>Signal</th>
          <th>Direction</th>
          <th class="right">Score</th>
          <th class="right">Confidence</th>
          <th>Reason</th>
          <th>Updated</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in watchlist" :key="entry.watchlist_entry_id">
          <td class="symbol">{{ displayTicker(entry) }}</td>
          <td>
            <span class="market-badge">{{ entry.market ?? '—' }}</span>
          </td>
          <td class="source-cell">{{ entry.source }}</td>
          <td class="signal-cell">{{ entry.signal_type }}</td>
          <td>
            <span v-if="entry.direction" class="direction-badge" :class="directionClass(entry.direction)">
              {{ entry.direction.toUpperCase() }}
            </span>
            <span v-else class="muted">—</span>
          </td>
          <td class="right mono">{{ entry.score != null ? entry.score.toFixed(2) : '—' }}</td>
          <td class="right mono">{{ entry.confidence != null ? (entry.confidence * 100).toFixed(0) + '%' : '—' }}</td>
          <td class="reason-cell" :title="entry.reason">{{ entry.reason || '—' }}</td>
          <td class="date-cell">{{ formatDate(entry.updated_at) }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

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

.refresh-btn {
  margin-left: auto;
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
  background: var(--bg-card);
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

.table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
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
}

.table td {
  padding: 10px 12px;
  font-size: 13px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.right,
.table th.right,
.table td.right {
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

.market-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  background: var(--blue-bg);
  color: var(--blue);
}

.source-cell {
  font-size: 12px;
  color: var(--text-secondary);
}

.signal-cell {
  font-size: 12px;
  color: var(--text-secondary);
}

.direction-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  letter-spacing: 0.5px;
}

.direction-long {
  background: var(--green-bg);
  color: var(--green);
}

.direction-short {
  background: var(--red-bg);
  color: var(--red);
}

.reason-cell {
  font-size: 12px;
  color: var(--text-secondary);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date-cell {
  font-size: 12px;
  color: var(--text-muted);
}

.positive {
  color: var(--green);
}

.negative {
  color: var(--red);
}
</style>
