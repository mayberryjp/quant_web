<script setup>
import { computed, onMounted, ref } from 'vue'
import { getPaperStatus } from '../../api/streamingChart.js'

const statuses = ref([])
const loading = ref(true)
const error = ref(null)

// Flatten to one row per (ticker, interval) fetch; pair each with the ticker's
// most recent replay for at-a-glance progress.
const rows = computed(() => {
  const out = []
  for (const entry of statuses.value) {
    const latestReplay = (entry.replays ?? [])[0] ?? null
    const fetches = entry.fetches ?? []
    if (fetches.length === 0) {
      out.push({ ticker: entry.ticker, interval: null, latestReplay })
      continue
    }
    for (const f of fetches) {
      out.push({ ticker: entry.ticker, ...f, latestReplay })
    }
  }
  return out
})

const headers = [
  { title: 'Ticker', key: 'ticker', align: 'start' },
  { title: 'Interval', key: 'interval', align: 'start' },
  { title: 'Bars', key: 'bars', align: 'end' },
  { title: 'First Bar', key: 'first_bar', align: 'start' },
  { title: 'Last Bar', key: 'last_bar', align: 'start' },
  { title: 'Last Fetched', key: 'last_fetched_at', align: 'start' },
  { title: 'Replay', key: 'replay', align: 'start' },
  { title: 'Progress', key: 'percent', align: 'end' },
]

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
        Per-ticker fetch &amp; replay status
      </div>
      <v-spacer />
      <v-btn variant="tonal" color="primary" :loading="loading" class="text-none" @click="load">
        Refresh
      </v-btn>
    </div>

    <v-sheet rounded="lg" color="#090c10">
      <v-card-title class="d-flex align-center ga-2 px-4 py-3">
        <span class="text-h6 text-sm-h5 text-md-h4 table-title">Paper Status</span>
        <v-chip color="primary" variant="tonal" size="small">{{ statuses.length }}</v-chip>
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
        no-data-text="No paper status found"
      >
        <template #item.ticker="{ item }">
          <router-link :to="`/ticker/${item.ticker}`" class="font-weight-bold text-decoration-none">
            {{ item.ticker }}
          </router-link>
        </template>

        <template #item.interval="{ item }">
          <v-chip v-if="item.interval" variant="tonal" size="x-small" label>{{ item.interval }}</v-chip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.bars="{ item }">
          <span class="mono">{{ num(item.bars) }}</span>
        </template>

        <template #item.first_bar="{ item }">
          <span class="text-caption text-medium-emphasis mono text-no-wrap">{{ fmtDate(item.first_bar) }}</span>
        </template>

        <template #item.last_bar="{ item }">
          <span class="text-caption text-medium-emphasis mono text-no-wrap">{{ fmtDate(item.last_bar) }}</span>
        </template>

        <template #item.last_fetched_at="{ item }">
          <span class="text-caption text-medium-emphasis mono text-no-wrap">{{ fmtDate(item.last_fetched_at) }}</span>
        </template>

        <template #item.replay="{ item }">
          <v-chip v-if="item.latestReplay" :color="chipColor(item.latestReplay.status)" variant="tonal" size="small" label>
            {{ (item.latestReplay.status ?? 'unknown').toUpperCase() }}
          </v-chip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.percent="{ item }">
          <span v-if="item.latestReplay?.percent != null" class="mono">
            {{ Number(item.latestReplay.percent).toFixed(1) }}%
          </span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
      </v-data-table>
    </v-sheet>
  </div>
</template>
