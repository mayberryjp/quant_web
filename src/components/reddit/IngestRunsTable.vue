<script setup>
defineProps({
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  lastRefreshedAt: { type: String, default: null },
})
defineEmits(['refresh'])

const headers = [
  { title: 'Created', key: 'created_at', align: 'start' },
  { title: 'Run Type', key: 'run_type', align: 'start' },
  { title: 'Status', key: 'status', align: 'start' },
  { title: 'Started', key: 'started_at', align: 'start' },
  { title: 'Finished', key: 'finished_at', align: 'start' },
  { title: 'Duration (ms)', key: 'duration_ms', align: 'end' },
  { title: 'Fetched', key: 'fetched_count', align: 'end' },
  { title: 'Processed', key: 'processed_count', align: 'end' },
  { title: 'Distilled', key: 'distilled_count', align: 'end' },
  { title: 'Emitted', key: 'emitted_count', align: 'end' },
  { title: 'Failed', key: 'failed_count', align: 'end' },
]

const statusColor = {
  success: 'success',
  done: 'success',
  running: 'warning',
  pending: 'grey',
  failed: 'error',
  error: 'error',
}

function statusChipColor(status) {
  return statusColor[String(status ?? '').toLowerCase()] ?? 'grey'
}

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
      <template #item.created_at="{ item }">
        <span class="mono">{{ fmtDate(item.created_at) }}</span>
      </template>

      <template #item.run_type="{ item }">
        <span class="text-uppercase">{{ item.run_type ?? '—' }}</span>
      </template>

      <template #item.status="{ item }">
        <v-chip :color="statusChipColor(item.status)" size="small" variant="tonal" label>
          {{ (item.status ?? 'unknown').toUpperCase() }}
        </v-chip>
      </template>

      <template #item.started_at="{ item }">
        <span class="mono">{{ fmtDate(item.started_at) }}</span>
      </template>

      <template #item.finished_at="{ item }">
        <span class="mono">{{ fmtDate(item.finished_at) }}</span>
      </template>

      <template #item.duration_ms="{ item }">
        <span class="mono">{{ num(item.duration_ms) }}</span>
      </template>

      <template #item.fetched_count="{ item }">
        <span class="mono">{{ num(item.fetched_count) }}</span>
      </template>

      <template #item.processed_count="{ item }">
        <span class="mono">{{ num(item.processed_count) }}</span>
      </template>

      <template #item.distilled_count="{ item }">
        <span class="mono">{{ num(item.distilled_count) }}</span>
      </template>

      <template #item.emitted_count="{ item }">
        <span class="mono">{{ num(item.emitted_count) }}</span>
      </template>

      <template #item.failed_count="{ item }">
        <span class="mono" :class="(item.failed_count ?? 0) > 0 ? 'text-error' : ''">{{ num(item.failed_count) }}</span>
      </template>
    </v-data-table>
  </v-sheet>
</template>
