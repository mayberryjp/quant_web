const BASE = 'http://stickynote.quant.mayberry.farm:8024'

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

/** Most recent published sticky-note watchlist (latest signal_date with active notes). */
export async function getLatestStickyNotes() {
  const data = await request('/sticky-notes/latest', { allowStatuses: [404] })
  return {
    signalDate: data?.signal_date ?? null,
    total: data?.total ?? 0,
    results: data?.results ?? [],
  }
}
