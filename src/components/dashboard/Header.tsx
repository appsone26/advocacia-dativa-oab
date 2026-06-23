'use client'

import { useState } from 'react'
import { Menu, Search, Bell, Moon, Sun } from 'lucide-react'

type Props = {
  nome: string
  nivel: string
  onMenuClick: () => void
}

const notificacoesMock = [
  { id: 1, texto: 'Adv. Carlos Silva designado ao caso #1042', tempo: 'há 5 minutos', lida: false },
  { id: 2, texto: 'Nova cliente cadastrada em Niterói', tempo: 'há 23 minutos', lida: false },
  { id: 3, texto: 'Caso #1039 concluído em Petrópolis', tempo: 'ontem', lida: true },
]

function getInitials(nome: string) {
  const parts = nome.replace('Dra.', '').replace('Dr.', '').trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : nome.slice(0, 2).toUpperCase()
}

export default function Header({ nome, nivel: _nivel, onMenuClick }: Props) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [dark, setDark] = useState(false)

  function toggleDark() {
    setDark(!dark)
    document.documentElement.classList.toggle('dark')
  }

  const naoLidas = notificacoesMock.filter(n => !n.lida).length

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-[52px] flex items-center px-4 gap-3 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>

      <div className="flex-1 max-w-sm flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 cursor-text">
        <Search size={15} className="text-gray-400 flex-shrink-0" />
        <span className="text-[13px] text-gray-400">Buscar advogados, clientes...</span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={toggleDark}
          className="w-[34px] h-[34px] flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Alternar modo escuro"
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="w-[34px] h-[34px] flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Notificações"
          >
            <Bell size={17} />
            {naoLidas > 0 && (
              <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-10 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 p-3">
                <p className="text-[13px] font-medium text-gray-900 dark:text-white mb-3">Notificações</p>
                {notificacoesMock.map(n => (
                  <div key={n.id} className="py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 flex gap-2 items-start">
                    {!n.lida && (
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#1e3a5f' }} />
                    )}
                    {n.lida && <div className="w-1.5 flex-shrink-0" />}
                    <div>
                      <p className="text-[12px] text-gray-800 dark:text-gray-200 leading-snug">{n.texto}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{n.tempo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <button className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg pl-1 pr-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <div
            className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0"
            style={{ background: '#1e3a5f' }}
          >
            {getInitials(nome)}
          </div>
          <span className="text-[13px] font-medium text-gray-900 dark:text-white">{nome.split(' ')[0]}</span>
        </button>
      </div>
    </header>
  )
}
