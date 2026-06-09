<script setup>
import { ref } from 'vue'

const positions = ref([
  {
    symbol: 'NVDA',
    shares: 50,
    avgCost: 124.30,
    currentPrice: 131.85,
    side: 'LONG',
  },
  {
    symbol: 'SMCI',
    shares: 100,
    avgCost: 42.10,
    currentPrice: 46.75,
    side: 'LONG',
  },
  {
    symbol: 'MSTR',
    shares: 30,
    avgCost: 415.00,
    currentPrice: 402.20,
    side: 'LONG',
  },
  {
    symbol: 'PLTR',
    shares: 200,
    avgCost: 78.50,
    currentPrice: 83.10,
    side: 'LONG',
  },
  {
    symbol: 'COIN',
    shares: 40,
    avgCost: 265.00,
    currentPrice: 271.40,
    side: 'LONG',
  },
])

function pnl(pos) {
  return (pos.currentPrice - pos.avgCost) * pos.shares
}

function pnlPercent(pos) {
  return ((pos.currentPrice - pos.avgCost) / pos.avgCost) * 100
}

function marketValue(pos) {
  return pos.currentPrice * pos.shares
}
</script>

<template>
  <section class="card">
    <div class="card-header">
      <h2>Positions</h2>
      <span class="badge">{{ positions.length }}</span>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Side</th>
          <th class="right">Shares</th>
          <th class="right">Avg Cost</th>
          <th class="right">Price</th>
          <th class="right">Mkt Value</th>
          <th class="right">P&L</th>
          <th class="right">%</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="pos in positions" :key="pos.symbol">
          <td class="symbol">{{ pos.symbol }}</td>
          <td>
            <span class="side-badge" :class="pos.side === 'LONG' ? 'long' : 'short'">
              {{ pos.side }}
            </span>
          </td>
          <td class="right mono">{{ pos.shares }}</td>
          <td class="right mono">${{ pos.avgCost.toFixed(2) }}</td>
          <td class="right mono">${{ pos.currentPrice.toFixed(2) }}</td>
          <td class="right mono">${{ marketValue(pos).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</td>
          <td class="right mono" :class="pnl(pos) >= 0 ? 'positive' : 'negative'">
            {{ pnl(pos) >= 0 ? '+' : '' }}${{ pnl(pos).toFixed(2) }}
          </td>
          <td class="right mono" :class="pnlPercent(pos) >= 0 ? 'positive' : 'negative'">
            {{ pnlPercent(pos) >= 0 ? '+' : '' }}{{ pnlPercent(pos).toFixed(2) }}%
          </td>
        </tr>
      </tbody>
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

.table {
  width: 100%;
  border-collapse: collapse;
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
  border-bottom: 1px solid var(--border);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.right {
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

.side-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  letter-spacing: 0.5px;
}

.side-badge.long {
  background: var(--green-bg);
  color: var(--green);
}

.side-badge.short {
  background: var(--red-bg);
  color: var(--red);
}

.positive {
  color: var(--green);
}

.negative {
  color: var(--red);
}
</style>
