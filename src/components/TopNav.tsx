'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2 12 C7 5.5 17 5.5 22 12 C17 18.5 7 18.5 2 12 Z" stroke="currentColor" strokeWidth={1.6} />
      <path d="M12 7.6 L13.15 10.85 L16.4 12 L13.15 13.15 L12 16.4 L10.85 13.15 L7.6 12 L10.85 10.85 Z" fill="currentColor" />
    </svg>
  )
}

const TABS = [
  { href: '/', label: 'Track' },
  { href: '/sessions', label: 'Sessions' },
  { href: '/dashboard', label: 'Dashboard' },
]

export function TopNav({ userLabel }: { userLabel?: string }) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav className="h-14 border-b border-white/[0.08] bg-[#0d1117]/80 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-8">
        <Link href="/landing" className="flex items-center gap-2.5 no-underline">
          <span className="inline-flex text-[#a5d6ff]"><Logo size={20} /></span>
          <span className="font-sora text-[16px] font-bold tracking-[-0.02em] text-[#e6edf3]">
            Fixate
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(t.href)
                  ? 'bg-[#a5d6ff]/[0.12] text-[#a5d6ff]'
                  : 'text-[#b9c2cd] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {userLabel && <span className="text-xs text-[#7d8694] hidden sm:inline">{userLabel}</span>}
        <a href="/auth/logout" className="text-xs text-[#7d8694] hover:text-[#b9c2cd]">
          Sign out
        </a>
      </div>
    </nav>
  )
}
