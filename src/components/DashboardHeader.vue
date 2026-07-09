<script setup>
import { computed } from 'vue'

const props = defineProps({
  totalPnL: { type: Number, default: 0 },
  costBasis: { type: Number, default: 0 },
  accountValue: { type: Number, default: 0 },
  openPositions: { type: Number, default: 0 },
})

function currency(value) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const statusStats = computed(() => [
  {
    label: 'Account Value',
    description: 'Total',
    value: `$${currency(props.accountValue)}`,
    color: 'stat-neutral',
  },
  {
    label: 'P&L',
    description: 'Realized',
    value: `${props.totalPnL >= 0 ? '+' : '-'}$${currency(Math.abs(props.totalPnL))}`,
    color: props.totalPnL >= 0 ? 'stat-profit' : 'stat-loss',
  },
  {
    label: 'Cost Basis',
    description: 'Invested',
    value: `$${currency(props.costBasis)}`,
    color: 'stat-neutral',
  },
  {
    label: 'Positions',
    description: 'Open',
    value: props.openPositions,
    color: 'stat-info',
  },
])
</script>

<template>
  <v-row class="quickstats-background ma-0 rounded-lg">
    <v-col
      v-for="(stat, index) in statusStats"
      :key="index"
      cols="6"
      sm="6"
      md="3"
      class="bg-transparent"
    >
      <v-card variant="plain" class="text-center pa-2 pa-sm-4 bg-transparent border-none">
        <div class="text-subtitle-1 text-sm-h6 text-md-h5 font-weight-medium stat-label mb-1">
          {{ stat.label }}
        </div>
        <div class="stat-description mb-1">{{ stat.description }}</div>
        <div :class="['text-h6 text-sm-h5 text-md-h4 font-weight-bold mono', stat.color]">
          {{ stat.value }}
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.quickstats-background {
  background-color: #0d1117 !important;
  color: rgba(255, 255, 255, 0.87);
  padding: 5px;
}

.stat-label {
  color: rgb(177, 184, 192);
}

.stat-description {
  font-size: 14px;
  color: #8b949e;
  font-weight: 400;
  line-height: 1.2;
}

.stat-profit {
  color: #5cdd8b !important;
}

.stat-loss {
  color: #dc3545 !important;
}

.stat-neutral {
  color: #ffffff !important;
}

.stat-info {
  color: #3498db !important;
}

@media (max-width: 599px) {
  .stat-description {
    font-size: 12px;
  }
}
</style>

