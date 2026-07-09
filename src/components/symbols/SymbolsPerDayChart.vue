<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Daily points: { date, total_symbols, new_symbols, delisted_symbols }.
  points: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const hasData = computed(() => props.points.length > 0)

const categories = computed(() => props.points.map((p) => p.date))

const chartSeries = computed(() => [
  { name: 'Total Symbols', type: 'area', data: props.points.map((p) => Number(p.total_symbols) || 0) },
  { name: 'New Listings', type: 'line', data: props.points.map((p) => Number(p.new_symbols) || 0) },
  { name: 'Delisted', type: 'line', data: props.points.map((p) => Number(p.delisted_symbols) || 0) },
])

const chartOptions = computed(() => ({
  chart: {
    type: 'line',
    background: '#0d1117',
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'inherit',
    animations: { enabled: true, easing: 'easeinout', speed: 800 },
  },
  theme: { mode: 'dark' },
  // Total = blue gradient area, New listings = green, Delisted = crimson.
  colors: ['#3498db', '#5CDD8B', '#B71C1C'],
  fill: {
    type: ['gradient', 'solid', 'solid'],
    opacity: [0.3, 1, 1],
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
  stroke: { curve: 'smooth', width: [3, 2, 2], lineCap: 'round' },
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
    type: 'category',
    categories: categories.value,
    tickAmount: 8,
    labels: { style: { colors: '#b1b8c0' }, rotate: -45, rotateAlways: false },
    axisBorder: { color: '#333' },
    axisTicks: { color: '#333' },
  },
  yaxis: [
    {
      seriesName: 'Total Symbols',
      min: 0,
      title: { text: 'Total', style: { color: '#3498db' } },
      labels: {
        style: { colors: '#b1b8c0' },
        formatter: (v) => Math.round(v).toLocaleString(),
      },
    },
    {
      seriesName: 'New Listings',
      opposite: true,
      min: 0,
      title: { text: 'New / Delisted', style: { color: '#5CDD8B' } },
      labels: {
        style: { colors: '#b1b8c0' },
        formatter: (v) => Math.round(v).toLocaleString(),
      },
    },
    {
      seriesName: 'New Listings',
      opposite: true,
      min: 0,
      show: false,
      labels: { formatter: (v) => Math.round(v).toLocaleString() },
    },
  ],
  tooltip: {
    theme: 'dark',
    shared: true,
    intersect: false,
    y: { formatter: (v) => Math.round(v).toLocaleString() },
  },
}))
</script>

<template>
  <v-card color="#0d1117" class="chart-card">
    <v-card-title class="chart-header d-flex align-center px-4 py-3">
      <span class="text-h6 text-sm-h5 text-md-h4 chart-title">Symbols in Database</span>
      <v-spacer />
      <span class="text-caption text-grey">per day</span>
    </v-card-title>
    <v-divider />

    <div v-if="loading" class="chart-state">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-card-text v-else-if="!hasData" class="chart-state text-center">
      <v-icon color="grey" size="28" class="mb-2">mdi-chart-line</v-icon>
      <div class="text-grey">No history available.</div>
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
