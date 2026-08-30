const BASE = 'http://streamingchart.quant.mayberry.farm:8027'

async function post(path, body) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const json = await res.json().catch(() => null)
    if (!res.ok) throw new Error(json?.detail || json?.error || `HTTP ${res.status}`)
    return json
  } catch (e) {
    clearTimeout(timeout)
    if (e.name === 'AbortError') throw new Error('Request timed out')
    throw e
  }
}

async function get(path) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(timeout)
    const json = await res.json().catch(() => null)
    if (!res.ok) throw new Error(json?.detail || json?.error || `HTTP ${res.status}`)
    return json
  } catch (e) {
    clearTimeout(timeout)
    if (e.name === 'AbortError') throw new Error('Request timed out')
    throw e
  }
}

/**
 * Fetch a ticker's intraday bars into the DB, then start a replay that
 * streams each slice to Kafka.
 */
export async function streamReplay(ticker, { interval = '1m', replayIntervalSeconds = 1.0 } = {}) {
  await post('/api/v1/fetch', { ticker })
  return post('/api/v1/replays', {
    ticker,
    interval,
    replay_interval_seconds: replayIntervalSeconds,
  })
}

/** Per-ticker fetch + replay status. Optionally filter to a single ticker. */
export async function getPaperStatus(ticker) {
  const qs = ticker ? `?ticker=${encodeURIComponent(ticker)}` : ''
  const data = await get(`/api/v1/status${qs}`)
  return data?.status ?? []
}

/** Intraday 1-minute bars for a ticker on a given date (YYYY-MM-DD). */
export async function getReplayBars(ticker, date) {
  if (!ticker) return { ticker, date, bars: [] }
  const params = new URLSearchParams({ ticker })
  if (date) params.set('date', date)
  const data = await get(`/api/v1/bars?${params.toString()}`)
  return {
    ticker: data?.ticker ?? ticker,
    interval: data?.interval ?? '1m',
    date: data?.date ?? date,
    count: data?.count ?? 0,
    bars: data?.bars ?? [],
  }
}
