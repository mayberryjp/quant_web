<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps({
  // Daily points: { date, total_symbols, new_symbols, delisted_symbols }.
  points: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const theme = useTheme()
const colors = computed(() => theme.current.value.colors)

const hasData = computed(() => props.points.length > 0)

const categories = computed(() => props.points.map((p) => p.date))

const chartSeries = computed(() => [
  { name: 'Total Symbols', data: props.points.map((p) => Number(p.total_symbols) || 0) },
  { name: 'New Listings', data: props.points.map((p) => Number(p.new_symbols) || 0) },
  { name: 'Delisted', data: props.points.map((p) => Number(p.delisted_symbols) || 0) },
])

const chartOptions = computed(() => ({
  chart: {
    type: 'line',
    background: 'transparent',
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'inherit',
    animations: { easing: 'easeinout', speed: 600 },
  },
  theme: { mode: 'dark' },
  // Total = primary, New listings = success (green), Delisted = error (red).
  colors: [colors.value.primary, colors.value.success, colors.value.error],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: [3, 2, 2] },
  markers: { size: 0, hover: { size: 5 } },
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'right',
    labels: { colors: colors.value['on-surface-variant'] },
  },
  grid: { borderColor: colors.value['surface-bright'], strokeDashArray: 4 },
  xaxis: {
    type: 'category',
    categories: categories.value,
    tickAmount: 8,
    labels: { style: { colors: colors.value['on-surface-variant'] }, rotate: -30, rotateAlways: false },
    axisBorder: { color: colors.value['surface-bright'] },
    axisTicks: { color: colors.value['surface-bright'] },
  },
  yaxis: [
    {
      seriesName: 'Total Symbols',
      min: 0,
      title: { text: 'Total', style: { color: colors.value['on-surface-variant'] } },
      labels: {
        style: { colors: colors.value['on-surface-variant'] },
        formatter: (v) => Math.round(v).toLocaleString(),
      },
    },
    {
      seriesName: 'New Listings',
      opposite: true,
      min: 0,
      title: { text: 'New / Delisted', style: { color: colors.value['on-surface-variant'] } },
      labels: {
        style: { colors: colors.value['on-surface-variant'] },
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
  <v-card>
    <v-card-title class="d-flex align-center py-3">
      <span class="text-subtitle-1 font-weight-medium">Symbols in Database</span>
      <v-spacer />
      <span class="text-caption text-medium-emphasis">per day</span>
    </v-card-title>
    <v-divider />
    <v-card-text>
      <div v-if="loading" class="d-flex justify-center align-center" style="height: 320px">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <div
        v-else-if="!hasData"
        class="d-flex flex-column align-center justify-center text-medium-emphasis"
        style="height: 320px"
      >
        <span class="text-body-2">No history available</span>
      </div>
      <apexchart v-else type="line" height="320" :options="chartOptions" :series="chartSeries" />
    </v-card-text>
  </v-card>
</template>
