import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function OwnerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const nome = user.user_metadata?.nome ?? 'Dra. Patrícia'

  return (
    <div>
      <h1 className="text-xl font-medium text-dativa-800 mb-1">Olá, {nome}</h1>
      <p className="text-gray-500 text-sm">Dashboard Geral · OAB-RJ</p>
      <p className="text-xs text-gray-400 mt-1">Tijolo 7 — em construção</p>
    </div>
  )
}
