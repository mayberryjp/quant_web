<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  positions: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
})
const emit = defineEmits(['refresh'])

function costBasis(pos) {
  return (pos.quantity ?? 0) * (pos.avg_cost ?? 0)
}

const totalCostBasis = computed(() =>
  props.positions.reduce((sum, p) => sum + costBasis(p), 0)
)

const totalRealizedPnL = computed(() =>
  props.positions.reduce((sum, p) => sum + (p.realized_pnl ?? 0), 0)
)
</script>

<template>
  <section class="card">
    <div class="card-header">
      <h2>Positions</h2>
      <span class="badge">{{ positions.length }}</span>
      <button class="refresh-btn" @click="emit('refresh')">↻</button>
    </div>

    <div v-if="loading" class="card-status">Loading…</div>
    <div v-else-if="error" class="card-status error-text">{{ error }}</div>
    <div v-else-if="!positions.length" class="card-status muted">No positions</div>

    <table v-else class="table">
      <colgroup>
        <col style="width: 15%" />
        <col style="width: 12%" />
        <col style="width: 18%" />
        <col style="width: 20%" />
        <col style="width: 20%" />
        <col style="width: 15%" />
      </colgroup>
      <thead>
        <tr>
          <th>Ticker</th>
          <th class="right">Qty</th>
          <th class="right">Avg Cost</th>
          <th class="right">Cost Basis</th>
          <th class="right">Realized P&L</th>
          <th>Market</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="pos in positions" :key="pos.id">
          <td class="symbol">{{ pos.ticker }}</td>
          <td class="right mono" :class="(pos.quantity ?? 0) > 0 ? 'positive' : (pos.quantity ?? 0) < 0 ? 'negative' : ''">
            {{ pos.quantity ?? 0 }}
          </td>
          <td class="right mono">${{ (pos.avg_cost ?? 0).toFixed(2) }}</td>
          <td class="right mono">
            ${{ costBasis(pos).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
          </td>
          <td class="right mono" :class="(pos.realized_pnl ?? 0) >= 0 ? 'positive' : 'negative'">
            {{ (pos.realized_pnl ?? 0) >= 0 ? '+' : '' }}${{ (pos.realized_pnl ?? 0).toFixed(2) }}
          </td>
          <td>
            <span class="market-badge">{{ (pos.market ?? '—').toUpperCase() }}</span>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="3" class="total-label">Totals</td>
          <td class="right mono">
            ${{ totalCostBasis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
          </td>
          <td class="right mono" :class="totalRealizedPnL >= 0 ? 'positive' : 'negative'">
            {{ totalRealizedPnL >= 0 ? '+' : '' }}${{ totalRealizedPnL.toFixed(2) }}
          </td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </section>
</template>

<style scoped>
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

.card-header h2 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--blue-bg);
  color: var(--blue);
}

.refresh-btn {
  margin-left: auto;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
}

.refresh-btn:hover {
  color: var(--text-primary);
  background: var(--bg-card);
}

.card-status {
  padding: 24px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
}

.error-text {
  color: var(--red);
}

.muted {
  color: var(--text-muted);
}

.table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.table th {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.table td {
  padding: 10px 12px;
  font-size: 13px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.right,
.table th.right,
.table td.right {
  text-align: right;
}

.mono {
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-variant-numeric: tabular-nums;
}

.symbol {
  font-weight: 600;
  color: var(--text-primary);
}

.market-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  letter-spacing: 0.5px;
  background: var(--blue-bg);
  color: var(--blue);
}

.positive {
  color: var(--green);
}

.negative {
  color: var(--red);
}

.total-row td {
  border-top: 1px solid var(--border);
  border-bottom: none;
  font-weight: 600;
  padding: 10px 12px;
}

.total-label {
  text-align: right;
  color: var(--text-secondary);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
