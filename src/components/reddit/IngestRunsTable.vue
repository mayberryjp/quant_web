<script setup>
defineEmits(['refresh'])

defineProps({
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  lastRefreshedAt: { type: String, default: null },
})

const headers = [
  { title: 'ID', key: 'id', align: 'end' },
  { title: 'Run Type', key: 'run_type', align: 'start' },
  { title: 'Status', key: 'status', align: 'start' },
  { title: 'Started', key: 'started_at', align: 'start' },
  { title: 'Finished', key: 'finished_at', align: 'start' },
  { title: 'Duration (s)', key: 'duration_s', align: 'end' },
  { title: 'Posts New', key: 'posts_new', align: 'end' },
  { title: 'Posts Dup', key: 'posts_duplicate', align: 'end' },
  { title: 'Distilled', key: 'items_distilled', align: 'end' },
  { title: 'Failed', key: 'items_failed', align: 'end' },
  { title: 'Signals', key: 'signals_emitted', align: 'end' },
  { title: 'Sentiment', key: 'sentiment_emitted', align: 'end' },
  { title: 'Error', key: 'error', align: 'start' },
]

const statusColor = {
  done: 'success',
  running: 'warning',
  unknown: 'grey',
  failed: 'error',
}

function statusChipColor(status) {
  return statusColor[String(status ?? '').toLowerCase()] ?? 'grey'
}

function rowStatus(item) {
  if (item?.error) return 'failed'
  if (!item?.finished_at) return 'running'
  return 'done'
}

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function num(v) {
  return v != null ? Number(v).toLocaleString() : '—'
}

function durationSeconds(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) return null
  const start = new Date(startedAt).getTime()
  const end = new Date(finishedAt).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null
  return ((end - start) / 1000).toFixed(1)
}

function shortError(v) {
  if (!v) return '—'
  const s = String(v)
  return s.length > 80 ? `${s.slice(0, 77)}...` : s
}
</script>

<template>
  <v-sheet rounded="lg" color="#090c10">
    <v-card-title class="d-flex align-center ga-2 px-4 py-3">
      <span class="text-h6 text-sm-h5 text-md-h4 table-title">Ingestion Runs</span>
      <v-chip color="primary" variant="tonal" size="small">{{ total }}</v-chip>
      <span class="text-caption text-medium-emphasis">Last refreshed: {{ fmtDate(lastRefreshedAt) }}</span>
      <v-spacer />
      <v-btn icon="mdi-refresh" size="small" variant="text" :loading="loading" @click="$emit('refresh')" />
    </v-card-title>
    <v-divider />

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="ma-4">
      {{ error }}
    </v-alert>

    <v-data-table
      :headers="headers"
      :items="items"
      :loading="loading"
      density="compact"
      item-value="id"
      class="app-table"
      no-data-text="No Reddit ingestion runs found"
    >
      <template #item.id="{ item }">
        <span class="mono">{{ num(item.id) }}</span>
      </template>

      <template #item.run_type="{ item }">
        <span class="text-uppercase">{{ item.run_type ?? '—' }}</span>
      </template>

      <template #item.status="{ item }">
        <v-chip :color="statusChipColor(rowStatus(item))" size="small" variant="tonal" label>
          {{ rowStatus(item).toUpperCase() }}
        </v-chip>
      </template>

      <template #item.started_at="{ item }">
        <span class="mono">{{ fmtDate(item.started_at) }}</span>
      </template>

      <template #item.finished_at="{ item }">
        <span class="mono">{{ fmtDate(item.finished_at) }}</span>
      </template>

      <template #item.duration_s="{ item }">
        <span class="mono">{{ durationSeconds(item.started_at, item.finished_at) ?? '—' }}</span>
      </template>

      <template #item.posts_new="{ item }">
        <span class="mono">{{ num(item.result?.posts_new) }}</span>
      </template>

      <template #item.posts_duplicate="{ item }">
        <span class="mono">{{ num(item.result?.posts_duplicate) }}</span>
      </template>

      <template #item.items_distilled="{ item }">
        <span class="mono">{{ num(item.result?.items_distilled) }}</span>
      </template>

      <template #item.items_failed="{ item }">
        <span class="mono" :class="(item.result?.items_failed ?? 0) > 0 ? 'text-error' : ''">{{ num(item.result?.items_failed) }}</span>
      </template>

      <template #item.signals_emitted="{ item }">
        <span class="mono">{{ num(item.result?.signals_emitted) }}</span>
      </template>

      <template #item.sentiment_emitted="{ item }">
        <span class="mono">{{ num(item.result?.sentiment_emitted) }}</span>
      </template>

      <template #item.error="{ item }">
        <span :class="item.error ? 'text-error' : 'text-medium-emphasis'">{{ shortError(item.error) }}</span>
      </template>
    </v-data-table>
  </v-sheet>
</template>
