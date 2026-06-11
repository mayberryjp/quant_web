<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  totalPnL: { type: Number, default: 0 },
  costBasis: { type: Number, default: 0 },
  openPositions: { type: Number, default: 0 },
})
</script>

<template>
  <header class="header">
    <div class="header-left">
      <h1 class="logo">⚡ MomentumTrader</h1>
    </div>
    <div class="header-stats">
      <div class="stat">
        <span class="stat-label">Realized P&L</span>
        <span class="stat-value" :class="totalPnL >= 0 ? 'positive' : 'negative'">
          {{ totalPnL >= 0 ? '+' : '' }}${{ totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
        </span>
      </div>
      <div class="stat">
        <span class="stat-label">Cost Basis</span>
        <span class="stat-value">
          ${{ costBasis.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
        </span>
      </div>
      <div class="stat">
        <span class="stat-label">Open Positions</span>
        <span class="stat-value">{{ openPositions }}</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.header-stats {
  display: flex;
  gap: 32px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.positive {
  color: var(--green);
}

.negative {
  color: var(--red);
}
</style>
