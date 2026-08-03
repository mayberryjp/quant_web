<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import QuickStats from '../QuickStats.vue'
import IngestRunsTable from './IngestRunsTable.vue'
import EpisodesTable from './EpisodesTable.vue'
import { getStats, getRuns, getEpisodes, triggerRun, requeueEpisode, deleteEpisode } from '../../api/youtube.js'

const stats = ref(null)
const runs = ref([])
const runsTotal = ref(0)
const episodes = ref([])
const episodesTotal = ref(0)
const failedTotal = ref(null)
const loading = ref(true)
const statsError = ref(null)
const runsError = ref(null)
const episodesError = ref(null)
const triggering = ref(false)
const restarting = ref([])
const deleting = ref([])
const snackbar = ref({ show: false, text: '', color: 'success' })
const lastRefreshedAt = ref(null)

let refreshTimer = null

function num(v) {
  return v != null ? Number(v).toLocaleString() : '—'
}

const kpis = computed(() => [
  { label: 'Total Runs', value: num(stats.value?.total_runs ?? runsTotal.value) },
  { label: 'Episodes', value: num(stats.value?.episodes_total ?? episodesTotal.value) },
  { label: 'Failed Runs', value: num(failedTotal.value), color: failedTotal.value ? 'stat-loss' : undefined },
])

const lastRun = computed(() => {
  const date = stats.value?.last_run_date
  const status = stats.value?.last_run_status
  if (!date) return 'No runs yet'
  return status ? `Last run ${date} · ${status}` : `Last run ${date}`
})

async function loadAll(silent = false) {
  if (!silent) loading.value = true
  try {
    const [s, r, e] = await Promise.allSettled([
      getStats(),
      getRuns({ pageSize: 100 }),
      getEpisodes({ pageSize: 100 }),
    ])

    stats.value = s.status === 'fulfilled' ? s.value : null
    statsError.value = s.status === 'rejected' ? s.reason.message : null

    if (r.status === 'fulfilled') {
      runs.value = r.value.items
      runsTotal.value = r.value.total
      failedTotal.value = r.value.items.filter((i) => i.failures > 0).length || null
    } else {
      runs.value = []
      runsTotal.value = 0
      runsError.value = r.reason.message
    }

    if (e.status === 'fulfilled') {
      episodes.value = e.value.items
      episodesTotal.value = e.value.total
    } else {
      episodes.value = []
      episodesTotal.value = 0
      episodesError.value = e.reason.message
    }
  } finally {
    lastRefreshedAt.value = new Date().toISOString()
    loading.value = false
  }
}

async function handleTrigger() {
  if (triggering.value) return
  triggering.value = true
  try {
    await triggerRun()
    snackbar.value = { show: true, text: 'Ingestion run triggered', color: 'success' }
    await loadAll()
  } catch (e) {
    snackbar.value = { show: true, text: `Trigger failed: ${e.message}`, color: 'error' }
  } finally {
    triggering.value = false
  }
}

async function requeue(item) {
  const videoId = item?.video_id
  if (!videoId || restarting.value.includes(videoId)) return
  restarting.value = [...restarting.value, videoId]
  try {
    await requeueEpisode(videoId)
    snackbar.value = { show: true, text: `Requeued episode ${videoId}`, color: 'success' }
    await loadAll()
  } catch (e) {
    snackbar.value = { show: true, text: `Requeue failed: ${e.message}`, color: 'error' }
  } finally {
    restarting.value = restarting.value.filter((x) => x !== videoId)
  }
}

async function remove(item) {
  const id = item?.id
  if (id == null || deleting.value.includes(id)) return
  deleting.value = [...deleting.value, id]
  try {
    await deleteEpisode(id)
    snackbar.value = { show: true, text: `Deleted episode #${id}`, color: 'success' }
    await loadAll()
  } catch (e) {
    snackbar.value = { show: true, text: `Delete failed: ${e.message}`, color: 'error' }
  } finally {
    deleting.value = deleting.value.filter((x) => x !== id)
  }
}

onMounted(() => {
  loadAll()
  refreshTimer = setInterval(() => loadAll(true), 60000)
})

onUnmounted(() => clearInterval(refreshTimer))
</script>

<template>
  <div>
    <QuickStats
      :kpis="kpis"
      :subtitle="lastRun"
      :error="statsError"
      :loading="loading && !runs.length"
    />

    <div class="d-flex justify-end mb-3">
      <v-btn
        color="primary"
        variant="tonal"
        size="small"
        prepend-icon="mdi-play-circle-outline"
        :loading="triggering"
        @click="handleTrigger"
      >
        Trigger Run
      </v-btn>
    </div>

    <IngestRunsTable
      :items="runs"
      :total="runsTotal"
      :loading="loading"
      :error="runsError"
      :last-refreshed-at="lastRefreshedAt"
      @refresh="loadAll()"
    />

    <div class="mt-6">
      <EpisodesTable
        :items="episodes"
        :total="episodesTotal"
        :loading="loading"
        :error="episodesError"
        :restarting="restarting"
        :deleting="deleting"
        :last-refreshed-at="lastRefreshedAt"
        @refresh="loadAll()"
        @restart="requeue"
        @delete="remove"
      />
    </div>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>
