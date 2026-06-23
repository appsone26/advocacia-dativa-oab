import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdvogadoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const nome = user.user_metadata?.nome ?? 'Advogado'

  return (
    <div>
      <h1 className="text-xl font-medium text-dativa-800 mb-1">Olá, {nome}</h1>
      <p className="text-gray-500 text-sm">Painel do Advogado</p>
      <p className="text-xs text-gray-400 mt-1">Tijolo 5 — em construção</p>
    </div>
  )
}
