const BASE = 'http://momentum.quant.mayberry.farm:8020'

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

/**
 * Fetch daily changes for a ticker.
 * @param {string} ticker - Stock ticker symbol
 * @param {number} limit - Number of recent days to fetch (default: 15)
 * @returns {Promise<Array>} Array of daily change objects
 */
export async function getDailyChanges(ticker, limit = 15) {
  const params = new URLSearchParams({ ticker, limit })
  const url = `/daily-changes?${params}`
  console.log('Fetching daily changes from:', BASE + url)
  const data = await request(url)
  console.log('Daily changes response:', data)
  return data.results || []
}
