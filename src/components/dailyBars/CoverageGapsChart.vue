<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps({
  // Per-day coverage points: { bar_date, symbols_with_bar, symbols_missing, coverage_pct }.
  points: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  referenceTicker: { type: String, default: '' },
})

const theme = useTheme()
const colors = computed(() => theme.current.value.colors)

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
    background: 'transparent',
    toolbar: { show: false },
    zoom: { enabled: true, type: 'x' },
    fontFamily: 'inherit',
    animations: { enabled: true, easing: 'easeinout', speed: 800 },
    dropShadow: { enabled: true, top: 3, left: 0, blur: 4, opacity: 0.2 },
  },
  theme: { mode: 'dark' },
  // With bars = success (green line), Missing = error (red gradient area).
  colors: [colors.value.success, colors.value.error],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: [3, 2], lineCap: 'round' },
  fill: {
    type: ['solid', 'gradient'],
    gradient: {
      shade: 'dark',
      type: 'vertical',
      shadeIntensity: 1,
      opacityFrom: 0.45,
      opacityTo: 0.03,
      stops: [0, 90, 100],
    },
  },
  markers: { size: 0, hover: { size: 6 } },
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'right',
    fontWeight: 500,
    labels: { colors: colors.value['on-surface-variant'] },
    markers: { width: 10, height: 10, radius: 12 },
    itemMargin: { horizontal: 10 },
  },
  grid: {
    borderColor: colors.value['surface-bright'],
    strokeDashArray: 4,
    row: { colors: ['transparent', 'rgba(255, 255, 255, 0.02)'], opacity: 1 },
    padding: { left: 8, right: 8 },
  },
  xaxis: {
    type: 'datetime',
    labels: { style: { colors: colors.value['on-surface-variant'] }, datetimeUTC: false },
    axisBorder: { color: colors.value['surface-bright'] },
    axisTicks: { color: colors.value['surface-bright'] },
    crosshairs: { stroke: { color: colors.value['surface-bright'], dashArray: 3 } },
  },
  yaxis: {
    min: 0,
    title: { text: 'Symbols', style: { color: colors.value['on-surface-variant'], fontWeight: 500 } },
    labels: {
      style: { colors: colors.value['on-surface-variant'] },
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
  <v-card color="surface-variant">
    <v-card-title class="d-flex align-center py-3">
      <span class="text-subtitle-1 font-weight-medium">Coverage Gaps</span>
      <v-chip v-if="referenceTicker" color="primary" variant="tonal" size="small" class="ml-2">
        vs {{ referenceTicker }}
      </v-chip>
      <v-spacer />
      <span class="text-caption text-medium-emphasis">symbols per trading day</span>
    </v-card-title>
    <v-divider />
    <v-card-text>
      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-0">
        {{ error }}
      </v-alert>
      <div v-else-if="loading" class="d-flex justify-center align-center" style="height: 320px">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <div
        v-else-if="!hasData"
        class="d-flex flex-column align-center justify-center text-medium-emphasis"
        style="height: 320px"
      >
        <span class="text-body-2">No coverage data available</span>
      </div>
      <apexchart v-else type="line" height="320" :options="chartOptions" :series="chartSeries" />
    </v-card-text>
  </v-card>
</template>

<style scoped>
/* ApexCharts tooltip internals can only be themed via deep CSS. */
:deep(.apexcharts-tooltip) {
  border: none !important;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45) !important;
  background: rgb(var(--v-theme-surface)) !important;
}
:deep(.apexcharts-tooltip-title) {
  background: rgb(var(--v-theme-surface-bright)) !important;
  border-bottom: none !important;
  font-weight: 600;
}
</style>
