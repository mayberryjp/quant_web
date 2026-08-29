<script setup>
import { ref, computed, onMounted } from 'vue'
import { getLatestStickyNotes } from '../api/stickyNotes.js'
import { streamReplay } from '../api/streamingChart.js'

const signalDate = ref(null)
const total = ref(0)
const results = ref([])
const loading = ref(false)
const error = ref(null)
const search = ref('')
const streamingTicker = ref(null)
const snackbar = ref({ show: false, color: 'success', text: '' })

// StickyNote shape is not fixed, so build columns from the union of keys
// across the returned notes (stable, first-seen order).
const HIDDEN_KEYS = ['id', 'created_at', 'created_date', 'created', 'updated_at', 'updated_date', 'updated', 'status', 'notes']
const headers = computed(() => {
  const keys = []
  for (const note of results.value) {
    for (const key of Object.keys(note ?? {})) {
      if (HIDDEN_KEYS.includes(key)) continue
      if (!keys.includes(key)) keys.push(key)
    }
  }
  const cols = keys.map((key) => ({
    title: key.replace(/_/g, ' ').toUpperCase(),
    key,
    align: 'start',
  }))
  cols.push({ title: 'STREAM', key: '_stream', align: 'end', sortable: false })
  return cols
})

function tickerOf(item) {
  return item.ticker || item.symbol || item.canonical_ticker || item.submitted_ticker || null
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const data = await getLatestStickyNotes()
    signalDate.value = data.signalDate
    total.value = data.total
    results.value = data.results
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function stream(item) {
  const ticker = tickerOf(item)
  if (!ticker) return
  streamingTicker.value = ticker
  try {
    await streamReplay(ticker)
    snackbar.value = { show: true, color: 'success', text: `Replay started for ${ticker}` }
  } catch (e) {
    snackbar.value = { show: true, color: 'error', text: `${ticker}: ${e.message}` }
  } finally {
    streamingTicker.value = null
  }
}

onMounted(load)
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <v-sheet rounded="lg" color="#090c10">
      <v-card-title class="d-flex align-center px-4 py-3">
        <span class="text-h6 text-sm-h5 text-md-h4">Sticky Note</span>
        <v-chip color="warning" variant="tonal" size="small" class="ml-2 ml-sm-3">{{ total }}</v-chip>
        <v-chip v-if="signalDate" color="primary" variant="tonal" size="small" label class="ml-2">
          {{ signalDate }}
        </v-chip>
        <v-spacer />
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Filter"
          density="compact"
          clearable
          hide-details
          single-line
          style="max-width: 220px"
          class="mr-2"
        />
        <v-btn icon="mdi-refresh" variant="text" size="small" :loading="loading" @click="load" />
      </v-card-title>
      <v-divider />

      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="ma-4">
        {{ error }}
      </v-alert>

      <v-data-table
        v-else
        :headers="headers"
        :items="results"
        :loading="loading"
        :search="search"
        no-data-text="No published sticky notes"
        class="app-table"
        density="compact"
        mobile-breakpoint="md"
        :items-per-page="25"
      >
        <template #item._stream="{ item }">
          <v-btn
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-play"
            :loading="streamingTicker === tickerOf(item)"
            :disabled="!tickerOf(item) || (streamingTicker && streamingTicker !== tickerOf(item))"
            @click="stream(item)"
          >
            Stream
          </v-btn>
        </template>
      </v-data-table>
    </v-sheet>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000" location="bottom right">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>
