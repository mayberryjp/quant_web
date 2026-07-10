<script setup>
defineProps({
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  restarting: { type: Array, default: () => [] },
  lastRefreshedAt: { type: String, default: null },
})
defineEmits(['refresh', 'restart'])

const headers = [
  { title: 'Run ID', key: 'id', align: 'start' },
  { title: 'Show', key: 'show_slug', align: 'start' },
  { title: 'Air Date', key: 'air_date', align: 'start' },
  { title: 'Status', key: 'status', align: 'start' },
  { title: 'Fetched', key: 'fetched_at', align: 'center' },
  { title: 'Distilled', key: 'distilled_at', align: 'center' },
  { title: 'Last Delivered', key: 'delivered_at', align: 'start' },
  { title: 'Raw Chars', key: 'raw_char_count', align: 'end' },
  { title: 'Summary Chars', key: 'summary_char_count', align: 'end' },
  { title: 'Summary', key: 'summary', align: 'center', sortable: false },
  { title: 'Last Error', key: 'last_error', align: 'start', sortable: false },
  { title: '', key: 'actions', align: 'center', sortable: false },
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

function fmtYmdDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const yy = String(d.getFullYear()).slice(-2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yy}-${mm}-${dd}:${hh}:${min}`
}

function hasDistilled(item) {
  return Boolean(item?.distilled_at) || ['distilled', 'delivered', 'done'].includes(item?.status)
}

function showName(slug) {
  if (!slug) return '—'
  return slug.replace(/_/g, ' ')
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
      v-else
      class="app-table"
      density="compact"
      mobile-breakpoint="md"
      :headers="headers"
      :items="items"
      :loading="loading"
      item-value="id"
      :items-per-page="10"
      :sort-by="[{ key: 'air_date', order: 'desc' }]"
      no-data-text="No CNBC ingestion runs found"
    >
      <template #item.id="{ item }">
        <span class="mono font-weight-medium">#{{ item.id }}</span>
      </template>

      <template #item.show_slug="{ item }">
        <span class="font-weight-medium">{{ showName(item.show_slug) }}</span>
        <div v-if="item.title" class="text-caption text-medium-emphasis">{{ item.title }}</div>
      </template>

      <template #item.air_date="{ item }">
        <span class="mono text-no-wrap">{{ item.air_date ?? '—' }}</span>
      </template>

      <template #item.status="{ item }">
        <v-chip :color="statusChipColor(item.status)" variant="tonal" size="small" label>
          {{ (item.status ?? 'unknown').toUpperCase() }}
        </v-chip>
      </template>

      <template #item.fetched_at="{ item }">
        <v-icon
          :icon="item.fetched_at ? 'mdi-check-circle' : 'mdi-minus'"
          :color="item.fetched_at ? 'success' : 'grey'"
          size="small"
        />
      </template>

      <template #item.distilled_at="{ item }">
        <v-icon
          :icon="hasDistilled(item) ? 'mdi-check-circle' : 'mdi-minus'"
          :color="hasDistilled(item) ? 'success' : 'grey'"
          size="small"
        />
      </template>

      <template #item.delivered_at="{ item }">
        <span class="mono text-no-wrap">{{ fmtYmdDate(item.delivered_at) }}</span>
      </template>

      <template #item.raw_char_count="{ item }">
        <span class="mono text-medium-emphasis">{{ num(item.raw_char_count) }}</span>
      </template>

      <template #item.summary_char_count="{ item }">
        <span class="mono text-medium-emphasis">{{ num(item.summary_char_count) }}</span>
      </template>

      <template #item.summary="{ item }">
        <v-tooltip v-if="item.summary" location="top" max-width="480" open-delay="100">
          <template #activator="{ props }">
            <v-icon v-bind="props" icon="mdi-text-box-outline" size="small" color="info" style="cursor: help" />
          </template>
          <span style="white-space: pre-wrap">{{ item.summary }}</span>
        </v-tooltip>
        <span v-else class="text-caption text-medium-emphasis">—</span>
      </template>

      <template #item.last_error="{ item }">
        <v-tooltip v-if="item.last_error" location="top" max-width="480" open-delay="100">
          <template #activator="{ props }">
            <v-icon v-bind="props" icon="mdi-alert-circle-outline" size="small" color="error" style="cursor: help" />
          </template>
          <span style="white-space: pre-wrap">{{ item.last_error }}</span>
        </v-tooltip>
        <span v-else class="text-caption text-medium-emphasis">—</span>
      </template>

      <template #item.actions="{ item }">
        <v-btn
          icon="mdi-restart"
          size="small"
          variant="text"
          color="primary"
          :loading="restarting.includes(item.archive_identifier)"
          :disabled="!item.archive_identifier"
          title="Restart distillation"
          @click="$emit('restart', item)"
        />
      </template>
    </v-data-table>
  </v-sheet>
</template>
