<script setup>
import { ref } from 'vue'
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

const marketOptions = [
  { value: 'stocks', label: 'Stocks' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'options', label: 'Options' },
  { value: 'forex', label: 'Forex' },
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
  <v-card>
    <v-card-title class="text-subtitle-1 font-weight-medium">Import Position</v-card-title>
    <v-divider />

    <v-form class="pa-4" @submit.prevent="handleSubmit">
      <v-row dense>
        <v-col cols="12" sm="6">
          <v-text-field v-model="form.ticker" label="Ticker *" placeholder="AAPL" required />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.quantity_delta"
            label="Quantity *"
            type="number"
            step="any"
            placeholder="10 or -5"
            required
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field v-model="form.price" label="Cost Basis" type="number" step="0.01" min="0" placeholder="185.50" />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field v-model="form.fees" label="Fees" type="number" step="0.01" min="0" placeholder="0.00" />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field v-model="form.occurred_at" label="Acquisition Date" type="date" />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="form.event_type"
            :items="eventTypes"
            item-title="label"
            item-value="value"
            label="Event Type"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="form.market"
            :items="marketOptions"
            item-title="label"
            item-value="value"
            label="Market"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field v-model="form.reason" label="Reason" placeholder="Optional note" maxlength="2000" />
        </v-col>
      </v-row>

      <div class="d-flex align-center ga-4 mt-2">
        <v-btn
          type="submit"
          color="primary"
          variant="flat"
          :loading="submitting"
          :disabled="!portfolio || !form.ticker.trim() || form.quantity_delta === ''"
        >
          Import Entry
        </v-btn>
        <span v-if="!portfolio" class="text-warning text-caption">Create or select a portfolio above</span>
      </div>

      <v-alert v-if="result" type="success" variant="tonal" density="compact" class="mt-4">
        <strong>{{ result.status === 'duplicate' ? 'Duplicate' : 'Recorded' }}</strong>
        — Ledger #{{ result.ledger_entry_id }}, Position #{{ result.position_id }},
        {{ result.submitted_ticker }} qty {{ result.quantity_delta }}
      </v-alert>

      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-4">
        {{ error }}
      </v-alert>
    </v-form>
  </v-card>
</template>

