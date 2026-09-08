import { Toaster } from 'sonner'
import { AuthScreen } from './components/AuthScreen.jsx'
import { Dashboard } from './components/Dashboard.jsx'
import { isConfigured, neon } from './lib/neon.js'

export default function App() {
  const session = neon?.auth.useSession?.() || { data: null, isPending: false }
  if (session.isPending) return <div className="app-loading"><span className="brand-mark">B</span><p>Opening your network…</p></div>
  return <><Toaster richColors position="bottom-right" />{session.data?.user ? <Dashboard user={session.data.user} onSignOut={() => neon.auth.signOut()} /> : <AuthScreen auth={neon?.auth} configured={isConfigured} />}</>
}

