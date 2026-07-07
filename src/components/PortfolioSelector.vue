<script setup>
import { ref, computed, onMounted } from 'vue'
import { getPortfolios, createPortfolio, deletePortfolio } from '../api/positions.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const portfolios = ref([])
const loading = ref(true)
const error = ref(null)

const showCreate = ref(false)
const newName = ref('')
const newType = ref('manual')
const newCurrency = ref('USD')
const creating = ref(false)
const createError = ref(null)

const showDelete = ref(false)
const deleting = ref(false)
const deleteError = ref(null)

const portfolioItems = computed(() =>
  portfolios.value.map((p) => ({
    title: `${p.name} (${p.portfolio_type})`,
    value: p.name,
  }))
)

const selectedPortfolio = computed(() =>
  portfolios.value.find((p) => p.name === props.modelValue)
)

async function loadPortfolios() {
  loading.value = true
  error.value = null
  try {
    portfolios.value = await getPortfolios()
    if (portfolios.value.length) {
      const current = props.modelValue
      const exists = portfolios.value.some((p) => p.name === current)
      if (!current || !exists) {
        emit('update:modelValue', portfolios.value[0].name)
      }
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!newName.value.trim()) return
  creating.value = true
  createError.value = null
  const createdName = newName.value.trim()
  try {
    await createPortfolio({
      name: createdName,
      portfolio_type: newType.value,
      currency: newCurrency.value,
    })
    showCreate.value = false
    newName.value = ''
    await loadPortfolios()
    emit('update:modelValue', createdName)
  } catch (e) {
    createError.value = e.message
  } finally {
    creating.value = false
  }
}

async function handleDelete() {
  const selected = selectedPortfolio.value
  if (!selected) return
  deleting.value = true
  deleteError.value = null
  try {
    await deletePortfolio(selected.id)
    showDelete.value = false
    emit('update:modelValue', '')
    await loadPortfolios()
  } catch (e) {
    deleteError.value = e.message
  } finally {
    deleting.value = false
  }
}

onMounted(loadPortfolios)
</script>

<template>
  <div class="d-flex align-center ga-2 flex-wrap">
    <v-select
      :model-value="modelValue"
      :items="portfolioItems"
      :loading="loading"
      :error-messages="error ? [error] : []"
      label="Portfolio"
      style="min-width: 240px"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <v-btn icon="mdi-plus" size="small" variant="tonal" @click="showCreate = true" />
    <v-btn
      icon="mdi-delete"
      size="small"
      variant="tonal"
      color="error"
      :disabled="deleting || !modelValue"
      @click="showDelete = true"
    />
    <v-btn icon="mdi-refresh" size="small" variant="tonal" @click="loadPortfolios" />
  </div>

  <v-dialog v-model="showCreate" max-width="420">
    <v-card title="Create Portfolio">
      <v-card-text class="d-flex flex-column ga-3">
        <v-text-field v-model="newName" label="Portfolio name" autofocus />
        <v-select v-model="newType" :items="['paper', 'manual', 'tracked']" label="Type" />
        <v-text-field v-model="newCurrency" label="Currency" />
        <v-alert v-if="createError" type="error" variant="tonal" density="compact">{{ createError }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text="Cancel" @click="showCreate = false" />
        <v-btn
          color="primary"
          variant="flat"
          :loading="creating"
          :disabled="!newName.trim()"
          text="Create"
          @click="handleCreate"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showDelete" max-width="420">
    <v-card title="Delete Portfolio">
      <v-card-text>
        Delete portfolio <strong>{{ selectedPortfolio?.name }}</strong>? This cannot be undone.
        <v-alert v-if="deleteError" type="error" variant="tonal" density="compact" class="mt-3">
          {{ deleteError }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text="Cancel" @click="showDelete = false" />
        <v-btn color="error" variant="flat" :loading="deleting" text="Delete" @click="handleDelete" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

