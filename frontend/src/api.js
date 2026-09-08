import React from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || ''

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  health: () => request('/api/health'),
  overview: () => request('/api/overview'),
  report: () => request('/api/report'),
  datasets: () => request('/api/datasets'),
  dataset: (name, limit = 20) => request(`/api/datasets/${name}?limit=${limit}`),
  knowledgeGraph: () => request('/api/knowledge-graph'),
  kgSearch: (q) => request(`/api/knowledge-graph/search?q=${encodeURIComponent(q)}`),
  recommendations: (patient) => request('/api/recommendations', {
    method: 'POST',
    body: JSON.stringify(patient),
  }),
  analyzeImage: (imageBase64) => request('/api/analyze-image', {
    method: 'POST',
    body: JSON.stringify({ image: imageBase64 }),
  }),
  classifierStatus: () => request('/api/classifier/status'),
  assessment: (data) => request('/api/assessment', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  departmentPlan: (data) => request('/api/department-plan', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  medicineSearch: (q, limit = 30) => request(`/api/medicines/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  medicineStats: () => request('/api/medicines/stats'),
  medicineGet: (id) => request(`/api/medicines/${id}`),
  trainedModels: () => request('/api/trained/models'),
  trainedEval: () => request('/api/trained/evaluation'),
  trainedPredictNumerical: (payload) => request('/api/trained/predict/numerical', { method: 'POST', body: JSON.stringify(payload) }),
  trainedPredictText: (payload) => request('/api/trained/predict/text', { method: 'POST', body: JSON.stringify(payload) }),
  aiStatus: () => request('/api/ai/status'),
  aiVision: (payload) => request('/api/ai/vision', { method: 'POST', body: JSON.stringify(payload) }),
  aiReason: (payload) => request('/api/ai/reason', { method: 'POST', body: JSON.stringify(payload) }),
  aiVerify: (payload) => request('/api/ai/verify', { method: 'POST', body: JSON.stringify(payload) }),
}

export function useFetch(fetcher, deps = []) {
  const [state, setState] = React.useState({ data: null, loading: true, error: null })
  React.useEffect(() => {
    let mounted = true
    setState({ data: null, loading: true, error: null })
    fetcher()
      .then((data) => mounted && setState({ data, loading: false, error: null }))
      .catch((err) => mounted && setState({ data: null, loading: false, error: err.message }))
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}
