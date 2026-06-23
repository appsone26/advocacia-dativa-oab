// Dashboard placeholder — Tijolo 7
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function OwnerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const nome = user.user_metadata?.nome ?? 'Dra. Patrícia'

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🏛️</div>
        <h1 className="text-xl font-bold text-dativa-800">Olá, {nome}</h1>
        <p className="text-gray-500 mt-2">Dashboard Geral · OAB-RJ</p>
        <p className="text-xs text-gray-400 mt-1">Tijolo 7 — em construção</p>
      </div>
    </div>
  )
}
