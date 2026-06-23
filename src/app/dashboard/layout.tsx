// src/app/dashboard/layout.tsx
// IMPORTANTE: Este layout NÃO chama Supabase nem faz redirect.
// O middleware já garantiu que só usuários autenticados chegam aqui.
// Os dados do usuário (nome, nível) são lidos client-side pelo DashboardShell.
import DashboardShell from '@/components/dashboard/DashboardShell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  )
}
