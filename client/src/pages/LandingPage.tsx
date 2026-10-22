import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LogoMark from '../components/LogoMark'

// Plays the full-quality original backwards instead of a re-encoded reversed copy
const VIDEO_SRC = '/video/medSafe.mp4'
const SENSITIVITY = 0.8
const REVERSED = true

function useTypewriter(
  text: string,
  speed = 38,
  startDelay = 600,
) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let intervalId: number | undefined

    const delayId = window.setTimeout(() => {
      let index = 0

      intervalId = window.setInterval(() => {
        index += 1
        setDisplayed(text.slice(0, index))

        if (index >= text.length) {
          setDone(true)
          if (intervalId !== undefined) {
            window.clearInterval(intervalId)
          }
        }
      }, speed)
    }, startDelay)

    return () => {
      window.clearTimeout(delayId)
      if (intervalId !== undefined) {
        window.clearInterval(intervalId)
      }
    }
  }, [text, speed, startDelay])

  return { displayed, done }
}

const features = [
  {
    title: 'Drug information',
    text: 'Uses, dosage and side effects for the medicines you take.',
  },
  {
    title: 'Contraindications',
    text: 'Know when a drug is not right for a condition or patient.',
  },
  {
    title: 'Interactions',
    text: 'Spot risky combinations before they reach your body.',
  },
]

function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const prevXRef = useRef<number | null>(null)
  const targetTimeRef = useRef(0)
  const isSeekingRef = useRef(false)
  const pendingSeekRef = useRef(false)

  const navigate = useNavigate()
  const [actionsVisible, setActionsVisible] = useState(false)

  const { displayed, done } = useTypewriter(
    "Check any medicine in seconds. Clear drug information, contraindications, and interactions, so every dose is a safe one.",
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActionsVisible(true)
    }, 400)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleMouseMove = (event: MouseEvent) => {
      const previousX = prevXRef.current

      if (previousX === null) {
        prevXRef.current = event.clientX
        return
      }

      const delta = event.clientX - previousX
      prevXRef.current = event.clientX

      if (!video.duration || !Number.isFinite(video.duration)) return

      const offset =
        (REVERSED ? -1 : 1) *
        (delta / window.innerWidth) * SENSITIVITY * video.duration

      const currentTarget = isSeekingRef.current
        ? targetTimeRef.current
        : video.currentTime

      targetTimeRef.current = Math.max(
        0,
        Math.min(video.duration, currentTarget + offset),
      )

      if (isSeekingRef.current) {
        pendingSeekRef.current = true
        return
      }

      isSeekingRef.current = true
      pendingSeekRef.current = false
      video.currentTime = targetTimeRef.current
    }

    const handleMouseLeave = () => {
      prevXRef.current = null
    }

    const handleLoadedMetadata = () => {
      if (REVERSED) {
        targetTimeRef.current = video.duration
        video.currentTime = video.duration
      }
    }

    const handleSeeked = () => {
      isSeekingRef.current = false

      if (pendingSeekRef.current) {
        pendingSeekRef.current = false
        isSeekingRef.current = true
        video.currentTime = targetTimeRef.current
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    video.addEventListener('seeked', handleSeeked)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    if (video.readyState >= 1) handleLoadedMetadata()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      video.removeEventListener('seeked', handleSeeked)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [])

  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="fixed inset-0 z-0 h-full w-full object-cover"
        style={{
          objectPosition: '70% center',
          filter: 'contrast(1.06) saturate(1.05)',
        }}
        src={VIDEO_SRC}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-[1] bg-black/10 pointer-events-none" />
      <div className="fixed inset-x-0 bottom-0 z-[1] h-1/3 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

      <nav className="fixed inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white"
          aria-label="medSafe home"
        >
          <LogoMark />
          <span className="font-mainframe-heading text-[21px] tracking-tight sm:text-[26px]">
            med<span className="text-white/70">Safe</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-white bg-transparent px-5 py-[0.3em] text-[15px] text-white transition-colors duration-200 hover:bg-white hover:text-black sm:text-[17px]"
        >
          Log in
        </button>
      </nav>

      <section className="relative z-[2] flex h-screen flex-col justify-end overflow-hidden px-5 pb-12 sm:px-8 md:justify-center md:px-10 md:pb-0">
        <div className="relative z-10 max-w-xl md:-mt-16">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/20 px-3 py-[0.25em] text-[12px] text-white backdrop-blur-sm sm:mb-6 sm:text-[13px]">
            <span className="h-[6px] w-[6px] rounded-full bg-white" />
            Drug safety, simplified
          </div>

          <h1
            className="font-mainframe-heading mb-5 text-white sm:mb-6"
            style={{
              fontSize: 'clamp(34px, 6vw, 60px)',
              lineHeight: 1.02,
              letterSpacing: '-0.02em',
            }}
          >
            Know your medicine.
            <br />
            Before you take it.
          </h1>

          <p
            className="mb-7 min-h-[68px] text-white sm:mb-8"
            style={{
              fontSize: 'clamp(17px, 3.4vw, 22px)',
              lineHeight: 1.4,
              fontWeight: 400,
            }}
          >
            {displayed}
            {!done && (
              <span
                className="ml-[2px] inline-block h-[1.1em] w-[2px] align-middle bg-white"
                style={{ animation: 'blink 1s step-end infinite' }}
              />
            )}
          </p>

          <div
            className={`flex flex-wrap items-center gap-x-6 gap-y-3 transition-all duration-[400ms] ease-out ${
              actionsVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-2 opacity-0'
            }`}
          >
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-full bg-white px-7 py-[0.55em] text-[15px] text-black transition-colors duration-200 hover:bg-black hover:text-white sm:text-[17px]"
            >
              Let&apos;s get started
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <div
          className={`absolute inset-x-0 bottom-0 z-10 hidden grid-cols-3 gap-8 px-10 pb-8 transition-all delay-200 duration-700 ease-out md:grid ${
            actionsVisible
              ? 'translate-y-0 opacity-100'
              : 'translate-y-3 opacity-0'
          }`}
        >
          {features.map((feature, index) => (
            <div key={feature.title} className="border-t border-white/40 pt-4 text-white">
              <div className="mb-2 flex items-baseline gap-3">
                <span className="text-[13px] text-white/60">
                  0{index + 1}
                </span>
                <span className="font-mainframe-heading text-[19px] tracking-tight">
                  {feature.title}
                </span>
              </div>
              <p className="max-w-xs text-[14px] leading-snug text-white/75">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export default LandingPage;
