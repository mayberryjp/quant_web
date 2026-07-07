<script setup>
import { ref, watch } from 'vue'
import { getLedgerEntries } from '../api/positions.js'

const props = defineProps({
  portfolio: { type: String, default: '' },
  refreshKey: { type: Number, default: 0 },
})

const entries = ref([])
const loading = ref(false)
const error = ref(null)
const tickerFilter = ref('')
const eventTypeFilter = ref('')

const headers = [
  { title: 'ID', key: 'id', align: 'start' },
  { title: 'Ticker', key: 'ticker', align: 'start' },
  { title: 'Event', key: 'event_type', align: 'start' },
  { title: 'Qty Δ', key: 'quantity_delta', align: 'end' },
  { title: 'Price', key: 'price', align: 'end' },
  { title: 'Fees', key: 'fees', align: 'end' },
  { title: 'Source', key: 'source', align: 'start' },
  { title: 'Reason', key: 'reason', align: 'start', sortable: false },
  { title: 'Occurred', key: 'occurred_at', align: 'start' },
]

const eventFilterOptions = [
  { value: '', title: 'All events' },
  { value: 'opening_balance', title: 'Opening Balance' },
  { value: 'external_position_change', title: 'External Change' },
  { value: 'manual_adjustment', title: 'Manual Adjustment' },
  { value: 'transfer_in', title: 'Transfer In' },
  { value: 'transfer_out', title: 'Transfer Out' },
  { value: 'stock_split', title: 'Stock Split' },
  { value: 'fee', title: 'Fee' },
  { value: 'correction', title: 'Correction' },
]

async function load() {
  if (!props.portfolio) return
  loading.value = true
  error.value = null
  try {
    const params = { portfolio: props.portfolio, limit: '50' }
    if (tickerFilter.value.trim()) params.ticker = tickerFilter.value.trim().toUpperCase()
    if (eventTypeFilter.value) params.event_type = eventTypeFilter.value
    entries.value = await getLedgerEntries(params)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

watch(() => props.portfolio, load, { immediate: true })
watch(() => props.refreshKey, load)

function formatDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleString() } catch { return iso }
}

function eventColor(type) {
  if (!type) return 'primary'
  if (type.includes('adjustment') || type.includes('correction')) return 'warning'
  if (type.includes('transfer_out') || type.includes('fee')) return 'error'
  return 'primary'
}
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center ga-2 flex-wrap">
      <span class="text-subtitle-1 font-weight-medium">Ledger History</span>
      <v-chip color="warning" variant="tonal">{{ entries.length }}</v-chip>
      <v-spacer />
      <v-text-field
        v-model="tickerFilter"
        label="Ticker"
        style="max-width: 130px"
        clearable
        @keyup.enter="load"
        @click:clear="load"
      />
      <v-select
        v-model="eventTypeFilter"
        :items="eventFilterOptions"
        label="Event"
        style="max-width: 180px"
        @update:model-value="load"
      />
      <v-btn icon="mdi-refresh" size="small" @click="load" />
    </v-card-title>
    <v-divider />

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="ma-4">
      {{ error }}
    </v-alert>

    <v-data-table
      v-else
      :headers="headers"
      :items="entries"
      :loading="loading"
      item-value="id"
      hide-default-footer
      :items-per-page="-1"
      no-data-text="No ledger entries"
    >
      <template #item.id="{ item }">
        <span class="mono text-disabled">{{ item.id }}</span>
      </template>
      <template #item.ticker="{ item }">
        <span class="font-weight-bold">{{ item.ticker }}</span>
      </template>
      <template #item.event_type="{ item }">
        <v-chip size="x-small" label variant="tonal" :color="eventColor(item.event_type)">
          {{ item.event_type?.replace(/_/g, ' ') }}
        </v-chip>
      </template>
      <template #item.quantity_delta="{ item }">
        <span class="mono" :class="(item.quantity_delta ?? 0) >= 0 ? 'text-success' : 'text-error'">
          {{ (item.quantity_delta ?? 0) >= 0 ? '+' : '' }}{{ item.quantity_delta }}
        </span>
      </template>
      <template #item.price="{ item }">
        <span class="mono">{{ item.price != null ? '$' + Number(item.price).toFixed(2) : '—' }}</span>
      </template>
      <template #item.fees="{ item }">
        <span class="mono">{{ item.fees != null && Number(item.fees) > 0 ? '$' + Number(item.fees).toFixed(2) : '—' }}</span>
      </template>
      <template #item.source="{ item }">
        <span class="text-disabled text-caption">{{ item.source ?? '—' }}</span>
      </template>
      <template #item.reason="{ item }">
        <span class="text-medium-emphasis text-caption d-inline-block text-truncate" style="max-width: 150px" :title="item.reason">
          {{ item.reason || '—' }}
        </span>
      </template>
      <template #item.occurred_at="{ item }">
        <span class="text-disabled text-caption">{{ formatDate(item.occurred_at) }}</span>
      </template>
    </v-data-table>
  </v-card>
</template>

