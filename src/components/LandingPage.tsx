'use client'

import { useEffect, useState } from 'react'

/**
 * Fixate — landing page (unauthenticated).
 * Ported from the design reference. CTAs route into the Auth0 login flow.
 * Palette: ice #a5d6ff · bg #0d1117 · card #161b22 · border #21262d
 */

const LABELS = [
  { id: 'blink',  text: 'blink rate',     marker: { cx: 300, cy: 96,  ring: 8,  dot: 4   }, line: { x1: 300,   y1: 96,  x2: 300, y2: 50  }, end: { cx: 300, cy: 50  }, pos: { left: '50%', top: '4%',  transform: 'translateX(-50%)' },        delay: 0    },
  { id: 'gaze',   text: 'gaze fixation',  marker: { cx: 300, cy: 180, ring: 11, dot: 4.5 }, line: { x1: 352.6, y1: 180, x2: 470, y2: 180 }, end: { cx: 470, cy: 180 }, pos: { left: '80%', top: '50%', transform: 'translateY(-50%)' },        delay: 2.25 },
  { id: 'pupil',  text: 'pupil response', marker: { cx: 300, cy: 234, ring: 8,  dot: 4   }, line: { x1: 300,   y1: 234, x2: 300, y2: 306 }, end: { cx: 300, cy: 306 }, pos: { left: '50%', top: '88%', transform: 'translateX(-50%)' },        delay: 4.5  },
  { id: 'strain', text: 'strain signal',  marker: { cx: 132, cy: 180, ring: 8,  dot: 4   }, line: { x1: 132,   y1: 180, x2: 44,  y2: 180 }, end: { cx: 44,  cy: 180 }, pos: { left: '6%',  top: '50%', transform: 'translate(-100%,-50%)' }, delay: 6.75 },
]

function NavBar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-[42px] py-6 bg-transparent">
      <span className="font-sora text-[19px] font-bold tracking-[-0.02em] text-white">Fixate</span>
      <div className="flex items-center gap-[30px]">
        <a href="#reveal" className="text-sm font-normal text-[#b9c2cd] no-underline transition-colors hover:text-white">How it works</a>
        <a href="/auth/login" className="text-sm font-normal text-[#b9c2cd] no-underline transition-colors hover:text-white">Sign in</a>
        <a
          href="/auth/login"
          className="rounded-lg border border-[#a5d6ff]/50 px-4 py-2 text-[13px] font-medium text-[#a5d6ff] no-underline transition-colors hover:border-[#a5d6ff] hover:bg-[#a5d6ff]/10"
        >
          Start tracking
        </a>
      </div>
    </nav>
  )
}

function NeuralEye() {
  const [hovered, setHovered] = useState<string | null>(null)

  const labelVisible = (id: string, delay: number) =>
    hovered === id
      ? { opacity: 1, animation: 'none' as const }
      : { animation: `fxLabel 9s ease-in-out infinite`, animationDelay: `${delay}s` }

  return (
    <div className="relative mt-9 h-[336px] w-[560px]" style={{ overflow: 'visible' }}>
      <svg viewBox="0 0 600 360" width="100%" height="100%" fill="none" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <radialGradient id="fxIrisGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a5d6ff" stopOpacity="0.32" />
            <stop offset="45%" stopColor="#a5d6ff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#a5d6ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="300" cy="180" rx="150" ry="125" fill="url(#fxIrisGlow)" style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'fxIris 5s ease-in-out infinite' }} />

        <g>
          <line x1="148" y1="88" x2="196.7" y2="75" stroke="#a5d6ff" strokeOpacity="0.4" strokeWidth="1.5" /><line x1="196.7" y1="75" x2="245.3" y2="65.5" stroke="#a5d6ff" strokeOpacity="0.4" strokeWidth="1.5" /><line x1="245.3" y1="65.5" x2="294" y2="62" stroke="#a5d6ff" strokeOpacity="0.4" strokeWidth="1.5" /><line x1="294" y1="62" x2="342.7" y2="65.5" stroke="#a5d6ff" strokeOpacity="0.4" strokeWidth="1.5" /><line x1="342.7" y1="65.5" x2="391.3" y2="75" stroke="#a5d6ff" strokeOpacity="0.4" strokeWidth="1.5" /><line x1="391.3" y1="75" x2="440" y2="88" stroke="#a5d6ff" strokeOpacity="0.4" strokeWidth="1.5" /><line x1="245.3" y1="65.5" x2="232.8" y2="108.8" stroke="#a5d6ff" strokeOpacity="0.14" strokeWidth="1" /><line x1="294" y1="62" x2="300" y2="96" stroke="#a5d6ff" strokeOpacity="0.14" strokeWidth="1" /><line x1="342.7" y1="65.5" x2="367.2" y2="108.8" stroke="#a5d6ff" strokeOpacity="0.14" strokeWidth="1" /><circle cx="148" cy="88" r="4.4" fill="#a5d6ff" fillOpacity="0.8" /><circle cx="196.7" cy="75" r="4.4" fill="#a5d6ff" fillOpacity="0.8" /><circle cx="245.3" cy="65.5" r="4.4" fill="#a5d6ff" fillOpacity="0.8" /><circle cx="294" cy="62" r="4.4" fill="#a5d6ff" fillOpacity="0.8" /><circle cx="342.7" cy="65.5" r="4.4" fill="#a5d6ff" fillOpacity="0.8" /><circle cx="391.3" cy="75" r="4.4" fill="#a5d6ff" fillOpacity="0.8" /><circle cx="440" cy="88" r="4.4" fill="#a5d6ff" fillOpacity="0.8" />
        </g>

        <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'fxBlink 5.5s ease-in-out infinite' }}>
          <g>
            <line x1="300" y1="180" x2="300" y2="126" stroke="#a5d6ff" strokeOpacity="0.16" strokeWidth="1.2" /><line x1="300" y1="180" x2="323.4" y2="131.3" stroke="#a5d6ff" strokeOpacity="0.16" strokeWidth="1.2" /><line x1="300" y1="180" x2="342.2" y2="146.3" stroke="#a5d6ff" strokeOpacity="0.16" strokeWidth="1.2" /><line x1="300" y1="180" x2="352.6" y2="168" stroke="#a5d6ff" strokeOpacity="0.16" strokeWidth="1.2" /><line x1="300" y1="180" x2="352.6" y2="192" stroke="#a5d6ff" strokeOpacity="0.16" strokeWidth="1.2" /><line x1="300" y1="180" x2="342.2" y2="213.7" stroke="#a5d6ff" strokeOpacity="0.16" strokeWidth="1.2" /><line x1="300" y1="180" x2="323.4" y2="228.7" stroke="#a5d6ff" strokeOpacity="0.16" strokeWidth="1.2" /><line x1="300" y1="180" x2="300" y2="234" stroke="#a5d6ff" strokeOpacity="0.16" strokeWidth="1.2" /><line x1="300" y1="180" x2="276.6" y2="228.7" stroke="#a5d6ff" strokeOpacity="0.16" strokeWidth="1.2" /><line x1="300" y1="180" x2="257.8" y2="213.7" stroke="#a5d6ff" strokeOpacity="0.16" strokeWidth="1.2" /><line x1="300" y1="180" x2="247.4" y2="192" stroke="#a5d6ff" strokeOpacity="0.16" strokeWidth="1.2" /><line x1="300" y1="180" x2="247.4" y2="168" stroke="#a5d6ff" strokeOpacity="0.16" strokeWidth="1.2" /><line x1="300" y1="180" x2="257.8" y2="146.3" stroke="#a5d6ff" strokeOpacity="0.16" strokeWidth="1.2" /><line x1="300" y1="180" x2="276.6" y2="131.3" stroke="#a5d6ff" strokeOpacity="0.16" strokeWidth="1.2" /><line x1="300" y1="126" x2="323.4" y2="131.3" stroke="#a5d6ff" strokeOpacity="0.42" strokeWidth="1.6" /><line x1="323.4" y1="131.3" x2="342.2" y2="146.3" stroke="#a5d6ff" strokeOpacity="0.42" strokeWidth="1.6" /><line x1="342.2" y1="146.3" x2="352.6" y2="168" stroke="#a5d6ff" strokeOpacity="0.42" strokeWidth="1.6" /><line x1="352.6" y1="168" x2="352.6" y2="192" stroke="#a5d6ff" strokeOpacity="0.42" strokeWidth="1.6" /><line x1="352.6" y1="192" x2="342.2" y2="213.7" stroke="#a5d6ff" strokeOpacity="0.42" strokeWidth="1.6" /><line x1="342.2" y1="213.7" x2="323.4" y2="228.7" stroke="#a5d6ff" strokeOpacity="0.42" strokeWidth="1.6" /><line x1="323.4" y1="228.7" x2="300" y2="234" stroke="#a5d6ff" strokeOpacity="0.42" strokeWidth="1.6" /><line x1="300" y1="234" x2="276.6" y2="228.7" stroke="#a5d6ff" strokeOpacity="0.42" strokeWidth="1.6" /><line x1="276.6" y1="228.7" x2="257.8" y2="213.7" stroke="#a5d6ff" strokeOpacity="0.42" strokeWidth="1.6" /><line x1="257.8" y1="213.7" x2="247.4" y2="192" stroke="#a5d6ff" strokeOpacity="0.42" strokeWidth="1.6" /><line x1="247.4" y1="192" x2="247.4" y2="168" stroke="#a5d6ff" strokeOpacity="0.42" strokeWidth="1.6" /><line x1="247.4" y1="168" x2="257.8" y2="146.3" stroke="#a5d6ff" strokeOpacity="0.42" strokeWidth="1.6" /><line x1="257.8" y1="146.3" x2="276.6" y2="131.3" stroke="#a5d6ff" strokeOpacity="0.42" strokeWidth="1.6" /><line x1="276.6" y1="131.3" x2="300" y2="126" stroke="#a5d6ff" strokeOpacity="0.42" strokeWidth="1.6" /><line x1="300" y1="158" x2="315.6" y2="164.4" stroke="#a5d6ff" strokeOpacity="0.55" strokeWidth="1.6" /><line x1="315.6" y1="164.4" x2="322" y2="180" stroke="#a5d6ff" strokeOpacity="0.55" strokeWidth="1.6" /><line x1="322" y1="180" x2="315.6" y2="195.6" stroke="#a5d6ff" strokeOpacity="0.55" strokeWidth="1.6" /><line x1="315.6" y1="195.6" x2="300" y2="202" stroke="#a5d6ff" strokeOpacity="0.55" strokeWidth="1.6" /><line x1="300" y1="202" x2="284.4" y2="195.6" stroke="#a5d6ff" strokeOpacity="0.55" strokeWidth="1.6" /><line x1="284.4" y1="195.6" x2="278" y2="180" stroke="#a5d6ff" strokeOpacity="0.55" strokeWidth="1.6" /><line x1="278" y1="180" x2="284.4" y2="164.4" stroke="#a5d6ff" strokeOpacity="0.55" strokeWidth="1.6" /><line x1="284.4" y1="164.4" x2="300" y2="158" stroke="#a5d6ff" strokeOpacity="0.55" strokeWidth="1.6" /><line x1="132" y1="180" x2="165.6" y2="146.4" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="165.6" y1="146.4" x2="199.2" y2="124.5" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="199.2" y1="124.5" x2="232.8" y2="108.8" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="232.8" y1="108.8" x2="266.4" y2="99.2" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="266.4" y1="99.2" x2="300" y2="96" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="300" y1="96" x2="333.6" y2="99.2" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="333.6" y1="99.2" x2="367.2" y2="108.8" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="367.2" y1="108.8" x2="400.8" y2="124.5" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="400.8" y1="124.5" x2="434.4" y2="146.4" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="434.4" y1="146.4" x2="468" y2="180" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="132" y1="180" x2="165.6" y2="212" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="165.6" y1="212" x2="199.2" y2="232.9" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="199.2" y1="232.9" x2="232.8" y2="247.8" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="232.8" y1="247.8" x2="266.4" y2="256.9" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="266.4" y1="256.9" x2="300" y2="260" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="300" y1="260" x2="333.6" y2="256.9" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="333.6" y1="256.9" x2="367.2" y2="247.8" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="367.2" y1="247.8" x2="400.8" y2="232.9" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="400.8" y1="232.9" x2="434.4" y2="212" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><line x1="434.4" y1="212" x2="468" y2="180" stroke="#a5d6ff" strokeOpacity="0.62" strokeWidth="2" /><circle cx="132" cy="180" r="5" fill="#a5d6ff" fillOpacity="0.92" /><circle cx="165.6" cy="146.4" r="5" fill="#a5d6ff" fillOpacity="0.92" /><circle cx="199.2" cy="124.5" r="5" fill="#a5d6ff" fillOpacity="0.92" /><circle cx="232.8" cy="108.8" r="5" fill="#a5d6ff" fillOpacity="0.92" /><circle cx="266.4" cy="99.2" r="5" fill="#a5d6ff" fillOpacity="0.92" /><circle cx="300" cy="96" r="5" fill="#a5d6ff" fillOpacity="0.92" /><circle cx="333.6" cy="99.2" r="5" fill="#a5d6ff" fillOpacity="0.92" /><circle cx="367.2" cy="108.8" r="5" fill="#a5d6ff" fillOpacity="0.92" /><circle cx="400.8" cy="124.5" r="5" fill="#a5d6ff" fillOpacity="0.92" /><circle cx="434.4" cy="146.4" r="5" fill="#a5d6ff" fillOpacity="0.92" /><circle cx="468" cy="180" r="5" fill="#a5d6ff" fillOpacity="0.92" /><circle cx="300" cy="180" r="7" fill="#a5d6ff" fillOpacity="1" style={{ filter: 'drop-shadow(0 0 6px rgba(165,214,255,0.8))' }} />
          </g>
        </g>
        {LABELS.map((l) => (
          <g
            key={l.id}
            style={labelVisible(l.id, l.delay)}
            onMouseEnter={() => setHovered(l.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <line x1={l.line.x1} y1={l.line.y1} x2={l.line.x2} y2={l.line.y2} stroke="#a5d6ff" strokeWidth={1} strokeOpacity={0.5} />
            <circle cx={l.end.cx} cy={l.end.cy} r={2.5} fill="#a5d6ff" />
            <circle cx={l.marker.cx} cy={l.marker.cy} r={l.marker.ring} fill="none" stroke="#a5d6ff" strokeWidth={1.4} />
            <circle cx={l.marker.cx} cy={l.marker.cy} r={l.marker.dot} fill="#a5d6ff" style={{ filter: 'drop-shadow(0 0 5px #a5d6ff)' }} />
          </g>
        ))}
        {LABELS.map((l) => (
          <circle
            key={l.id + '-hit'}
            cx={l.marker.cx}
            cy={l.marker.cy}
            r={16}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHovered(l.id)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </svg>

      {LABELS.map((l) => (
        <div
          key={l.id + '-txt'}
          className="pointer-events-none absolute whitespace-nowrap text-[10px] font-light uppercase tracking-[0.22em]"
          style={{
            left: l.pos.left,
            top: l.pos.top,
            transform: l.pos.transform,
            color: 'rgba(165,214,255,0.85)',
            ...labelVisible(l.id, l.delay),
          }}
        >
          {l.text}
        </div>
      ))}
    </div>
  )
}

function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center overflow-hidden px-6 pt-[104px] text-center">
      <div
        className="pointer-events-none absolute left-1/2 top-[300px] z-0 h-[560px] w-[820px] -translate-x-1/2"
        style={{
          background: 'radial-gradient(ellipse, rgba(165,214,255,0.10), rgba(165,214,255,0) 70%)',
          filter: 'blur(50px)',
          animation: 'fxGlowEye 9s ease-in-out infinite',
        }}
      />

      <div className="relative z-[1] flex flex-col items-center">
        <h1 className="font-sora m-0 text-[96px] font-extrabold leading-none tracking-[-0.02em] text-white">
          Fixate
        </h1>
        <div className="mt-4 text-[19px] font-light tracking-[0.15em] text-[#a5d6ff]">fixing your fixation</div>

        <NeuralEye />

        <h2 className="font-sora mx-auto mt-[42px] max-w-[660px] text-[42px] font-semibold leading-[1.15] tracking-[-0.02em] text-white" style={{ textWrap: 'balance' as const }}>
          Your eyes are telling you something.
        </h2>
        <p className="mt-3.5 text-[18px] font-light text-[#b9c2cd]">Fixate reads them in real time.</p>
        <a
          href="/auth/login"
          className="mt-[30px] inline-flex items-center gap-2 rounded-[10px] border border-[#a5d6ff]/50 px-[26px] py-[13px] text-[15px] font-medium text-[#a5d6ff] no-underline transition-colors hover:border-[#a5d6ff] hover:bg-[#a5d6ff]/10"
        >
          Sign in with email — it&apos;s free
        </a>
      </div>
    </section>
  )
}

const VALUE_PROPS = [
  { n: '01', text: 'Sixty times a minute your eyes signal fatigue. Almost none of it gets read.' },
  { n: '02', text: 'Fixate reads blink rate, gaze, and pupil response as they happen — entirely on-device.' },
  { n: '03', text: 'No streaks. No scores. A single quiet nudge, only when your eyes need one.' },
]

function ValueProps() {
  return (
    <section id="reveal" className="mx-auto max-w-[1120px] px-6 py-[140px]">
      <div className="border-t border-white/[0.08]">
        {VALUE_PROPS.map((p) => (
          <div key={p.n} className="grid grid-cols-[64px_1fr] items-start gap-7 border-b border-white/[0.08] py-[34px]">
            <span className="font-dm-mono pt-1.5 text-xs text-[#a5d6ff]">{p.n}</span>
            <p className="font-sora m-0 text-[20px] font-normal leading-[1.35] tracking-[-0.01em] text-[#e6edf3]" style={{ textWrap: 'balance' as const }}>
              {p.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Chevron() {
  const [atTop, setAtTop] = useState(true)
  useEffect(() => {
    const onScroll = () => {
      const reveal = document.getElementById('reveal')
      if (!reveal) return
      setAtTop(reveal.getBoundingClientRect().top > window.innerHeight * 0.5)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handle = () => {
    if (atTop) {
      const reveal = document.getElementById('reveal')
      if (reveal) window.scrollTo({ top: reveal.getBoundingClientRect().top + window.pageYOffset, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <button
        onClick={handle}
        aria-label={atTop ? 'Scroll down' : 'Back to top'}
        className="inline-flex cursor-pointer border-0 bg-transparent p-0 text-[#a5d6ff] opacity-80"
        style={{ animation: 'fxBounce 2s ease-in-out infinite' }}
      >
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
          {atTop ? <path d="M6 9l6 6 6-6" /> : <path d="M6 15l6-6 6 6" />}
        </svg>
      </button>
    </div>
  )
}

const CSS = `
@keyframes fxBlink { 0%, 88%, 100% { transform: scaleY(1); } 92% { transform: scaleY(0.06); } 96% { transform: scaleY(1); } }
@keyframes fxBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(7px); } }
@keyframes fxLabel { 0% { opacity: 0; } 3% { opacity: 1; } 22% { opacity: 1; } 27% { opacity: 0; } 100% { opacity: 0; } }
@keyframes fxIris { 0%, 100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
@keyframes fxGlowEye { 0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); } 50% { opacity: 0.8; transform: translateX(-50%) scale(1.06); } }`

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0d1117] text-[#e6edf3]">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <NavBar />
      <Hero />
      <ValueProps />
      <Chevron />
    </main>
  )
}
