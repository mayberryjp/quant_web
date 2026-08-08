<script setup>
import { computed, onMounted, ref } from 'vue'
import { getIndicatorRuns, getLatestIndicatorRun } from '../../api/indicators.js'

const runs = ref([])
const total = ref(0)
const latestRun = ref(null)
const loading = ref(true)
const error = ref(null)

const headers = [
  { title: 'Run ID', key: 'id', align: 'start' },
  { title: 'Mode', key: 'mode', align: 'start' },
  { title: 'Status', key: 'status', align: 'start' },
  { title: 'Adjustment', key: 'adjustment_type', align: 'start' },
  { title: 'Window', key: 'window', align: 'start', sortable: false },
  { title: 'Started', key: 'started_at', align: 'start' },
  { title: 'Finished', key: 'finished_at', align: 'start' },
  { title: 'Duration', key: 'duration_seconds', align: 'end' },
  { title: 'Requested', key: 'symbols_requested', align: 'end' },
  { title: 'Succeeded', key: 'symbols_succeeded', align: 'end' },
  { title: 'Failed', key: 'symbols_failed', align: 'end' },
  { title: 'Indicators', key: 'indicators_run', align: 'end' },
  { title: 'Values', key: 'values_upserted', align: 'end' },
  { title: 'Errors', key: 'errors', align: 'end' },
]

const statusColor = {
  completed: 'success',
  ok: 'success',
  failed: 'error',
  running: 'info',
}

const latestSummary = computed(() => {
  if (!latestRun.value) return 'No run data yet'
  const status = latestRun.value.status ? ` · ${String(latestRun.value.status).toUpperCase()}` : ''
  return `Latest run #${latestRun.value.id ?? '—'}${status}`
})

function chipColor(status) {
  return statusColor[String(status || '').toLowerCase()] ?? 'grey'
}

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

function num(v) {
  return v != null ? Number(v).toLocaleString() : '—'
}

function duration(item) {
  let secs = item.duration_seconds != null ? Number(item.duration_seconds) : null
  if ((secs == null || Number.isNaN(secs)) && item.started_at && item.finished_at) {
    secs = (new Date(item.finished_at) - new Date(item.started_at)) / 1000
  }
  if (secs == null || Number.isNaN(secs)) return '—'
  if (secs < 60) return `${secs.toFixed(1)}s`
  if (secs < 3600) {
    const mins = Math.floor(secs / 60)
    return `${mins}m ${Math.round(secs % 60)}s`
  }
  const hrs = Math.floor(secs / 3600)
  const mins = Math.floor((secs % 3600) / 60)
  return `${hrs}h ${mins}m`
}

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    const [runList, latest] = await Promise.allSettled([
      getIndicatorRuns({ limit: 100 }),
      getLatestIndicatorRun(),
    ])

    if (runList.status === 'fulfilled') {
      runs.value = runList.value.runs
      total.value = runList.value.count
    } else {
      runs.value = []
      total.value = 0
      error.value = runList.reason?.message || 'Failed to load indicator runs'
    }

    latestRun.value = latest.status === 'fulfilled' ? latest.value : null
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <div class="text-body-2 text-medium-emphasis">
        Indicator compute ingestion runs · {{ latestSummary }}
      </div>
      <v-spacer />
      <v-btn variant="tonal" color="primary" :loading="loading" class="text-none" @click="loadAll">
        Refresh
      </v-btn>
    </div>

    <v-sheet rounded="lg" color="#090c10">
      <v-card-title class="d-flex align-center ga-2 px-4 py-3">
        <span class="text-h6 text-sm-h5 text-md-h4 table-title">Ingestion Runs</span>
        <v-chip color="primary" variant="tonal" size="small">{{ total }}</v-chip>
      </v-card-title>
      <v-divider />

      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="ma-4">
        {{ error }}
      </v-alert>

      <v-data-table
        v-else
        class="app-table"
        density="compact"
        mobile-breakpoint="md"
        :headers="headers"
        :items="runs"
        :loading="loading"
        item-value="id"
        :items-per-page="10"
        :sort-by="[{ key: 'id', order: 'desc' }]"
        no-data-text="No indicator runs found"
      >
        <template #item.id="{ item }">
          <span class="mono font-weight-medium">#{{ item.id }}</span>
        </template>

        <template #item.mode="{ item }">
          <v-chip variant="tonal" size="small" label>{{ (item.mode ?? '—').toUpperCase() }}</v-chip>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="chipColor(item.status)" variant="tonal" size="small" label>
            {{ (item.status ?? 'unknown').toUpperCase() }}
          </v-chip>
        </template>

        <template #item.window="{ item }">
          <span class="mono text-caption text-medium-emphasis">
            {{ item.requested_start_date ?? '—' }} → {{ item.requested_end_date ?? '—' }}
          </span>
        </template>

        <template #item.started_at="{ item }">
          <span class="text-caption text-medium-emphasis mono text-no-wrap">{{ fmtDate(item.started_at) }}</span>
        </template>

        <template #item.finished_at="{ item }">
          <span class="text-caption text-medium-emphasis mono text-no-wrap">{{ fmtDate(item.finished_at) }}</span>
        </template>

        <template #item.duration_seconds="{ item }">
          <span class="mono text-caption">{{ duration(item) }}</span>
        </template>

        <template #item.symbols_requested="{ item }">
          <span class="mono">{{ num(item.symbols_requested) }}</span>
        </template>

        <template #item.symbols_succeeded="{ item }">
          <span class="mono text-success">{{ num(item.symbols_succeeded) }}</span>
        </template>

        <template #item.symbols_failed="{ item }">
          <span class="mono" :class="(item.symbols_failed ?? 0) > 0 ? 'text-error font-weight-bold' : 'text-medium-emphasis'">
            {{ num(item.symbols_failed) }}
          </span>
        </template>

        <template #item.indicators_run="{ item }">
          <span class="mono">{{ num(item.indicators_run) }}</span>
        </template>

        <template #item.values_upserted="{ item }">
          <span class="mono text-success font-weight-medium">{{ num(item.values_upserted) }}</span>
        </template>

        <template #item.errors="{ item }">
          <span class="mono" :class="(item.errors ?? 0) > 0 ? 'text-error font-weight-bold' : 'text-medium-emphasis'">
            {{ num(item.errors) }}
          </span>
        </template>
      </v-data-table>
    </v-sheet>
  </div>
</template>
