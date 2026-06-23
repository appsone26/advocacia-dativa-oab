'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [nivel, setNivel] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login')
        return
      }
      const meta = user.user_metadata
      setNome(meta?.nome ?? user.email ?? '')
      setNivel(meta?.nivel ?? '')
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="text-sm" style={{ color: '#2d5986' }}>Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col">
      <Header
        nome={nome}
        nivel={nivel}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <div className="flex flex-1">
        {/* Desktop: sidebar fixa, sempre visível */}
        <div className="hidden md:flex w-[230px] flex-shrink-0">
          <Sidebar
            nivel={nivel}
            open={true}
            onClose={() => {}}
            isDesktop={true}
          />
        </div>

        {/* Mobile: gaveta deslizante */}
        <div className="md:hidden">
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-20"
              style={{ top: '52px' }}
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <Sidebar
            nivel={nivel}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isDesktop={false}
          />
        </div>

        <main className="flex-1 p-4 md:p-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
