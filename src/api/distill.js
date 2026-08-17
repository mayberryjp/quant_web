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
export async function getJobs({ limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset })
  const data = await request(`/v1/jobs?${params}`)
  return {
    items: data.items ?? [],
    total: data.total ?? 0,
  }
}

/** Retrieve every distillation job by paging through the service response. */
export async function getAllJobs({ pageSize = 50 } = {}) {
  const items = []
  let offset = 0
  let total = 0

  do {
    const page = await getJobs({ limit: pageSize, offset })
    total = page.total
    items.push(...page.items)
    offset += page.items.length
  } while (offset < total && offset > 0)

  return { items, total }
}
