<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { getMonitoringJobs, getMonitoringRun, getMonitoringRuns } from '../../api/monitoring.js'

const runs = ref([])
const jobs = ref([])
const total = ref(0)
const loading = ref(true)
const detailLoading = ref(false)
const error = ref(null)
const detailError = ref(null)
const selectedJob = ref(null)
const selectedStatus = ref(null)
const limit = ref(50)
const offset = ref(0)
const selectedRun = ref(null)
const detailDialog = ref(false)

const headers = [
  { title: 'Execution ID', key: 'execution_id', align: 'start' },
  { title: 'Job', key: 'job_name', align: 'start' },
  { title: 'Attempt', key: 'attempt', align: 'end' },
  { title: 'Status', key: 'status', align: 'start' },
  { title: 'Exit', key: 'exit_code', align: 'end' },
  { title: 'Started', key: 'started_at', align: 'start' },
  { title: 'Finished', key: 'finished_at', align: 'start' },
  { title: 'Duration', key: 'duration_ms', align: 'end' },
  { title: 'Error', key: 'error_message', align: 'start' },
  { title: '', key: 'actions', align: 'end', sortable: false },
]

const statusOptions = [
  { title: 'Started', value: 'started' },
  { title: 'Success', value: 'success' },
  { title: 'Failed', value: 'failed' },
  { title: 'Timeout', value: 'timeout' },
]

const limitOptions = [25, 50, 100, 200]

const statusColor = {
  started: 'info',
  success: 'success',
  failed: 'error',
  timeout: 'warning',
}

const jobOptions = computed(() => jobs.value.map((job) => ({ title: job.name, value: job.name })))

const latestSummary = computed(() => {
  const latest = runs.value[0]
  if (!latest) return 'No run data yet'
  const status = latest.status ? ` · ${String(latest.status).toUpperCase()}` : ''
  return `Latest ${latest.job_name ?? 'job'} run${status}`
})

const canPageBack = computed(() => offset.value > 0)
const canPageForward = computed(() => runs.value.length >= limit.value)

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

function fmtDuration(item) {
  let ms = item.duration_ms != null ? Number(item.duration_ms) : null
  if ((ms == null || Number.isNaN(ms)) && item.started_at && item.finished_at) {
    ms = new Date(item.finished_at) - new Date(item.started_at)
  }
  if (ms == null || Number.isNaN(ms)) return '—'
  if (ms < 1000) return `${Math.round(ms)}ms`
  const secs = ms / 1000
  if (secs < 60) return `${secs.toFixed(1)}s`
  if (secs < 3600) {
    const mins = Math.floor(secs / 60)
    return `${mins}m ${Math.round(secs % 60)}s`
  }
  const hrs = Math.floor(secs / 3600)
  const mins = Math.floor((secs % 3600) / 60)
  return `${hrs}h ${mins}m`
}

function shortId(id) {
  if (!id) return '—'
  return String(id).slice(0, 8)
}

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    const [jobList, runList] = await Promise.allSettled([
      getMonitoringJobs(),
      getMonitoringRuns({
        jobName: selectedJob.value,
        status: selectedStatus.value,
        limit: limit.value,
        offset: offset.value,
      }),
    ])

    if (jobList.status === 'fulfilled') {
      jobs.value = jobList.value.jobs
    }

    if (runList.status === 'fulfilled') {
      runs.value = runList.value.runs
      total.value = runList.value.count
    } else {
      runs.value = []
      total.value = 0
      error.value = runList.reason?.message || 'Failed to load monitoring runs'
    }

    if (jobList.status === 'rejected' && !error.value) {
      error.value = jobList.reason?.message || 'Failed to load monitoring jobs'
    }
  } finally {
    loading.value = false
  }
}

async function showRunDetails(run) {
  detailDialog.value = true
  detailLoading.value = true
  detailError.value = null
  selectedRun.value = run
  try {
    const detail = await getMonitoringRun(run.execution_id)
    if (!detail) {
      detailError.value = 'Run not found'
      return
    }
    selectedRun.value = detail
  } catch (e) {
    detailError.value = e.message || 'Failed to load run details'
  } finally {
    detailLoading.value = false
  }
}

function previousPage() {
  offset.value = Math.max(0, offset.value - limit.value)
}

function nextPage() {
  offset.value += limit.value
}

watch([selectedJob, selectedStatus, limit], () => {
  offset.value = 0
  loadAll()
})

watch(offset, () => {
  loadAll()
})

onMounted(loadAll)
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <div class="text-body-2 text-medium-emphasis">
        Scheduler job run history · {{ latestSummary }}
      </div>
      <v-spacer />
      <v-btn variant="tonal" color="primary" :loading="loading" class="text-none" @click="loadAll">
        Refresh
      </v-btn>
    </div>

    <v-row class="mb-2">
      <v-col cols="12" md="5">
        <v-select
          v-model="selectedJob"
          :items="jobOptions"
          label="Job"
          clearable
          hide-details
        />
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-select
          v-model="selectedStatus"
          :items="statusOptions"
          label="Status"
          clearable
          hide-details
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-select
          v-model="limit"
          :items="limitOptions"
          label="Rows"
          hide-details
        />
      </v-col>
    </v-row>

    <v-sheet rounded="lg" color="#090c10">
      <v-card-title class="d-flex align-center ga-2 px-4 py-3">
        <span class="text-h6 text-sm-h5 text-md-h4 table-title">Ingestion Runs</span>
        <v-chip color="primary" variant="tonal" size="small">{{ total }}</v-chip>
        <v-spacer />
        <v-chip color="info" variant="tonal" size="small">{{ jobs.length }} jobs</v-chip>
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
        :items="runs"
        :loading="loading"
        item-value="execution_id"
        :items-per-page="limit"
        :sort-by="[{ key: 'started_at', order: 'desc' }]"
        no-data-text="No monitoring runs found"
      >
        <template #item.execution_id="{ item }">
          <span class="mono font-weight-medium" :title="item.execution_id">{{ shortId(item.execution_id) }}</span>
        </template>

        <template #item.job_name="{ item }">
          <v-chip variant="tonal" size="small" label>{{ item.job_name ?? '—' }}</v-chip>
        </template>

        <template #item.attempt="{ item }">
          <span class="mono">{{ item.attempt ?? '—' }}</span>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="chipColor(item.status)" variant="tonal" size="small" label>
            {{ (item.status ?? 'unknown').toUpperCase() }}
          </v-chip>
        </template>

        <template #item.exit_code="{ item }">
          <span class="mono" :class="item.exit_code === 0 ? 'text-success' : item.exit_code == null ? 'text-medium-emphasis' : 'text-error'">
            {{ item.exit_code ?? '—' }}
          </span>
        </template>

        <template #item.started_at="{ item }">
          <span class="text-caption text-medium-emphasis mono text-no-wrap">{{ fmtDate(item.started_at) }}</span>
        </template>

        <template #item.finished_at="{ item }">
          <span class="text-caption text-medium-emphasis mono text-no-wrap">{{ fmtDate(item.finished_at) }}</span>
        </template>

        <template #item.duration_ms="{ item }">
          <span class="mono text-caption">{{ fmtDuration(item) }}</span>
        </template>

        <template #item.error_message="{ item }">
          <span class="text-caption text-error text-truncate d-inline-block error-cell">
            {{ item.error_message ?? '—' }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <v-btn
            icon="mdi-text-box-search-outline"
            size="small"
            variant="text"
            :aria-label="`View run ${item.execution_id}`"
            @click="showRunDetails(item)"
          />
        </template>
      </v-data-table>

      <v-divider />
      <div class="d-flex align-center px-4 py-3 ga-2">
        <span class="text-caption text-medium-emphasis mono">Offset {{ offset }}</span>
        <v-spacer />
        <v-btn size="small" variant="tonal" :disabled="!canPageBack || loading" @click="previousPage">
          Previous
        </v-btn>
        <v-btn size="small" variant="tonal" :disabled="!canPageForward || loading" @click="nextPage">
          Next
        </v-btn>
      </div>
    </v-sheet>

    <v-dialog v-model="detailDialog" max-width="960">
      <v-card>
        <v-card-title class="d-flex align-center ga-2">
          <span>Run Output</span>
          <v-chip v-if="selectedRun?.status" :color="chipColor(selectedRun.status)" variant="tonal" size="small" label>
            {{ selectedRun.status.toUpperCase() }}
          </v-chip>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="detailDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-alert v-if="detailError" type="error" variant="tonal" density="compact" class="mb-4">
            {{ detailError }}
          </v-alert>
          <v-progress-linear v-if="detailLoading" indeterminate color="primary" class="mb-4" />

          <div class="text-body-2 text-medium-emphasis mb-4">
            <span class="mono">{{ selectedRun?.execution_id ?? '—' }}</span>
            <span class="mx-2">·</span>
            <span>{{ selectedRun?.job_name ?? '—' }}</span>
            <span class="mx-2">·</span>
            <span>{{ fmtDuration(selectedRun ?? {}) }}</span>
          </div>

          <div class="text-subtitle-2 mb-2">Stdout</div>
          <pre class="run-output mb-4">{{ selectedRun?.stdout || '—' }}</pre>

          <div class="text-subtitle-2 mb-2">Stderr</div>
          <pre class="run-output">{{ selectedRun?.stderr || '—' }}</pre>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.error-cell {
  max-width: 260px;
}

.run-output {
  max-height: 260px;
  overflow: auto;
  padding: 12px;
  border-radius: 8px;
  background: rgb(var(--v-theme-background));
  color: rgba(var(--v-theme-on-surface), 0.87);
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 0.8125rem;
  line-height: 1.5;
  white-space: pre-wrap;
}
</style>
