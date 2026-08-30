<script setup>
import { ref, computed, watch } from 'vue'
import { getReplayBars } from '../api/streamingChart.js'

const props = defineProps({
  ticker: { type: String, default: '' },
  date: { type: String, default: '' },
})

function today() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const bars = ref([])
const loading = ref(false)
const error = ref(null)
const selectedDate = ref(props.date || today())
const dateMenu = ref(false)

function toIsoDate(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function onPickDate(value) {
  selectedDate.value = toIsoDate(value)
  dateMenu.value = false
}

function parseTime(value) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function fmtTime(value) {
  const d = parseTime(value)
  if (!d) return value || ''
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

async function loadBars() {
  if (!props.ticker) return
  loading.value = true
  error.value = null
  try {
    const data = await getReplayBars(props.ticker, selectedDate.value)
    bars.value = data.bars
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const sortedBars = computed(() => {
  if (!bars.value.length) return []
  return [...bars.value].sort((a, b) => {
    const aTime = parseTime(a.bar_time)?.getTime() ?? 0
    const bTime = parseTime(b.bar_time)?.getTime() ?? 0
    return aTime - bTime
  })
})

const chartSeries = computed(() => {
  if (!sortedBars.value.length) return []

  return [
    {
      name: 'High (Above Close)',
      type: 'rangeBar',
      data: sortedBars.value.map((b) => ({
        x: fmtTime(b.bar_time),
        y: [Number(b.close) || 0, Number(b.high) || 0],
      })),
    },
    {
      name: 'Low (Below Close)',
      type: 'rangeBar',
      data: sortedBars.value.map((b) => ({
        x: fmtTime(b.bar_time),
        y: [Number(b.low) || 0, Number(b.close) || 0],
      })),
    },
    {
      name: 'Close',
      type: 'line',
      data: sortedBars.value.map((b) => ({
        x: fmtTime(b.bar_time),
        y: Number(b.close) || 0,
      })),
    },
  ]
})

const chartOptions = computed(() => ({
  chart: {
    type: 'line',
    background: '#0d1117',
    toolbar: { show: false },
    zoom: { enabled: true, type: 'x' },
    fontFamily: 'inherit',
    animations: { enabled: true, easing: 'easeinout', speed: 800 },
    stacked: false,
  },
  theme: { mode: 'dark' },
  colors: ['#5CDD8B', '#EF5350', '#1E88E5'],
  fill: {
    type: ['solid', 'solid', 'solid'],
    opacity: [0.4, 0.4, 1],
  },
  stroke: { curve: 'smooth', width: [0, 0, 2], lineCap: 'round' },
  plotOptions: {
    rangeBar: {
      horizontal: false,
      dataLabels: { position: 'top' },
    },
  },
  dataLabels: { enabled: false },
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
    title: { text: 'Time', style: { color: '#b1b8c0' } },
    labels: { style: { colors: '#b1b8c0' }, rotate: -45, hideOverlappingLabels: true },
    axisBorder: { color: '#333' },
    axisTicks: { color: '#333' },
  },
  yaxis: {
    title: { text: 'Price ($)', style: { color: '#5CDD8B' } },
    labels: {
      style: { colors: '#b1b8c0' },
      formatter: (v) => '$' + v.toFixed(2),
    },
  },
  tooltip: {
    theme: 'dark',
    shared: true,
    intersect: false,
    y: [
      {
        formatter: (v) => {
          if (Array.isArray(v)) return '$' + v[0].toFixed(2) + ' - $' + v[1].toFixed(2)
          return '$' + (v || 0).toFixed(2)
        },
      },
      {
        formatter: (v) => {
          if (Array.isArray(v)) return '$' + v[0].toFixed(2) + ' - $' + v[1].toFixed(2)
          return '$' + (v || 0).toFixed(2)
        },
      },
      {
        formatter: (v) => '$' + (v || 0).toFixed(2),
      },
    ],
  },
}))

watch(
  () => props.date,
  (value) => {
    if (value) selectedDate.value = value
  },
)

watch(
  () => selectedDate.value,
  () => {
    if (props.ticker) loadBars()
  },
)

watch(
  () => props.ticker,
  () => {
    if (props.ticker) loadBars()
  },
  { immediate: true }
)
</script>

<template>
  <v-card color="#0d1117" class="chart-card" v-if="props.ticker">
    <v-card-title class="chart-header d-flex align-center px-4 py-3">
      <span class="text-h6 text-sm-h5 text-md-h4 chart-title">{{ props.ticker }} Replay</span>
      <v-spacer />
      <v-menu v-model="dateMenu" :close-on-content-click="false" location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-text-field
            v-bind="menuProps"
            :model-value="selectedDate"
            readonly
            density="compact"
            hide-details
            variant="outlined"
            prepend-inner-icon="mdi-calendar"
            placeholder="yyyy-mm-dd"
            style="max-width: 180px"
            class="mr-2"
          />
        </template>
        <v-date-picker
          :model-value="selectedDate ? new Date(selectedDate) : undefined"
          show-adjacent-months
          @update:model-value="onPickDate"
        />
      </v-menu>
      <v-btn
        icon="mdi-refresh"
        size="small"
        variant="text"
        :loading="loading"
        @click="loadBars"
      />
    </v-card-title>
    <v-divider />

    <v-card-text v-if="error" class="chart-state text-center">
      <v-icon color="warning" size="28" class="mb-2">mdi-alert-circle-outline</v-icon>
      <div class="text-grey">{{ error }}</div>
    </v-card-text>

    <div v-else-if="loading" class="chart-state">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-card-text v-else-if="!bars.length" class="chart-state text-center">
      <v-icon color="grey" size="28" class="mb-2">mdi-chart-line</v-icon>
      <div class="text-grey">No intraday data available for {{ selectedDate }}.</div>
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

:deep(.apexcharts-tooltip) {
  background: #1e1e1e !important;
  border: none !important;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4) !important;
}
:deep(.apexcharts-tooltip-title) {
  background: #2d2d2d !important;
  border-bottom: 1px solid #3a3a3a !important;
}

@media (max-width: 900px) {
  .chart-header {
    flex-wrap: wrap;
    row-gap: 8px;
  }
}
</style>
