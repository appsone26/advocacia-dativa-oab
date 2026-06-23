'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [temSessao, setTemSessao] = useState<boolean | null>(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmaSenha, setConfirmaSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  // Confirma que a sessão de recuperação existe
  // (criada pela rota /auth/confirmar)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setTemSessao(!!data.user)
    })
  }, [])

  async function handleRedefinir(e: React.FormEvent) {
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
      setErro('Escolha uma senha diferente da senha padrão do sistema.')
      return
    }

    setCarregando(true)
    const supabase = createClient()

    // Define a nova senha e marca que não é mais primeiro acesso
    const { error } = await supabase.auth.updateUser({
      password: novaSenha,
      data: { primeiro_acesso: false },
    })

    if (error) {
      setErro('Erro ao redefinir a senha. O link pode ter expirado.')
      setCarregando(false)
      return
    }

    // Atualiza também na tabela profiles
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ primeiro_acesso: false }).eq('id', user.id)
    }

    // Encerra a sessão de recuperação e manda fazer login com a senha nova
    await supabase.auth.signOut()
    setSucesso(true)
    setCarregando(false)

    setTimeout(() => router.push('/auth/login'), 2500)
  }

  // Carregando verificação de sessão
  if (temSessao === null) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
        <p className="text-sm text-gray-400">Verificando link...</p>
      </div>
    )
  }

  // Sem sessão válida = link inválido/expirado
  if (!temSessao) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] text-center">
          <div className="bg-white rounded-card shadow-card p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4">
              <span className="text-red-500 text-xl">!</span>
            </div>
            <h2 className="text-base font-semibold text-dativa-800 mb-2">Link inválido</h2>
            <p className="text-sm text-gray-500 mb-5">
              Este link de recuperação expirou ou já foi usado. Solicite um novo.
            </p>
            <a
              href="/auth/esqueci-senha"
              className="inline-block bg-dativa-800 hover:bg-dativa-700 text-white font-semibold px-5 py-2.5 rounded-btn text-sm transition-colors"
            >
              Solicitar novo link
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-dativa-800 mb-4">
            <span className="text-ouro-600 text-2xl">🔐</span>
          </div>
          <h1 className="text-xl font-bold text-dativa-800">Criar nova senha</h1>
          <p className="text-sm text-gray-500 mt-1">Escolha uma senha pessoal para sua conta.</p>
        </div>

        <div className="bg-white rounded-card shadow-card p-6">
          {sucesso ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mb-4">
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <h2 className="text-base font-semibold text-dativa-800 mb-2">Senha redefinida</h2>
              <p className="text-sm text-gray-500">
                Sua senha foi alterada com sucesso. Redirecionando para o login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleRedefinir} className="space-y-4">
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
                {carregando ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
