<script setup>
import { ref, computed, onMounted } from 'vue'
import QuickStats from '../QuickStats.vue'
import IngestRunsTable from './IngestRunsTable.vue'
import CoverageGapsChart from './CoverageGapsChart.vue'
import SymbolGapsTable from './SymbolGapsTable.vue'
import DateGapsTable from './DateGapsTable.vue'
import {
  getIngestRuns,
  getLatestIngestRun,
  getBarDateRange,
  getCoverageGaps,
  getSymbolGaps,
  getDateGaps,
} from '../../api/dailyBars.js'

// Reference ticker whose trading calendar defines the expected days, plus the
// start of the charted window. We graph all known days from here.
const REFERENCE_TICKER = 'MSFT'
const COVERAGE_FROM = '2016-01-01'

const latestRun = ref(null)
const runs = ref([])
const dateRange = ref(null)
const coverage = ref(null)
const symbolGaps = ref([])
const dateGaps = ref([])
const loading = ref(true)
const runsError = ref(null)
const coverageError = ref(null)
const symbolGapsError = ref(null)
const dateGapsError = ref(null)

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const kpis = computed(() => [
  {
    label: 'Total Bars',
    value: dateRange.value?.total_bars != null ? Number(dateRange.value.total_bars).toLocaleString() : '—',
  },
  {
    label: 'Last Run ID',
    value: latestRun.value?.run_id != null ? `#${latestRun.value.run_id}` : '—',
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
  const [runList, latest, range, cov, symGaps, dtGaps] = await Promise.allSettled([
    getIngestRuns({ limit: 100 }),
    getLatestIngestRun(),
    getBarDateRange(),
    getCoverageGaps({ ticker: REFERENCE_TICKER, fromDate: COVERAGE_FROM }),
    getSymbolGaps({ ticker: REFERENCE_TICKER, limit: 50 }),
    getDateGaps({ ticker: REFERENCE_TICKER, limit: 50 }),
  ])

  runs.value = runList.status === 'fulfilled' ? runList.value : []
  runsError.value = runList.status === 'rejected' ? runList.reason.message : null

  latestRun.value = latest.status === 'fulfilled' ? latest.value : null
  dateRange.value = range.status === 'fulfilled' ? range.value : null

  coverage.value = cov.status === 'fulfilled' ? cov.value : null
  coverageError.value = cov.status === 'rejected' ? cov.reason.message : null

  symbolGaps.value = symGaps.status === 'fulfilled' ? symGaps.value : []
  symbolGapsError.value = symGaps.status === 'rejected' ? symGaps.reason.message : null

  dateGaps.value = dtGaps.status === 'fulfilled' ? dtGaps.value : []
  dateGapsError.value = dtGaps.status === 'rejected' ? dtGaps.reason.message : null

  loading.value = false
}

onMounted(loadAll)
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <div class="text-body-2 text-medium-emphasis">Daily OHLCV bar ingestion activity</div>
      <v-spacer />
      <v-btn variant="tonal" color="primary" :loading="loading" class="text-none" @click="loadAll">
        Refresh
      </v-btn>
    </div>

    <QuickStats :stats="kpis" :loading="loading" class="mb-2" />

    <v-row>
      <v-col cols="12">
        <CoverageGapsChart
          :points="coverage?.items ?? []"
          :reference-ticker="coverage?.reference_ticker ?? REFERENCE_TICKER"
          :loading="loading"
          :error="coverageError"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <IngestRunsTable :runs="runs" :loading="loading" :error="runsError" @refresh="loadAll" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <DateGapsTable
          :items="dateGaps"
          :reference-ticker="REFERENCE_TICKER"
          :loading="loading"
          :error="dateGapsError"
          @refresh="loadAll"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <SymbolGapsTable
          :items="symbolGaps"
          :reference-ticker="REFERENCE_TICKER"
          :loading="loading"
          :error="symbolGapsError"
          @refresh="loadAll"
        />
      </v-col>
    </v-row>
  </div>
</template>
