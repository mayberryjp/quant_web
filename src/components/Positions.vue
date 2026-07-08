<script setup>
import { computed } from 'vue'

const props = defineProps({
  positions: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
})
const emit = defineEmits(['refresh'])

const headers = [
  { title: 'Ticker', key: 'ticker', align: 'start' },
  { title: 'Qty', key: 'quantity', align: 'end' },
  { title: 'Avg Cost', key: 'avg_cost', align: 'end' },
  { title: 'Cost Basis', key: 'cost_basis', align: 'end', sortable: false },
  { title: 'Realized P&L', key: 'realized_pnl', align: 'end' },
  { title: 'Market', key: 'market', align: 'start' },
]

function costBasis(pos) {
  return (pos.quantity ?? 0) * (pos.avg_cost ?? 0)
}

function money(v) {
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const totalCostBasis = computed(() =>
  props.positions.reduce((sum, p) => sum + costBasis(p), 0)
)

const totalRealizedPnL = computed(() =>
  props.positions.reduce((sum, p) => sum + (p.realized_pnl ?? 0), 0)
)
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center ga-2">
      <span class="text-subtitle-1 font-weight-medium">Positions</span>
      <v-chip color="primary" variant="tonal">{{ positions.length }}</v-chip>
      <v-spacer />
      <v-btn icon="mdi-refresh" size="small" @click="emit('refresh')" />
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
      no-data-text="No positions"
    >
      <template #item.ticker="{ item }">
        <span class="font-weight-bold">{{ item.ticker }}</span>
      </template>
      <template #item.quantity="{ item }">
        <span
          class="mono"
          :class="(item.quantity ?? 0) > 0 ? 'text-success' : (item.quantity ?? 0) < 0 ? 'text-error' : ''"
        >
          {{ item.quantity ?? 0 }}
        </span>
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
      <template #item.market="{ item }">
        <v-chip size="x-small" color="primary" variant="tonal" label>
          {{ (item.market ?? '—').toUpperCase() }}
        </v-chip>
      </template>

      <template #body.append>
        <tr v-if="positions.length" class="font-weight-bold">
          <td colspan="3" class="text-right text-medium-emphasis text-caption text-uppercase">Totals</td>
          <td class="text-right mono">${{ money(totalCostBasis) }}</td>
          <td class="text-right mono" :class="totalRealizedPnL >= 0 ? 'text-success' : 'text-error'">
            {{ totalRealizedPnL >= 0 ? '+' : '' }}${{ totalRealizedPnL.toFixed(2) }}
          </td>
          <td></td>
        </tr>
      </template>
    </v-data-table>
  </v-card>
</template>

