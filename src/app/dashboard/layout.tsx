import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const nome = (user?.user_metadata?.nome as string) ?? (user?.email ?? '')
  const nivel = (user?.user_metadata?.nivel as string) ?? ''

  return (
    <DashboardShell nome={nome} nivel={nivel}>
      {children}
    </DashboardShell>
  )
}
