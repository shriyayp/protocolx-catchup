/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react'

const INTRO_KEY = 'catchup_intro_seen'
const INTRO_DURATION = 2600
const EXIT_DURATION = 520

function CinematicIntro({ onComplete }) {
  const [exiting, setExiting] = useState(false)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return undefined
    initializedRef.current = true

    let reducedMotion = false
    try {
      reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (sessionStorage.getItem(INTRO_KEY) === '1') {
        onComplete()
        return undefined
      }
      sessionStorage.setItem(INTRO_KEY, '1')
    } catch {
      reducedMotion = false
    }

    if (reducedMotion) {
      onComplete()
      return undefined
    }

    const exitTimer = window.setTimeout(() => setExiting(true), INTRO_DURATION)
    const completeTimer = window.setTimeout(onComplete, INTRO_DURATION + EXIT_DURATION)

    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(completeTimer)
    }
  }, [onComplete])

  const handleSkip = () => setExiting(true)

  useEffect(() => {
    if (!exiting) return undefined
    const timer = window.setTimeout(onComplete, EXIT_DURATION)
    return () => window.clearTimeout(timer)
  }, [exiting, onComplete])

  return (
    <div className={`cinematic-intro ${exiting ? 'is-exiting' : ''}`} role="dialog" aria-label="CatchUp introduction">
      <div className="cinematic-intro__atmosphere" aria-hidden="true" />
      <div className="cinematic-intro__grid" aria-hidden="true" />
      <div className="cinematic-intro__content">
        <div className="cinematic-intro__mark" aria-hidden="true">
          <span className="cinematic-intro__mark-face">C</span>
          <span className="cinematic-intro__mark-slash">/</span>
        </div>
        <div className="cinematic-intro__wordmark" aria-label="CatchUp">
          {'CATCHUP'.split('').map((letter, index) => (
            <span key={`${letter}-${index}`} style={{ '--letter-index': index }}>
              {letter}
            </span>
          ))}
        </div>
        <p className="cinematic-intro__tagline">Conversation intelligence</p>
      </div>
      <div className="cinematic-intro__footer">
        <span>Find what matters</span>
        <button type="button" onClick={handleSkip}>Skip intro</button>
      </div>
    </div>
  )
}

export default CinematicIntro
