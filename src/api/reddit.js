const BASE = '/api/quant_reddit'

async function request(path, { allowStatuses = [], ...options } = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal, cache: 'no-store', ...options })
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

export async function getHealth() {
  return request('/reddit/health')
}

export async function getReady() {
  return request('/reddit/ready')
}

export async function getStats() {
  return request('/reddit/stats', { allowStatuses: [404] })
}

export async function getRuns({ runType, page = 1, pageSize = 100 } = {}) {
  const params = { page, page_size: pageSize }
  if (runType) params.run_type = runType
  const qs = new URLSearchParams(params).toString()
  const data = await request(`/reddit/runs/recent?${qs}`, { allowStatuses: [404] })
  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  }
}
