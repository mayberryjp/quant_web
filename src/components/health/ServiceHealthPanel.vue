<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import HealthCard from '../HealthCard.vue'

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
    trading_days_in_range: data.trading_days_in_range?.toLocaleString() ?? '—',
    active_symbols: data.active_symbols?.toLocaleString() ?? '—',
    symbols_queried: data.symbols_queried?.toLocaleString() ?? '—',
    symbols_not_queried: data.symbols_not_queried?.toLocaleString() ?? '—',
    symbols_with_bars: data.symbols_with_bars?.toLocaleString() ?? '—',
    symbols_no_bars: data.symbols_no_bars?.toLocaleString() ?? '—',
    total_bars_ingested: data.total_bars_ingested?.toLocaleString() ?? '—',
    percent_symbols_queried: data.percent_symbols_queried != null ? `${data.percent_symbols_queried.toFixed(1)}%` : '—',
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
  if (val === true || val === 'ok' || val === 'healthy' || val === 'ready' || val === 'succeeded') return 'text-success'
  if (val === false || val === 'error' || val === 'unhealthy' || val === 'failed') return 'text-error'
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
    return isWithin24Hours(raw[key]) ? 'text-success' : 'text-error'
  }
  if (key === 'records_failed' || key === 'symbols_failed' || key === 'errors') return val !== '0' ? 'text-error' : 'text-success'
  if (key === 'error_message') return val !== 'none' ? 'text-error' : 'text-success'
  return ''
}

function backfillValClass(key, val) {
  if (key === 'percent_symbols_queried') {
    const n = parseFloat(val)
    if (n >= 95) return 'text-success'
    if (n >= 50) return 'text-warning'
    return 'text-error'
  }
  if (key === 'symbols_no_bars') return val !== '0' ? 'text-error' : 'text-success'
  if (key === 'symbols_with_bars') return 'text-success'
  if (key === 'symbols_not_queried') return val !== '0' ? 'text-warning' : 'text-success'
  return ''
}
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <div class="text-body-2 text-medium-emphasis">
        Service liveness, readiness, and ingestion status across services
      </div>
      <v-spacer />
      <v-btn variant="tonal" color="primary" class="text-none" @click="loadAll">Refresh</v-btn>
    </div>

    <v-row>
      <v-col cols="12" md="6">
        <HealthCard
          title="quant_symbols/health"
          :loading="cards.health.loading"
          :error="cards.health.error"
          :data="cards.health.data"
          :val-class="(k, v) => statusClass(v)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <HealthCard
          title="quant_symbols/ready"
          :loading="cards.ready.loading"
          :error="cards.ready.error"
          :data="cards.ready.data"
          :val-class="(k, v) => statusClass(v)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <HealthCard
          title="quant_symbols/sync/latest"
          :loading="cards.sync.loading"
          :error="cards.sync.error"
          :data="syncFlattened"
          :val-class="(k, v) => syncValClass(k, v, rawTimestamps)"
        />
      </v-col>

      <v-col cols="12"><v-divider /></v-col>

      <v-col cols="12" md="6">
        <HealthCard
          title="quant_daily_bars/health"
          :loading="cards.bars_health.loading"
          :error="cards.bars_health.error"
          :data="cards.bars_health.data"
          :val-class="(k, v) => statusClass(v)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <HealthCard
          title="quant_daily_bars/bars/date-range"
          :loading="cards.bars_coverage.loading"
          :error="cards.bars_coverage.error"
          :data="dateRangeFlattened"
        />
      </v-col>
      <v-col cols="12" md="6">
        <HealthCard
          title="quant_daily_bars/ready"
          :loading="cards.bars_ready.loading"
          :error="cards.bars_ready.error"
          :data="cards.bars_ready.data"
          :val-class="(k, v) => statusClass(v)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <HealthCard
          title="quant_daily_bars/ingest/latest"
          :loading="cards.bars_ingest.loading"
          :error="cards.bars_ingest.error"
          :data="ingestFlattened"
          :val-class="(k, v) => syncValClass(k, v, barsRawTimestamps)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <HealthCard
          title="quant_daily_bars/bars/backfill-progress"
          :loading="cards.bars_backfill.loading"
          :error="cards.bars_backfill.error"
          :data="backfillFlattened"
          :val-class="backfillValClass"
        />
      </v-col>
    </v-row>
  </div>
</template>
