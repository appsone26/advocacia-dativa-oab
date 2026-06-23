import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const nome = user.user_metadata?.nome ?? user.email ?? ''
  const nivel = user.user_metadata?.nivel ?? ''

  return (
    <DashboardShell nome={nome} nivel={nivel}>
      {children}
    </DashboardShell>
  )
}
