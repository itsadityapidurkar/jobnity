const icons = {
  upload: (
    <>
      <path d="M12 16V4" />
      <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
      <path d="M5 14.5v4A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-4" />
    </>
  ),
  analyze: (
    <>
      <circle cx="11" cy="11" r="5.5" />
      <path d="m15.2 15.2 4.3 4.3" />
      <path d="M11 8.5v5M8.5 11h5" />
    </>
  ),
  prepare: (
    <>
      <path d="M6 4.5h8a3 3 0 0 1 3 3v12H9a3 3 0 0 0-3 3z" />
      <path d="M6 4.5v18" />
      <path d="M9.5 9h4M9.5 12.5h4" />
    </>
  ),
}

export default function StepIcon({ name }) {
  return (
    <svg className="step-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}
