<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { importLedgerEntry } from '../api/positions.js'

const props = defineProps({
  portfolio: { type: String, default: '' },
})
const emit = defineEmits(['imported'])

const form = ref({
  ticker: '',
  market: 'stocks',
  locale: 'us',
  event_type: 'opening_balance',
  quantity_delta: '',
  price: '',
  fees: '',
  occurred_at: '',
  reason: '',
})

const submitting = ref(false)
const result = ref(null)
const error = ref(null)

const eventTypes = [
  { value: 'opening_balance', label: 'Opening Balance' },
  { value: 'external_position_change', label: 'External Position Change' },
  { value: 'manual_adjustment', label: 'Manual Adjustment' },
  { value: 'transfer_in', label: 'Transfer In' },
  { value: 'transfer_out', label: 'Transfer Out' },
  { value: 'stock_split', label: 'Stock Split' },
  { value: 'fee', label: 'Fee Only' },
  { value: 'correction', label: 'Correction' },
]

async function handleSubmit() {
  if (!props.portfolio || !form.value.ticker.trim() || form.value.quantity_delta === '') return
  submitting.value = true
  result.value = null
  error.value = null

  const ticker = form.value.ticker.trim().toUpperCase()
  const idempotencyKey = `${props.portfolio}:web:${ticker}:${Date.now()}`
  const occurredAt = form.value.occurred_at
    ? new Date(form.value.occurred_at).toISOString()
    : new Date().toISOString()

  const payload = {
    portfolio: props.portfolio,
    idempotency_key: idempotencyKey,
    source: 'web-ui',
    ticker,
    market: form.value.market,
    locale: form.value.locale,
    event_type: form.value.event_type,
    quantity_delta: Number(form.value.quantity_delta),
    occurred_at: occurredAt,
  }

  if (form.value.price !== '') payload.price = Number(form.value.price)
  if (form.value.fees !== '') payload.fees = Number(form.value.fees)
  if (form.value.reason.trim()) payload.reason = form.value.reason.trim()

  try {
    const data = await importLedgerEntry(payload)
    result.value = data
    form.value.ticker = ''
    form.value.quantity_delta = ''
    form.value.price = ''
    form.value.fees = ''
    form.value.occurred_at = ''
    form.value.reason = ''
    emit('imported')
  } catch (e) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="card">
    <div class="card-header">
      <h2>Import Position</h2>
    </div>

    <form class="import-form" @submit.prevent="handleSubmit">
      <div class="form-grid">
        <div class="field">
          <label class="field-label">Ticker *</label>
          <input v-model="form.ticker" class="text-input" placeholder="AAPL" required />
        </div>

        <div class="field">
          <label class="field-label">Quantity *</label>
          <input v-model="form.quantity_delta" class="text-input" type="number" step="any" placeholder="10 or -5" required />
        </div>

        <div class="field">
          <label class="field-label">Cost Basis</label>
          <input v-model="form.price" class="text-input" type="number" step="0.01" min="0" placeholder="185.50" />
        </div>

        <div class="field">
          <label class="field-label">Fees</label>
          <input v-model="form.fees" class="text-input" type="number" step="0.01" min="0" placeholder="0.00" />
        </div>

        <div class="field">
          <label class="field-label">Acquisition Date</label>
          <input v-model="form.occurred_at" class="text-input" type="date" />
        </div>

        <div class="field">
          <label class="field-label">Event Type</label>
          <select v-model="form.event_type" class="select-input">
            <option v-for="et in eventTypes" :key="et.value" :value="et.value">{{ et.label }}</option>
          </select>
        </div>

        <div class="field">
          <label class="field-label">Market</label>
          <select v-model="form.market" class="select-input">
            <option value="stocks">Stocks</option>
            <option value="crypto">Crypto</option>
            <option value="options">Options</option>
            <option value="forex">Forex</option>
          </select>
        </div>

        <div class="field span-2">
          <label class="field-label">Reason</label>
          <input v-model="form.reason" class="text-input" placeholder="Optional note" maxlength="2000" />
        </div>
      </div>

      <div class="form-actions">
        <button class="submit-btn" type="submit" :disabled="submitting || !portfolio || !form.ticker.trim() || form.quantity_delta === ''">
          {{ submitting ? 'Importing…' : 'Import Entry' }}
        </button>
        <span v-if="!portfolio" class="warn-text">Create or select a portfolio above</span>
      </div>

      <div v-if="result" class="result-box success">
        <strong>{{ result.status === 'duplicate' ? 'Duplicate' : 'Recorded' }}</strong>
        — Ledger #{{ result.ledger_entry_id }}, Position #{{ result.position_id }},
        {{ result.submitted_ticker }} qty {{ result.quantity_delta }}
      </div>

      <div v-if="error" class="result-box error">
        {{ error }}
      </div>
    </form>
  </section>
</template>

<style scoped>
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

.card-header h2 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.import-form {
  padding: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.span-2 {
  grid-column: span 2;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.text-input,
.select-input {
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
}

.text-input:focus,
.select-input:focus {
  outline: none;
  border-color: var(--blue);
}

.form-actions {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.submit-btn {
  padding: 8px 20px;
  border-radius: 6px;
  border: none;
  background: var(--blue);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.submit-btn:hover {
  opacity: 0.9;
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.warn-text {
  font-size: 12px;
  color: var(--yellow);
}

.result-box {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
}

.result-box.success {
  background: var(--green-bg);
  color: var(--green);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.result-box.error {
  background: var(--red-bg);
  color: var(--red);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .span-2 {
    grid-column: span 1;
  }
}
</style>
