<script setup>
import { ref, reactive, computed, onMounted } from 'vue'

// Per-card state: { data, error, loading }
const cards = reactive({
  health: { data: null, error: null, loading: true },
  ready: { data: null, error: null, loading: true },
  sync: { data: null, error: null, loading: true },
  bars_health: { data: null, error: null, loading: true },
  bars_ready: { data: null, error: null, loading: true },
  bars_ingest: { data: null, error: null, loading: true },
  bars_coverage: { data: null, error: null, loading: true },
  bars_backfill: { data: null, error: null, loading: true },
})

const rawTimestamps = ref({ started_at: null, finished_at: null })
const barsRawTimestamps = ref({ started_at: null, finished_at: null })

const syncFlattened = computed(() => {
  const data = cards.sync.data
  if (!data) return null
  const raw = data.latest ?? data
  rawTimestamps.value = { started_at: raw.started_at, finished_at: raw.finished_at }
  return {
    status: data.status ?? '—',
    id: raw.id,
    vendor_code: raw.vendor?.code ?? '—',
    vendor_name: raw.vendor?.name ?? '—',
    endpoint: raw.endpoint,
    run_status: raw.run_status,
    started_at: formatDate(raw.started_at),
    finished_at: formatDate(raw.finished_at),
    records_seen: raw.records_seen?.toLocaleString() ?? '—',
    records_inserted: raw.records_inserted?.toLocaleString() ?? '—',
    records_failed: raw.records_failed?.toLocaleString() ?? '0',
    error_message: raw.error_message ?? 'none',
    raw_payload_count: raw.raw_payload_count?.toLocaleString() ?? '—',
  }
})

const ingestFlattened = computed(() => {
  const data = cards.bars_ingest.data
  if (!data) return null
  const raw = data.latest ?? data
  barsRawTimestamps.value = { started_at: raw.started_at, finished_at: raw.finished_at }
  return {
    status: data.status ?? '—',
    run_id: raw.run_id,
    vendor: raw.vendor ?? '—',
    mode: raw.mode ?? '—',
    run_status: raw.status ?? '—',
    from_date: raw.from_date ?? '—',
    to_date: raw.to_date ?? '—',
    symbols_requested: raw.symbols_requested?.toLocaleString() ?? '—',
    symbols_succeeded: raw.symbols_succeeded?.toLocaleString() ?? '—',
    symbols_failed: raw.symbols_failed?.toLocaleString() ?? '0',
    bars_upserted: raw.bars_upserted?.toLocaleString() ?? '—',
    errors: raw.errors?.toLocaleString() ?? '0',
    error_message: raw.error_message ?? 'none',
    duration_seconds: raw.duration_seconds ?? '—',
    started_at: formatDate(raw.started_at),
    finished_at: formatDate(raw.finished_at),
  }
})

const dateRangeFlattened = computed(() => {
  const data = cards.bars_coverage.data
  if (!data) return null
  return {
    first_date: data.first_date ?? '—',
    last_date: data.last_date ?? '—',
    total_bars: data.total_bars?.toLocaleString() ?? '—',
    unique_days: data.unique_days?.toLocaleString() ?? '—',
  }
})

const backfillFlattened = computed(() => {
  const data = cards.bars_backfill.data
  if (!data) return null
  return {
    from_date: data.from_date ?? '—',
    to_date: data.to_date ?? '—',
    weekdays_in_range: data.weekdays_in_range?.toLocaleString() ?? '—',
    active_symbols: data.active_symbols?.toLocaleString() ?? '—',
    total_bars_expected: data.total_bars_expected?.toLocaleString() ?? '—',
    total_bars_have: data.total_bars_have?.toLocaleString() ?? '—',
    total_bars_missing: data.total_bars_missing?.toLocaleString() ?? '—',
    percent_complete: data.percent_complete != null ? `${data.percent_complete.toFixed(1)}%` : '—',
    symbols_complete: data.symbols_complete?.toLocaleString() ?? '—',
    symbols_partial: data.symbols_partial?.toLocaleString() ?? '—',
    symbols_empty: data.symbols_empty?.toLocaleString() ?? '—',
  }
})

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

async function fetchCard(name, url) {
  const card = cards[name]
  card.loading = true
  card.error = null
  card.data = null
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    console.log(`[Health] ${name} response:`, json)
    card.data = json
  } catch (e) {
    clearTimeout(timeout)
    console.error(`[Health] ${name} error:`, e)
    card.error = e.name === 'AbortError' ? 'Timeout' : e.message
  } finally {
    card.loading = false
    console.log(`[Health] ${name} final state:`, { loading: card.loading, error: card.error, data: card.data })
  }
}

function loadAll() {
  fetchCard('health', '/api/quant_symbols/health')
  fetchCard('ready', '/api/quant_symbols/ready')
  fetchCard('sync', '/api/quant_symbols/sync/latest?vendor=massive&endpoint=/v3/reference/tickers')
  fetchCard('bars_health', '/api/quant_daily_bars/health')
  fetchCard('bars_ready', '/api/quant_daily_bars/ready')
  fetchCard('bars_ingest', '/api/quant_daily_bars/ingest/latest')
  fetchCard('bars_coverage', '/api/quant_daily_bars/bars/date-range')
  fetchCard('bars_backfill', '/api/quant_daily_bars/bars/backfill-progress?from_date=2025-06-01')
}

onMounted(loadAll)

function statusClass(val) {
  if (val === true || val === 'ok' || val === 'healthy' || val === 'ready' || val === 'succeeded') return 'status-ok'
  if (val === false || val === 'error' || val === 'unhealthy' || val === 'failed') return 'status-error'
  return ''
}

function isWithin24Hours(iso) {
  if (!iso) return false
  try {
    return (Date.now() - new Date(iso).getTime()) < 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

function syncValClass(key, val, timestamps) {
  if (key === 'run_status') return statusClass(val)
  if (key === 'started_at' || key === 'finished_at') {
    const raw = timestamps?.value ?? timestamps
    return isWithin24Hours(raw[key]) ? 'status-ok' : 'status-error'
  }
  if (key === 'records_failed' || key === 'symbols_failed' || key === 'errors') return val !== '0' ? 'status-error' : 'status-ok'
  if (key === 'error_message') return val !== 'none' ? 'status-error' : 'status-ok'
  return ''
}

function backfillValClass(key, val) {
  if (key === 'percent_complete') {
    const n = parseFloat(val)
    if (n >= 95) return 'status-ok'
    if (n >= 50) return 'status-warn'
    return 'status-error'
  }
  if (key === 'symbols_empty') return val !== '0' ? 'status-error' : 'status-ok'
  if (key === 'symbols_complete') return 'status-ok'
  if (key === 'total_bars_missing') return val !== '0' ? 'status-warn' : 'status-ok'
  return ''
}
</script>

<template>
  <div class="health-page">
    <div class="health-toolbar">
      <h2>System Health</h2>
      <button class="refresh-btn" @click="loadAll">
        ↻ Refresh
      </button>
    </div>

    <div class="health-grid">
      <!-- Health -->
      <div class="health-card">
        <h3>quant_symbols/health</h3>
        <div v-if="cards.health.loading" class="loading-card">Loading…</div>
        <div v-else-if="cards.health.error" class="error">{{ cards.health.error }}</div>
        <div v-else-if="cards.health.data" class="entries">
          <div v-for="(val, key) in cards.health.data" :key="key" class="entry">
            <span class="entry-key">{{ key }}</span>
            <span class="entry-val" :class="statusClass(val)">{{ val }}</span>
          </div>
        </div>
        <div v-else class="empty">No data</div>
      </div>

      <!-- Ready -->
      <div class="health-card">
        <h3>quant_symbols/ready</h3>
        <div v-if="cards.ready.loading" class="loading-card">Loading…</div>
        <div v-else-if="cards.ready.error" class="error">{{ cards.ready.error }}</div>
        <div v-else-if="cards.ready.data" class="entries">
          <div v-for="(val, key) in cards.ready.data" :key="key" class="entry">
            <span class="entry-key">{{ key }}</span>
            <span class="entry-val" :class="statusClass(val)">{{ val }}</span>
          </div>
        </div>
        <div v-else class="empty">No data</div>
      </div>

      <!-- Sync Latest -->
      <div class="health-card">
        <h3>quant_symbols/sync/latest</h3>
        <div v-if="cards.sync.loading" class="loading-card">Loading…</div>
        <div v-else-if="cards.sync.error" class="error">{{ cards.sync.error }}</div>
        <div v-else-if="syncFlattened" class="entries">
          <div v-for="(val, key) in syncFlattened" :key="key" class="entry">
            <span class="entry-key">{{ key }}</span>
            <span class="entry-val" :class="syncValClass(key, val, rawTimestamps)">{{ val }}</span>
          </div>
        </div>
        <div v-else class="empty">No data</div>
      </div>

      <!-- quant_bars section -->
      <div class="section-divider wide"></div>

      <!-- Bars Health -->
      <div class="health-card">
        <h3>quant_daily_bars/health</h3>
        <div v-if="cards.bars_health.loading" class="loading-card">Loading…</div>
        <div v-else-if="cards.bars_health.error" class="error">{{ cards.bars_health.error }}</div>
        <div v-else-if="cards.bars_health.data" class="entries">
          <div v-for="(val, key) in cards.bars_health.data" :key="key" class="entry">
            <span class="entry-key">{{ key }}</span>
            <span class="entry-val" :class="statusClass(val)">{{ val }}</span>
          </div>
        </div>
        <div v-else class="empty">No data</div>
      </div>

      <!-- Bars Date Range -->
      <div class="health-card">
        <h3>quant_daily_bars/bars/date-range</h3>
        <div v-if="cards.bars_coverage.loading" class="loading-card">Loading…</div>
        <div v-else-if="cards.bars_coverage.error" class="error">{{ cards.bars_coverage.error }}</div>
        <div v-else-if="dateRangeFlattened" class="entries">
          <div v-for="(val, key) in dateRangeFlattened" :key="key" class="entry">
            <span class="entry-key">{{ key }}</span>
            <span class="entry-val">{{ val }}</span>
          </div>
        </div>
        <div v-else class="empty">No data</div>
      </div>

      <!-- Bars Ready -->
      <div class="health-card">
        <h3>quant_daily_bars/ready</h3>
        <div v-if="cards.bars_ready.loading" class="loading-card">Loading…</div>
        <div v-else-if="cards.bars_ready.error" class="error">{{ cards.bars_ready.error }}</div>
        <div v-else-if="cards.bars_ready.data" class="entries">
          <template v-for="(val, key) in cards.bars_ready.data" :key="key">
            <template v-if="val && typeof val === 'object'">
              <div class="entry entry-section-header">
                <span class="entry-key"><strong>{{ key }}</strong></span>
              </div>
              <div v-for="(subVal, subKey) in val" :key="key + '.' + subKey" class="entry entry-nested">
                <span class="entry-key">{{ subKey }}</span>
                <span class="entry-val" :class="statusClass(subVal)">{{ subVal ?? '—' }}</span>
              </div>
            </template>
            <div v-else class="entry">
              <span class="entry-key">{{ key }}</span>
              <span class="entry-val" :class="statusClass(val)">{{ val }}</span>
            </div>
          </template>
        </div>
        <div v-else class="empty">No data</div>
      </div>

      <!-- Bars Ingest Latest -->
      <div class="health-card">
        <h3>quant_daily_bars/ingest/latest</h3>
        <div v-if="cards.bars_ingest.loading" class="loading-card">Loading…</div>
        <div v-else-if="cards.bars_ingest.error" class="error">{{ cards.bars_ingest.error }}</div>
        <div v-else-if="ingestFlattened" class="entries">
          <div v-for="(val, key) in ingestFlattened" :key="key" class="entry">
            <span class="entry-key">{{ key }}</span>
            <span class="entry-val" :class="syncValClass(key, val, barsRawTimestamps)">{{ val }}</span>
          </div>
        </div>
        <div v-else class="empty">No data</div>
      </div>

      <!-- Bars Backfill Progress -->
      <div class="health-card">
        <h3>quant_daily_bars/bars/backfill-progress</h3>
        <div v-if="cards.bars_backfill.loading" class="loading-card">Loading…</div>
        <div v-else-if="cards.bars_backfill.error" class="error">{{ cards.bars_backfill.error }}</div>
        <div v-else-if="backfillFlattened" class="entries">
          <div v-for="(val, key) in backfillFlattened" :key="key" class="entry">
            <span class="entry-key">{{ key }}</span>
            <span class="entry-val" :class="backfillValClass(key, val)">{{ val }}</span>
          </div>
        </div>
        <div v-else class="empty">No data</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.health-page {
  padding: 24px;
  flex: 1;
}

.health-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.health-toolbar h2 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.refresh-btn {
  padding: 6px 16px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 13px;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--bg-card);
}

.loading {
  text-align: center;
  color: var(--text-muted);
  padding: 48px 0;
}

.loading-card {
  color: var(--text-muted);
  font-size: 13px;
  padding: 8px;
}

.health-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.health-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  text-align: left;
}

.health-card.wide {
  grid-column: 1 / -1;
}

.section-divider {
  border-top: 1px solid var(--border);
  margin: 8px 0;
}

.section-divider.wide {
  grid-column: 1 / -1;
}

.health-card h3 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
  font-family: monospace;
}

.entries {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 6px;
  border-radius: 4px;
  background: var(--bg-secondary);
}

.entry-section-header {
  margin-top: 4px;
  background: transparent;
  border-bottom: 1px solid var(--border);
  border-radius: 0;
}

.entry-nested {
  padding-left: 16px;
}

.entry-key {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.entry-val {
  font-size: 12px;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  word-break: break-all;
  max-width: 60%;
  text-align: right;
}

.status-ok {
  color: var(--green);
}

.status-warn {
  color: var(--yellow, #e5a100);
}

.status-error {
  color: var(--red);
}

.error {
  color: var(--red);
  font-size: 13px;
  padding: 8px;
  background: var(--red-bg);
  border-radius: 4px;
}

.empty {
  color: var(--text-muted);
  font-size: 13px;
}

@media (max-width: 900px) {
  .health-grid {
    grid-template-columns: 1fr;
  }
}
</style>
