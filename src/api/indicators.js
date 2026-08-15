const BASE = 'http://indicators.quant.mayberry.farm:8001'

async function request(path, { allowStatuses = [], ...options } = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal, ...options })
    clearTimeout(timeout)
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

export async function getIndicatorRuns({ limit = 100 } = {}) {
  const params = new URLSearchParams({ limit })
  const data = await request(`/runs?${params.toString()}`, { allowStatuses: [404] })
  return {
    runs: data?.runs ?? [],
    count: data?.count ?? 0,
  }
}

export async function getLatestIndicatorRun() {
  return request('/runs/latest', { allowStatuses: [404] })
}
