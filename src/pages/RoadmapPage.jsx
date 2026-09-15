import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import BackgroundLayout from '../components/BackgroundLayout'
import Navigation from '../components/Navigation'
import RoadmapExplorer from '../components/Roadmaps/RoadmapExplorer'
import RoleRoadmapView from '../components/Roadmaps/RoleRoadmapView'
import SkillRoadmapView from '../components/Roadmaps/SkillRoadmapView'
import uploadBackground from '../assets/resume-upload-hero.png'

export default function RoadmapPage() {
  const [searchParams] = useSearchParams()

  const preselectedRole = searchParams.get('role')
  const preselectedSkillsStr = searchParams.get('skills')
  const recommendedSkills = preselectedSkillsStr ? preselectedSkillsStr.split(',').filter(Boolean) : []

  // View mode: 'explorer' | 'role' | 'skill'
  const [viewMode, setViewMode] = useState('explorer')
  const [selectedRoleTitle, setSelectedRoleTitle] = useState(preselectedRole || '')
  const [selectedSkillTitle, setSelectedSkillTitle] = useState('')

  useEffect(() => {
    if (preselectedRole && !selectedRoleTitle) {
      setSelectedRoleTitle(preselectedRole)
    }
  }, [preselectedRole, selectedRoleTitle])

  function handleSelectRole(roleTitle) {
    setSelectedRoleTitle(roleTitle)
    setViewMode('role')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSelectSkill(skillTitle) {
    setSelectedSkillTitle(skillTitle)
    setViewMode('skill')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBackToExplorer() {
    setViewMode('explorer')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <BackgroundLayout backgroundImage={uploadBackground} className="upload-layout">
      <Navigation />

      <main className="roadmap-main">
        {viewMode === 'explorer' && (
          <RoadmapExplorer 
            onSelectRole={handleSelectRole}
            onSelectSkill={handleSelectSkill}
            recommendedRole={preselectedRole}
            recommendedSkills={recommendedSkills}
          />
        )}

        {viewMode === 'role' && selectedRoleTitle && (
          <RoleRoadmapView 
            roleTitle={selectedRoleTitle}
            onSelectSkill={handleSelectSkill}
            onBack={handleBackToExplorer}
          />
        )}

        {viewMode === 'skill' && selectedSkillTitle && (
          <SkillRoadmapView 
            skillName={selectedSkillTitle}
            onBack={() => {
              if (selectedRoleTitle) setViewMode('role')
              else setViewMode('explorer')
            }}
          />
        )}
      </main>
    </BackgroundLayout>
  )
}
