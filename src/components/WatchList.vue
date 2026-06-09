<script setup>
import { ref } from 'vue'

const watchlist = ref([
  {
    symbol: 'AMD',
    price: 168.42,
    change: 5.23,
    changePercent: 3.20,
    volume: '42.1M',
    relVolume: 2.4,
    float: '1.6B',
    momentum: 'high',
  },
  {
    symbol: 'TSLA',
    price: 342.10,
    change: -8.50,
    changePercent: -2.42,
    volume: '98.3M',
    relVolume: 1.8,
    float: '3.2B',
    momentum: 'medium',
  },
  {
    symbol: 'RKLB',
    price: 28.75,
    change: 4.12,
    changePercent: 16.73,
    volume: '31.5M',
    relVolume: 5.1,
    float: '450M',
    momentum: 'high',
  },
  {
    symbol: 'IONQ',
    price: 42.30,
    change: 2.85,
    changePercent: 7.22,
    volume: '18.7M',
    relVolume: 3.6,
    float: '198M',
    momentum: 'high',
  },
  {
    symbol: 'AAPL',
    price: 228.50,
    change: -1.20,
    changePercent: -0.52,
    volume: '55.2M',
    relVolume: 0.9,
    float: '15.4B',
    momentum: 'low',
  },
  {
    symbol: 'AFRM',
    price: 61.40,
    change: 3.90,
    changePercent: 6.78,
    volume: '12.8M',
    relVolume: 2.9,
    float: '280M',
    momentum: 'high',
  },
])

function momentumClass(level) {
  return {
    high: 'momentum-high',
    medium: 'momentum-medium',
    low: 'momentum-low',
  }[level]
}
</script>

<template>
  <section class="card">
    <div class="card-header">
      <h2>Watch List</h2>
      <span class="badge">{{ watchlist.length }}</span>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th class="right">Price</th>
          <th class="right">Change</th>
          <th class="right">%</th>
          <th class="right">Volume</th>
          <th class="right">RVOL</th>
          <th>Momentum</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="stock in watchlist" :key="stock.symbol">
          <td class="symbol">{{ stock.symbol }}</td>
          <td class="right mono">${{ stock.price.toFixed(2) }}</td>
          <td class="right mono" :class="stock.change >= 0 ? 'positive' : 'negative'">
            {{ stock.change >= 0 ? '+' : '' }}{{ stock.change.toFixed(2) }}
          </td>
          <td class="right mono" :class="stock.changePercent >= 0 ? 'positive' : 'negative'">
            {{ stock.changePercent >= 0 ? '+' : '' }}{{ stock.changePercent.toFixed(2) }}%
          </td>
          <td class="right mono">{{ stock.volume }}</td>
          <td class="right mono" :class="stock.relVolume >= 2 ? 'highlight' : ''">
            {{ stock.relVolume.toFixed(1) }}x
          </td>
          <td>
            <span class="momentum-badge" :class="momentumClass(stock.momentum)">
              {{ stock.momentum.toUpperCase() }}
            </span>
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
  background: var(--yellow-bg);
  color: var(--yellow);
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

.positive {
  color: var(--green);
}

.negative {
  color: var(--red);
}

.highlight {
  color: var(--yellow);
  font-weight: 600;
}

.momentum-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  letter-spacing: 0.5px;
}

.momentum-high {
  background: var(--green-bg);
  color: var(--green);
}

.momentum-medium {
  background: var(--yellow-bg);
  color: var(--yellow);
}

.momentum-low {
  background: rgba(107, 114, 128, 0.15);
  color: var(--text-muted);
}
</style>
