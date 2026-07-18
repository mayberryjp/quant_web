<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import QuickStats from '../QuickStats.vue'
import IngestRunsTable from './IngestRunsTable.vue'
import { getStats, getTranscripts, restartTranscript, deleteTranscript } from '../../api/cnbc.js'

const stats = ref(null)
const runs = ref([])
const total = ref(0)
const failedTotal = ref(null)
const loading = ref(true)
const statsError = ref(null)
const runsError = ref(null)
const restarting = ref([])
const deleting = ref([])
const snackbar = ref({ show: false, text: '', color: 'success' })
const lastRefreshedAt = ref(null)

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function num(v) {
  return v != null ? Number(v).toLocaleString() : '—'
}

const kpis = computed(() => [
  { label: 'Transcripts', value: num(stats.value?.transcripts_total) },
  { label: 'Distilled', value: num(stats.value?.distilled) },
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
    const [s, t, f] = await Promise.allSettled([
      getStats(),
      getTranscripts({ pageSize: 100 }),
      getTranscripts({ status: 'failed', pageSize: 1 }),
    ])

    stats.value = s.status === 'fulfilled' ? s.value : null
    statsError.value = s.status === 'rejected' ? s.reason.message : null

    runs.value = t.status === 'fulfilled' ? t.value.items : []
    total.value = t.status === 'fulfilled' ? t.value.total : 0
    runsError.value = t.status === 'rejected' ? t.reason.message : null

    failedTotal.value = f.status === 'fulfilled' ? f.value.total : null
  } finally {
    lastRefreshedAt.value = new Date().toISOString()
    loading.value = false
  }
}

async function restart(item) {
  const id = item?.archive_identifier
  if (!id || restarting.value.includes(id)) return
  restarting.value = [...restarting.value, id]
  try {
    await restartTranscript(id)
    snackbar.value = { show: true, text: `Restarted distillation for ${id}`, color: 'success' }
    await loadAll()
  } catch (e) {
    snackbar.value = { show: true, text: `Restart failed: ${e.message}`, color: 'error' }
  } finally {
    restarting.value = restarting.value.filter((x) => x !== id)
  }
}

async function remove(item) {
  const id = item?.id
  if (id == null || deleting.value.includes(id)) return
  deleting.value = [...deleting.value, id]
  try {
    await deleteTranscript(id)
    snackbar.value = { show: true, text: `Deleted transcript #${id}`, color: 'success' }
    await loadAll()
  } catch (e) {
    snackbar.value = { show: true, text: `Delete failed: ${e.message}`, color: 'error' }
  } finally {
    deleting.value = deleting.value.filter((x) => x !== id)
  }
}

onMounted(() => loadAll())

let refreshTimer = null
onMounted(() => {
  refreshTimer = setInterval(() => loadAll(true), 60000)
})
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <div class="text-body-2 text-medium-emphasis">
        CNBC transcript ingestion activity · {{ lastRun }}
      </div>
      <v-spacer />
      <v-btn variant="tonal" color="primary" :loading="loading" class="text-none" @click="loadAll()">
        Refresh
      </v-btn>
    </div>

    <v-alert v-if="statsError" type="warning" variant="tonal" density="compact" class="mb-4">
      {{ statsError }}
    </v-alert>

    <QuickStats :stats="kpis" :loading="loading" class="mb-2" />

    <v-row>
      <v-col cols="12">
        <IngestRunsTable
          :items="runs"
          :total="total"
          :loading="loading"
          :error="runsError"
          :restarting="restarting"
          :deleting="deleting"
          :last-refreshed-at="lastRefreshedAt"
          @refresh="loadAll"
          @restart="restart"
          @delete="remove"
        />
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000" location="bottom right">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>
