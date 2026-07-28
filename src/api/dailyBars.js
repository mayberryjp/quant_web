const BASE = '/api/quant_daily_bars'

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

/** Bounded list of ingestion (bar) runs, newest first. */
export async function getIngestRuns({ status, mode, limit = 100, offset = 0 } = {}) {
  const params = { limit, offset }
  if (status) params.status = status
  if (mode) params.mode = mode
  const qs = new URLSearchParams(params).toString()
  const data = await request(`/ingest/runs?${qs}`)
  return data?.items ?? []
}

/** Most recent ingestion run, or null when none exist yet. */
export async function getLatestIngestRun() {
  const data = await request('/ingest/latest', { allowStatuses: [404] })
  return data?.latest ?? null
}

/** Aggregate bar coverage (first/last date, total bars, unique days), or null when empty. */
export async function getBarDateRange() {
  return request('/bars/date-range', { allowStatuses: [404] })
}

/**
 * Per-day coverage vs. a reference ticker's trading calendar.
 * Pages through every day (the endpoint caps each page) so the full history can
 * be charted. Returns the response metadata plus the combined `items` array.
 */
export async function getCoverageGaps({ ticker, fromDate, toDate, adjustmentType } = {}) {
  const pageSize = 1000
  let offset = 0
  let meta = null
  const items = []
  // Safety bound: stop after 50 pages (50k days) to avoid an unbounded loop.
  for (let page = 0; page < 50; page++) {
    const params = { limit: pageSize, offset }
    if (ticker) params.ticker = ticker
    if (fromDate) params.from_date = fromDate
    if (toDate) params.to_date = toDate
    if (adjustmentType) params.adjustment_type = adjustmentType
    const qs = new URLSearchParams(params).toString()
    const data = await request(`/bars/coverage-gaps?${qs}`, { allowStatuses: [404] })
    if (!data) break
    if (meta === null) meta = data
    const batch = data.items ?? []
    items.push(...batch)
    if (batch.length < pageSize) break
    offset += pageSize
  }
  return { ...(meta ?? {}), items, count: items.length }
}

/** Symbols with the most missing bars vs. the reference calendar (worst first). */
export async function getSymbolGaps({ ticker, limit = 50, offset = 0 } = {}) {
  const params = { limit, offset }
  if (ticker) params.ticker = ticker
  const qs = new URLSearchParams(params).toString()
  const data = await request(`/bars/gaps/symbols?${qs}`, { allowStatuses: [404] })
  return data?.items ?? []
}

/** Trading dates with the most missing symbols (worst first). */
export async function getDateGaps({ ticker, limit = 50, offset = 0 } = {}) {
  const params = { limit, offset }
  if (ticker) params.ticker = ticker
  const qs = new URLSearchParams(params).toString()
  const data = await request(`/bars/gaps/dates?${qs}`, { allowStatuses: [404] })
  return data?.items ?? []
}

/**
 * Fetch daily bars (OHLCV) for a ticker.
 * @param {string} ticker - Stock ticker symbol
 * @param {number} limit - Number of recent days to fetch (default: 30)
 * @returns {Promise<Array>} Array of daily bar objects with open, high, low, close, volume
 */
export async function getDailyBars(ticker, limit = 30) {
  const params = new URLSearchParams({ ticker, limit })
  const url = `/bars?${params}`
  console.log('Fetching from:', BASE + url)
  const data = await request(url, { allowStatuses: [404] })
  return data?.items ?? []
}
