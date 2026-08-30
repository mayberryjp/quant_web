<script setup>
import { computed, onMounted, ref } from 'vue'
import { getPaperStatus } from '../../api/streamingChart.js'

const statuses = ref([])
const loading = ref(true)
const error = ref(null)

// One row per replay (raw stream history), newest-first per the API order.
const rows = computed(() => {
  const out = []
  for (const entry of statuses.value) {
    for (const r of entry.replays ?? []) {
      out.push({ ticker: entry.ticker, ...r, _started: startedAt(r) })
    }
  }
  return out
})

const headers = [
  { title: 'Ticker', key: 'ticker', align: 'start' },
  { title: 'Replay ID', key: 'id', align: 'start' },
  { title: 'Interval', key: 'interval', align: 'start' },
  { title: 'Status', key: 'status', align: 'start' },
  { title: 'Progress', key: 'percent', align: 'end' },
  { title: 'Slices', key: 'total_slices', align: 'end' },
  { title: 'Started', key: '_started', align: 'start' },
]

function startedAt(item) {
  return item.started_at ?? item.created_at ?? item.submitted_at ?? null
}

const statusColor = {
  completed: 'success',
  running: 'info',
  failed: 'error',
  pending: 'warning',
}

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

async function load() {
  loading.value = true
  error.value = null
  try {
    statuses.value = await getPaperStatus()
  } catch (e) {
    error.value = e.message
    statuses.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <div class="text-body-2 text-medium-emphasis">
        Replay stream history (most-recent-first)
      </div>
      <v-spacer />
      <v-btn variant="tonal" color="primary" :loading="loading" class="text-none" @click="load">
        Refresh
      </v-btn>
    </div>

    <v-sheet rounded="lg" color="#090c10">
      <v-card-title class="d-flex align-center ga-2 px-4 py-3">
        <span class="text-h6 text-sm-h5 text-md-h4 table-title">Replay History</span>
        <v-chip color="primary" variant="tonal" size="small">{{ rows.length }}</v-chip>
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
        :items="rows"
        :loading="loading"
        :items-per-page="25"
        :sort-by="[{ key: '_started', order: 'desc' }]"
        no-data-text="No replays found"
      >
        <template #item.ticker="{ item }">
          <router-link :to="`/ticker/${item.ticker}`" class="font-weight-bold text-decoration-none">
            {{ item.ticker }}
          </router-link>
        </template>

        <template #item.id="{ item }">
          <span class="mono text-caption text-medium-emphasis" :title="item.id">{{ item.id ?? '—' }}</span>
        </template>

        <template #item.interval="{ item }">
          <v-chip v-if="item.interval" variant="tonal" size="x-small" label>{{ item.interval }}</v-chip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="chipColor(item.status)" variant="tonal" size="small" label>
            {{ (item.status ?? 'unknown').toUpperCase() }}
          </v-chip>
        </template>

        <template #item.percent="{ item }">
          <span v-if="item.percent != null" class="mono">{{ Number(item.percent).toFixed(1) }}%</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.total_slices="{ item }">
          <span class="mono">{{ num(item.total_slices) }}</span>
        </template>

        <template #item._started="{ item }">
          <span class="text-caption text-medium-emphasis mono text-no-wrap">{{ fmtDate(item._started) }}</span>
        </template>
      </v-data-table>
    </v-sheet>
  </div>
</template>
