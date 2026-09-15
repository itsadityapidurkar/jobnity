export default function LoadingSkeleton({ title = 'Reading your resume', detail = 'Finding the experience and skills that matter.' }) {
  return (
    <div className="loading-skeleton" role="status" aria-live="polite">
      <div className="loading-skeleton__document" aria-hidden="true">
        <span /><span /><span /><span />
      </div>
      <p>{title}</p>
      <small>{detail}</small>
    </div>
  )
}
