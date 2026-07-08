<script setup>
import { ref, computed, watch } from 'vue'
import { getPositions } from '../api/positions.js'

const props = defineProps({
  portfolio: { type: String, default: '' },
})

const positions = ref([])
const loading = ref(false)
const error = ref(null)

const headers = [
  { title: 'Ticker', key: 'ticker', align: 'start' },
  { title: 'Market', key: 'market', align: 'start' },
  { title: 'Quantity', key: 'quantity', align: 'end' },
  { title: 'Avg Cost', key: 'avg_cost', align: 'end' },
  { title: 'Cost Basis', key: 'cost_basis', align: 'end', sortable: false },
  { title: 'Realized P&L', key: 'realized_pnl', align: 'end' },
  { title: 'Lots', key: 'lot_count', align: 'center' },
  { title: 'Updated', key: 'updated_at', align: 'start' },
]

async function load() {
  if (!props.portfolio) return
  loading.value = true
  error.value = null
  try {
    positions.value = await getPositions({ portfolio: props.portfolio })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

watch(() => props.portfolio, load, { immediate: true })

function costBasis(pos) {
  return (pos.quantity ?? 0) * (pos.avg_cost ?? 0)
}

function money(v) {
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString() } catch { return iso }
}

const totalCostBasis = computed(() =>
  positions.value.reduce((sum, p) => sum + costBasis(p), 0)
)
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center ga-2">
      <span class="text-subtitle-1 font-weight-medium">Real Positions</span>
      <v-chip color="primary" variant="tonal">{{ positions.length }}</v-chip>
      <v-spacer />
      <v-btn icon="mdi-refresh" size="small" @click="load" />
    </v-card-title>
    <v-divider />

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="ma-4">
      {{ error }}
    </v-alert>

    <v-data-table
      v-else
      :headers="headers"
      :items="positions"
      :loading="loading"
      item-value="id"
      no-data-text="No positions found"
    >
      <template #item.ticker="{ item }">
        <span class="font-weight-bold">{{ item.ticker }}</span>
      </template>
      <template #item.market="{ item }">
        <v-chip size="x-small" color="primary" variant="tonal" label>
          {{ (item.market ?? '—').toUpperCase() }}
        </v-chip>
      </template>
      <template #item.quantity="{ item }">
        <span class="mono">{{ item.quantity ?? 0 }}</span>
      </template>
      <template #item.avg_cost="{ item }">
        <span class="mono">${{ (item.avg_cost ?? 0).toFixed(2) }}</span>
      </template>
      <template #item.cost_basis="{ item }">
        <span class="mono">${{ money(costBasis(item)) }}</span>
      </template>
      <template #item.realized_pnl="{ item }">
        <span class="mono" :class="(item.realized_pnl ?? 0) >= 0 ? 'text-success' : 'text-error'">
          {{ (item.realized_pnl ?? 0) >= 0 ? '+' : '' }}${{ (item.realized_pnl ?? 0).toFixed(2) }}
        </span>
      </template>
      <template #item.lot_count="{ item }">
        <span class="mono">{{ item.lot_count ?? '—' }}</span>
      </template>
      <template #item.updated_at="{ item }">
        <span class="text-disabled text-caption">{{ formatDate(item.updated_at) }}</span>
      </template>

      <template #body.append>
        <tr v-if="positions.length" class="font-weight-bold">
          <td colspan="4" class="text-right text-medium-emphasis text-caption text-uppercase">Total Cost Basis</td>
          <td class="text-right mono">${{ money(totalCostBasis) }}</td>
          <td colspan="3"></td>
        </tr>
      </template>
    </v-data-table>
  </v-card>
</template>

