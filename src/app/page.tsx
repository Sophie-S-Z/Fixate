import { auth0 } from '@/lib/auth0'
import { HomeClient } from './HomeClient'

export default async function Home() {
  const session = await auth0.getSession()
  const user = session?.user ?? null
  return <HomeClient user={user} />
}
