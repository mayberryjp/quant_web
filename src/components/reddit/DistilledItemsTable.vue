<script setup>
import { ref } from 'vue'

defineEmits(['refresh', 'restart', 'delete'])

defineProps({
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  lastRefreshedAt: { type: String, default: null },
  restarting: { type: Array, default: () => [] },
  deleting: { type: Array, default: () => [] },
})

const pendingDelete = ref(null)

const headers = [
  { title: 'Title', key: 'title', align: 'start' },
  { title: 'Fetched At', key: 'fetched_at', align: 'start' },
  { title: 'Subreddit', key: 'subreddit', align: 'start' },
  { title: 'State', key: 'process_state', align: 'start' },
  { title: 'Distill Attempts', key: 'distill_attempts', align: 'end' },
  { title: 'Post Chars', key: 'post_chars', align: 'end' },
  { title: 'Summary Chars', key: 'summary_chars', align: 'end' },
  { title: 'Summary', key: 'summary', align: 'center', sortable: false },
  { title: 'Last Error', key: 'last_error', align: 'center', sortable: false },
  { title: '', key: 'actions', align: 'center', sortable: false },
]

const stateColor = {
  distilled: 'success',
  done: 'success',
  emitted: 'success',
  failed: 'error',
  skipped: 'grey',
  pending: 'warning',
}

function statusChipColor(status) {
  return stateColor[String(status ?? '').toLowerCase()] ?? 'grey'
}

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function num(v) {
  return v != null ? Number(v).toLocaleString() : '—'
}

function pickState(item) {
  return item.process_state ?? item.state ?? item.status ?? 'unknown'
}

function pickDistillAttempts(item) {
  if (item.distill_attempts != null) return item.distill_attempts
  if (item.distill_attempt_count != null) return item.distill_attempt_count
  if (item.attempts != null) return item.attempts
  if (item.summary_attempts != null) return item.summary_attempts
  return null
}

function displayTitle(title) {
  if (!title) return '—'
  return title.length > 30 ? `${title.slice(0, 27)}...` : title
}

function pickPostChars(item) {
  if (item.content_chars != null) return item.content_chars
  if (item.post_chars != null) return item.post_chars
  if (item.post_char_count != null) return item.post_char_count
  if (item.body_chars != null && item.title_chars != null) return item.body_chars + item.title_chars
  if (item.body_chars != null) return item.body_chars
  if (item.title_chars != null) return item.title_chars
  if (item.body_char_count != null) return item.body_char_count
  if (item.raw_char_count != null) return item.raw_char_count
  if (typeof item.body === 'string') return item.body.length
  return null
}

function pickSummaryChars(item) {
  if (item.summary_chars != null) return item.summary_chars
  if (item.summary_char_count != null) return item.summary_char_count
  if (typeof item.summary_text === 'string') return item.summary_text.length
  if (typeof item.summary === 'string') return item.summary.length
  return null
}

function pickSummary(item) {
  const text = item.summary_text ?? item.summary ?? null
  if (typeof text !== 'string') return null

  const trimmed = text.trim()
  return trimmed.length ? trimmed : null
}

function itemKey(item) {
  return item?.fullname ?? item?.id ?? item?.name ?? item?.permalink ?? null
}
</script>

<template>
  <v-sheet rounded="lg" color="#090c10" class="mt-4">
    <v-card-title class="d-flex align-center ga-2 px-4 py-3">
      <span class="text-h6 text-sm-h5 text-md-h4 table-title">Posts</span>
      <v-chip color="success" variant="tonal" size="small">{{ total }}</v-chip>
      <span class="text-caption text-medium-emphasis">Last refreshed: {{ fmtDate(lastRefreshedAt) }}</span>
      <v-spacer />
      <v-btn icon="mdi-refresh" size="small" variant="text" :loading="loading" @click="$emit('refresh')" />
    </v-card-title>
    <v-divider />

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="ma-4">
      {{ error }}
    </v-alert>

    <v-data-table
      :headers="headers"
      :items="items"
      :loading="loading"
      density="compact"
      item-value="fullname"
      class="app-table"
      no-data-text="No Reddit posts found"
    >
      <template #item.fullname="{ item }">
        <span class="mono">{{ item.fullname ?? '—' }}</span>
      </template>

      <template #item.kind="{ item }">
        <span class="text-uppercase text-caption">{{ item.kind ?? '—' }}</span>
      </template>

      <template #item.subreddit="{ item }">
        <span class="text-caption text-medium-emphasis">{{ item.subreddit ?? '—' }}</span>
      </template>

      <template #item.title="{ item }">
        <a
          v-if="item.permalink"
          :href="item.permalink"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary text-decoration-none text-body-2 text-no-wrap"
          :title="item.title ?? ''"
        >
          {{ displayTitle(item.title) }}
        </a>
        <span
          v-else
          :title="item.title ?? ''"
          class="text-body-2 text-no-wrap"
        >
          {{ displayTitle(item.title) }}
        </span>
      </template>

      <template #item.post_chars="{ item }">
        <span class="mono">{{ num(pickPostChars(item)) }}</span>
      </template>

      <template #item.summary_chars="{ item }">
        <span class="mono">{{ num(pickSummaryChars(item)) }}</span>
      </template>

      <template #item.summary="{ item }">
        <v-tooltip v-if="pickSummary(item)" location="top" max-width="480" open-delay="100">
          <template #activator="{ props }">
            <v-icon v-bind="props" icon="mdi-text-box-outline" size="small" color="info" style="cursor: help" />
          </template>
          <span style="white-space: pre-wrap">{{ pickSummary(item) }}</span>
        </v-tooltip>
        <span v-else class="text-caption text-medium-emphasis">—</span>
      </template>

      <template #item.last_error="{ item }">
        <v-tooltip v-if="item.last_error || item.error" location="top" max-width="480" open-delay="100">
          <template #activator="{ props }">
            <v-icon v-bind="props" icon="mdi-alert-circle-outline" size="small" color="error" style="cursor: help" />
          </template>
          <span style="white-space: pre-wrap">{{ item.last_error ?? item.error }}</span>
        </v-tooltip>
        <span v-else class="text-caption text-medium-emphasis">—</span>
      </template>

      <template #item.process_state="{ item }">
        <v-chip :color="statusChipColor(pickState(item))" size="small" variant="tonal" label>
          {{ String(pickState(item)).toUpperCase() }}
        </v-chip>
      </template>

      <template #item.distill_attempts="{ item }">
        <span class="mono">{{ num(pickDistillAttempts(item)) }}</span>
      </template>

      <template #item.fetched_at="{ item }">
        <span class="mono">{{ fmtDate(item.fetched_at) }}</span>
      </template>

      <template #item.actions="{ item }">
        <div class="d-flex align-center justify-center">
          <v-btn
            icon="mdi-restart"
            size="small"
            variant="text"
            color="primary"
            :loading="restarting.includes(itemKey(item))"
            :disabled="!itemKey(item)"
            title="Restart distillation"
            @click="$emit('restart', item)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            :loading="deleting.includes(itemKey(item))"
            :disabled="!itemKey(item)"
            title="Delete post"
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
      <v-card title="Delete Post">
        <v-card-text>
          Delete post <strong>{{ pendingDelete?.title ?? 'this item' }}</strong>
          <template v-if="pendingDelete?.subreddit"> · r/{{ pendingDelete.subreddit }}</template>?
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
