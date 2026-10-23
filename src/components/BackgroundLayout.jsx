import heroImage from '../assets/jobnity-hero.png'

/** A clean, full-bleed executive canvas for modern focused application workflows. */
export default function BackgroundLayout({
  children,
  backgroundImage = heroImage,
  className = '',
  showPhoto = false
}) {
  return (
    <main className={`background-layout ${showPhoto ? 'background-layout--with-photo' : 'background-layout--canvas'} ${className}`}>
      {showPhoto && (
        <img
          className="background-layout__image"
          src={backgroundImage || heroImage}
          alt=""
          aria-hidden="true"
        />
      )}
      <div className="background-layout__wash" aria-hidden="true" />
      <div className="background-layout__content">{children}</div>
    </main>
  )
}

