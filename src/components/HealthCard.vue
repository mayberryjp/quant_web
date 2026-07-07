<script setup>
defineProps({
  title: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  data: { type: [Object, null], default: null },
  valClass: { type: Function, default: () => '' },
})

function isObject(v) {
  return v !== null && typeof v === 'object'
}
</script>

<template>
  <v-card height="100%">
    <v-card-title class="text-body-2 font-weight-medium text-medium-emphasis mono">{{ title }}</v-card-title>
    <v-divider />
    <v-card-text class="pa-2">
      <div v-if="loading" class="d-flex justify-center pa-4">
        <v-progress-circular indeterminate size="24" color="primary" />
      </div>

      <v-alert v-else-if="error" type="error" variant="tonal" density="compact">{{ error }}</v-alert>

      <v-list v-else-if="data" density="compact" bg-color="transparent" class="py-0">
        <template v-for="(val, key) in data" :key="key">
          <template v-if="isObject(val)">
            <v-list-subheader class="text-uppercase font-weight-bold">{{ key }}</v-list-subheader>
            <v-list-item v-for="(subVal, subKey) in val" :key="`${key}.${subKey}`" class="pl-6">
              <v-list-item-title class="text-caption text-medium-emphasis">{{ subKey }}</v-list-item-title>
              <template #append>
                <span class="text-caption mono" :class="valClass(subKey, subVal)">{{ subVal ?? '—' }}</span>
              </template>
            </v-list-item>
          </template>
          <v-list-item v-else>
            <v-list-item-title class="text-caption text-medium-emphasis">{{ key }}</v-list-item-title>
            <template #append>
              <span class="text-caption mono text-right" :class="valClass(key, val)" style="word-break: break-all">{{ val }}</span>
            </template>
          </v-list-item>
        </template>
      </v-list>

      <span v-else class="text-disabled text-caption">No data</span>
    </v-card-text>
  </v-card>
</template>
