<script setup>
defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  referenceTicker: { type: String, default: '' },
})
defineEmits(['refresh'])

const headers = [
  { title: 'Ticker', key: 'ticker', align: 'start' },
  { title: 'First Bar', key: 'first_date', align: 'start' },
  { title: 'Last Bar', key: 'last_date', align: 'start' },
  { title: 'Expected', key: 'expected_days', align: 'end' },
  { title: 'Present', key: 'present_days', align: 'end' },
  { title: 'Gaps', key: 'gap_days', align: 'end' },
  { title: 'Gap %', key: 'gap_pct', align: 'end' },
]

function num(v) {
  return v != null ? Number(v).toLocaleString() : '—'
}

function pct(v) {
  return v != null ? `${Number(v).toFixed(2)}%` : '—'
}

// Highlight severity by gap percentage: ≥10% is bad (error), any gap is a warning.
function gapClass(gapPct) {
  const n = Number(gapPct) || 0
  if (n >= 10) return 'text-error font-weight-bold'
  if (n > 0) return 'text-warning font-weight-bold'
  return 'text-medium-emphasis'
}
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center ga-2 py-3">
      <span class="text-subtitle-1 font-weight-medium">Symbols With Most Gaps</span>
      <v-chip color="warning" variant="tonal" size="small">{{ items.length }}</v-chip>
      <v-chip v-if="referenceTicker" color="primary" variant="tonal" size="small">vs {{ referenceTicker }}</v-chip>
      <v-spacer />
      <v-btn icon="mdi-refresh" size="small" variant="text" :loading="loading" @click="$emit('refresh')" />
    </v-card-title>
    <v-divider />

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="ma-4">{{ error }}</v-alert>

    <v-data-table
      v-else
      :headers="headers"
      :items="items"
      :loading="loading"
      item-value="symbol_id"
      :items-per-page="10"
      :sort-by="[{ key: 'gap_days', order: 'desc' }]"
      no-data-text="No gap data available"
    >
      <template #item.ticker="{ item }">
        <span class="font-weight-bold">{{ item.ticker ?? '—' }}</span>
      </template>
      <template #item.first_date="{ item }">
        <span class="mono text-caption text-medium-emphasis">{{ item.first_date ?? '—' }}</span>
      </template>
      <template #item.last_date="{ item }">
        <span class="mono text-caption text-medium-emphasis">{{ item.last_date ?? '—' }}</span>
      </template>
      <template #item.expected_days="{ item }">
        <span class="mono">{{ num(item.expected_days) }}</span>
      </template>
      <template #item.present_days="{ item }">
        <span class="mono text-success">{{ num(item.present_days) }}</span>
      </template>
      <template #item.gap_days="{ item }">
        <span class="mono" :class="gapClass(item.gap_pct)">{{ num(item.gap_days) }}</span>
      </template>
      <template #item.gap_pct="{ item }">
        <span class="mono" :class="gapClass(item.gap_pct)">{{ pct(item.gap_pct) }}</span>
      </template>
    </v-data-table>
  </v-card>
</template>
