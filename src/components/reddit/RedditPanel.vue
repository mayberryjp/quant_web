<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import QuickStats from '../QuickStats.vue'
import DistilledItemsTable from './DistilledItemsTable.vue'
import { deleteItem, getHealth, getReady, getRecentItems, getStats, restartItem } from '../../api/reddit.js'

const health = ref(null)
const ready = ref(null)
const stats = ref(null)
const recentItems = ref([])
const recentItemsTotal = ref(0)
const loading = ref(true)
const healthError = ref(null)
const readyError = ref(null)
const statsError = ref(null)
const itemsError = ref(null)
const lastRefreshedAt = ref(null)
const restarting = ref([])
const deleting = ref([])

let refreshTimer = null

function num(v) {
  return v != null ? Number(v).toLocaleString() : '—'
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

  return [
    {
      label: 'Items Ingested',
      value: num(stats.value?.items_ingested ?? stats.value?.items_total ?? stats.value?.ingested_count),
    },
    {
      label: 'New Items',
      value: num(stateBreakdown.new),
    },
    {
      label: 'Distilled Items',
      value: num(stateBreakdown.distilled),
    },
    {
      label: 'Failed Items',
      value: num(stateBreakdown.failed ?? stats.value?.failed_count),
      color: (stateBreakdown.failed ?? stats.value?.failed_count ?? 0) > 0 ? 'stat-loss' : undefined,
    },
  ]
})

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

function itemKey(item) {
  return item?.fullname ?? item?.id ?? item?.name ?? item?.permalink ?? null
}

async function handleRestart(item) {
  const key = itemKey(item)
  if (!key || restarting.value.includes(key)) return

  restarting.value = [...restarting.value, key]
  try {
    await restartItem(key)
    await loadAll(true)
  } finally {
    restarting.value = restarting.value.filter((value) => value !== key)
  }
}

async function handleDelete(item) {
  const key = itemKey(item)
  if (!key || deleting.value.includes(key)) return

  deleting.value = [...deleting.value, key]
  try {
    await deleteItem(key)
    await loadAll(true)
  } finally {
    deleting.value = deleting.value.filter((value) => value !== key)
  }
}

async function loadAll(silent = false) {
  if (!silent) loading.value = true
  try {
    const [h, r, s, items] = await Promise.allSettled([
      getHealth(),
      getReady(),
      getStats(),
      getRecentItems({
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

    <QuickStats :stats="kpis" :loading="loading && !recentItems.length" class="mb-4" />

    <div class="text-body-2 text-medium-emphasis mb-3">{{ subtitle }}</div>

    <DistilledItemsTable
      :items="recentItems"
      :total="recentItemsTotal"
      :loading="loading"
      :error="itemsError"
      :last-refreshed-at="lastRefreshedAt"
      :restarting="restarting"
      :deleting="deleting"
      @refresh="loadAll"
      @restart="handleRestart"
      @delete="handleDelete"
    />
  </div>
</template>
