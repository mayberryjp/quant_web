const BASE = '/api/quant_symbols'

const DEFAULT_VENDOR = 'massive'
const DEFAULT_ENDPOINT = '/v3/reference/tickers'

async function request(path, { allowStatuses = [], ...options } = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal, ...options })
    clearTimeout(timeout)
    // Tolerated statuses (e.g. 404 "no runs yet") resolve to null instead of throwing.
    if (allowStatuses.includes(res.status)) return null
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || json.detail || `HTTP ${res.status}`)
    return json
  } catch (e) {
    clearTimeout(timeout)
    if (e.name === 'AbortError') throw new Error('Request timed out')
    throw e
  }
}

/** Total number of normalized symbols in the universe. */
export async function getSymbolCount(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const data = await request(`/symbols/count${qs ? '?' + qs : ''}`)
  return data?.total ?? 0
}

/** Most recent ingestion (sync) run, or null when none exist yet. */
export async function getLatestSyncRun(vendor = DEFAULT_VENDOR, endpoint = DEFAULT_ENDPOINT) {
  const qs = new URLSearchParams({ vendor, endpoint }).toString()
  const data = await request(`/sync/latest?${qs}`, { allowStatuses: [404] })
  return data?.latest ?? null
}

/** Bounded list of ingestion (sync) runs, newest first. */
export async function getSyncRuns({
  vendor = DEFAULT_VENDOR,
  endpoint = DEFAULT_ENDPOINT,
  status,
  limit = 100,
  offset = 0,
} = {}) {
  const params = { vendor, endpoint, limit, offset }
  if (status) params.status = status
  const qs = new URLSearchParams(params).toString()
  const data = await request(`/sync/runs?${qs}`)
  return data?.items ?? []
}

/** Daily symbol-count history (total, new, delisted) over a look-back window. */
export async function getSymbolCountHistory({ days = 30, market = 'stocks', locale = 'us' } = {}) {
  const qs = new URLSearchParams({ days, market, locale }).toString()
  const data = await request(`/symbols/count/history?${qs}`)
  return data?.points ?? []
}

/** Symbols added within the look-back window (newest first). */
export async function getRecentSymbols({
  days = 7,
  market = 'stocks',
  locale = 'us',
  limit = 100,
  offset = 0,
} = {}) {
  const qs = new URLSearchParams({ days, market, locale, limit, offset }).toString()
  const data = await request(`/symbols/recent?${qs}`)
  return data?.items ?? []
}

/** Symbols delisted within the look-back window (newest first). */
export async function getDelistedSymbols({
  days = 7,
  market = 'stocks',
  locale = 'us',
  limit = 100,
  offset = 0,
} = {}) {
  const qs = new URLSearchParams({ days, market, locale, limit, offset }).toString()
  const data = await request(`/symbols/delisted?${qs}`)
  return data?.items ?? []
}
