import type { Metadata } from 'next'
import { Sora, Plus_Jakarta_Sans, DM_Mono } from 'next/font/google'
import { Auth0Provider } from '@auth0/nextjs-auth0/client'
import './globals.css'

const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})
const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})
const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'Fixate — Fixing your fixation',
  description:
    'Real-time eye strain tracking powered by on-device MediaPipe. No video leaves your device.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${jakarta.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0d1117] text-[#e6edf3]">
        <Auth0Provider>{children}</Auth0Provider>
      </body>
    </html>
  )
}
