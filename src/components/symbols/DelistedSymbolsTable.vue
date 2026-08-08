<script setup>
defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  days: { type: Number, default: 7 },
})
defineEmits(['refresh'])

const headers = [
  { title: 'Ticker', key: 'canonical_ticker', align: 'start' },
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Market', key: 'market', align: 'start' },
  { title: 'Exchange', key: 'exchange', align: 'start', sortable: false },
  { title: 'Delisted', key: 'delisted_at', align: 'end' },
]

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

function exchange(item) {
  return item.primary_exchange?.mic || item.primary_exchange?.name || '—'
}
</script>

<template>
  <v-sheet rounded="lg" color="#090c10">
    <v-card-title class="d-flex align-center ga-2 px-4 py-3">
      <span class="text-h6 text-sm-h5 text-md-h4 table-title">Delisted Symbols</span>
      <v-chip color="error" variant="tonal" size="small">{{ items.length }}</v-chip>
      <v-spacer />
      <span class="text-caption text-medium-emphasis">Last {{ days }} days</span>
      <v-btn icon="mdi-refresh" size="small" variant="text" :loading="loading" @click="$emit('refresh')" />
    </v-card-title>
    <v-divider />

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="ma-4">{{ error }}</v-alert>

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
      :sort-by="[{ key: 'delisted_at', order: 'desc' }]"
      no-data-text="No delisted symbols in this period"
    >
      <template #item.canonical_ticker="{ item }">
        <span class="font-weight-bold">{{ item.canonical_ticker ?? '—' }}</span>
      </template>
      <template #item.name="{ item }">
        <span
          class="text-medium-emphasis text-caption d-inline-block text-truncate"
          style="max-width: 240px"
          :title="item.name"
        >
          {{ item.name || '—' }}
        </span>
      </template>
      <template #item.market="{ item }">
        <v-chip size="x-small" color="primary" variant="tonal" label>
          {{ (item.market ?? '—').toUpperCase() }}
        </v-chip>
      </template>
      <template #item.exchange="{ item }">
        <span class="text-caption text-medium-emphasis mono">{{ exchange(item) }}</span>
      </template>
      <template #item.delisted_at="{ item }">
        <span class="mono text-caption text-error">{{ fmtDate(item.delisted_at) }}</span>
      </template>
    </v-data-table>
  </v-sheet>
</template>
