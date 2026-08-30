const BASE = 'http://momentum.quant.mayberry.farm:8020'

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

export async function getMomentumRuns({ status } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  const qs = params.toString()
  const data = await request(`/runs${qs ? '?' + qs : ''}`, { allowStatuses: [404] })
  return {
    runs: data?.results ?? [],
    count: data?.count ?? 0,
  }
}

export async function getLatestMomentumRun() {
  const data = await request('/runs/latest', { allowStatuses: [404] })
  return data?.latest ?? null
}
