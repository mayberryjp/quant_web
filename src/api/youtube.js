const BASE = '/api/quant_youtube'

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

/** Aggregate YouTube ingestion counters + last-run summary. */
export async function getStats() {
  return request('/allin/stats', { allowStatuses: [404] })
}

/**
 * Paginated list of AllIn ingestion runs, newest first.
 * Returns { items, total }.
 */
export async function getRuns({ page = 1, pageSize = 100 } = {}) {
  const qs = new URLSearchParams({ page, page_size: pageSize }).toString()
  const data = await request(`/allin/runs?${qs}`, { allowStatuses: [404] })
  return { items: data?.items ?? [], total: data?.total ?? 0 }
}

/** Fetch a single run by its run_date (YYYY-MM-DD). */
export async function getRun(runDate) {
  return request(`/allin/runs/${encodeURIComponent(runDate)}`, { allowStatuses: [404] })
}

/**
 * Paginated list of ingested episodes.
 * Returns { items, total }.
 */
export async function getEpisodes({ page = 1, pageSize = 100 } = {}) {
  const qs = new URLSearchParams({ page, page_size: pageSize }).toString()
  const data = await request(`/episodes?${qs}`, { allowStatuses: [404] })
  return { items: data?.items ?? [], total: data?.total ?? 0 }
}

/** Requeue an episode for transcript fetch + distillation by video_id string. */
export async function requeueEpisode(videoId) {
  return request(`/episodes/${encodeURIComponent(videoId)}/requeue`, { method: 'POST' })
}

/** Permanently delete an episode by numeric id. */
export async function deleteEpisode(id) {
  return request(`/episodes/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/** Trigger a new ingestion run. Returns a job object with an `id`. */
export async function triggerRun() {
  return request('/runs/trigger', { method: 'POST' })
}

/** Poll job status by job id. */
export async function getJob(jobId) {
  return request(`/jobs/${encodeURIComponent(jobId)}`)
}
