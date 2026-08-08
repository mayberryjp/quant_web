<script setup>
import { computed, onMounted, ref } from 'vue'
import { getLatestMomentumRun, getMomentumRuns } from '../../api/momentum.js'

const runs = ref([])
const total = ref(0)
const latestRun = ref(null)
const loading = ref(true)
const error = ref(null)

const headers = [
  { title: 'Run ID', key: 'id', align: 'start' },
  { title: 'Run Date', key: 'run_date', align: 'start' },
  { title: 'As-Of', key: 'as_of_bar_date', align: 'start' },
  { title: 'Status', key: 'status', align: 'start' },
  { title: 'Rule', key: 'momentum_rule', align: 'start' },
  { title: 'Adjustment', key: 'adjustment_type', align: 'start' },
  { title: 'Started', key: 'started_at', align: 'start' },
  { title: 'Finished', key: 'finished_at', align: 'start' },
  { title: 'Duration', key: 'duration_seconds', align: 'end' },
  { title: 'Requested', key: 'symbols_requested', align: 'end' },
  { title: 'Computed', key: 'symbols_computed', align: 'end' },
  { title: 'Skipped', key: 'symbols_skipped', align: 'end' },
  { title: 'Failed', key: 'symbols_failed', align: 'end' },
  { title: 'Flagged', key: 'momentum_flagged', align: 'end' },
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
      getMomentumRuns({ limit: 100 }),
      getLatestMomentumRun(),
    ])

    if (runList.status === 'fulfilled') {
      runs.value = runList.value.runs
      total.value = runList.value.count
    } else {
      runs.value = []
      total.value = 0
      error.value = runList.reason?.message || 'Failed to load momentum runs'
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
        Momentum ingestion runs · {{ latestSummary }}
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
        no-data-text="No momentum runs found"
      >
        <template #item.id="{ item }">
          <span class="mono font-weight-medium">#{{ item.id }}</span>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="chipColor(item.status)" variant="tonal" size="small" label>
            {{ (item.status ?? 'unknown').toUpperCase() }}
          </v-chip>
        </template>

        <template #item.run_date="{ item }">
          <span class="mono text-caption text-medium-emphasis">{{ item.run_date ?? '—' }}</span>
        </template>

        <template #item.as_of_bar_date="{ item }">
          <span class="mono text-caption text-medium-emphasis">{{ item.as_of_bar_date ?? '—' }}</span>
        </template>

        <template #item.momentum_rule="{ item }">
          <v-chip variant="tonal" size="small" label>{{ (item.momentum_rule ?? '—').toUpperCase() }}</v-chip>
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

        <template #item.symbols_computed="{ item }">
          <span class="mono text-success">{{ num(item.symbols_computed) }}</span>
        </template>

        <template #item.symbols_skipped="{ item }">
          <span class="mono text-medium-emphasis">{{ num(item.symbols_skipped) }}</span>
        </template>

        <template #item.symbols_failed="{ item }">
          <span class="mono" :class="(item.symbols_failed ?? 0) > 0 ? 'text-error font-weight-bold' : 'text-medium-emphasis'">
            {{ num(item.symbols_failed) }}
          </span>
        </template>

        <template #item.momentum_flagged="{ item }">
          <span class="mono" :class="(item.momentum_flagged ?? 0) > 0 ? 'text-warning font-weight-medium' : 'text-medium-emphasis'">
            {{ num(item.momentum_flagged) }}
          </span>
        </template>
      </v-data-table>
    </v-sheet>
  </div>
</template>
