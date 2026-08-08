<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import QuickStats from '../QuickStats.vue'
import IngestRunsTable from './IngestRunsTable.vue'
import DistilledItemsTable from './DistilledItemsTable.vue'
import { getHealth, getReady, getStats, getRuns, getRecentItems } from '../../api/reddit.js'

const health = ref(null)
const ready = ref(null)
const stats = ref(null)
const runs = ref([])
const runsTotal = ref(0)
const recentItems = ref([])
const recentItemsTotal = ref(0)
const loading = ref(true)
const healthError = ref(null)
const readyError = ref(null)
const statsError = ref(null)
const runsError = ref(null)
const itemsError = ref(null)
const lastRefreshedAt = ref(null)

let refreshTimer = null

function num(v) {
  return v != null ? Number(v).toLocaleString() : '—'
}

function sumNumbersDeep(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (!value || typeof value !== 'object') return 0

  return Object.values(value).reduce((acc, child) => acc + sumNumbersDeep(child), 0)
}

function boolStatus(v) {
  if (v === true) return { text: 'OK', color: 'success' }
  if (v === false) return { text: 'FAILED', color: 'error' }
  return { text: 'UNKNOWN', color: 'grey' }
}

const healthStatus = computed(() => boolStatus(health.value?.ok ?? health.value?.healthy ?? health.value?.status === 'ok'))
const readyStatus = computed(() => boolStatus(ready.value?.ok ?? ready.value?.ready ?? ready.value?.status === 'ok'))

const kpis = computed(() => {
  const stateBreakdown =
    stats.value?.items_by_state ??
    stats.value?.state_breakdown ??
    stats.value?.process_state_breakdown ??
    {}

  const emissionsTotal =
    stats.value?.emission_count ??
    stats.value?.emissions_count ??
    sumNumbersDeep(stats.value?.emissions)

  return [
    {
      label: 'Items Ingested',
      value: num(stats.value?.items_ingested ?? stats.value?.items_total ?? stats.value?.ingested_count),
    },
    {
      label: 'Extractions',
      value: num(stats.value?.extractions ?? stats.value?.extraction_count ?? stats.value?.extractions_count),
    },
    {
      label: 'Emissions',
      value: num(emissionsTotal),
    },
    {
      label: 'Failed Items',
      value: num(stateBreakdown.failed ?? stats.value?.failed_count),
      color: (stateBreakdown.failed ?? stats.value?.failed_count ?? 0) > 0 ? 'stat-loss' : undefined,
    },
  ]
})

function isDistilledItem(item) {
  const state = String(item?.state ?? item?.process_state ?? item?.status ?? '').toLowerCase()
  return state === 'distilled' || state === 'done' || state === 'emitted' || Boolean(item?.distilled_at)
}

const distilledItems = computed(() => recentItems.value.filter(isDistilledItem))
const distilledItemsTotal = computed(() => distilledItems.value.length)

const subtitle = computed(() => {
  const lastFetched = stats.value?.last_fetched_at
  const lastRun = stats.value?.last_run
  const lastIngest = stats.value?.last_ingest_time ?? stats.value?.last_ingest_at
  const heartbeat = stats.value?.worker_heartbeat ?? stats.value?.worker_heartbeat_at

  if (!lastFetched && !lastRun && !lastIngest && !heartbeat) {
    return 'Cycle run activity for Reddit ingestion and processing workers'
  }

  const parts = []
  if (lastFetched) parts.push(`Last fetched: ${lastFetched}`)
  if (lastRun) parts.push(`Last run: ${lastRun}`)
  if (lastIngest) parts.push(`Last ingest: ${lastIngest}`)
  if (heartbeat) parts.push(`Worker heartbeat: ${heartbeat}`)
  return parts.join(' · ')
})

async function loadAll(silent = false) {
  if (!silent) loading.value = true
  try {
    const [h, r, s, cycleRuns, items] = await Promise.allSettled([
      getHealth(),
      getReady(),
      getStats(),
      getRuns({ pageSize: 100 }),
      getRecentItems({
        pageSize: 100,
        kind: 'post',
        includeSummary: true,
        includeCharCounts: true,
      }),
    ])

    health.value = h.status === 'fulfilled' ? h.value : null
    healthError.value = h.status === 'rejected' ? h.reason.message : null

    ready.value = r.status === 'fulfilled' ? r.value : null
    readyError.value = r.status === 'rejected' ? r.reason.message : null

    stats.value = s.status === 'fulfilled' ? s.value : null
    statsError.value = s.status === 'rejected' ? s.reason.message : null

    if (cycleRuns.status === 'fulfilled') {
      const ingestOnly = cycleRuns.value.items.filter(
        (item) => String(item?.run_type ?? '').toLowerCase() === 'ingest'
      )
      runs.value = ingestOnly
      runsTotal.value = ingestOnly.length
      runsError.value = null
    } else {
      runs.value = []
      runsTotal.value = 0
      runsError.value = cycleRuns.reason.message
    }

    if (items.status === 'fulfilled') {
      recentItems.value = items.value.items
      recentItemsTotal.value = items.value.total
      itemsError.value = null
    } else {
      recentItems.value = []
      recentItemsTotal.value = 0
      itemsError.value = items.reason.message
    }
  } finally {
    lastRefreshedAt.value = new Date().toISOString()
    loading.value = false
  }
}

onMounted(() => {
  loadAll()
  refreshTimer = setInterval(() => loadAll(true), 60000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <div>
    <div class="d-flex align-center ga-2 mb-4 flex-wrap">
      <v-chip :color="healthStatus.color" variant="tonal" size="small">Live: {{ healthStatus.text }}</v-chip>
      <v-chip :color="readyStatus.color" variant="tonal" size="small">Ready: {{ readyStatus.text }}</v-chip>
      <v-spacer />
      <v-btn variant="tonal" color="primary" :loading="loading" class="text-none" @click="loadAll()">
        Refresh
      </v-btn>
    </div>

    <v-alert v-if="healthError" type="warning" variant="tonal" density="compact" class="mb-2">
      Health probe failed: {{ healthError }}
    </v-alert>
    <v-alert v-if="readyError" type="warning" variant="tonal" density="compact" class="mb-2">
      Readiness probe failed: {{ readyError }}
    </v-alert>
    <v-alert v-if="statsError" type="warning" variant="tonal" density="compact" class="mb-4">
      Stats query failed: {{ statsError }}
    </v-alert>

    <QuickStats :stats="kpis" :loading="loading && !runs.length" class="mb-4" />

    <div class="text-body-2 text-medium-emphasis mb-3">{{ subtitle }}</div>

    <IngestRunsTable
      :items="runs"
      :total="runsTotal"
      :loading="loading"
      :error="runsError"
      :last-refreshed-at="lastRefreshedAt"
      @refresh="loadAll"
    />

    <DistilledItemsTable
      :items="distilledItems"
      :total="distilledItemsTotal"
      :loading="loading"
      :error="itemsError"
      :last-refreshed-at="lastRefreshedAt"
      @refresh="loadAll"
    />
  </div>
</template>
