<script setup>
import { ref, computed, onMounted } from 'vue'
import QuickStats from '../QuickStats.vue'
import IngestRunsTable from './IngestRunsTable.vue'
import { getStats, getTranscripts } from '../../api/cnbc.js'

const stats = ref(null)
const runs = ref([])
const total = ref(0)
const loading = ref(true)
const statsError = ref(null)
const runsError = ref(null)

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
  { label: 'Sentiments Sent', value: num(stats.value?.sentiments_sent) },
  { label: 'Entities Submitted', value: num(stats.value?.entities_submitted) },
])

const lastRun = computed(() => {
  const date = stats.value?.last_run_date
  const status = stats.value?.last_run_status
  if (!date) return 'No runs yet'
  return status ? `Last run ${date} · ${status}` : `Last run ${date}`
})

async function loadAll() {
  loading.value = true
  const [s, t] = await Promise.allSettled([
    getStats(),
    getTranscripts({ pageSize: 100 }),
  ])

  stats.value = s.status === 'fulfilled' ? s.value : null
  statsError.value = s.status === 'rejected' ? s.reason.message : null

  runs.value = t.status === 'fulfilled' ? t.value.items : []
  total.value = t.status === 'fulfilled' ? t.value.total : 0
  runsError.value = t.status === 'rejected' ? t.reason.message : null

  loading.value = false
}

onMounted(loadAll)
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <div class="text-body-2 text-medium-emphasis">
        CNBC transcript ingestion activity · {{ lastRun }}
      </div>
      <v-spacer />
      <v-btn variant="tonal" color="primary" :loading="loading" class="text-none" @click="loadAll">
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
          @refresh="loadAll"
        />
      </v-col>
    </v-row>
  </div>
</template>
