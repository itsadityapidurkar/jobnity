let rawApiBase = import.meta.env.VITE_API_URL || '/api'
if (rawApiBase && !rawApiBase.endsWith('/api')) {
  rawApiBase = rawApiBase.replace(/\/+$/, '') + '/api'
}
const API_BASE = rawApiBase

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`
  const response = await fetch(url, options).catch((err) => {
    throw new Error(`Cannot connect to backend server at ${url}. Please ensure FastAPI server is running. (${err.message})`)
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

  async loadSampleResume(roleType = 'software-engineer') {
    const res = await request(`/resumes/sample?role=${encodeURIComponent(roleType)}`, { method: 'POST' })
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

  async analyzeSkillGap(resumeId, roleIdOrTitle, jobDescription = '') {
    return await request('/analysis/skill-gap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_id: resumeId,
        role_id: roleIdOrTitle,
        target_role: roleIdOrTitle,
        job_description: jobDescription || undefined
      }),
    })
  },

  async getSkillResources(skillIdOrName) {
    return await request(`/skills/${encodeURIComponent(skillIdOrName)}/resources`)
  },

  async getAnalysisRecommendations(analysisId) {
    return await request(`/analysis/${analysisId}/recommendations`)
  },

  async getInterviewStatus() {
    return await request('/interview/status')
  },

  async startInterview(roleOrOptions, targetSkill = '', resumeId = '', candidateId = '', candidateProfile = null) {
    let payload = {}
    if (typeof roleOrOptions === 'object' && roleOrOptions !== null) {
      payload = {
        role_id_or_title: roleOrOptions.role_id_or_title || roleOrOptions.role,
        target_skill: roleOrOptions.target_skill || roleOrOptions.targetSkill || undefined,
        resume_id: roleOrOptions.resume_id || roleOrOptions.resumeId || undefined,
        candidate_id: roleOrOptions.candidate_id || roleOrOptions.candidateId || undefined,
        candidate_profile: roleOrOptions.candidate_profile || roleOrOptions.candidateProfile || undefined,
        difficulty: roleOrOptions.difficulty || 'medium'
      }
    } else {
      payload = {
        role_id_or_title: roleOrOptions,
        target_skill: targetSkill || undefined,
        resume_id: resumeId || undefined,
        candidate_id: candidateId || undefined,
        candidate_profile: candidateProfile || undefined
      }
    }

    return await request('/interview/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  },

  async submitInterviewAnswer({ candidate_id, resume_id, candidate_profile, interview_id, question_id, question, answer, target_role }) {
    return await request('/interview/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_id,
        resume_id,
        candidate_profile,
        interview_id,
        question_id,
        question,
        answer,
        target_role
      })
    })
  },

  async getRecommendedRoles(payload = {}) {
    return await request('/roles/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }
}
