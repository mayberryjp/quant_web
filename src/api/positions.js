const BASE = 'http://positions.quant.mayberry.farm:8015'

async function request(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: controller.signal,
      ...options,
    })
    clearTimeout(timeout)
    const json = await res.json()
    if (!res.ok) throw new Error(json.detail || json.error || `HTTP ${res.status}`)
    return json
  } catch (e) {
    clearTimeout(timeout)
    if (e.name === 'AbortError') throw new Error('Request timed out')
    throw e
  }
}

/** Extract array from a paginated dict response or bare array. */
function extractItems(data) {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    if (Array.isArray(data.items)) return data.items
    if (Array.isArray(data.portfolios)) return data.portfolios
    if (Array.isArray(data.positions)) return data.positions
    if (Array.isArray(data.entries)) return data.entries
    if (Array.isArray(data.lots)) return data.lots
    if (Array.isArray(data.runs)) return data.runs
    if (Array.isArray(data.warnings)) return data.warnings
  }
  return []
}

/** Normalize a position object from the API to consistent field names/types. */
function normalizePosition(raw) {
  return {
    ...raw,
    ticker: raw.submitted_ticker ?? raw.ticker ?? '—',
    quantity: Number(raw.quantity) || 0,
    avg_cost: Number(raw.average_cost ?? raw.avg_cost) || 0,
    market_value: Number(raw.market_value) || 0,
    realized_pnl: Number(raw.realized_pnl) || 0,
    unrealized_pnl: Number(raw.unrealized_pnl) || 0,
  }
}

/** Normalize a ledger entry from the API. */
function normalizeLedger(raw) {
  return {
    ...raw,
    ticker: raw.submitted_ticker ?? raw.ticker ?? '—',
    quantity_delta: Number(raw.quantity_delta) || 0,
    price: raw.price != null ? Number(raw.price) : null,
    fees: raw.fees != null ? Number(raw.fees) : 0,
  }
}

export async function getPortfolios() {
  const data = await request('/portfolios')
  return extractItems(data)
}

export async function createPortfolio(body) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${BASE}/portfolios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const json = await res.json()
    // 201 = created, 409 = already exists — both are acceptable
    if (res.status === 201 || res.status === 409) return json
    if (!res.ok) throw new Error(json.detail || json.error || `HTTP ${res.status}`)
    return json
  } catch (e) {
    clearTimeout(timeout)
    if (e.name === 'AbortError') throw new Error('Request timed out')
    throw e
  }
}

export function deletePortfolio(id) {
  return request(`/portfolios/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function getPositions(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const data = await request(`/positions${qs ? '?' + qs : ''}`)
  return extractItems(data).map(normalizePosition)
}

export function getPositionByTicker(ticker, portfolio) {
  const qs = portfolio ? `?portfolio=${encodeURIComponent(portfolio)}` : ''
  return request(`/positions/by-ticker/${encodeURIComponent(ticker)}${qs}`)
}

export function importLedgerEntry(data) {
  return request('/position-ledger/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function getLedgerEntries(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const data = await request(`/position-ledger${qs ? '?' + qs : ''}`)
  return extractItems(data).map(normalizeLedger)
}

export async function getPositionLots(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const data = await request(`/position-lots${qs ? '?' + qs : ''}`)
  return extractItems(data)
}

export function getReconciliationWarnings() {
  return request('/reconciliation/warnings')
}

export function getHealth() {
  return request('/positions/health')
}

export function getReady() {
  return request('/positions/ready')
}
