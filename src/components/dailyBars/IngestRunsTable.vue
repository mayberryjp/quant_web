<script setup>
defineProps({
  runs: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
})
defineEmits(['refresh'])

const headers = [
  { title: 'Run ID', key: 'run_id', align: 'start' },
  { title: 'Mode', key: 'mode', align: 'start' },
  { title: 'Status', key: 'status', align: 'start' },
  { title: 'Window', key: 'window', align: 'start', sortable: false },
  { title: 'Started', key: 'started_at', align: 'start' },
  { title: 'Finished', key: 'finished_at', align: 'start' },
  { title: 'Duration', key: 'duration_seconds', align: 'end' },
  { title: 'Requested', key: 'symbols_requested', align: 'end' },
  { title: 'Succeeded', key: 'symbols_succeeded', align: 'end' },
  { title: 'Failed', key: 'symbols_failed', align: 'end' },
  { title: 'Bars', key: 'bars_upserted', align: 'end' },
]

const statusColor = {
  completed: 'success',
  failed: 'error',
  running: 'info',
}

function statusChipColor(status) {
  return statusColor[status] ?? 'grey'
}

function fmtDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function duration(item) {
  let secs = item.duration_seconds != null ? Number(item.duration_seconds) : null
  // Fall back to computing from timestamps when the run didn't record a duration.
  if ((secs == null || Number.isNaN(secs)) && item.started_at && item.finished_at) {
    secs = (new Date(item.finished_at) - new Date(item.started_at)) / 1000
  }
  if (secs == null || Number.isNaN(secs)) return '—'
  if (secs < 60) return `${secs.toFixed(1)}s`
  if (secs < 3600) {
    const mins = Math.floor(secs / 60)
    return `${mins}m ${Math.round(secs % 60)}s`
  }
  const hrs = Math.floor(secs / 3600)
  const mins = Math.floor((secs % 3600) / 60)
  return `${hrs}h ${mins}m`
}

function num(v) {
  return v != null ? Number(v).toLocaleString() : '—'
}
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center ga-2 py-3">
      <span class="text-subtitle-1 font-weight-medium">Ingestion Runs</span>
      <v-chip color="primary" variant="tonal" size="small">{{ runs.length }}</v-chip>
      <v-spacer />
      <v-btn icon="mdi-refresh" size="small" variant="text" :loading="loading" @click="$emit('refresh')" />
    </v-card-title>
    <v-divider />

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="ma-4">
      {{ error }}
    </v-alert>

    <v-data-table
      v-else
      :headers="headers"
      :items="runs"
      :loading="loading"
      item-value="run_id"
      :items-per-page="10"
      :sort-by="[{ key: 'run_id', order: 'desc' }]"
      no-data-text="No ingestion runs found"
    >
      <template #item.run_id="{ item }">
        <span class="mono font-weight-medium">#{{ item.run_id }}</span>
      </template>

      <template #item.mode="{ item }">
        <v-chip variant="tonal" size="small" label>{{ (item.mode ?? '—').toUpperCase() }}</v-chip>
      </template>

      <template #item.status="{ item }">
        <v-chip :color="statusChipColor(item.status)" variant="tonal" size="small" label>
          {{ (item.status ?? 'unknown').toUpperCase() }}
        </v-chip>
      </template>

      <template #item.window="{ item }">
        <span class="mono text-caption text-medium-emphasis">{{ item.from_date }} → {{ item.to_date }}</span>
      </template>

      <template #item.started_at="{ item }">
        <span class="text-caption text-medium-emphasis mono">{{ fmtDate(item.started_at) }}</span>
      </template>

      <template #item.finished_at="{ item }">
        <span class="text-caption text-medium-emphasis mono">{{ fmtDate(item.finished_at) }}</span>
      </template>

      <template #item.duration_seconds="{ item }">
        <span class="mono text-caption">{{ duration(item) }}</span>
      </template>

      <template #item.symbols_requested="{ item }">
        <span class="mono">{{ num(item.symbols_requested) }}</span>
      </template>

      <template #item.symbols_succeeded="{ item }">
        <span class="mono text-success">{{ num(item.symbols_succeeded) }}</span>
      </template>

      <template #item.symbols_failed="{ item }">
        <span
          class="mono"
          :class="(item.symbols_failed ?? 0) > 0 ? 'text-error font-weight-bold' : 'text-medium-emphasis'"
        >
          {{ num(item.symbols_failed) }}
        </span>
      </template>

      <template #item.bars_upserted="{ item }">
        <span class="mono text-success font-weight-medium">{{ num(item.bars_upserted) }}</span>
      </template>
    </v-data-table>
  </v-card>
</template>
