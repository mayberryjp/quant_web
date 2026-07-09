<script setup>
import { ref, computed, onMounted } from 'vue'
import QuickStats from '../QuickStats.vue'
import SymbolsPerDayChart from './SymbolsPerDayChart.vue'
import NewSymbolsTable from './NewSymbolsTable.vue'
import DelistedSymbolsTable from './DelistedSymbolsTable.vue'
import SymbolRunsTable from './SymbolRunsTable.vue'
import {
  getSymbolCount,
  getLatestSyncRun,
  getSyncRuns,
  getSymbolCountHistory,
  getRecentSymbols,
  getDelistedSymbols,
} from '../../api/symbols.js'

// Look-back windows (parameterized so they're easy to adjust).
const CHART_DAYS = 30
const TABLE_DAYS = 7

const totalSymbols = ref(null)
const latestRun = ref(null)
const runs = ref([])
const historyPoints = ref([])
const newSymbols = ref([])
const delistedSymbols = ref([])
const loading = ref(true)
const runsError = ref(null)
const newError = ref(null)
const delistedError = ref(null)

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

const kpis = computed(() => [
  {
    label: 'Total Symbols',
    value: totalSymbols.value != null ? totalSymbols.value.toLocaleString() : '—',
  },
  {
    label: 'Last Run ID',
    value: latestRun.value?.id != null ? `#${latestRun.value.id}` : '—',
  },
  {
    label: 'Last Run Start',
    value: fmtDate(latestRun.value?.started_at),
  },
  {
    label: 'Last Run Finish',
    value: fmtDate(latestRun.value?.finished_at),
  },
])

async function loadAll() {
  loading.value = true
  const [count, latest, runList, history, recent, delisted] = await Promise.allSettled([
    getSymbolCount(),
    getLatestSyncRun(),
    getSyncRuns({ limit: 100 }),
    getSymbolCountHistory({ days: CHART_DAYS }),
    getRecentSymbols({ days: TABLE_DAYS }),
    getDelistedSymbols({ days: TABLE_DAYS }),
  ])

  totalSymbols.value = count.status === 'fulfilled' ? count.value : null
  latestRun.value = latest.status === 'fulfilled' ? latest.value : null

  runs.value = runList.status === 'fulfilled' ? runList.value : []
  runsError.value = runList.status === 'rejected' ? runList.reason.message : null

  historyPoints.value = history.status === 'fulfilled' ? history.value : []

  newSymbols.value = recent.status === 'fulfilled' ? recent.value : []
  newError.value = recent.status === 'rejected' ? recent.reason.message : null

  delistedSymbols.value = delisted.status === 'fulfilled' ? delisted.value : []
  delistedError.value = delisted.status === 'rejected' ? delisted.reason.message : null

  loading.value = false
}

onMounted(loadAll)
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <div class="text-body-2 text-medium-emphasis">Symbol universe and ingestion activity</div>
      <v-spacer />
      <v-btn variant="tonal" color="primary" :loading="loading" class="text-none" @click="loadAll">
        Refresh
      </v-btn>
    </div>

    <QuickStats :stats="kpis" :loading="loading" class="mb-2" />

    <v-row>
      <v-col cols="12">
        <SymbolsPerDayChart :points="historyPoints" :loading="loading" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <SymbolRunsTable :runs="runs" :loading="loading" :error="runsError" @refresh="loadAll" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <NewSymbolsTable
          :items="newSymbols"
          :days="TABLE_DAYS"
          :loading="loading"
          :error="newError"
          @refresh="loadAll"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <DelistedSymbolsTable
          :items="delistedSymbols"
          :days="TABLE_DAYS"
          :loading="loading"
          :error="delistedError"
          @refresh="loadAll"
        />
      </v-col>
    </v-row>
  </div>
</template>
