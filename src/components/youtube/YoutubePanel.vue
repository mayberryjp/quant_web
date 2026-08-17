<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import QuickStats from '../QuickStats.vue'
import EpisodesTable from './EpisodesTable.vue'
import { getSummary, getEpisodes, requeueEpisode, deleteEpisode } from '../../api/youtube.js'

const summary = ref(null)
const episodes = ref([])
const episodesTotal = ref(0)
const loading = ref(true)
const summaryError = ref(null)
const episodesError = ref(null)
const restarting = ref([])
const deleting = ref([])
const snackbar = ref({ show: false, text: '', color: 'success' })
const lastRefreshedAt = ref(null)

let refreshTimer = null

function num(v) {
  return v != null ? Number(v).toLocaleString() : '—'
}

const kpis = computed(() => [
  { label: 'Discovered', value: num(summary.value?.episodes_discovered) },
  { label: 'Distilled', value: num(summary.value?.distilled) },
  { label: 'Transcript unavailable', value: num(summary.value?.transcript_unavailable), color: summary.value?.transcript_unavailable ? 'stat-loss' : undefined },
  { label: 'Too short', value: num(summary.value?.duration_too_short), color: summary.value?.duration_too_short ? 'stat-info' : undefined },
  { label: 'Failures', value: num(summary.value?.failures), color: summary.value?.failures ? 'stat-loss' : undefined },
])

async function loadAll(silent = false) {
  if (!silent) loading.value = true
  try {
    const [s, e] = await Promise.allSettled([
      getSummary(),
      getEpisodes(),
    ])

    summary.value = s.status === 'fulfilled' ? s.value : null
    summaryError.value = s.status === 'rejected' ? s.reason.message : null

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
      :stats="kpis"
      :md-cols="2"
      fill-width
      :loading="loading && !episodes.length"
    />

    <v-alert v-if="summaryError" type="error" variant="tonal" density="compact" class="mt-3">
      {{ summaryError }}
    </v-alert>

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

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>
