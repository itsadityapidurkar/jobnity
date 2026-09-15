const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options).catch((err) => {
    throw new Error(`Cannot connect to backend server at ${API_BASE}. Please ensure FastAPI server is running. (${err.message})`)
  })
  
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(body.detail || body.message || body.error || `HTTP error ${response.status}`)
    error.status = response.status
    throw error
  }

  return body
}

export const apiClient = {
  async uploadResume(file) {
    if (!file || !(file instanceof File)) {
      throw new Error('Please select a valid PDF or DOCX resume file.')
    }
    const form = new FormData()
    form.append('file', file)
    const res = await request('/resumes/upload', { method: 'POST', body: form })
    return {
      resume_id: res.resume_id,
      filename: res.filename,
      profile: res.profile
    }
  },

  async updateResume(resumeId, profileData) {
    return await request(`/resumes/${resumeId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    })
  },

  async getRoles(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : ''
    const res = await request(`/roles${query}`)
    return res.roles || res
  },

  async getRoleSkills(roleIdOrTitle) {
    return await request(`/roles/${encodeURIComponent(roleIdOrTitle)}/skills`)
  },

  async getSkills(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : ''
    return await request(`/skills${query}`)
  },

  async analyzeSkillGap(resumeId, roleIdOrTitle) {
    return await request('/analysis/skill-gap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_id: resumeId,
        role_id: roleIdOrTitle,
        target_role: roleIdOrTitle
      }),
    })
  },

  async getSkillResources(skillIdOrName) {
    return await request(`/skills/${encodeURIComponent(skillIdOrName)}/resources`)
  },

  async getAnalysisRecommendations(analysisId) {
    return await request(`/analysis/${analysisId}/recommendations`)
  }
}
