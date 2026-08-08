<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  lastRefreshedAt: { type: String, default: null },
  restarting: { type: Array, default: () => [] },
  deleting: { type: Array, default: () => [] },
})
defineEmits(['refresh', 'restart', 'delete'])

const showSkipped = ref(false)
const pendingDelete = ref(null)

const skippedCount = computed(() => props.items.filter((i) => i.status === 'skipped').length)
const visibleItems = computed(() =>
  showSkipped.value ? props.items : props.items.filter((i) => i.status !== 'skipped')
)

const headers = [
  { title: 'Channel', key: 'channel_slug', align: 'start' },
  { title: 'Title', key: 'title', align: 'start', minWidth: '260px' },
  { title: 'Published', key: 'published_at', align: 'start' },
  { title: 'Status', key: 'status', align: 'start' },
  { title: 'Attempts', key: 'attempts', align: 'center' },
  { title: 'Topics', key: 'key_topic_count', align: 'end' },
  { title: 'Segments', key: 'segment_count', align: 'end' },
  { title: 'Raw Chars', key: 'raw_char_count', align: 'end' },
  { title: 'Summary Chars', key: 'summary_char_count', align: 'end' },
  { title: 'Summary', key: 'summary', align: 'center', sortable: false },
  { title: 'Last Error', key: 'last_error', align: 'center', sortable: false },
  { title: '', key: 'actions', align: 'center', sortable: false },
]

const statusColor = {
  done: 'success',
  distilled: 'info',
  fetched: 'warning',
  discovered: 'grey',
  skipped: 'grey',
  failed: 'error',
  error: 'error',
}

function statusChipColor(status) {
  return statusColor[status] ?? 'grey'
}

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

function num(v) {
  return v != null ? Number(v).toLocaleString() : '—'
}
</script>

<template>
  <v-sheet rounded="lg" color="#090c10">
    <v-card-title class="d-flex align-center ga-2 px-4 py-3">
      <span class="text-h6 text-sm-h5 text-md-h4 table-title">Episodes</span>
      <v-chip color="primary" variant="tonal" size="small">{{ total }}</v-chip>
      <span class="text-caption text-medium-emphasis">Last refreshed: {{ fmtDate(lastRefreshedAt) }}</span>
      <v-spacer />
      <v-btn
        v-if="skippedCount > 0"
        :color="showSkipped ? 'warning' : 'default'"
        variant="tonal"
        size="small"
        class="mr-2"
        @click="showSkipped = !showSkipped"
      >
        {{ showSkipped ? 'Hide' : 'Show' }} skipped ({{ skippedCount }})
      </v-btn>
      <v-btn icon="mdi-refresh" size="small" variant="text" :loading="loading" @click="$emit('refresh')" />
    </v-card-title>
    <v-divider />

    <v-alert v-if="error" type="error" variant="tonal" class="ma-4" density="compact">
      {{ error }}
    </v-alert>

    <v-data-table
      :headers="headers"
      :items="visibleItems"
      :loading="loading"
      density="compact"
      item-value="id"
      class="app-table"
    >
      <template #item.channel_slug="{ item }">
        <span class="text-caption text-medium-emphasis">{{ item.channel_slug ?? '—' }}</span>
      </template>

      <template #item.title="{ item }">
        <a
          v-if="item.source_url"
          :href="item.source_url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary text-decoration-none"
        >{{ item.title }}</a>
        <span v-else>{{ item.title }}</span>
      </template>

      <template #item.published_at="{ item }">
        <span class="text-caption text-no-wrap">{{ fmtDate(item.published_at) }}</span>
      </template>

      <template #item.status="{ item }">
        <v-chip :color="statusChipColor(item.status)" size="x-small" variant="tonal">
          {{ item.status ?? '—' }}
        </v-chip>
      </template>

      <template #item.key_topic_count="{ item }">
        <span class="mono">{{ num(item.key_topic_count) }}</span>
      </template>

      <template #item.segment_count="{ item }">
        <span class="mono">{{ num(item.segment_count) }}</span>
      </template>

      <template #item.raw_char_count="{ item }">
        <span class="mono">{{ num(item.raw_char_count) }}</span>
      </template>

      <template #item.summary_char_count="{ item }">
        <span class="mono">{{ num(item.summary_char_count) }}</span>
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

      <template #item.actions="{ item, emit }">
        <div class="d-flex align-center justify-center">
          <v-btn
            icon="mdi-restart"
            size="small"
            variant="text"
            color="primary"
            :loading="restarting.includes(item.video_id)"
            title="Requeue transcript + distillation"
            @click="$emit('restart', item)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            :loading="deleting.includes(item.id)"
            title="Delete episode"
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
      <v-card title="Delete Episode">
        <v-card-text>
          Delete episode <strong>#{{ pendingDelete?.id }}</strong>
          <template v-if="pendingDelete?.title"> · {{ pendingDelete.title }}</template>?
          This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancel" @click="pendingDelete = null" />
          <v-btn color="error" variant="flat" text="Delete" @click="$emit('delete', pendingDelete); pendingDelete = null" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-sheet>
</template>
