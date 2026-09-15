import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import BackgroundLayout from '../components/BackgroundLayout'
import Navigation from '../components/Navigation'
import RoadmapExplorer from '../components/Roadmaps/RoadmapExplorer'
import RoleRoadmapView from '../components/Roadmaps/RoleRoadmapView'
import SkillRoadmapView from '../components/Roadmaps/SkillRoadmapView'
import uploadBackground from '../assets/resume-upload-hero.png'

const viewVariants = {
  initial: { opacity: 0, y: 14, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -14, scale: 0.995, transition: { duration: 0.2, ease: 'easeInOut' } }
}

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
        <AnimatePresence mode="wait">
          {viewMode === 'explorer' && (
            <motion.div key="view-explorer" initial="initial" animate="animate" exit="exit" variants={viewVariants}>
              <RoadmapExplorer 
                onSelectRole={handleSelectRole}
                onSelectSkill={handleSelectSkill}
                recommendedRole={preselectedRole}
                recommendedSkills={recommendedSkills}
              />
            </motion.div>
          )}

          {viewMode === 'role' && selectedRoleTitle && (
            <motion.div key={`view-role-${selectedRoleTitle}`} initial="initial" animate="animate" exit="exit" variants={viewVariants}>
              <RoleRoadmapView 
                roleTitle={selectedRoleTitle}
                onSelectSkill={handleSelectSkill}
                onBack={handleBackToExplorer}
              />
            </motion.div>
          )}

          {viewMode === 'skill' && selectedSkillTitle && (
            <motion.div key={`view-skill-${selectedSkillTitle}`} initial="initial" animate="animate" exit="exit" variants={viewVariants}>
              <SkillRoadmapView 
                skillName={selectedSkillTitle}
                onBack={() => {
                  if (selectedRoleTitle) setViewMode('role')
                  else setViewMode('explorer')
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </BackgroundLayout>
  )
}
