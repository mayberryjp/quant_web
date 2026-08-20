const BASE = import.meta.env.VITE_MONITORING_API_BASE || 'http://monitoring.quant.mayberry.farm:8025'

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

export async function getMonitoringJobs() {
  const data = await request('/jobs')
  return {
    jobs: data?.jobs ?? [],
    count: data?.count ?? 0,
  }
}

export async function getMonitoringRuns({ jobName, status, limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset })
  if (jobName) params.set('job_name', jobName)
  if (status) params.set('status', status)
  const data = await request(`/runs?${params.toString()}`, { allowStatuses: [404] })
  return {
    runs: data?.results ?? [],
    count: data?.count ?? 0,
    limit: data?.limit ?? limit,
    offset: data?.offset ?? offset,
  }
}

export async function getMonitoringRun(executionId) {
  const data = await request(`/runs/${encodeURIComponent(executionId)}`, { allowStatuses: [404] })
  return data?.run ?? null
}

export async function getLatestMonitoringRun(jobName) {
  const data = await request(`/jobs/${encodeURIComponent(jobName)}/runs/latest`, { allowStatuses: [404] })
  return data?.run ?? null
}
