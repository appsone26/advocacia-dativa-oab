'use client'
// src/components/dashboard/Sidebar.tsx
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, FileText, BarChart2, Building2,
  ScrollText, Settings, X, Scale, MapPin, UserCheck,
  MessageSquare, LogOut, Shield
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
        { href: '/dashboard/owner',               label: 'Visão Geral',       icon: icon(LayoutDashboard) },
        { href: '/dashboard/owner/municipios',    label: '92 Municípios',     icon: icon(MapPin) },
        { href: '/dashboard/owner/gestores',      label: 'Gestores',          icon: icon(Building2) },
        { href: '/dashboard/owner/advogados',     label: 'Advogados',         icon: icon(UserCheck) },
        { href: '/dashboard/owner/clientes',      label: 'Clientes',          icon: icon(Users) },
        { href: '/dashboard/owner/casos',         label: 'Casos',             icon: icon(FileText) },
        { href: '/dashboard/owner/comissao',      label: 'Comissão',          icon: icon(Shield) },
        { href: '/dashboard/owner/mensagens',     label: 'Mensagens em massa',icon: icon(MessageSquare) },
        { href: '/dashboard/owner/relatorios',    label: 'Relatórios',        icon: icon(BarChart2) },
        { href: '/dashboard/owner/auditoria',     label: 'Auditoria',         icon: icon(ScrollText) },
        { href: '/dashboard/owner/configuracoes', label: 'Configurações',     icon: icon(Settings) },
      ]
    case 'comissao':
      return [
        { href: '/dashboard/comissao',            label: 'Visão Geral',       icon: icon(LayoutDashboard) },
        { href: '/dashboard/comissao/municipios', label: 'Municípios',        icon: icon(MapPin) },
        { href: '/dashboard/comissao/casos',      label: 'Casos',             icon: icon(FileText) },
        { href: '/dashboard/comissao/relatorios', label: 'Relatórios',        icon: icon(BarChart2) },
      ]
    case 'gestor':
      return [
        { href: '/dashboard/gestor',              label: 'Meu Município',     icon: icon(LayoutDashboard) },
        { href: '/dashboard/gestor/advogados',    label: 'Advogados',         icon: icon(UserCheck) },
        { href: '/dashboard/gestor/clientes',     label: 'Clientes',          icon: icon(Users) },
        { href: '/dashboard/gestor/casos',        label: 'Casos',             icon: icon(FileText) },
        { href: '/dashboard/gestor/relatorios',   label: 'Relatórios',        icon: icon(BarChart2) },
      ]
    case 'advogado':
      return [
        { href: '/dashboard/advogado',            label: 'Meu Painel',        icon: icon(LayoutDashboard) },
        { href: '/dashboard/advogado/casos',      label: 'Meus Casos',        icon: icon(Scale) },
        { href: '/dashboard/advogado/historico',  label: 'Histórico',         icon: icon(ScrollText) },
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
      {/* Botão fechar — só no mobile */}
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

      {/* Itens do menu */}
      <div style={{ flex: 1 }}>
        {items.map(item => {
          const active = pathname === item.href ||
            (item.href !== '/dashboard/' + nivel && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
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

      {/* Rodapé com Sair */}
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
