'use client'
// src/components/dashboard/Sidebar.tsx
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MODULOS } from '@/config/modulos'
import {
  LayoutDashboard, Users, FileText, BarChart2, Building2,
  ScrollText, Settings, X, Scale, MapPin, UserCheck,
  MessageSquare, LogOut, Shield, Calendar
} from 'lucide-react'

type MenuItem = {
  href: string
  label: string
  icon: React.ReactNode
}

function getMenuItems(nivel: string): MenuItem[] {
  const icon = (I: React.ElementType) => <I size={18} />

  switch (nivel) {
    case 'owner':
      return [
        { href: '/dashboard/owner',        label: 'Visão Geral',        icon: icon(LayoutDashboard) },
        { href: '/dashboard/owner/agenda', label: 'Agenda',             icon: icon(Calendar) },
        { href: '/dashboard/usuarios',     label: 'Usuários',           icon: icon(Users) },
        { href: '/dashboard/relatorios', label: 'Relatórios',         icon: icon(BarChart2) },
        { href: '/dashboard/relatorios', label: 'Auditoria',          icon: icon(ScrollText) },
      ]
    case 'comissao':
      return [
        { href: '/dashboard/comissao',   label: 'Visão Geral',  icon: icon(LayoutDashboard) },
        { href: '/dashboard/comissao',   label: 'Municípios',   icon: icon(MapPin) },
        { href: '/dashboard/comissao',   label: 'Casos',        icon: icon(FileText) },
        { href: '/dashboard/relatorios', label: 'Relatórios',   icon: icon(BarChart2) },
      ]
    case 'gestor':
      // Módulo adormecido → sem menu (defensivo; o middleware já bloqueia a rota).
      if (!MODULOS.gestor) return []
      return [
        { href: '/dashboard/gestor',     label: 'Meu Município', icon: icon(LayoutDashboard) },
        { href: '/dashboard/gestor',     label: 'Advogados',     icon: icon(UserCheck) },
        { href: '/dashboard/gestor',     label: 'Clientes',      icon: icon(Users) },
        { href: '/dashboard/gestor',     label: 'Casos',         icon: icon(FileText) },
        { href: '/dashboard/relatorios', label: 'Relatórios',    icon: icon(BarChart2) },
      ]
    case 'advogado':
      // Módulo adormecido → sem menu (defensivo; o middleware já bloqueia a rota).
      if (!MODULOS.advogado) return []
      return [
        { href: '/dashboard/advogado',   label: 'Meu Painel', icon: icon(LayoutDashboard) },
        { href: '/dashboard/advogado',   label: 'Meus Casos', icon: icon(Scale) },
        { href: '/dashboard/advogado',   label: 'Histórico',  icon: icon(ScrollText) },
      ]
    default:
      return []
  }
}

type Props = {
  nivel: string
  open: boolean
  onClose: () => void
  isDesktop: boolean
}

export default function Sidebar({ nivel, open, onClose, isDesktop }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const items = getMenuItems(nivel)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const sidebarStyle: React.CSSProperties = isDesktop
    ? {
        width: '230px',
        background: '#fff',
        borderRight: '1px solid #e2e8f0',
        height: 'calc(100vh - 52px)',
        position: 'sticky',
        top: '52px',
        overflowY: 'auto',
        padding: '16px 0',
        display: 'flex',
        flexDirection: 'column',
      }
    : {
        position: 'fixed',
        top: '52px',
        left: 0,
        bottom: 0,
        width: '260px',
        background: '#fff',
        zIndex: 30,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
        overflowY: 'auto',
        padding: '16px 0',
        boxShadow: open ? '4px 0 20px rgba(0,0,0,0.15)' : 'none',
        display: 'flex',
        flexDirection: 'column',
      }

  return (
    <nav style={sidebarStyle} aria-label="Menu principal">
      {!isDesktop && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 12px 8px' }}>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', lineHeight: 0, padding: '4px' }}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <div style={{ flex: 1 }}>
        {items.map((item, idx) => {
          const active = pathname === item.href ||
            (item.href !== '/dashboard/owner' && pathname.startsWith(item.href))

          return (
            <Link
              key={`${item.href}-${idx}`}
              href={item.href}
              onClick={!isDesktop ? onClose : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 20px',
                fontSize: '13.5px',
                fontWeight: active ? 600 : 400,
                color: active ? '#1e3a5f' : '#475569',
                background: active ? '#f0f4f8' : 'none',
                borderLeft: active ? '3px solid #c9a227' : '3px solid transparent',
                textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <span style={{ color: active ? '#c9a227' : '#94a3b8', lineHeight: 0 }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </div>

      <div style={{ borderTop: '1px solid #f1f5f9', padding: '8px 0' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 20px', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: '13.5px', color: '#ef4444',
            borderLeft: '3px solid transparent',
          }}
        >
          <span style={{ lineHeight: 0 }}><LogOut size={18} /></span>
          Sair
        </button>
        <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '6px 0 4px' }}>
          OAB-RJ · Advocacia Dativa
        </div>
      </div>
    </nav>
  )
}
