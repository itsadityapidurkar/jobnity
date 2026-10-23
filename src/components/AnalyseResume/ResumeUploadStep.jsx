import { useRef, useState } from 'react'

export default function ResumeUploadStep({ onAnalyze, onSampleSelect, errorMessage, onClearError }) {
  const inputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  function validateAndSetFile(file) {
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'heic', 'gif', 'svg']
    if (imageExtensions.includes(ext)) {
      setError('Image files and scanned copies (.png, .jpg, etc.) cannot be processed. Please upload an original digital PDF or DOCX file with selectable text.')
      return
    }
    if (!['pdf', 'docx'].includes(ext)) {
      setError('Please select a valid PDF or DOCX file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10 MB limit.')
      return
    }
    setError('')
    if (onClearError) onClearError()
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
        <p className="eyebrow">Career Intelligence</p>
        <h1>Analyse Your Resume</h1>
        <p>Upload your resume to see your exact skill match for industry roles, uncover high-priority areas to grow, and build your career roadmap.</p>
      </div>

      {(errorMessage || error) && (
        <div className="upload-error-alert" role="alert" style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          margin: '0 auto 1.5rem',
          maxWidth: '560px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <strong style={{ color: '#fca5a5', fontSize: '0.95rem' }}>
              {(errorMessage || error).toLowerCase().includes('scanned') || (errorMessage || error).toLowerCase().includes('image')
                ? 'Text Not Readable in Document'
                : 'Upload Issue'}
            </strong>
          </div>
          <p style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: '0 0 0.5rem 0', lineHeight: '1.45' }}>
            {errorMessage || error}
          </p>
          {((errorMessage || error).toLowerCase().includes('scanned') || (errorMessage || error).toLowerCase().includes('image')) && (
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', background: 'rgba(0,0,0,0.25)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
              💡 <strong>Helpful Tip:</strong> Please upload an original digital PDF or Word (.docx) document where text can be highlighted and selected. Scanned photos or camera snapshots cannot be read.
            </div>
          )}
        </div>
      )}

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
          <h2>Choose a Resume File</h2>
          <p>
            Drag and drop your file here, or{' '}
            <button type="button" onClick={() => inputRef.current?.click()}>
              browse files
            </button>
          </p>
          <small className="supported-formats">Supported formats: PDF or DOCX (up to 10 MB)</small>
          {error && <p className="upload-zone__error">{error}</p>}

          <div className="sample-resumes-prompt">
            <span>Or explore instantly with a sample profile:</span>
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
