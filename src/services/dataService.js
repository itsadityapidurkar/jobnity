import { JOB_ROLES, ROLE_SKILLS, LEARNING_RESOURCES, SKILLS_TAXONOMY, SKILL_ALIASES, SAMPLE_RESUMES } from '../data/jobnityData'

/**
 * Normalizes a skill string to standard format or canonical name using alias mapping
 */
export function normalizeSkill(skillName) {
  if (!skillName || typeof skillName !== 'string') return ''
  const trimmed = skillName.trim().toLowerCase()
  const aliasMatch = SKILL_ALIASES.find(a => a.alias.toLowerCase() === trimmed)
  if (aliasMatch) return aliasMatch.canonical_skill
  
  const taxMatch = SKILLS_TAXONOMY.find(s => s.skill.toLowerCase() === trimmed)
  if (taxMatch) return taxMatch.skill

  // Return title case if no direct alias found
  return skillName.trim()
}

/**
 * Fetch list of all standardized job roles
 */
export function getJobRoles() {
  return JOB_ROLES
}

/**
 * Fetch skills for a specific job role
 */
export function getRoleSkills(roleTitle) {
  if (!roleTitle) return []
  return ROLE_SKILLS.filter(rs => rs.job_role.toLowerCase() === roleTitle.toLowerCase())
}

/**
 * Fetch learning resources for a skill
 */
export function getLearningResources(skillName) {
  if (!skillName) return { youtube: [], blogs: [], roadmaps: [] }
  
  const norm = normalizeSkill(skillName).toLowerCase()
  const matching = LEARNING_RESOURCES.filter(r => {
    const resSkill = r.skill.toLowerCase()
    return resSkill === norm || resSkill.includes(norm) || norm.includes(resSkill)
  })

  const youtube = matching.filter(r => r.resource_type === 'YouTube')
  const blogs = matching.filter(r => r.resource_type === 'Blog')
  const roadmaps = matching.filter(r => r.resource_type === 'Roadmap')

  // If no exact dataset resource matches, provide fallback links dynamically
  const fallbackYoutube = youtube.length ? youtube : [
    {
      resource_id: `yt-fallback-1`,
      skill: skillName,
      resource_type: 'YouTube',
      title: `Complete ${skillName} Tutorial for Beginners`,
      url: `https://www.youtube.com/results?search_query=learn+${encodeURIComponent(skillName)}+tutorial`,
      provider: 'YouTube Learning',
      difficulty: 'Beginner to Intermediate',
      duration: '1 - 2 hours'
    }
  ]

  const fallbackBlogs = blogs.length ? blogs : [
    {
      resource_id: `blog-fallback-1`,
      skill: skillName,
      resource_type: 'Blog',
      title: `Mastering ${skillName}: A Comprehensive Guide`,
      url: `https://dev.to/search?q=${encodeURIComponent(skillName)}`,
      provider: 'Dev Community / MDN',
      difficulty: 'Intermediate'
    }
  ]

  // Only include roadmap.sh if there is a known valid roadmap or valid URL in dataset
  const hasRoadmapSh = roadmaps.some(r => r.url && r.url.includes('roadmap.sh'))
  const validRoadmaps = hasRoadmapSh ? roadmaps : []

  return {
    youtube: fallbackYoutube,
    blogs: fallbackBlogs,
    roadmaps: validRoadmaps
  }
}

/**
 * Simulate resume parsing from file
 */
export async function parseResumeFile(file) {
  // Simulate short delay for realistic NLP extraction feel
  await new Promise(res => setTimeout(res, 1200))

  if (!file) {
    throw new Error('No file selected. Please choose a PDF or DOCX file.')
  }

  const fileName = file.name.toLowerCase()
  
  // Pick sample matching filename keywords or pick random realistic sample
  let matchedSample = SAMPLE_RESUMES[0]
  if (fileName.includes('data') || fileName.includes('science')) {
    matchedSample = SAMPLE_RESUMES.find(r => r.job_role.includes('Data')) || SAMPLE_RESUMES[1]
  } else if (fileName.includes('devops') || fileName.includes('cloud')) {
    matchedSample = SAMPLE_RESUMES.find(r => r.job_role.includes('Cloud') || r.job_role.includes('DevOps')) || SAMPLE_RESUMES[2]
  } else if (fileName.includes('senior') || fileName.includes('lead')) {
    matchedSample = SAMPLE_RESUMES[3]
  }

  // Format extracted structure
  return {
    id: `prof_${Date.now()}`,
    fileName: file.name,
    fileType: file.name.split('.').pop().toUpperCase(),
    fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    personalInfo: {
      name: file.name ? file.name.replace(/\.(pdf|docx)$/i, '').replace(/(resume|cv|_)/gi, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim() : 'Candidate Name',
      email: 'candidate@example.com',
      phone: '+1 (555) 019-2831'
    },
    education: [
      {
        degree: matchedSample.degree || 'Bachelor of Science in Computer Science',
        institution: matchedSample.college || 'State University',
        details: matchedSample.education || 'Graduated with Honors'
      }
    ],
    skills: matchedSample.skills && matchedSample.skills.length > 0 
      ? matchedSample.skills 
      : ['Python', 'SQL', 'Git', 'JavaScript', 'HTML', 'CSS'],
    experience: [
      {
        company: 'Tech Solutions Inc.',
        role: matchedSample.job_role || 'Software Engineer',
        duration: '2022 - Present',
        description: typeof matchedSample.experience === 'string' ? matchedSample.experience : 'Developed backend microservices and improved database query efficiency.'
      }
    ],
    projects: [
      {
        name: 'Project Portal',
        description: typeof matchedSample.projects === 'string' ? matchedSample.projects : 'Built full stack web application with authentication and data visualization.',
        technologies: 'React, Node.js, PostgreSQL'
      }
    ],
    certifications: [
      {
        name: matchedSample.certifications || 'AWS Certified Cloud Practitioner',
        issuer: 'Amazon Web Services'
      }
    ]
  }
}

/**
 * Perform Skill Gap Analysis comparing Candidate Profile vs Target Role
 */
export function calculateSkillGap(candidateProfile, targetRoleTitle) {
  if (!targetRoleTitle) return null

  const roleSkills = getRoleSkills(targetRoleTitle)
  if (!roleSkills.length) return null

  // Normalized set of candidate skills
  const candidateSkillSet = new Set(
    (candidateProfile.skills || []).map(s => normalizeSkill(s).toLowerCase())
  )

  const matched = []
  const missing = []
  let requiredMissingCount = 0
  let preferredMissingCount = 0

  roleSkills.forEach((rs, idx) => {
    const normSkill = normalizeSkill(rs.skill)
    const isMatched = candidateSkillSet.has(normSkill.toLowerCase())

    const skillItem = {
      id: `sk_${idx}`,
      skill: rs.skill,
      canonicalSkill: normSkill,
      importance: rs.importance || 'Required', // Required or Preferred
      priority: rs.priority || 'Medium',
      minimumLevel: rs.minimum_level || 'Intermediate',
      candidateLevel: isMatched ? 'Intermediate' : 'Not Found',
      status: isMatched ? 'Matched' : 'Missing',
      reason: rs.skill_evidence || `Essential skill for ${targetRoleTitle}`
    }

    if (isMatched) {
      matched.push(skillItem)
    } else {
      missing.push(skillItem)
      if (rs.importance === 'Required') {
        requiredMissingCount++
      } else {
        preferredMissingCount++
      }
    }
  })

  const totalSkills = roleSkills.length
  const matchedCount = matched.length
  // Readiness score %
  const readinessScore = totalSkills > 0 ? Math.round((matchedCount / totalSkills) * 100) : 0
  const gapScore = 100 - readinessScore

  return {
    targetRole: targetRoleTitle,
    readinessScore,
    gapScore,
    matchedCount,
    missingCount: missing.length,
    requiredCount: roleSkills.filter(r => r.importance === 'Required').length,
    preferredCount: roleSkills.filter(r => r.importance === 'Preferred').length,
    requiredMissingCount,
    preferredMissingCount,
    matched,
    missing
  }
}
