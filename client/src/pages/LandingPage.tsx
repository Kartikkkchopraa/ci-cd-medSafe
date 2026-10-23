import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SiteNav, { Brand } from '../components/SiteNav'
import { AlertIcon, ArrowRightIcon, CheckIcon, PlusIcon } from '../components/icons'

// Plays the full-quality original backwards instead of a re-encoded reversed copy
const VIDEO_SRC = '/video/medSafe.mp4'
const SENSITIVITY = 0.8
const REVERSED = true

const highlights = ['Drug information', 'Contraindications', 'Interactions']

const steps = [
  {
    title: 'Search',
    text: 'Find any medicine by its brand or generic name.',
  },
  {
    title: 'Build your list',
    text: 'Add everything you take, prescribed or over the counter.',
  },
  {
    title: 'Get your report',
    text: 'See what each one is for, when to avoid it, and how they interact.',
  },
]

// Reveals every .reveal element inside the container as it scrolls into view
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return

    const targets = root.querySelectorAll<HTMLElement>('.reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.15 },
    )

    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return ref
}

// Hides the "move your cursor" hint once the visitor has discovered the effect
function useHasScrubbed(distance = 160) {
  const [scrubbed, setScrubbed] = useState(false)

  useEffect(() => {
    let travelled = 0
    let lastX: number | null = null

    const onMove = (event: MouseEvent) => {
      if (lastX !== null) travelled += Math.abs(event.clientX - lastX)
      lastX = event.clientX
      if (travelled > distance) {
        setScrubbed(true)
        window.removeEventListener('mousemove', onMove)
      }
    }

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [distance])

  return scrubbed
}

const PreviewShell = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-60 flex-col justify-center overflow-hidden rounded-[22px] bg-[#0a0a0a] p-5 text-white">
    {children}
  </div>
)

const InfoPreview = () => (
  <PreviewShell>
    <p className="eyebrow">Medicine</p>
    <p className="mt-2 font-mainframe-heading text-[18px] leading-tight tracking-[-0.01em]">Dolo 650 mg oral tablet</p>
    <p className="mt-1 text-[13px] text-white/50">Paracetamol 650 mg</p>
    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
      {[
        ['Dose form', 'Oral tablet'],
        ['Route', 'Oral'],
        ['Brand', 'Dolo'],
        ['Maker', 'Micro Labs'],
      ].map(([label, value]) => (
        <div key={label}>
          <dt className="text-[10px] uppercase tracking-[0.08em] text-white/40">{label}</dt>
          <dd className="mt-0.5 text-white/90">{value}</dd>
        </div>
      ))}
    </dl>
  </PreviewShell>
)

const ContraPreview = () => (
  <PreviewShell>
    <p className="font-mainframe-heading text-[15px]">Do not use if</p>
    <div className="mt-3 space-y-2">
      {['Severe liver impairment', 'Allergic to paracetamol'].map((text) => (
        <div key={text} className="callout callout-caution flex items-center gap-2.5 py-2.5 text-[13px]">
          <span className="shrink-0 text-amber-300"><AlertIcon size={16} /></span>
          {text}
        </div>
      ))}
    </div>
  </PreviewShell>
)

const InteractionPreview = () => (
  <PreviewShell>
    <div className="flex items-center gap-2 text-[13px]">
      <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1">Dolo 650</span>
      <span className="text-white/40"><PlusIcon size={14} /></span>
      <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1">Crocin 500</span>
    </div>
    <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 p-4">
      <p className="font-mainframe-heading text-[14px] text-red-200">Duplicate ingredient</p>
      <p className="mt-1 text-[13px] leading-snug text-white/70">
        Both contain paracetamol. Taking them together can double the dose.
      </p>
    </div>
  </PreviewShell>
)

const features = [
  {
    title: 'Drug information',
    text: 'What a medicine is, what it’s made of, and what it treats.',
    preview: <InfoPreview />,
  },
  {
    title: 'Contraindications',
    text: 'Clear warnings for when a medicine isn’t right for you.',
    preview: <ContraPreview />,
  },
  {
    title: 'Interactions',
    text: 'Spot risky combinations and doubled-up ingredients before they reach your body.',
    preview: <InteractionPreview />,
  },
]

function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const prevXRef = useRef<number | null>(null)
  const targetTimeRef = useRef(0)
  const isSeekingRef = useRef(false)
  const pendingSeekRef = useRef(false)

  const navigate = useNavigate()
  const revealRef = useReveal<HTMLDivElement>()
  const hasScrubbed = useHasScrubbed()

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

    // A full-viewport moving background is exactly what reduced motion asks us to avoid; leave the still frame
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduceMotion) window.addEventListener('mousemove', handleMouseMove)
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
    <main className="relative min-h-screen bg-[#e5e5e5] text-[#0a0a0a]">
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

      {/* Washes that keep dark text legible where it overlaps the figures */}
      <div className="pointer-events-none fixed inset-0 z-[1] hidden bg-[linear-gradient(90deg,rgba(229,229,229,0.9)_0%,rgba(229,229,229,0.6)_38%,rgba(229,229,229,0)_62%)] md:block" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[1] h-[72%] bg-gradient-to-t from-[#e5e5e5] via-[#e5e5e5]/85 to-transparent md:hidden" />

      <SiteNav
        variant="overlay"
        tone="light"
        actions={
          <button type="button" onClick={() => navigate('/login')} className="btn btn-ink-outline btn-sm">
            Log in
          </button>
        }
      />

      <section className="relative z-[2] flex h-[100svh] min-h-[600px] flex-col">
        <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-end px-5 pb-10 sm:px-8 md:justify-center md:pb-0 lg:px-10">
          <div className="max-w-[740px] md:-mt-8">
            <div className="rise-in mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/50 px-3 py-[0.3em] text-[13px] text-black/70 backdrop-blur-sm">
              <span className="h-[6px] w-[6px] rounded-full bg-[#00594f]" />
              Drug safety, simplified
            </div>

            <h1
              className="rise-in font-mainframe-heading"
              style={{
                fontSize: 'clamp(42px, 5.6vw, 80px)',
                lineHeight: 0.98,
                letterSpacing: '-0.035em',
                animationDelay: '80ms',
              }}
            >
              Know your medicine.
              <br />
              <span className="text-black/40">Before you take it.</span>
            </h1>

            <p
              className="rise-in mt-6 max-w-[30rem] text-black/65"
              style={{ fontSize: 'clamp(17px, 1.6vw, 20px)', lineHeight: 1.45, animationDelay: '160ms' }}
            >
              Check any medicine in seconds. Clear drug information, contraindications and interactions, so every dose is a safe one.
            </p>

            <div className="rise-in mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: '240ms' }}>
              <button type="button" onClick={() => navigate('/register')} className="btn btn-ink btn-lg">
                Get started
                <ArrowRightIcon size={17} />
              </button>
              <button type="button" onClick={() => navigate('/login')} className="btn btn-ink-outline btn-lg">
                I have an account
              </button>
            </div>

            <ul className="rise-in mt-8 hidden flex-wrap gap-x-5 gap-y-2 text-[14px] text-black/60 sm:flex" style={{ animationDelay: '320ms' }}>
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <span className="text-[#00594f]"><CheckIcon size={16} /></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Hint for the cursor-driven video, only where there is a cursor */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-black/10 bg-white/60 px-4 py-2 text-[13px] text-black/60 backdrop-blur-md transition-opacity duration-700 md:flex motion-reduce:!hidden [@media(pointer:coarse)]:!hidden ${
            hasScrubbed ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <svg width="22" height="12" viewBox="0 0 22 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 6h20M5 2 1 6l4 4M17 2l4 4-4 4" />
          </svg>
          Move your cursor
        </div>
      </section>

      <div
        ref={revealRef}
        className="relative z-[3] rounded-t-[32px] bg-[#f2f2f2] sm:rounded-t-[44px]"
      >
        <section className="mx-auto max-w-6xl px-5 pt-20 sm:px-8 sm:pt-28">
          <p className="reveal eyebrow text-[#00594f]">How it works</p>
          <h2 className="reveal mt-3 max-w-xl font-mainframe-heading text-[clamp(30px,4.4vw,52px)] leading-[1.02] tracking-[-0.03em]">
            Three steps to a safer dose.
          </h2>

          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="reveal rounded-[28px] border border-black/[0.06] bg-white p-7"
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00594f]/10 font-mainframe-heading text-[15px] text-[#00594f]">
                  {index + 1}
                </span>
                <h3 className="mt-6 font-mainframe-heading text-[21px] tracking-[-0.015em]">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-snug text-black/55">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-5 pt-24 sm:px-8 sm:pt-32">
          <p className="reveal eyebrow text-[#00594f]">What you&apos;ll see</p>
          <h2 className="reveal mt-3 max-w-2xl font-mainframe-heading text-[clamp(30px,4.4vw,52px)] leading-[1.02] tracking-[-0.03em]">
            Everything about a medicine, in one place.
          </h2>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="reveal rounded-[30px] border border-black/[0.06] bg-white p-2.5"
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div aria-hidden="true">{feature.preview}</div>
                <div className="px-4 pb-5 pt-6">
                  <h3 className="font-mainframe-heading text-[21px] tracking-[-0.015em]">{feature.title}</h3>
                  <p className="mt-2 text-[15px] leading-snug text-black/55">{feature.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-10 pt-24 sm:px-8 sm:pt-32">
          <div className="reveal relative overflow-hidden rounded-[32px] bg-[#0a0a0a] px-7 py-14 text-white sm:px-14 sm:py-20">
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#00594f]/50 blur-[100px]" />
            <h2 className="relative max-w-xl font-mainframe-heading text-[clamp(30px,4.4vw,52px)] leading-[1.02] tracking-[-0.03em]">
              Check what you&apos;re taking.
            </h2>
            <p className="relative mt-4 max-w-md text-[17px] leading-snug text-white/60">
              Create an account, add your medicines, and get a clear report on each one and how they work together.
            </p>
            <div className="relative mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate('/register')} className="btn btn-primary btn-lg">
                Get started
                <ArrowRightIcon size={17} />
              </button>
              <button type="button" onClick={() => navigate('/login')} className="btn btn-secondary btn-lg">
                Log in
              </button>
            </div>
          </div>
        </section>

        <footer className="mx-auto flex max-w-6xl flex-col gap-6 px-5 pb-12 pt-10 sm:px-8 md:flex-row md:items-start md:justify-between">
          <Brand tone="light" />
          <p className="max-w-md text-[13px] leading-relaxed text-black/45 md:text-right">
            medSafe provides general information only and isn&apos;t a substitute for advice from a doctor or pharmacist.
            <br />© {new Date().getFullYear()} medSafe
          </p>
        </footer>
      </div>
    </main>
  )
}

export default LandingPage;
