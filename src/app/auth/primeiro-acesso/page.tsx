'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { NivelUsuario } from '@/types'

const DASHBOARD_POR_NIVEL: Record<NivelUsuario, string> = {
  cliente:  '/auth/login',
  advogado: '/dashboard/advogado',
  gestor:   '/dashboard/gestor',
  comissao: '/dashboard/comissao',
  owner:    '/dashboard/owner',
}

export default function PrimeiroAcessoPage() {
  const router = useRouter()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmaSenha, setConfirmaSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleTrocarSenha(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (novaSenha.length < 8) {
      setErro('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    if (novaSenha !== confirmaSenha) {
      setErro('As senhas não conferem.')
      return
    }
    if (novaSenha === 'Dativa@2026') {
      setErro('Você precisa escolher uma senha diferente da senha padrão.')
      return
    }

    setCarregando(true)
    const supabase = createClient()

    // 1. Atualiza a senha
    const { error: senhaError } = await supabase.auth.updateUser({
      password: novaSenha,
      data: { primeiro_acesso: false }, // Remove a flag de primeiro acesso
    })

    if (senhaError) {
      setErro('Erro ao atualizar a senha. Tente novamente.')
      setCarregando(false)
      return
    }

    // 2. Atualiza também na tabela profiles
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ primeiro_acesso: false })
        .eq('id', user.id)
    }

    // 3. Redireciona ao dashboard correto
    const nivel = user?.user_metadata?.nivel as NivelUsuario
    const destino = DASHBOARD_POR_NIVEL[nivel] ?? '/auth/login'
    router.push(destino)
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-dativa-800 mb-4">
            <span className="text-ouro-600 text-2xl">🔐</span>
          </div>
          <h1 className="text-xl font-bold text-dativa-800">Criar sua senha</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-[280px] mx-auto">
            Este é seu primeiro acesso. Escolha uma senha pessoal para continuar.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-card shadow-card p-6">

          {/* Aviso sobre senha padrão */}
          <div className="bg-ouro-50 border border-ouro-200 rounded-btn px-3.5 py-3 mb-5">
            <p className="text-xs text-ouro-800 font-medium">
              Por segurança, a senha padrão <code className="font-mono">Dativa@2026</code> deve ser substituída agora.
            </p>
          </div>

          <form onSubmit={handleTrocarSenha} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nova senha
              </label>
              <input
                type="password"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-btn text-sm
                           focus:outline-none focus:ring-2 focus:ring-dativa-700 focus:border-transparent
                           placeholder:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirmar nova senha
              </label>
              <input
                type="password"
                value={confirmaSenha}
                onChange={e => setConfirmaSenha(e.target.value)}
                required
                placeholder="Repita a senha"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-btn text-sm
                           focus:outline-none focus:ring-2 focus:ring-dativa-700 focus:border-transparent
                           placeholder:text-gray-300"
              />
            </div>

            {/* Indicador de força de senha */}
            {novaSenha.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[8, 12, 16].map((min, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        novaSenha.length >= min
                          ? i === 0 ? 'bg-red-400' : i === 1 ? 'bg-yellow-400' : 'bg-green-400'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  {novaSenha.length < 8 ? 'Muito curta' : novaSenha.length < 12 ? 'Fraca' : novaSenha.length < 16 ? 'Média' : 'Forte'}
                </p>
              </div>
            )}

            {/* Erro */}
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-btn px-3.5 py-2.5">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-dativa-800 hover:bg-dativa-700 text-white font-semibold
                         py-2.5 rounded-btn text-sm transition-colors
                         disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {carregando ? 'Salvando...' : 'Salvar senha e continuar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
