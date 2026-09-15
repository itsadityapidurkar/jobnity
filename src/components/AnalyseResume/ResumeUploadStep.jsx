import { useRef, useState } from 'react'

export default function ResumeUploadStep({ onAnalyze, onSampleSelect }) {
  const inputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  function validateAndSetFile(file) {
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      setError('Please select a valid PDF or DOCX file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10 MB limit.')
      return
    }
    setError('')
    setSelectedFile({
      file,
      name: file.name,
      type: ext.toUpperCase(),
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    })
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  function handleRemoveFile() {
    setSelectedFile(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="resume-panel upload-panel">
      <div className="panel-heading">
        <p className="eyebrow">Analyse Your Resume</p>
        <h1>Discover your skill gap &amp; clear career path.</h1>
        <p>Upload your resume to identify your skills and discover where you can improve.</p>
      </div>

      {!selectedFile ? (
        <div 
          className={`upload-zone ${dragging ? 'is-dragging' : ''} ${error ? 'has-error' : ''}`}
          onDragEnter={(e) => { e.preventDefault(); setDragging(true) }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => { e.preventDefault(); setDragging(false) }}
          onDrop={handleDrop}
        >
          <input 
            ref={inputRef} 
            type="file" 
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
            onChange={handleFileChange} 
          />
          <svg viewBox="0 0 24 24" aria-hidden="true" className="upload-zone__icon">
            <path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v4A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-4" />
          </svg>
          <h2>Upload Resume</h2>
          <p>
            Drag and drop your file here, or{' '}
            <button type="button" onClick={() => inputRef.current?.click()}>
              browse files
            </button>
          </p>
          <small className="supported-formats">Supported formats: PDF, DOCX (up to 10 MB)</small>
          {error && <p className="upload-zone__error">{error}</p>}

          <div className="sample-resumes-prompt">
            <span>Or test with a sample resume:</span>
            <div className="sample-buttons">
              <button type="button" className="sample-btn" onClick={() => onSampleSelect('Software Engineer')}>Software Engineer</button>
              <button type="button" className="sample-btn" onClick={() => onSampleSelect('Data Scientist')}>Data Scientist</button>
              <button type="button" className="sample-btn" onClick={() => onSampleSelect('Cloud Engineer')}>Cloud Engineer</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="file-preview-card">
          <div className="file-preview-info">
            <div className="file-icon">
              <span>{selectedFile.type}</span>
            </div>
            <div className="file-details">
              <strong>{selectedFile.name}</strong>
              <div className="file-meta">
                <span>{selectedFile.size}</span>
                <span className="file-status-badge">Ready for analysis</span>
              </div>
            </div>
          </div>
          <button type="button" className="file-remove-btn" onClick={handleRemoveFile} aria-label="Remove file">
            Change / Remove
          </button>
        </div>
      )}

      {selectedFile && (
        <button 
          type="button" 
          className="primary-button panel-button upload-submit-btn"
          onClick={() => onAnalyze(selectedFile.file)}
        >
          Analyse Resume
          <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  )
}
