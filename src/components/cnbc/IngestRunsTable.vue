<script setup>
defineProps({
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
})
defineEmits(['refresh'])

const headers = [
  { title: 'Show', key: 'show_slug', align: 'start' },
  { title: 'Air Date', key: 'air_date', align: 'start' },
  { title: 'Broadcast', key: 'broadcast_start', align: 'start' },
  { title: 'Status', key: 'status', align: 'start' },
  { title: 'Attempts', key: 'attempts', align: 'end' },
  { title: 'Discovered', key: 'discovered_at', align: 'start' },
  { title: 'Fetched', key: 'fetched_at', align: 'start' },
  { title: 'Distilled', key: 'distilled_at', align: 'start' },
  { title: 'Delivered', key: 'delivered_at', align: 'start' },
  { title: 'Tokens', key: 'token_usage', align: 'end', sortable: false },
  { title: 'Last Error', key: 'last_error', align: 'start', sortable: false },
]

const statusColor = {
  done: 'success',
  delivered: 'info',
  distilled: 'info',
  fetched: 'warning',
  discovered: 'grey',
  failed: 'error',
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

function showName(slug) {
  if (!slug) return '—'
  return slug.replace(/_/g, ' ')
}

function tokens(usage) {
  if (usage == null) return '—'
  // token_usage is a JSON object (e.g. { total_tokens, prompt_tokens, ... });
  // surface the total when present, else fall back to a raw count.
  const total = usage.total_tokens ?? usage.total ?? null
  if (total != null) return Number(total).toLocaleString()
  if (typeof usage === 'number') return Number(usage).toLocaleString()
  return '—'
}
</script>

<template>
  <v-sheet rounded="lg" color="#090c10">
    <v-card-title class="d-flex align-center ga-2 px-4 py-3">
      <span class="text-h6 text-sm-h5 text-md-h4 table-title">Ingestion Runs</span>
      <v-chip color="primary" variant="tonal" size="small">{{ total }}</v-chip>
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
      :items="items"
      :loading="loading"
      item-value="id"
      :items-per-page="10"
      :sort-by="[{ key: 'broadcast_start', order: 'desc' }]"
      no-data-text="No CNBC ingestion runs found"
    >
      <template #item.show_slug="{ item }">
        <span class="font-weight-medium">{{ showName(item.show_slug) }}</span>
        <div v-if="item.title" class="text-caption text-medium-emphasis">{{ item.title }}</div>
      </template>

      <template #item.air_date="{ item }">
        <span class="mono">{{ item.air_date ?? '—' }}</span>
      </template>

      <template #item.broadcast_start="{ item }">
        <span class="text-caption text-medium-emphasis mono">{{ fmtDate(item.broadcast_start) }}</span>
      </template>

      <template #item.status="{ item }">
        <v-chip :color="statusChipColor(item.status)" variant="tonal" size="small" label>
          {{ (item.status ?? 'unknown').toUpperCase() }}
        </v-chip>
      </template>

      <template #item.attempts="{ item }">
        <span
          class="mono"
          :class="(item.attempts ?? 0) > 1 ? 'text-warning font-weight-bold' : 'text-medium-emphasis'"
        >
          {{ item.attempts ?? 0 }}
        </span>
      </template>

      <template #item.discovered_at="{ item }">
        <span class="text-caption text-medium-emphasis mono">{{ fmtDate(item.discovered_at) }}</span>
      </template>

      <template #item.fetched_at="{ item }">
        <span class="text-caption text-medium-emphasis mono">{{ fmtDate(item.fetched_at) }}</span>
      </template>

      <template #item.distilled_at="{ item }">
        <span class="text-caption text-medium-emphasis mono">{{ fmtDate(item.distilled_at) }}</span>
      </template>

      <template #item.delivered_at="{ item }">
        <span class="text-caption text-medium-emphasis mono">{{ fmtDate(item.delivered_at) }}</span>
      </template>

      <template #item.token_usage="{ item }">
        <span class="mono text-medium-emphasis">{{ tokens(item.token_usage) }}</span>
      </template>

      <template #item.last_error="{ item }">
        <span
          v-if="item.last_error"
          class="text-caption text-error"
          style="display: inline-block; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap"
          :title="item.last_error"
        >
          {{ item.last_error }}
        </span>
        <span v-else class="text-caption text-medium-emphasis">—</span>
      </template>
    </v-data-table>
  </v-sheet>
</template>
