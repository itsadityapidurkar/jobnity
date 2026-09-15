import heroImage from '../assets/jobnity-hero.png'

/** A shared, full-bleed canvas that keeps foreground content readable on imagery. */
export default function BackgroundLayout({ children, backgroundImage = heroImage, className = '' }) {
  return (
    <main className={`background-layout ${className}`}>
      <img
        className="background-layout__image"
        src={backgroundImage}
        alt=""
        aria-hidden="true"
      />
      <div className="background-layout__wash" aria-hidden="true" />
      <div className="background-layout__content">{children}</div>
    </main>
  )
}
