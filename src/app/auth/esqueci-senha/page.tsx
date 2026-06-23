'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function EsqueciSenhaPage() {
  const searchParams = useSearchParams()
  const linkInvalido = searchParams.get('erro') === 'link_invalido'

  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)

    await fetch('/api/recuperar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    // Sempre mostra sucesso (não revela se o email existe)
    setEnviado(true)
    setCarregando(false)
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-dativa-800 mb-4">
            <span className="text-ouro-600 text-2xl font-bold">⚖</span>
          </div>
          <div className="text-[10px] font-bold tracking-[2px] uppercase text-dativa-700 mb-1">
            OAB · Rio de Janeiro
          </div>
          <h1 className="text-2xl font-bold text-dativa-800">Advocacia Dativa</h1>
        </div>

        <div className="bg-white rounded-card shadow-card p-6">
          {enviado ? (
            // Estado de sucesso
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mb-4">
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <h2 className="text-base font-semibold text-dativa-800 mb-2">Email enviado</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Se houver uma conta com este email, você receberá um link para redefinir sua senha. Verifique também a caixa de spam.
              </p>
              <a
                href="/auth/login"
                className="inline-block mt-6 text-sm text-dativa-700 hover:text-dativa-800 hover:underline"
              >
                Voltar ao login
              </a>
            </div>
          ) : (
            // Formulário
            <>
              <h2 className="text-base font-semibold text-dativa-800 mb-1">Recuperar senha</h2>
              <p className="text-sm text-gray-500 mb-5">
                Informe seu email e enviaremos um link para criar uma nova senha.
              </p>

              {linkInvalido && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-btn px-3.5 py-2.5 mb-4">
                  O link expirou ou já foi usado. Solicite um novo abaixo.
                </div>
              )}

              <form onSubmit={handleEnviar} className="space-y-4">
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
                               placeholder:text-gray-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-dativa-800 hover:bg-dativa-700 text-white font-semibold
                             py-2.5 rounded-btn text-sm transition-colors
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <a
                  href="/auth/login"
                  className="text-sm text-dativa-700 hover:text-dativa-800 hover:underline"
                >
                  Voltar ao login
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
