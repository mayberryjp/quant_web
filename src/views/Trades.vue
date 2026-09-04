<script setup>
import { ref, computed, onMounted } from 'vue'
import { getTrades, getDailyPnl } from '../api/trades.js'

const trades = ref([])
const count = ref(0)
const loading = ref(false)
const error = ref(null)
const search = ref('')

const pnl = ref([])
const pnlLoading = ref(false)
const pnlError = ref(null)
const pnlMode = ref('paper')

const filteredPnl = computed(() =>
  pnl.value.filter((r) => String(r.execution_mode || '').toLowerCase() === pnlMode.value)
)

const pnlHeaders = [
  { title: 'Date', key: 'trade_date', align: 'start' },
  { title: 'Mode', key: 'execution_mode', align: 'start' },
  { title: 'Trades', key: 'total_trades', align: 'end' },
  { title: 'Symbols', key: 'symbols_traded', align: 'end' },
  { title: 'Wins', key: 'winning_trades', align: 'end' },
  { title: 'Losses', key: 'losing_trades', align: 'end' },
  { title: 'Breakeven', key: 'breakeven_trades', align: 'end' },
  { title: 'Win Rate', key: 'win_rate', align: 'end' },
  { title: 'Realized P&L', key: 'realized_pnl', align: 'end' },
  { title: 'Return', key: 'return_pct', align: 'end' },
  { title: 'Invested', key: 'amount_invested', align: 'end' },
  { title: 'Proceeds', key: 'gross_proceeds', align: 'end' },
  { title: 'Avg Win', key: 'average_win', align: 'end' },
  { title: 'Avg Loss', key: 'average_loss', align: 'end' },
  { title: 'Largest Win', key: 'largest_win', align: 'end' },
  { title: 'Largest Loss', key: 'largest_loss', align: 'end' },
]

const modeColor = { paper: 'primary', live: 'success' }

function pct(v) {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return v
  return `${n.toFixed(2)}%`
}

const headers = [
  { title: 'Created', key: 'created_at', align: 'start' },
  { title: 'Symbol', key: 'symbol', align: 'start' },
  { title: 'Status', key: 'status', align: 'start' },
  { title: 'Qty', key: 'quantity', align: 'end' },
  { title: 'Trigger', key: 'trigger_price', align: 'end' },
  { title: 'Target Buy', key: 'target_buy_price', align: 'end' },
  { title: 'Filled Qty', key: 'filled_quantity', align: 'end' },
  { title: 'Filled Avg', key: 'filled_avg_price', align: 'end' },
  { title: 'Target Sell', key: 'target_sell_price', align: 'end' },
  { title: 'Exit Avg', key: 'exit_filled_avg_price', align: 'end' },
  { title: 'Result', key: 'result', align: 'start', sortable: false },
  { title: 'P&L', key: 'pnl_amount', align: 'end', sortable: false },
  { title: 'Exit Reason', key: 'exit_reason', align: 'start' },
  { title: 'Notional', key: 'notional', align: 'end' },
  { title: 'Strategy', key: 'trigger_reason', align: 'start' },
  { title: 'Broker', key: 'broker', align: 'start' },
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

/** Realized P&L in dollars: (exit avg - filled avg) * quantity. Null until exited. */
function pnlAmount(item) {
  const entry = Number(item.filled_avg_price)
  const exit = Number(item.exit_filled_avg_price)
  const q = Number(item.quantity)
  if (!entry || !exit || Number.isNaN(q)) return null
  return (exit - entry) * q
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

function fmtDay(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fmtTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
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

async function loadPnl() {
  pnlLoading.value = true
  pnlError.value = null
  try {
    const data = await getDailyPnl()
    pnl.value = data.pnl
  } catch (e) {
    pnlError.value = e.message
  } finally {
    pnlLoading.value = false
  }
}

onMounted(() => {
  loadPnl()
  load()
})
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <v-sheet rounded="lg" color="#090c10" class="mb-4 mb-md-6">
      <v-card-title class="d-flex align-center px-4 py-3">
        <span class="text-h6 text-sm-h5 text-md-h4">Daily P&amp;L</span>
        <v-chip color="warning" variant="tonal" size="small" class="ml-2 ml-sm-3">{{ filteredPnl.length }}</v-chip>
        <v-spacer />
        <v-btn-toggle v-model="pnlMode" mandatory density="compact" variant="outlined" divided class="mr-2">
          <v-btn value="paper" size="small">Paper</v-btn>
          <v-btn value="live" size="small">Live</v-btn>
        </v-btn-toggle>
        <v-btn icon="mdi-refresh" variant="text" size="small" :loading="pnlLoading" @click="loadPnl" />
      </v-card-title>
      <v-divider />

      <v-alert v-if="pnlError" type="error" variant="tonal" density="compact" class="ma-4">
        {{ pnlError }}
      </v-alert>

      <v-data-table
        v-else
        :headers="pnlHeaders"
        :items="filteredPnl"
        :loading="pnlLoading"
        item-value="id"
        no-data-text="No P&L found"
        class="app-table"
        density="compact"
        mobile-breakpoint="md"
        :items-per-page="25"
        :sort-by="[{ key: 'trade_date', order: 'desc' }]"
      >
        <template #item.trade_date="{ item }">
          <span class="mono text-no-wrap">{{ item.trade_date }}</span>
        </template>

        <template #item.execution_mode="{ item }">
          <v-chip :color="chipColor(modeColor, item.execution_mode)" variant="tonal" size="small" label>
            {{ (item.execution_mode ?? '—').toUpperCase() }}
          </v-chip>
        </template>

        <template #item.total_trades="{ item }">
          <span class="mono">{{ item.total_trades ?? 0 }}</span>
        </template>

        <template #item.symbols_traded="{ item }">
          <span class="mono">{{ item.symbols_traded ?? 0 }}</span>
        </template>

        <template #item.winning_trades="{ item }">
          <span class="mono text-success">{{ item.winning_trades ?? 0 }}</span>
        </template>

        <template #item.losing_trades="{ item }">
          <span class="mono text-error">{{ item.losing_trades ?? 0 }}</span>
        </template>

        <template #item.breakeven_trades="{ item }">
          <span class="mono text-medium-emphasis">{{ item.breakeven_trades ?? 0 }}</span>
        </template>

        <template #item.win_rate="{ item }">
          <span class="mono">{{ pct(item.win_rate) }}</span>
        </template>

        <template #item.realized_pnl="{ item }">
          <span class="mono" :class="Number(item.realized_pnl) >= 0 ? 'text-success' : 'text-error'">
            {{ Number(item.realized_pnl) >= 0 ? '+' : '' }}${{ money(item.realized_pnl) }}
          </span>
        </template>

        <template #item.return_pct="{ item }">
          <span class="mono" :class="Number(item.return_pct) >= 0 ? 'text-success' : 'text-error'">
            {{ pct(item.return_pct) }}
          </span>
        </template>

        <template #item.amount_invested="{ item }">
          <span class="mono">${{ money(item.amount_invested) }}</span>
        </template>

        <template #item.gross_proceeds="{ item }">
          <span class="mono">${{ money(item.gross_proceeds) }}</span>
        </template>

        <template #item.average_win="{ item }">
          <span class="mono text-success">${{ money(item.average_win) }}</span>
        </template>

        <template #item.average_loss="{ item }">
          <span class="mono text-error">${{ money(item.average_loss) }}</span>
        </template>

        <template #item.largest_win="{ item }">
          <span class="mono text-success">${{ money(item.largest_win) }}</span>
        </template>

        <template #item.largest_loss="{ item }">
          <span class="mono text-error">${{ money(item.largest_loss) }}</span>
        </template>
      </v-data-table>
    </v-sheet>

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
          <router-link
            :to="{ name: 'ReplayChart', params: { ticker: item.symbol }, query: { date: fmtDay(item.created_at) } }"
            class="font-weight-bold text-decoration-none"
          >
            {{ item.symbol }}
          </router-link>
        </template>

        <template #item.created_at="{ item }">
          <span class="text-caption text-medium-emphasis mono text-no-wrap">{{ fmtDay(item.created_at) }}</span>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="chipColor(statusColor, item.status)" variant="tonal" size="small" label>
            {{ (item.status ?? 'unknown').toUpperCase() }}
          </v-chip>
        </template>

        <template #item.quantity="{ item }">
          <span class="mono">{{ item.quantity == null || item.quantity === '' ? '—' : Math.floor(Number(item.quantity)).toLocaleString() }}</span>
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

        <template #item.result="{ item }">
          <v-chip
            v-if="pnlAmount(item) != null"
            :color="pnlAmount(item) > 0 ? 'success' : pnlAmount(item) < 0 ? 'error' : 'grey'"
            variant="tonal"
            size="small"
            label
          >
            {{ pnlAmount(item) > 0 ? 'WIN' : pnlAmount(item) < 0 ? 'LOSS' : 'EVEN' }}
          </v-chip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.pnl_amount="{ item }">
          <span
            v-if="pnlAmount(item) != null"
            class="mono"
            :class="pnlAmount(item) >= 0 ? 'text-success' : 'text-error'"
          >
            {{ pnlAmount(item) >= 0 ? '+' : '-' }}${{ money(Math.abs(pnlAmount(item))) }}
          </span>
          <span v-else class="mono text-medium-emphasis">—</span>
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

        <template #item.filled_at="{ item }">
          <span class="text-caption text-medium-emphasis mono text-no-wrap">{{ fmtTime(item.filled_at) }}</span>
        </template>

        <template #item.closed_at="{ item }">
          <span class="text-caption text-medium-emphasis mono text-no-wrap">{{ fmtTime(item.closed_at) }}</span>
        </template>
      </v-data-table>
    </v-sheet>
  </v-container>
</template>
