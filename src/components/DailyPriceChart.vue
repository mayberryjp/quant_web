<script setup>
import { ref, computed, watch } from 'vue'
import { getDailyBars } from '../api/dailyBars.js'

const props = defineProps({
  ticker: { type: String, default: '' },
  defaultRange: { type: Number, default: 30 },
})

const LOOKBACK_DAYS = 365
const RANGE_OPTIONS = [3, 5, 7, 21, 30, 90, 180, 365]

const bars = ref([])
const loading = ref(false)
const error = ref(null)
const selectedRange = ref(
  RANGE_OPTIONS.includes(props.defaultRange) ? props.defaultRange : 30,
)

function parseDate(value) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function chooseSampleStep(rangeDays) {
  if (rangeDays <= 30) return 1
  if (rangeDays <= 90) return 2
  if (rangeDays <= 180) return 3
  return 5
}

async function loadBars() {
  if (!props.ticker) return
  loading.value = true
  error.value = null
  try {
    console.log('Loading bars for:', props.ticker)
    const data = await getDailyBars(props.ticker, LOOKBACK_DAYS)
    console.log('Bars data:', data)
    if (data && data.length > 0) {
      console.log('First bar:', data[0])
      console.log('First bar keys:', Object.keys(data[0]))
    }
    bars.value = data
  } catch (e) {
    console.error('Failed to load bars:', e)
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const sortedBars = computed(() => {
  if (!bars.value.length) return []
  return [...bars.value].sort((a, b) => {
    const aDate = parseDate(a.bar_date)?.getTime() ?? 0
    const bDate = parseDate(b.bar_date)?.getTime() ?? 0
    return aDate - bDate
  })
})

const visibleBars = computed(() => {
  if (!sortedBars.value.length) return []

  const range = Number(selectedRange.value) || 30
  const latestDate = parseDate(sortedBars.value[sortedBars.value.length - 1]?.bar_date)
  if (!latestDate) return sortedBars.value

  const cutoff = new Date(latestDate)
  cutoff.setDate(cutoff.getDate() - range)

  const windowed = sortedBars.value.filter((bar) => {
    const d = parseDate(bar.bar_date)
    return d && d >= cutoff
  })
  const step = chooseSampleStep(range)

  if (step <= 1 || windowed.length <= 2) return windowed

  const sampled = windowed.filter((_, idx) => idx % step === 0)
  const last = windowed[windowed.length - 1]
  if (sampled[sampled.length - 1] !== last) sampled.push(last)
  return sampled
})

const chartSeries = computed(() => {
  if (!visibleBars.value.length) return []
  
  return [
    {
      name: 'High (Above Close)',
      type: 'rangeBar',
      data: visibleBars.value.map((b) => ({
        x: b.bar_date || '',
        y: [Number(b.close) || 0, Number(b.high) || 0],
      })),
    },
    {
      name: 'Low (Below Close)',
      type: 'rangeBar',
      data: visibleBars.value.map((b) => ({
        x: b.bar_date || '',
        y: [Number(b.low) || 0, Number(b.close) || 0],
      })),
    },
    {
      name: 'Close',
      type: 'line',
      data: visibleBars.value.map((b) => ({
        x: b.bar_date || '',
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
    labels: { style: { colors: '#b1b8c0' }, rotate: -45 },
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
  () => props.defaultRange,
  (value) => {
    if (RANGE_OPTIONS.includes(value)) {
      selectedRange.value = value
    }
  },
  { immediate: true }
)

watch(
  () => props.ticker,
  () => {
    console.log('Ticker changed to:', props.ticker)
    if (RANGE_OPTIONS.includes(props.defaultRange)) {
      selectedRange.value = props.defaultRange
    }
    if (props.ticker) loadBars()
  },
  { immediate: true }
)
</script>

<template>
  <v-card color="#0d1117" class="chart-card" v-if="props.ticker">
    <v-card-title class="chart-header d-flex align-center px-4 py-3">
      <span class="text-h6 text-sm-h5 text-md-h4 chart-title">{{ props.ticker }} Daily Prices</span>
      <v-spacer />
      <v-btn-toggle
        v-model="selectedRange"
        mandatory
        density="comfortable"
        variant="outlined"
        color="primary"
        divided
        class="range-toggle mr-2"
      >
        <v-btn
          v-for="days in RANGE_OPTIONS"
          :key="days"
          :value="days"
          size="x-small"
        >
          {{ days }}d
        </v-btn>
      </v-btn-toggle>
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
      <div class="text-grey">No price data available.</div>
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

.range-toggle {
  flex-wrap: wrap;
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
