<script setup>
defineProps({
  runs: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
})
defineEmits(['refresh'])

const headers = [
  { title: 'Status', key: 'run_status', align: 'start' },
  { title: 'Started', key: 'started_at', align: 'start' },
  { title: 'Finished', key: 'finished_at', align: 'start' },
  { title: 'Duration', key: 'duration', align: 'end', sortable: false },
  { title: 'Seen', key: 'records_seen', align: 'end' },
  { title: 'Inserted', key: 'records_inserted', align: 'end' },
  { title: 'New', key: 'symbols_new', align: 'end' },
  { title: 'Delisted', key: 'symbols_delisted', align: 'end' },
  { title: 'Failed', key: 'records_failed', align: 'end' },
]

const statusColor = {
  succeeded: 'success',
  failed: 'error',
  running: 'info',
  cancelled: 'warning',
}

function statusChipColor(status) {
  return statusColor[status] ?? 'grey'
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

function duration(item) {
  if (!item.started_at || !item.finished_at) return '—'
  const secs = (new Date(item.finished_at) - new Date(item.started_at)) / 1000
  if (Number.isNaN(secs)) return '—'
  if (secs < 60) return `${secs.toFixed(1)}s`
  const mins = Math.floor(secs / 60)
  return `${mins}m ${Math.round(secs % 60)}s`
}

function num(v) {
  return v != null ? Number(v).toLocaleString() : '—'
}
</script>

<template>
  <v-sheet rounded="lg" color="#090c10">
    <v-card-title class="d-flex align-center ga-2 px-4 py-3">
      <span class="text-h6 text-sm-h5 text-md-h4 table-title">Ingestion Runs</span>
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
      class="app-table"
      density="compact"
      mobile-breakpoint="md"
      :headers="headers"
      :items="runs"
      :loading="loading"
      item-value="id"
      :items-per-page="10"
      :sort-by="[{ key: 'started_at', order: 'desc' }]"
      no-data-text="No ingestion runs found"
    >
      <template #item.run_status="{ item }">
        <v-chip :color="statusChipColor(item.run_status)" variant="tonal" size="small" label>
          {{ (item.run_status ?? 'unknown').toUpperCase() }}
        </v-chip>
      </template>

      <template #item.started_at="{ item }">
        <span class="text-caption text-medium-emphasis mono">{{ fmtDate(item.started_at) }}</span>
      </template>

      <template #item.finished_at="{ item }">
        <span class="text-caption text-medium-emphasis mono">{{ fmtDate(item.finished_at) }}</span>
      </template>

      <template #item.duration="{ item }">
        <span class="mono text-caption">{{ duration(item) }}</span>
      </template>

      <template #item.records_seen="{ item }">
        <span class="mono">{{ num(item.records_seen) }}</span>
      </template>

      <template #item.records_inserted="{ item }">
        <span class="mono text-success">{{ num(item.records_inserted) }}</span>
      </template>

      <template #item.symbols_new="{ item }">
        <span
          class="mono"
          :class="(item.symbols_new ?? 0) > 0 ? 'text-success font-weight-bold' : 'text-medium-emphasis'"
        >
          {{ num(item.symbols_new) }}
        </span>
      </template>

      <template #item.symbols_delisted="{ item }">
        <span
          class="mono"
          :class="(item.symbols_delisted ?? 0) > 0 ? 'text-error font-weight-bold' : 'text-medium-emphasis'"
        >
          {{ num(item.symbols_delisted) }}
        </span>
      </template>

      <template #item.records_failed="{ item }">
        <span
          class="mono"
          :class="(item.records_failed ?? 0) > 0 ? 'text-error font-weight-bold' : 'text-medium-emphasis'"
        >
          {{ num(item.records_failed) }}
        </span>
      </template>
    </v-data-table>
  </v-sheet>
</template>
