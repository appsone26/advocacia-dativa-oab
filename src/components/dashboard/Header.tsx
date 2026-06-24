'use client'
// src/components/dashboard/Header.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Menu, Bell, LogOut, ChevronDown, Search } from 'lucide-react'

const LABEL_NIVEL: Record<string, string> = {
  owner:    'Presidência',
  comissao: 'Comissão',
  gestor:   'Gestor Municipal',
  advogado: 'Advogado',
  cliente:  'Cliente',
}

type Props = {
  nome: string
  nivel: string
  onMenuClick: () => void
}

export default function Header({ nome, nivel, onMenuClick }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const iniciais = nome
    ? nome.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '?'

  return (
    <header style={{
      background: '#1e3a5f',
      color: '#fff',
      // Reserva o espaço da barra de status do iPhone (relógio/wifi) no modo app
      paddingTop: 'env(safe-area-inset-top)',
      height: 'calc(52px + env(safe-area-inset-top))',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '16px',
      paddingRight: '16px',
      gap: '12px',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      flexShrink: 0,
      boxSizing: 'border-box',
    }}>
      {/* Hambúrguer — só mobile */}
      <button
        className="md:hidden"
        onClick={onMenuClick}
        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', lineHeight: 0 }}
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>

      {/* Logo / título */}
      <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.3px', flexShrink: 0 }}>
        Advocacia <span style={{ color: '#c9a227' }}>Dativa</span>
      </span>

      {/* Busca universal */}
      <div style={{ flex: 1, maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Buscar advogado ou cliente..."
            style={{
              width: '100%',
              padding: '6px 12px 6px 32px',
              borderRadius: '6px',
              border: 'none',
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Sininho de notificações */}
      <button
        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', lineHeight: 0, position: 'relative' }}
        aria-label="Notificações"
      >
        <Bell size={20} />
        {/* Badge — aparece quando tiver notificações */}
        <span style={{
          position: 'absolute', top: '2px', right: '2px',
          width: '8px', height: '8px', borderRadius: '50%',
          background: '#c9a227', border: '2px solid #1e3a5f'
        }} />
      </button>

      {/* Avatar + nome + menu de logout */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen(v => !v)}
          style={{
            background: 'none', border: 'none', color: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px'
          }}
        >
          {/* Avatar com iniciais */}
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: '#c9a227', color: '#1e3a5f',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '13px', flexShrink: 0
          }}>
            {iniciais}
          </div>
          <div className="hidden md:block" style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.2 }}>
              {nome || 'Carregando...'}
            </div>
            <div style={{ fontSize: '11px', color: '#c9a227', lineHeight: 1.2 }}>
              {LABEL_NIVEL[nivel] ?? nivel}
            </div>
          </div>
          <ChevronDown size={14} className="hidden md:block" />
        </button>

        {/* Dropdown de logout */}
        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              background: '#fff', borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              minWidth: '180px', zIndex: 50, overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e3a5f' }}>{nome}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{LABEL_NIVEL[nivel] ?? nivel}</div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', padding: '10px 16px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '13px', color: '#ef4444', textAlign: 'left'
                }}
              >
                <LogOut size={15} />
                Sair do sistema
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
