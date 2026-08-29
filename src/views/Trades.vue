<script setup>
import { ref, onMounted } from 'vue'
import { getTrades } from '../api/trades.js'

const trades = ref([])
const count = ref(0)
const loading = ref(false)
const error = ref(null)
const search = ref('')

const headers = [
  { title: 'Symbol', key: 'symbol', align: 'start' },
  { title: 'Side', key: 'side', align: 'start' },
  { title: 'Type', key: 'position_type', align: 'start' },
  { title: 'Status', key: 'status', align: 'start' },
  { title: 'Qty', key: 'quantity', align: 'end' },
  { title: 'Trigger', key: 'trigger_price', align: 'end' },
  { title: 'Target Buy', key: 'target_buy_price', align: 'end' },
  { title: 'Filled Qty', key: 'filled_quantity', align: 'end' },
  { title: 'Filled Avg', key: 'filled_avg_price', align: 'end' },
  { title: 'Target Sell', key: 'target_sell_price', align: 'end' },
  { title: 'Exit Avg', key: 'exit_filled_avg_price', align: 'end' },
  { title: 'Exit Reason', key: 'exit_reason', align: 'start' },
  { title: 'Notional', key: 'notional', align: 'end' },
  { title: 'Trigger Reason', key: 'trigger_reason', align: 'start' },
  { title: 'Broker', key: 'broker', align: 'start' },
  { title: 'Created', key: 'created_at', align: 'start' },
  { title: 'Filled', key: 'filled_at', align: 'start' },
  { title: 'Closed', key: 'closed_at', align: 'start' },
]

const sideColor = { buy: 'success', sell: 'error' }
const statusColor = {
  new: 'warning',
  submitted: 'info',
  filled: 'success',
  closed: 'info',
  failed: 'error',
  cancelled: 'grey',
}

function chipColor(map, v) {
  return map[String(v || '').toLowerCase()] ?? 'grey'
}

function money(v) {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return v
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function qty(v) {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return v
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 })
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

async function load() {
  loading.value = true
  error.value = null
  try {
    const data = await getTrades({ mode: 'paper' })
    trades.value = data.trades
    count.value = data.count
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <v-sheet rounded="lg" color="#090c10">
      <v-card-title class="d-flex align-center px-4 py-3">
        <span class="text-h6 text-sm-h5 text-md-h4">Trades</span>
        <v-chip color="primary" variant="tonal" size="small" label class="ml-2 ml-sm-3">PAPER</v-chip>
        <v-chip color="warning" variant="tonal" size="small" class="ml-2">{{ count }}</v-chip>
        <v-spacer />
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Filter"
          density="compact"
          clearable
          hide-details
          single-line
          style="max-width: 220px"
          class="mr-2"
        />
        <v-btn icon="mdi-refresh" variant="text" size="small" :loading="loading" @click="load" />
      </v-card-title>
      <v-divider />

      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="ma-4">
        {{ error }}
      </v-alert>

      <v-data-table
        v-else
        :headers="headers"
        :items="trades"
        :loading="loading"
        :search="search"
        item-value="id"
        no-data-text="No trades found"
        class="app-table"
        density="compact"
        mobile-breakpoint="md"
        :items-per-page="25"
        :sort-by="[{ key: 'created_at', order: 'desc' }]"
      >
        <template #item.symbol="{ item }">
          <router-link :to="`/ticker/${item.symbol}`" class="font-weight-bold text-decoration-none">
            {{ item.symbol }}
          </router-link>
        </template>

        <template #item.side="{ item }">
          <v-chip :color="chipColor(sideColor, item.side)" variant="tonal" size="x-small" label>
            {{ (item.side ?? '—').toUpperCase() }}
          </v-chip>
        </template>

        <template #item.position_type="{ item }">
          <v-chip variant="tonal" size="x-small" label>{{ (item.position_type ?? '—').toUpperCase() }}</v-chip>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="chipColor(statusColor, item.status)" variant="tonal" size="small" label>
            {{ (item.status ?? 'unknown').toUpperCase() }}
          </v-chip>
        </template>

        <template #item.quantity="{ item }">
          <span class="mono">{{ qty(item.quantity) }}</span>
        </template>

        <template #item.trigger_price="{ item }">
          <span class="mono">{{ money(item.trigger_price) }}</span>
        </template>

        <template #item.target_buy_price="{ item }">
          <span class="mono">{{ money(item.target_buy_price) }}</span>
        </template>

        <template #item.filled_quantity="{ item }">
          <span class="mono">{{ qty(item.filled_quantity) }}</span>
        </template>

        <template #item.filled_avg_price="{ item }">
          <span class="mono">{{ money(item.filled_avg_price) }}</span>
        </template>

        <template #item.target_sell_price="{ item }">
          <span class="mono">{{ money(item.target_sell_price) }}</span>
        </template>

        <template #item.exit_filled_avg_price="{ item }">
          <span class="mono">{{ money(item.exit_filled_avg_price) }}</span>
        </template>

        <template #item.exit_reason="{ item }">
          <span class="text-caption text-medium-emphasis">{{ item.exit_reason ?? '—' }}</span>
        </template>

        <template #item.notional="{ item }">
          <span class="mono">{{ money(item.notional) }}</span>
        </template>

        <template #item.trigger_reason="{ item }">
          <span class="text-caption text-medium-emphasis">{{ item.trigger_reason ?? '—' }}</span>
        </template>

        <template #item.broker="{ item }">
          <span class="text-caption text-medium-emphasis">{{ item.broker ?? '—' }}</span>
        </template>

        <template #item.created_at="{ item }">
          <span class="text-caption text-medium-emphasis mono text-no-wrap">{{ fmtDate(item.created_at) }}</span>
        </template>

        <template #item.filled_at="{ item }">
          <span class="text-caption text-medium-emphasis mono text-no-wrap">{{ fmtDate(item.filled_at) }}</span>
        </template>

        <template #item.closed_at="{ item }">
          <span class="text-caption text-medium-emphasis mono text-no-wrap">{{ fmtDate(item.closed_at) }}</span>
        </template>
      </v-data-table>
    </v-sheet>
  </v-container>
</template>
