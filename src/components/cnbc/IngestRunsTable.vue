<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  restarting: { type: Array, default: () => [] },
  deleting: { type: Array, default: () => [] },
  lastRefreshedAt: { type: String, default: null },
})
const emit = defineEmits(['refresh', 'restart', 'delete'])

const pendingDelete = ref(null)
const showFailed = ref(false)

const failedItems = computed(() => props.items.filter(isFailed))
const visibleItems = computed(() => showFailed.value ? failedItems.value : props.items)

function confirmDelete() {
  if (!pendingDelete.value) return
  emit('delete', pendingDelete.value)
  pendingDelete.value = null
}

const headers = [
  { title: 'Run ID', key: 'id', align: 'start' },
  { title: 'Episode', key: 'show_slug', align: 'start' },
  { title: 'Air Date', key: 'air_date', align: 'start' },
  { title: 'Status', key: 'status', align: 'start' },
  { title: 'Attempts', key: 'attempts', align: 'center' },
  { title: 'Fetched', key: 'fetched_at', align: 'center' },
  { title: 'Distilled', key: 'distilled_at', align: 'center' },
  { title: 'Processed', key: 'processed_at', align: 'start' },
  { title: 'Raw Chars', key: 'raw_char_count', align: 'end' },
  { title: 'Summary Chars', key: 'summary_char_count', align: 'end' },
  { title: 'Summary', key: 'summary', align: 'center', sortable: false },
  { title: 'Last Error', key: 'last_error', align: 'start', sortable: false },
  { title: '', key: 'actions', align: 'center', sortable: false },
]

const statusColor = {
  done: 'success',
  delivered: 'info',
  distilled: 'info',
  fetched: 'warning',
  discovered: 'grey',
  failed: 'error',
}

function statusChipColor(status) {
  return statusColor[status] ?? 'grey'
}

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtYmdDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function hasDistilled(item) {
  return Boolean(item?.distilled_at) || ['distilled', 'delivered', 'done'].includes(item?.status)
}

function isFailed(item) {
  return String(item?.status ?? '').toLowerCase() === 'failed' || Boolean(item?.last_error)
}

function showName(slug) {
  if (!slug) return '—'
  return slug.replace(/_/g, ' ')
}

function displayTitle(title) {
  if (!title) return ''
  return title.length > 30 ? `${title.slice(0, 27)}...` : title
}

function num(v) {
  return v != null ? Number(v).toLocaleString() : '—'
}
</script>

<template>
  <v-sheet rounded="lg" color="#090c10">
    <v-card-title class="d-flex align-center ga-2 px-4 py-3">
      <span class="text-h6 text-sm-h5 text-md-h4 table-title">Ingestion Runs</span>
      <span class="text-caption text-medium-emphasis">Last refreshed: {{ fmtDate(lastRefreshedAt) }}</span>
      <v-spacer />
      <v-btn
        :color="showFailed ? 'error' : 'default'"
        variant="tonal"
        size="small"
        class="mr-2"
        @click="showFailed = !showFailed"
      >
        {{ showFailed ? 'Show all' : 'Show' }} failed ({{ failedItems.length }})
      </v-btn>
      <v-btn icon="mdi-refresh" size="small" variant="text" :loading="loading" @click="$emit('refresh')" />
    </v-card-title>
    <v-divider />

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="ma-4">
      {{ error }}
    </v-alert>

    <v-data-table
      v-else
      class="app-table"
      density="compact"
      mobile-breakpoint="md"
      :headers="headers"
      :items="visibleItems"
      :loading="loading"
      item-value="id"
      :items-per-page="10"
      :sort-by="[{ key: 'air_date', order: 'desc' }]"
      no-data-text="No CNBC ingestion runs found"
    >
      <template #item.id="{ item }">
        <span class="mono font-weight-medium">#{{ item.id }}</span>
      </template>

      <template #item.show_slug="{ item }">
        <a
          v-if="item.title && item.source_url"
          :href="item.source_url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary text-decoration-none text-no-wrap"
          :title="item.title"
        >{{ displayTitle(item.title) }}</a>
        <span v-else-if="item.title" class="text-no-wrap" :title="item.title">{{ displayTitle(item.title) }}</span>
        <span v-else class="text-medium-emphasis">—</span>
      </template>

      <template #item.air_date="{ item }">
        <span class="mono text-no-wrap">{{ item.air_date ?? '—' }}</span>
      </template>

      <template #item.status="{ item }">
        <v-chip :color="statusChipColor(item.status)" variant="tonal" size="small" label>
          {{ (item.status ?? 'unknown').toUpperCase() }}
        </v-chip>
      </template>

      <template #item.attempts="{ item }">
        <span class="mono">{{ item.attempts ?? '—' }}</span>
      </template>

      <template #item.fetched_at="{ item }">
        <v-icon
          :icon="item.fetched_at ? 'mdi-check-circle' : 'mdi-minus'"
          :color="item.fetched_at ? 'success' : 'grey'"
          size="small"
        />
      </template>

      <template #item.distilled_at="{ item }">
        <v-icon
          :icon="hasDistilled(item) ? 'mdi-check-circle' : 'mdi-minus'"
          :color="hasDistilled(item) ? 'success' : 'grey'"
          size="small"
        />
      </template>

      <template #item.processed_at="{ item }">
        <span class="mono text-no-wrap">{{ fmtYmdDate(item.processed_at) }}</span>
      </template>

      <template #item.raw_char_count="{ item }">
        <span class="mono text-medium-emphasis">{{ num(item.raw_char_count) }}</span>
      </template>

      <template #item.summary_char_count="{ item }">
        <span class="mono text-medium-emphasis">{{ num(item.summary_char_count) }}</span>
      </template>

      <template #item.summary="{ item }">
        <v-tooltip v-if="item.summary" location="top" max-width="480" open-delay="100">
          <template #activator="{ props }">
            <v-icon v-bind="props" icon="mdi-text-box-outline" size="small" color="info" style="cursor: help" />
          </template>
          <span style="white-space: pre-wrap">{{ item.summary }}</span>
        </v-tooltip>
        <span v-else class="text-caption text-medium-emphasis">—</span>
      </template>

      <template #item.last_error="{ item }">
        <v-tooltip v-if="item.last_error" location="top" max-width="480" open-delay="100">
          <template #activator="{ props }">
            <v-icon v-bind="props" icon="mdi-alert-circle-outline" size="small" color="error" style="cursor: help" />
          </template>
          <span style="white-space: pre-wrap">{{ item.last_error }}</span>
        </v-tooltip>
        <span v-else class="text-caption text-medium-emphasis">—</span>
      </template>

      <template #item.actions="{ item }">
        <div class="d-flex align-center justify-center">
          <v-btn
            icon="mdi-restart"
            size="small"
            variant="text"
            color="primary"
            :loading="restarting.includes(item.archive_identifier)"
            :disabled="!item.archive_identifier"
            title="Restart distillation"
            @click="$emit('restart', item)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            :loading="deleting.includes(item.id)"
            title="Delete transcript"
            @click="pendingDelete = item"
          />
        </div>
      </template>
    </v-data-table>

    <v-dialog
      :model-value="pendingDelete != null"
      max-width="420"
      @update:model-value="pendingDelete = null"
    >
      <v-card title="Delete Transcript">
        <v-card-text>
          Delete transcript <strong>#{{ pendingDelete?.id }}</strong>
          <template v-if="pendingDelete?.show_slug"> · {{ showName(pendingDelete.show_slug) }}</template>
          <template v-if="pendingDelete?.air_date"> ({{ pendingDelete.air_date }})</template>?
          This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancel" @click="pendingDelete = null" />
          <v-btn color="error" variant="flat" text="Delete" @click="confirmDelete" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-sheet>
</template>
