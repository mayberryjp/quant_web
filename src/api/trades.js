const BASE = 'http://execution.quant.mayberry.farm:8028'

async function request(path, { allowStatuses = [], ...options } = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: controller.signal,
      cache: 'no-store',
      ...options,
    })
    clearTimeout(timeout)
    if (allowStatuses.includes(res.status)) return null
    const json = await res.json()
    if (!res.ok) throw new Error(json.detail || json.error || `HTTP ${res.status}`)
    return json
  } catch (e) {
    clearTimeout(timeout)
    if (e.name === 'AbortError') throw new Error('Request timed out')
    throw e
  }
}

/** Trade history (most-recent-first). Defaults to paper trades only. */
export async function getTrades({ mode = 'paper', status, symbol, limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset })
  if (mode) params.set('mode', mode)
  if (status) params.set('status', status)
  if (symbol) params.set('symbol', symbol)
  const data = await request(`/trades?${params.toString()}`)
  return {
    trades: data?.trades ?? [],
    count: data?.count ?? 0,
    limit: data?.limit ?? limit,
    offset: data?.offset ?? offset,
  }
}
