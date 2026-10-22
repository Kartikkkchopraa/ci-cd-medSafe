import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import LogoMark from './LogoMark'
import { useAuthStore } from '../store/authStore'

type Tone = 'dark' | 'light'

interface SiteNavProps {
  // "overlay" floats over a full-bleed hero; "sticky" is translucent chrome that content scrolls under
  variant?: 'overlay' | 'sticky'
  // "light" is for light backgrounds: dark text, light material
  tone?: Tone
  actions?: ReactNode
}

export function Brand({ tone = 'dark' }: { tone?: Tone }) {
  const light = tone === 'light'
  return (
    <Link to="/" className={`flex items-center gap-2 rounded-full ${light ? 'text-[#0a0a0a]' : 'text-white'}`} aria-label="medSafe home">
      <LogoMark />
      <span className="font-mainframe-heading text-[21px] tracking-[-0.01em] sm:text-[24px]">
        med<span className={light ? 'text-black/45' : 'text-white/60'}>Safe</span>
      </span>
    </Link>
  )
}

export function LogoutButton() {
  const logout = useAuthStore((state) => state.logout)
  return (
    <button type="button" onClick={logout} className="btn btn-secondary btn-sm">
      Log out
    </button>
  )
}

function useScrolled(threshold = 4) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}

function SiteNav({ variant = 'sticky', tone = 'dark', actions }: SiteNavProps) {
  const scrolled = useScrolled()
  const light = tone === 'light'

  const chrome = scrolled
    ? `${light ? 'material-light border-black/[0.06]' : 'material border-white/[0.08]'} border-b`
    : `border-b border-transparent ${variant === 'sticky' ? 'bg-black' : ''}`

  return (
    <nav
      className={`${variant === 'overlay' ? 'fixed inset-x-0' : 'sticky'} top-0 z-20 transition-[background-color,border-color] duration-300 ${chrome}`}
    >
      <div
        className={`mx-auto flex items-center justify-between px-5 sm:px-8 ${
          variant === 'overlay' ? 'max-w-[1440px] py-4 sm:py-5 lg:px-10' : 'max-w-6xl py-4'
        }`}
      >
        <Brand tone={tone} />
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </nav>
  )
}

export default SiteNav
