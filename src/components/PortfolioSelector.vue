<script setup>
import { ref, onMounted, defineEmits, defineProps } from 'vue'
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
const deleting = ref(false)
const deleteError = ref(null)

async function loadPortfolios() {
  loading.value = true
  error.value = null
  try {
    portfolios.value = await getPortfolios()
    if (portfolios.value.length) {
      const current = props.modelValue
      const exists = portfolios.value.some(p => p.name === current)
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
  const selected = portfolios.value.find(p => p.name === props.modelValue)
  if (!selected) return
  if (!confirm(`Delete portfolio "${selected.name}"? This cannot be undone.`)) return
  deleting.value = true
  deleteError.value = null
  try {
    await deletePortfolio(selected.id)
    emit('update:modelValue', '')
    await loadPortfolios()
  } catch (e) {
    deleteError.value = e.message
  } finally {
    deleting.value = false
  }
}

function onSelect(e) {
  emit('update:modelValue', e.target.value)
}

onMounted(loadPortfolios)
</script>

<template>
  <div class="portfolio-selector">
    <div class="selector-row">
      <label class="field-label">Portfolio</label>
      <select
        v-if="!loading && portfolios.length"
        class="select-input"
        :value="modelValue"
        @change="onSelect"
      >
        <option v-for="p in portfolios" :key="p.id" :value="p.name">
          {{ p.name }} ({{ p.portfolio_type }})
        </option>
      </select>
      <span v-else-if="loading" class="loading-text">Loading…</span>
      <span v-else-if="error" class="error-text">{{ error }}</span>
      <span v-else class="muted-text">No portfolios</span>
      <button class="icon-btn" @click="showCreate = !showCreate" title="Create portfolio">+</button>
      <button class="icon-btn danger" @click="handleDelete" :disabled="deleting || !modelValue" title="Delete portfolio">✕</button>
      <button class="icon-btn" @click="loadPortfolios" title="Refresh">↻</button>
      <span v-if="deleteError" class="error-text">{{ deleteError }}</span>
    </div>
    <div v-if="showCreate" class="create-form">
      <input v-model="newName" class="text-input" placeholder="Portfolio name" />
      <select v-model="newType" class="select-input small">
        <option value="paper">paper</option>
        <option value="manual">manual</option>
        <option value="tracked">tracked</option>
      </select>
      <input v-model="newCurrency" class="text-input small" placeholder="USD" />
      <button class="action-btn" :disabled="creating || !newName.trim()" @click="handleCreate">
        {{ creating ? 'Creating…' : 'Create' }}
      </button>
      <span v-if="createError" class="error-text">{{ createError }}</span>
    </div>
  </div>
</template>

<style scoped>
.portfolio-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selector-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.select-input {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
}

.select-input.small {
  width: 90px;
}

.text-input {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
}

.text-input.small {
  width: 70px;
}

.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}

.icon-btn.danger:hover {
  background: var(--red-bg);
  color: var(--red);
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--blue);
  background: var(--blue-bg);
  color: var(--blue);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.action-btn:hover {
  background: var(--blue);
  color: #fff;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.create-form {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.loading-text {
  font-size: 13px;
  color: var(--text-muted);
}

.error-text {
  font-size: 12px;
  color: var(--red);
}

.muted-text {
  font-size: 13px;
  color: var(--text-muted);
}
</style>
