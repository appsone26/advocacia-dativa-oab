'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, MapPin, Briefcase, Users, User,
  UserShield, BarChart2, FileText, Mail, Settings,
  Clock, LogOut, Scale
} from 'lucide-react'

type NavItem = {
  icon: React.ReactNode
  label: string
  href: string
  badge?: string
}

type NavSection = {
  section: string
  items: NavItem[]
}

function getNav(nivel: string): NavSection[] {
  switch (nivel) {
    case 'owner':
      return [
        {
          section: 'Principal',
          items: [
            { icon: <LayoutDashboard size={18} />, label: 'Painel geral', href: '/dashboard/owner' },
            { icon: <MapPin size={18} />, label: 'Municípios', href: '/dashboard/owner/municipios' },
            { icon: <Briefcase size={18} />, label: 'Casos', href: '/dashboard/owner/casos' },
          ],
        },
        {
          section: 'Gestão',
          items: [
            { icon: <Users size={18} />, label: 'Advogados', href: '/dashboard/owner/advogados' },
            { icon: <User size={18} />, label: 'Clientes', href: '/dashboard/owner/clientes' },
            { icon: <UserShield size={18} />, label: 'Comissão', href: '/dashboard/owner/comissao' },
          ],
        },
        {
          section: 'Relatórios',
          items: [
            { icon: <BarChart2 size={18} />, label: 'Relatórios', href: '/dashboard/owner/relatorios' },
            { icon: <FileText size={18} />, label: 'Auditoria', href: '/dashboard/owner/auditoria' },
            { icon: <Mail size={18} />, label: 'Mensagens em massa', href: '/dashboard/owner/mensagens' },
          ],
        },
      ]

    case 'gestor':
      return [
        {
          section: 'Município',
          items: [
            { icon: <LayoutDashboard size={18} />, label: 'Painel', href: '/dashboard/gestor' },
            { icon: <Briefcase size={18} />, label: 'Casos', href: '/dashboard/gestor/casos' },
          ],
        },
        {
          section: 'Gestão local',
          items: [
            { icon: <Users size={18} />, label: 'Advogados', href: '/dashboard/gestor/advogados' },
            { icon: <User size={18} />, label: 'Clientes', href: '/dashboard/gestor/clientes' },
            { icon: <Settings size={18} />, label: 'Configurações', href: '/dashboard/gestor/configuracoes' },
          ],
        },
        {
          section: 'Relatórios',
          items: [
            { icon: <BarChart2 size={18} />, label: 'Relatórios', href: '/dashboard/gestor/relatorios' },
          ],
        },
      ]

    case 'advogado':
      return [
        {
          section: 'Meu trabalho',
          items: [
            { icon: <LayoutDashboard size={18} />, label: 'Meu painel', href: '/dashboard/advogado' },
            { icon: <Briefcase size={18} />, label: 'Meus casos', href: '/dashboard/advogado/casos' },
            { icon: <Clock size={18} />, label: 'Histórico', href: '/dashboard/advogado/historico' },
          ],
        },
        {
          section: 'Conta',
          items: [
            { icon: <User size={18} />, label: 'Meu perfil', href: '/dashboard/advogado/perfil' },
          ],
        },
      ]

    case 'comissao':
      return [
        {
          section: 'Regional',
          items: [
            { icon: <LayoutDashboard size={18} />, label: 'Visão geral', href: '/dashboard/comissao' },
            { icon: <MapPin size={18} />, label: 'Municípios', href: '/dashboard/comissao/municipios' },
            { icon: <Briefcase size={18} />, label: 'Casos', href: '/dashboard/comissao/casos' },
          ],
        },
        {
          section: 'Relatórios',
          items: [
            { icon: <BarChart2 size={18} />, label: 'Relatórios', href: '/dashboard/comissao/relatorios' },
          ],
        },
      ]

    default:
      return []
  }
}

type Props = {
  nivel: string
  open: boolean
  onClose: () => void
}

export default function Sidebar({ nivel, open, onClose }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const nav = getNav(nivel)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  function handleNav(href: string) {
    router.push(href)
    onClose()
  }

  return (
    <aside
      className={`
        fixed top-[52px] left-0 bottom-0 w-[230px] z-30
        flex flex-col
        transition-transform duration-250 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{ background: '#1e3a5f' }}
    >
      <div
        className="flex items-center gap-3 px-3 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
      >
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: '#c9a227' }}
        >
          <Scale size={16} color="#1e3a5f" />
        </div>
        <div>
          <p className="text-white text-[13px] font-medium leading-tight">Advocacia Dativa</p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>OAB-RJ</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {nav.map((section) => (
          <div key={section.section}>
            <p
              className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              {section.section}
            </p>
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <button
                  key={item.href}
                  onClick={() => handleNav(item.href)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 mx-1.5 rounded-md text-[13px] text-left
                    transition-colors duration-150
                    ${active
                      ? 'text-white'
                      : 'text-white/65 hover:text-white hover:bg-white/10'
                    }
                  `}
                  style={active ? { background: 'rgba(201,162,39,0.2)', width: 'calc(100% - 12px)' } : { width: 'calc(100% - 12px)' }}
                >
                  <span style={{ color: active ? '#c9a227' : 'rgba(255,255,255,0.65)' }}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ background: '#c9a227', color: '#1e3a5f' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="border-t p-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] text-white/65 hover:text-white hover:bg-white/10 transition-colors"
        >
          <LogOut size={18} style={{ color: 'rgba(255,255,255,0.65)' }} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
