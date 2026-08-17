const BASE = 'http://cnbc.quant.mayberry.farm:8019'

async function request(path, { allowStatuses = [], ...options } = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal, cache: 'no-store', ...options })
    clearTimeout(timeout)
    // Tolerated statuses (e.g. 404 before any run) resolve to null instead of throwing.
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

/** Aggregate CNBC ingestion counters + last-run summary. */
export async function getStats() {
  return request('/cnbc/stats', { allowStatuses: [404] })
}

/**
 * Bounded list of ingested transcripts (the CNBC ingestion activity), newest
 * broadcast first. Each row tracks an archive.org item through the processing
 * state machine (discovered → fetched → distilled → delivered → done | failed).
 */
export async function getTranscripts({ status, show, fromDate, toDate, page, pageSize } = {}) {
  const params = {}
  if (page != null) params.page = page
  if (pageSize != null) params.page_size = pageSize
  if (status) params.status = status
  if (show) params.show = show
  if (fromDate) params.from_date = fromDate
  if (toDate) params.to_date = toDate
  const qs = new URLSearchParams(params).toString()
  const data = await request(`/transcripts${qs ? `?${qs}` : ''}`, { allowStatuses: [404] })
  return { items: data?.items ?? [], total: data?.total ?? 0 }
}

/** Re-run distillation/processing for a single transcript by its identifier. */
export async function restartTranscript(identifier) {
  return request(`/transcripts/${encodeURIComponent(identifier)}/restart`, { method: 'POST' })
}

/** Permanently delete a single transcript (and its ingestion run) by numeric id. */
export async function deleteTranscript(id) {
  return request(`/transcripts/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
