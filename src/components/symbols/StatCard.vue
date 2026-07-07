<script setup>
defineProps({
  label: { type: String, default: '' },
  value: { type: [String, Number], default: '—' },
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <v-card height="100%">
    <v-card-text class="text-center py-5">
      <div
        class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2"
        style="letter-spacing: 0.06em"
      >
        {{ label }}
      </div>
      <div v-if="loading" class="d-flex justify-center py-1">
        <v-progress-circular indeterminate size="22" width="2" color="primary" />
      </div>
      <div
        v-else
        class="text-h5 font-weight-bold mono"
        style="word-break: break-word"
        :title="String(value)"
      >
        {{ value }}
      </div>
    </v-card-text>
  </v-card>
</template>
