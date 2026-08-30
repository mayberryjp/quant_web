const BASE = 'http://distill.quant.mayberry.farm:8021'

async function request(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal, cache: 'no-store', ...options })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || json.detail || `HTTP ${res.status}`)
    return json
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Request timed out')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

/** Current queue, worker, and job-state counters for the distillation service. */
export function getQueue() {
  return request('/queue')
}

/** Most recent distillation jobs, including their processing outcome. */
export async function getJobs() {
  const data = await request('/v1/jobs')
  return {
    items: data.items ?? [],
    total: data.total ?? 0,
  }
}
