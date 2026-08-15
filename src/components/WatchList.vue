<script setup>
import { ref, onMounted } from 'vue'

const watchlist = ref([])
const loading = ref(false)
const error = ref(null)
const search = ref('')

const headers = [
  { title: 'Ticker', key: 'ticker', align: 'start' },
  { title: 'Market', key: 'market', align: 'start' },
  { title: 'Source', key: 'source', align: 'start' },
  { title: 'Signal', key: 'signal_type', align: 'start' },
  { title: 'Direction', key: 'direction', align: 'start' },
  { title: 'Confidence', key: 'confidence', align: 'end' },
  { title: 'Seen Count', key: 'seen_count', align: 'end' },
  { title: 'First Seen', key: 'created_at', align: 'start' },
  { title: 'Last Seen', key: 'updated_at', align: 'start' },
  { title: 'Reason', key: 'reason', align: 'start', sortable: false },
]

async function load() {
  loading.value = true
  error.value = null
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 10000)
    const res = await fetch('http://signals.quant.mayberry.farm:8016/watchlist?active=true', {
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    watchlist.value = data.items ?? []
  } catch (e) {
    if (e.name !== 'AbortError') error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)

function formatDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toISOString().slice(0, 10) } catch { return iso }
}

function displayTicker(entry) {
  return entry.canonical_ticker || entry.submitted_ticker
}

function tickerFilter(_value, query, item) {
  if (!query) return true
  return displayTicker(item.raw).toLowerCase().includes(query.toLowerCase())
}
</script>

<template>
  <v-sheet rounded="lg" color="#090c10">
    <v-card-title class="watchlist-header d-flex align-center px-4 py-3">
      <span class="text-h6 text-sm-h5 text-md-h4 watchlist-title">Watch List</span>
      <v-chip color="warning" variant="tonal" size="small" class="ml-2 ml-sm-3">{{ watchlist.length }}</v-chip>
      <v-spacer />
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Filter by ticker"
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
      :items="watchlist"
      :loading="loading"
      :search="search"
      :custom-filter="tickerFilter"
      item-value="watchlist_entry_id"
      no-data-text="No watchlist entries"
      class="app-table"
      density="compact"
      mobile-breakpoint="md"
      :items-per-page="25"
    >
      <template #item.ticker="{ item }">
        <router-link :to="`/ticker/${displayTicker(item)}`" class="font-weight-bold text-decoration-none">
          {{ displayTicker(item) }}
        </router-link>
      </template>
      <template #item.market="{ item }">
        <v-chip size="x-small" color="primary" variant="tonal" label>
          {{ (item.market ?? '—').toUpperCase() }}
        </v-chip>
      </template>
      <template #item.source="{ item }">
        <span class="text-medium-emphasis text-caption">{{ item.source }}</span>
      </template>
      <template #item.signal_type="{ item }">
        <span class="text-medium-emphasis text-caption">{{ item.signal_type }}</span>
      </template>
      <template #item.direction="{ item }">
        <v-chip
          v-if="item.direction"
          size="x-small"
          label
          :color="item.direction === 'long' ? 'success' : item.direction === 'short' ? 'error' : undefined"
          variant="tonal"
        >
          {{ item.direction.toUpperCase() }}
        </v-chip>
        <span v-else class="text-disabled">—</span>
      </template>
      <template #item.confidence="{ item }">
        <span class="mono">{{ item.confidence != null ? (item.confidence * 100).toFixed(0) + '%' : '—' }}</span>
      </template>
      <template #item.seen_count="{ item }">
        <span class="mono">{{ item.seen_count ?? '—' }}</span>
      </template>
      <template #item.created_at="{ item }">
        <span class="text-disabled text-caption">{{ formatDate(item.created_at) }}</span>
      </template>
      <template #item.updated_at="{ item }">
        <span class="text-disabled text-caption">{{ formatDate(item.updated_at) }}</span>
      </template>
      <template #item.reason="{ item }">
        <span class="text-medium-emphasis text-caption d-inline-block text-truncate" style="max-width: 200px" :title="item.reason">
          {{ item.reason || '—' }}
        </span>
      </template>
    </v-data-table>
  </v-sheet>
</template>

<style scoped>
.watchlist-header {
  gap: 8px;
  flex-wrap: wrap;
}

/* Title colour matches the reference; size comes from Vuetify text utilities. */
.watchlist-title {
  color: #b1b8c0;
}
</style>

