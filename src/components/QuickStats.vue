<script setup>
defineProps({
  // Array of { label, value, description?, color? }.
  // `color` is one of the stat-* classes below (defaults to stat-neutral).
  stats: { type: Array, default: () => [] },
  mdCols: { type: [String, Number], default: 3 },
  fillWidth: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <v-row justify="center" class="quickstats-background ma-0 rounded-lg">
    <v-col
      v-for="(stat, index) in stats"
      :key="index"
      cols="6"
      sm="6"
      :md="mdCols"
      :class="['bg-transparent', { 'quickstats-fill-width': fillWidth }]"
    >
      <v-card variant="plain" class="text-center pa-2 pa-sm-4 bg-transparent border-none">
        <div class="text-subtitle-1 text-sm-h6 text-md-h5 font-weight-medium stat-label mb-1">
          {{ stat.label }}
        </div>
        <div class="stat-description mb-1">{{ stat.description || '' }}</div>
        <div v-if="loading" class="d-flex justify-center py-1">
          <v-progress-circular indeterminate size="22" width="2" color="primary" />
        </div>
        <div
          v-else
          class="text-h6 text-sm-h5 text-md-h4 font-weight-bold mono"
          :class="stat.color || 'stat-neutral'"
          style="word-break: break-word"
          :title="String(stat.value)"
        >
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

@media (min-width: 960px) {
  .quickstats-fill-width {
    flex: 1 1 0 !important;
    max-width: none !important;
  }
}
</style>
