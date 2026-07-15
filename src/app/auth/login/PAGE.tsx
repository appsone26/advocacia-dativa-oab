'use client'
// src/app/auth/login/page.tsx

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { NivelUsuario } from '@/types'
import { MODULOS } from '@/config/modulos'

const DASHBOARD_POR_NIVEL: Record<NivelUsuario, string> = {
  cliente:  '/auth/login',
  advogado: '/dashboard/advogado',
  gestor:   '/dashboard/gestor',
  comissao: '/dashboard/comissao',
  owner:    '/dashboard/owner',
}

// Níveis cujo painel pode estar adormecido (interruptores em modulos.ts).
const MODULO_DO_NIVEL: Partial<Record<NivelUsuario, 'gestor' | 'advogado'>> = {
  gestor:   'gestor',
  advogado: 'advogado',
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro('Email ou senha incorretos.')
      setCarregando(false)
      return
    }

    const nivel = data.user?.user_metadata?.nivel as NivelUsuario
    const primeiroacesso = data.user?.user_metadata?.primeiro_acesso as boolean

    // Nível adormecido (ou sem painel próprio) → não entra: avisa e desloga.
    const mod = MODULO_DO_NIVEL[nivel]
    const nivelAdormecido = mod ? !MODULOS[mod] : false
    const destino = DASHBOARD_POR_NIVEL[nivel] ?? '/auth/login'

    if (nivelAdormecido || destino === '/auth/login') {
      await supabase.auth.signOut()
      setErro('Este acesso está indisponível no momento.')
      setCarregando(false)
      return
    }

    if (primeiroacesso) {
      router.push('/auth/primeiro-acesso')
      return
    }

    router.push(destino)
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">

        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-dativa-800 mb-4">
            <span className="text-ouro-600 text-2xl font-bold">⚖</span>
          </div>
          <div className="text-[10px] font-bold tracking-[2px] uppercase text-dativa-700 mb-1">
            OAB · Rio de Janeiro
          </div>
          <h1 className="text-2xl font-bold text-dativa-800">Advocacia Dativa</h1>
          <p className="text-sm text-gray-500 mt-1">Comissão de Desenvolvimento</p>
        </div>

        {/* Card do formulário */}
        <div className="bg-white rounded-card shadow-card p-6">
          <h2 className="text-base font-semibold text-dativa-800 mb-5">Entrar no sistema</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-btn text-sm 
                           focus:outline-none focus:ring-2 focus:ring-dativa-700 focus:border-transparent
                           placeholder:text-gray-300 transition-shadow"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-btn text-sm pr-10
                             focus:outline-none focus:ring-2 focus:ring-dativa-700 focus:border-transparent
                             placeholder:text-gray-300 transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  {mostrarSenha ? 'ocultar' : 'mostrar'}
                </button>
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-btn px-3.5 py-2.5">
                {erro}
              </div>
            )}

            {/* Botão entrar */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-dativa-800 hover:bg-dativa-700 text-white font-semibold 
                         py-2.5 rounded-btn text-sm transition-colors
                         disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Esqueci senha */}
          <div className="mt-4 text-center">
            <a
              href="/auth/esqueci-senha"
              className="text-sm text-dativa-700 hover:text-dativa-800 hover:underline"
            >
              Esqueci minha senha
            </a>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Advocacia Dativa OAB-RJ · Acesso restrito
        </p>
      </div>
    </div>
  )
}
