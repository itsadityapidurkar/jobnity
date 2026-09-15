const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options)
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(body.detail || body.message || body.error || 'Something went wrong. Please try again.')
    error.status = response.status
    throw error
  }

  return body
}

export const apiClient = {
  uploadResume(file) {
    const form = new FormData()
    form.append('file', file)
    return request('/resume/upload', { method: 'POST', body: form })
  },
  updateResume(profileId, profile) {
    return request(`/resume/${profileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
  },
  analyzeSkillGap(profileId, role) {
    return request('/skills/gap-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(profileId ? { profile_id: profileId } : {}),
        role,
        target_role: role,
      }),
    })
  },
  getRoadmap(reportId) {
    return request(`/roadmap/${reportId}`)
  },
  generateRoadmap(reportId) {
    return request('/roadmap/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_id: reportId }),
    })
  },
  updateRoadmapItem(itemId, status) {
    return request(`/roadmap/item/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  },
  submitInterviewAnswer(payload) {
    return request('/interview/submit-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  },
  getDashboard(candidateId) {
    return request(`/dashboard/${candidateId}`)
  },
}
