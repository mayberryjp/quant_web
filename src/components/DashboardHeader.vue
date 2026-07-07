<script setup>
const props = defineProps({
  totalPnL: { type: Number, default: 0 },
  costBasis: { type: Number, default: 0 },
  openPositions: { type: Number, default: 0 },
})

function currency(value) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2 })
}
</script>

<template>
  <v-sheet color="surface-variant" border="b" class="px-6 py-3">
    <v-row align="center" no-gutters>
      <v-col>
        <span class="text-h6 font-weight-bold">⚡ MomentumTrader</span>
      </v-col>
      <v-col cols="auto">
        <div class="d-flex ga-8 text-right">
          <div>
            <div class="text-caption text-medium-emphasis text-uppercase">Realized P&L</div>
            <div
              class="text-subtitle-1 font-weight-medium mono"
              :class="props.totalPnL >= 0 ? 'text-success' : 'text-error'"
            >
              {{ props.totalPnL >= 0 ? '+' : '' }}${{ currency(props.totalPnL) }}
            </div>
          </div>
          <div>
            <div class="text-caption text-medium-emphasis text-uppercase">Cost Basis</div>
            <div class="text-subtitle-1 font-weight-medium mono">${{ currency(props.costBasis) }}</div>
          </div>
          <div>
            <div class="text-caption text-medium-emphasis text-uppercase">Open Positions</div>
            <div class="text-subtitle-1 font-weight-medium mono">{{ props.openPositions }}</div>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-sheet>
</template>

