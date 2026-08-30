<script setup>
import { computed, onMounted, ref } from 'vue'
import QuickStats from '../QuickStats.vue'
import { getJobs, getQueue } from '../../api/distill.js'

const queue = ref(null)
const jobs = ref([])
const total = ref(0)
const loading = ref(true)
const error = ref(null)

const headers = [
  { title: 'Status', key: 'status', align: 'start' },
  { title: 'Source', key: 'source', align: 'start' },
  { title: 'Source Item', key: 'source_item_id', align: 'start' },
  { title: 'Created', key: 'created_at', align: 'start' },
  { title: 'Started', key: 'started_at', align: 'start' },
  { title: 'Completed', key: 'completed_at', align: 'start' },
  { title: 'Model', key: 'model', align: 'start', sortable: false },
  { title: 'Tokens', key: 'token_usage', align: 'end', sortable: false },
  { title: 'Total', key: 'total_duration', align: 'end', sortable: false },
  { title: 'Distill', key: 'distill_duration', align: 'end', sortable: false },
  { title: 'Entities', key: 'entities_duration', align: 'end', sortable: false },
  { title: 'Sentiment', key: 'sentiment_duration', align: 'end', sortable: false },
  { title: 'Attempts', key: 'attempts', align: 'end' },
  { title: 'Error', key: 'error', align: 'start', sortable: false },
]

const statusColor = {
  queued: 'warning',
  running: 'info',
  succeeded: 'success',
  failed: 'error',
}

const kpis = computed(() => [
  { label: 'Queued', value: num(queue.value?.jobs?.queued), color: 'stat-info' },
  { label: 'Running', value: num(queue.value?.jobs?.running), color: 'stat-info' },
  { label: 'Succeeded', value: num(queue.value?.jobs?.succeeded), color: 'stat-profit' },
  { label: 'Failed', value: num(queue.value?.jobs?.failed), color: 'stat-loss' },
])

const serviceSummary = computed(() => {
  if (!queue.value) return 'Queue status unavailable'
  const server = queue.value.server ?? {}
  const availability = server.available ? 'Online' : 'Unavailable'
  return `${availability} · ${num(server.threads_busy)} of ${num(server.threads_total)} workers busy · queue depth ${num(server.queue_depth)}`
})

function num(value) {
  return value != null ? Number(value).toLocaleString() : '—'
}

function chipColor(status) {
  return statusColor[String(status ?? '').toLowerCase()] ?? 'grey'
}

function fmtDate(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function processing(item) {
  return item.result?.processing ?? {}
}

function minutes(milliseconds) {
  if (milliseconds == null || Number.isNaN(Number(milliseconds))) return '—'
  return `${(Number(milliseconds) / 60000).toFixed(1)}m`
}

async function loadAll() {
  loading.value = true
  error.value = null
  const [queueResult, jobsResult] = await Promise.allSettled([getQueue(), getJobs()])

  queue.value = queueResult.status === 'fulfilled' ? queueResult.value : null
  jobs.value = jobsResult.status === 'fulfilled' ? jobsResult.value.items : []
  total.value = jobsResult.status === 'fulfilled' ? jobsResult.value.total : 0

  const failures = [queueResult, jobsResult]
    .filter((result) => result.status === 'rejected')
    .map((result) => result.reason?.message || 'Failed to load distillation status')
  error.value = failures.length ? failures.join(' · ') : null
  loading.value = false
}

onMounted(loadAll)
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <div class="text-body-2 text-medium-emphasis">{{ serviceSummary }}</div>
      <v-spacer />
      <v-btn variant="tonal" color="primary" :loading="loading" class="text-none" @click="loadAll">
        Refresh
      </v-btn>
    </div>

    <QuickStats :stats="kpis" :loading="loading" class="mb-4" />

    <v-card>
      <v-card-title class="d-flex align-center ga-2 px-4 py-3">
        <span class="text-h6">Distillation Jobs</span>
        <v-chip color="primary" variant="tonal" size="small">{{ total }}</v-chip>
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
        :items="jobs"
        :loading="loading"
        item-value="job_id"
        :items-per-page="10"
        no-data-text="No distillation jobs found"
      >
        <template #item.status="{ item }">
          <v-chip :color="chipColor(item.status)" variant="tonal" size="small" label>
            {{ (item.status ?? 'unknown').toUpperCase() }}
          </v-chip>
        </template>

        <template #item.source="{ item }">
          <v-chip variant="tonal" size="small" label>{{ item.source ?? '—' }}</v-chip>
        </template>

        <template #item.source_item_id="{ item }">
          <span class="mono text-caption">{{ item.source_item_id ?? '—' }}</span>
        </template>

        <template #item.created_at="{ item }">
          <span class="mono text-caption text-no-wrap">{{ fmtDate(item.created_at) }}</span>
        </template>

        <template #item.started_at="{ item }">
          <span class="mono text-caption text-no-wrap">{{ fmtDate(item.started_at) }}</span>
        </template>

        <template #item.completed_at="{ item }">
          <span class="mono text-caption text-no-wrap">{{ fmtDate(item.completed_at) }}</span>
        </template>

        <template #item.model="{ item }">
          <span class="mono text-caption">{{ processing(item).model ?? '—' }}</span>
        </template>

        <template #item.token_usage="{ item }">
          <v-tooltip v-if="processing(item).token_usage" location="top">
            <template #activator="{ props }">
              <span v-bind="props" class="mono text-caption">
                {{ num(processing(item).token_usage.total_tokens) }}
              </span>
            </template>
            Prompt: {{ num(processing(item).token_usage.prompt_tokens) }} · Completion: {{ num(processing(item).token_usage.completion_tokens) }}
          </v-tooltip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.total_duration="{ item }">
          <span class="mono text-caption">{{ minutes(processing(item).durations_ms?.total) }}</span>
        </template>

        <template #item.distill_duration="{ item }">
          <span class="mono text-caption">{{ minutes(processing(item).durations_ms?.distill) }}</span>
        </template>

        <template #item.entities_duration="{ item }">
          <span class="mono text-caption">{{ minutes(processing(item).durations_ms?.entities) }}</span>
        </template>

        <template #item.sentiment_duration="{ item }">
          <span class="mono text-caption">{{ minutes(processing(item).durations_ms?.sentiment) }}</span>
        </template>

        <template #item.attempts="{ item }">
          <span class="mono">{{ num(item.attempts) }}</span>
        </template>

        <template #item.error="{ item }">
          <v-tooltip v-if="item.error" location="top">
            <template #activator="{ props }">
              <span v-bind="props" class="text-error text-caption text-truncate d-inline-block error-cell">
                {{ item.error }}
              </span>
            </template>
            {{ item.error }}
          </v-tooltip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.error-cell {
  max-width: 260px;
}
</style>
