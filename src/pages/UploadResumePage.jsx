import { Link } from 'react-router-dom';
import { useRef, useState } from 'react'
import heroBackground from '../assets/jobnity-hero.png'
import BackgroundLayout from '../components/BackgroundLayout'
import LoadingSkeleton from '../components/LoadingSkeleton'
import StepIndicator from '../components/StepIndicator'
import Toast from '../components/Toast'
import { apiClient } from '../services/apiClient'
import { useNavigate } from 'react-router-dom'

const emptyProfile = { skills: [], education: '', experience: '', projects: '' }

function asEditableText(value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map((item) => typeof item === 'string' ? item : item.title ?? item.name ?? JSON.stringify(item)).join('\n')
  if (value && typeof value === 'object') return value.title ?? value.name ?? JSON.stringify(value)
  return ''
}

function normaliseProfile(response) {
  const source = response.profile ?? response.data ?? response
  return {
    id: source.profile_id ?? source.id,
    personalInfo: {
      name: source.name || (source.personalInfo && source.personalInfo.name) || 'Candidate Name',
      email: source.email || (source.personalInfo && source.personalInfo.email) || '',
      phone: source.phone || (source.personalInfo && source.personalInfo.phone) || ''
    },
    skills: Array.isArray(source.skills) ? source.skills.map((skill) => typeof skill === 'string' ? skill : skill.name).filter(Boolean) : [],
    education: asEditableText(source.education),
    experience: asEditableText(source.experience),
    projects: asEditableText(source.projects),
  }
}

function UploadIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v4A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-4" /></svg>
}

function UploadZone({ onFile, error }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file) {
    if (!file) return
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'docx'].includes(extension)) {
      onFile(null, 'Please choose a PDF or DOCX resume.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      onFile(null, 'Your resume must be 10 MB or smaller.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    onFile(file)
  }

  return (
    <div
      className={`upload-zone ${dragging ? 'is-dragging' : ''} ${error ? 'has-error' : ''}`}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => { event.preventDefault(); setDragging(false) }}
      onDrop={(event) => { event.preventDefault(); setDragging(false); handleFile(event.dataTransfer.files[0]) }}
    >
      <input ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => handleFile(event.target.files[0])} />
      <UploadIcon />
      <h2>Drop your resume here</h2>
      <p>or <button type="button" onClick={() => inputRef.current?.click()}>browse files</button></p>
      <small>PDF or DOCX · up to 10 MB</small>
      {error && <p className="upload-zone__error" role="status">{error}</p>}
    </div>
  )
}

function SkillsEditor({ skills, onChange }) {
  const [draft, setDraft] = useState('')
  const [duplicate, setDuplicate] = useState(false)
  
  function addSkill(event) {
    event.preventDefault()
    const skill = draft.trim()
    if (!skill) return
    if (skills.some((item) => item.toLowerCase() === skill.toLowerCase())) {
      setDuplicate(true)
      setTimeout(() => setDuplicate(false), 400)
      return
    }
    onChange([...skills, skill])
    setDraft('')
    setDuplicate(false)
  }
  return <section className="review-field review-field--skills"><div className="review-field__heading"><label>Skills</label><span>Edit, remove, or add anything we missed</span></div><div className="skill-chips">{skills.map((skill, index) => <span className="skill-chip" key={`${skill}-${index}`}><input value={skill} onChange={(event) => onChange(skills.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} aria-label={`Edit ${skill}`} /><button type="button" onClick={() => onChange(skills.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${skill}`}>×</button></span>)}</div><form className="add-skill" onSubmit={addSkill}><input className={duplicate ? 'is-shaking' : ''} value={draft} onChange={(event) => { setDraft(event.target.value); setDuplicate(false) }} placeholder="Add a skill" aria-label="Add a skill" /><button type="submit">Add</button></form></section>
}

function TextEditor({ label, description, value, onChange }) {
  const textareaRef = useRef(null)
  
  function handleInput(event) {
    onChange(event.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  return <section className="review-field"><div className="review-field__heading"><label htmlFor={label}>{label}</label><span>{description}</span></div><textarea ref={textareaRef} id={label} value={value} onChange={handleInput} rows="3" /></section>
}

function ReviewPanel({ profile, onChange, onConfirm, saving }) {
  return <div className="resume-panel resume-panel--review"><div className="panel-heading"><p className="eyebrow">Check the details</p><h1>Make your profile yours.</h1><p>We found the essentials. Edit anything before we build your skill gap report.</p></div><SkillsEditor skills={profile.skills} onChange={(skills) => onChange({ ...profile, skills })} /><TextEditor label="Education" description="Degrees, institutions, and dates" value={profile.education} onChange={(education) => onChange({ ...profile, education })} /><TextEditor label="Experience" description="Roles, companies, and key impact" value={profile.experience} onChange={(experience) => onChange({ ...profile, experience })} /><TextEditor label="Projects" description="Projects you want employers to notice" value={profile.projects} onChange={(projects) => onChange({ ...profile, projects })} /><button className="primary-button panel-button" type="button" onClick={onConfirm} disabled={saving}>{saving ? 'Saving profile…' : <>Confirm &amp; Continue <span aria-hidden="true">→</span></>}</button></div>
}

export default function UploadResumePage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('idle')
  const [profile, setProfile] = useState(emptyProfile)
  const [uploadError, setUploadError] = useState('')
  const [toast, setToast] = useState('')

  async function upload(file, validationError = '') {
    if (validationError) { setUploadError(validationError); return }
    if (!file) return
    setUploadError('')
    setStatus('loading')
    try {
      const response = await apiClient.uploadResume(file)
      const parsedProfile = normaliseProfile(response)
      if (!parsedProfile.id) throw new Error('We could not read a profile from that resume. Please try another file.')
      setProfile(parsedProfile)
      setStatus('review')
    } catch (error) {
      setStatus('idle')
      setToast(error.message || 'We could not parse that resume. Please try again.')
    }
  }

  async function confirmProfile() {
    if (!profile.id) return
    setStatus('saving')
    try {
      await apiClient.updateResume(profile.id, { skills: profile.skills, education: profile.education, experience: profile.experience, projects: profile.projects })
      sessionStorage.setItem('jobnity_profile_id', String(profile.id))
      navigate('/skill-gap-report')
    } catch (error) {
      setStatus('review')
      setToast(error.message || 'We could not save your updates. Please try again.')
    }
  }

  return <BackgroundLayout backgroundImage={heroBackground} className="upload-layout"><header className="upload-header"><Link className="wordmark" to="/">Jobnity</Link><StepIndicator active={0} /></header><div className="upload-main">{status === 'review' || status === 'saving' ? <ReviewPanel profile={profile} onChange={setProfile} onConfirm={confirmProfile} saving={status === 'saving'} /> : <div className="resume-panel"><div className="panel-heading"><p className="eyebrow">Your career starts here</p><h1>Let’s look at your resume.</h1><p>Upload it once and we’ll turn its details into a clear direction.</p></div>{status === 'loading' ? <LoadingSkeleton /> : <UploadZone onFile={upload} error={uploadError} />}</div>}</div><Toast message={toast} onDismiss={() => setToast('')} /></BackgroundLayout>
}
