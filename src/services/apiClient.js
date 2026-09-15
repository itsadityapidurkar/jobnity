import { 
  getJobRoles, 
  getRoleSkills, 
  getLearningResources, 
  parseResumeFile, 
  calculateSkillGap 
} from './dataService'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

async function request(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, options)
    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      const error = new Error(body.detail || body.message || body.error || 'API call failed.')
      error.status = response.status
      throw error
    }

    return body
  } catch (err) {
    console.warn(`[Jobnity API] Call to ${path} failed or backend offline. Falling back to local data.`, err.message)
    throw err
  }
}

export const apiClient = {
  async uploadResume(file) {
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await request('/resumes/upload', { method: 'POST', body: form })
      return {
        resume_id: res.resume_id,
        filename: res.filename,
        profile: res.profile
      }
    } catch (e) {
      // Local fallback
      const parsed = await parseResumeFile(file)
      return {
        resume_id: parsed.id,
        filename: file.name,
        profile: parsed
      }
    }
  },

  async updateResume(resumeId, profileData) {
    try {
      return await request(`/resumes/${resumeId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })
    } catch (e) {
      return { id: resumeId, ...profileData }
    }
  },

  async analyzeSkillGap(resumeId, roleIdOrTitle) {
    try {
      return await request('/analysis/skill-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_id: resumeId,
          role_id: roleIdOrTitle,
          target_role: roleIdOrTitle
        }),
      })
    } catch (e) {
      return null
    }
  },

  async getRoleSkills(roleIdOrTitle) {
    try {
      return await request(`/roles/${encodeURIComponent(roleIdOrTitle)}/skills`)
    } catch (e) {
      return { skills: getRoleSkills(roleIdOrTitle) }
    }
  },

  async getSkillResources(skillIdOrName) {
    try {
      return await request(`/skills/${encodeURIComponent(skillIdOrName)}/resources`)
    } catch (e) {
      return getLearningResources(skillIdOrName)
    }
  },

  async getAnalysisRecommendations(analysisId) {
    try {
      return await request(`/analysis/${analysisId}/recommendations`)
    } catch (e) {
      return null
    }
  }
}
