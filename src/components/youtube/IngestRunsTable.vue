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
  { title: 'Run Date', key: 'run_date', align: 'start' },
  { title: 'Status', key: 'status', align: 'start' },
  { title: 'Discovered', key: 'episodes_discovered', align: 'end' },
  { title: 'Fetched', key: 'transcripts_fetched', align: 'end' },
  { title: 'Distilled', key: 'distilled', align: 'end' },
  { title: 'Reprocessed', key: 'reprocessed', align: 'end' },
  { title: 'Failures', key: 'failures', align: 'end' },
  { title: 'Crawled', key: 'notes.crawled', align: 'end', sortable: false },
  { title: 'New', key: 'notes.new', align: 'end', sortable: false },
  { title: 'Created', key: 'created_at', align: 'start' },
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
  return statusColor[status] ?? 'grey'
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

    <v-alert v-if="error" type="error" variant="tonal" class="ma-4" density="compact">
      {{ error }}
    </v-alert>

    <v-data-table
      :headers="headers"
      :items="items"
      :loading="loading"
      density="compact"
      item-value="run_date"
      class="app-table"
    >
      <template #item.status="{ item }">
        <v-chip :color="statusChipColor(item.status)" size="x-small" variant="tonal">
          {{ item.status ?? '—' }}
        </v-chip>
      </template>

      <template #item.episodes_discovered="{ item }">
        <span class="mono">{{ num(item.episodes_discovered) }}</span>
      </template>

      <template #item.transcripts_fetched="{ item }">
        <span class="mono">{{ num(item.transcripts_fetched) }}</span>
      </template>

      <template #item.distilled="{ item }">
        <span class="mono">{{ num(item.distilled) }}</span>
      </template>

      <template #item.reprocessed="{ item }">
        <span class="mono">{{ num(item.reprocessed) }}</span>
      </template>

      <template #item.failures="{ item }">
        <span class="mono" :class="item.failures ? 'text-error' : ''">{{ num(item.failures) }}</span>
      </template>

      <template #item["notes.crawled"]="{ item }">
        <span class="mono">{{ num(item.notes?.crawled) }}</span>
      </template>

      <template #item["notes.new"]="{ item }">
        <span class="mono">{{ num(item.notes?.new) }}</span>
      </template>

      <template #item.created_at="{ item }">
        <span class="text-caption">{{ fmtDate(item.created_at) }}</span>
      </template>
    </v-data-table>
  </v-sheet>
</template>
