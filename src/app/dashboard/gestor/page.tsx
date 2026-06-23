// Dashboard do Gestor Municipal
// TIJOLO 4 — a ser implementado

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function GestorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const nome = user.user_metadata?.nome ?? 'Gestor'

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🏛️</div>
        <h1 className="text-xl font-bold text-dativa-800">Olá, {nome}</h1>
        <p className="text-gray-500 mt-2">Dashboard do Gestor Municipal</p>
        <p className="text-xs text-gray-400 mt-1">Tijolo 4 — em construção</p>
      </div>
    </div>
  )
}
