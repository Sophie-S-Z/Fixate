import { auth0 } from '@/lib/auth0'

export const proxy = auth0.middleware.bind(auth0)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
