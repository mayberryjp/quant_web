<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Per-day coverage points: { bar_date, symbols_with_bar, symbols_missing, coverage_pct }.
  points: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  referenceTicker: { type: String, default: '' },
})

const hasData = computed(() => props.points.length > 0)

const chartSeries = computed(() => [
  {
    name: 'Symbols With Bars',
    type: 'line',
    data: props.points.map((p) => [new Date(p.bar_date).getTime(), Number(p.symbols_with_bar) || 0]),
  },
  {
    name: 'Symbols Missing',
    type: 'area',
    data: props.points.map((p) => [new Date(p.bar_date).getTime(), Number(p.symbols_missing) || 0]),
  },
])

const chartOptions = computed(() => ({
  chart: {
    type: 'line',
    background: '#0d1117',
    toolbar: { show: false },
    zoom: { enabled: true, type: 'x' },
    fontFamily: 'inherit',
    animations: { enabled: true, easing: 'easeinout', speed: 800 },
  },
  theme: { mode: 'dark' },
  // With bars = green line, Missing = crimson gradient area.
  colors: ['#5CDD8B', '#B71C1C'],
  fill: {
    type: ['solid', 'gradient'],
    opacity: [1, 0.3],
    gradient: {
      shade: 'dark',
      type: 'vertical',
      shadeIntensity: 1,
      opacityFrom: 0.45,
      opacityTo: 0.03,
      stops: [0, 90, 100],
    },
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: [3, 2], lineCap: 'round' },
  markers: { size: 0, hover: { size: 6 } },
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'right',
    labels: { colors: '#b1b8c0' },
  },
  grid: {
    borderColor: '#333',
    row: { colors: ['transparent', 'transparent'], opacity: 0.1 },
  },
  xaxis: {
    type: 'datetime',
    labels: { style: { colors: '#b1b8c0' }, datetimeUTC: false },
    axisBorder: { color: '#333' },
    axisTicks: { color: '#333' },
  },
  yaxis: {
    min: 0,
    title: { text: 'Symbols', style: { color: '#5CDD8B' } },
    labels: {
      style: { colors: '#b1b8c0' },
      formatter: (v) => Math.round(v).toLocaleString(),
    },
  },
  tooltip: {
    theme: 'dark',
    shared: true,
    intersect: false,
    x: { format: 'yyyy-MM-dd' },
    y: { formatter: (v) => Math.round(v).toLocaleString() },
  },
}))
</script>

<template>
  <v-card color="#0d1117" class="chart-card">
    <v-card-title class="chart-header d-flex align-center px-4 py-3">
      <span class="text-h6 text-sm-h5 text-md-h4 chart-title">Coverage Gaps</span>
      <v-chip v-if="referenceTicker" color="primary" variant="tonal" size="small" class="ml-2">
        vs {{ referenceTicker }}
      </v-chip>
      <v-spacer />
      <span class="text-caption text-grey">symbols per trading day</span>
    </v-card-title>
    <v-divider />

    <v-card-text v-if="error" class="chart-state text-center">
      <v-icon color="warning" size="28" class="mb-2">mdi-alert-circle-outline</v-icon>
      <div class="text-grey">{{ error }}</div>
    </v-card-text>

    <div v-else-if="loading" class="chart-state">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-card-text v-else-if="!hasData" class="chart-state text-center">
      <v-icon color="grey" size="28" class="mb-2">mdi-chart-line</v-icon>
      <div class="text-grey">No coverage data available.</div>
    </v-card-text>

    <div v-else class="chart-wrap">
      <apexchart type="line" height="320" :options="chartOptions" :series="chartSeries" />
    </div>
  </v-card>
</template>

<style scoped>
.chart-card {
  overflow: hidden;
}

.chart-title {
  color: #ffffff;
}

.chart-wrap {
  padding: 12px 12px 4px;
}

.chart-state {
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* ApexCharts tooltip internals can only be themed via deep CSS. */
:deep(.apexcharts-tooltip) {
  background: #1e1e1e !important;
  border: none !important;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4) !important;
}
:deep(.apexcharts-tooltip-title) {
  background: #2d2d2d !important;
  border-bottom: 1px solid #3a3a3a !important;
}
</style>
