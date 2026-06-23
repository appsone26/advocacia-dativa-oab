// src/app/dashboard/gestor/page.tsx
// Tijolo 4 — Painel do Gestor Municipal
// Dados estáticos por enquanto; ligação ao Supabase vem no Tijolo 4b
'use client'
import { useState } from 'react'
import {
  Users, FileText, CheckCircle, Clock,
  Plus, UserPlus, Search, ChevronDown, AlertCircle,
  Scale, Shield, Home, MoreVertical
} from 'lucide-react'

// ── Tipos ────────────────────────────────────────────────
type Advogado = {
  id: number
  nome: string
  oab: string
  posicao: number
  area: string
  casosAtivos: number
  recusas: number
  status: 'disponivel' | 'ocupado' | 'afastado'
}

type Caso = {
  id: number
  cliente: string
  area: 'violencia' | 'alimentos' | 'outros'
  prioridade: 'urgente' | 'alta' | 'normal'
  status: 'aguardando' | 'em_andamento' | 'concluido'
  advogado: string | null
  data: string
}

// ── Dados estáticos de exemplo ────────────────────────────
const advogados: Advogado[] = [
  { id: 1, nome: 'Dr. Carlos Mendes',    oab: 'RJ 45.231', posicao: 1, area: 'Família',           casosAtivos: 2, recusas: 0, status: 'disponivel' },
  { id: 2, nome: 'Dra. Ana Ferreira',    oab: 'RJ 38.102', posicao: 2, area: 'Violência doméstica',casosAtivos: 3, recusas: 1, status: 'ocupado'    },
  { id: 3, nome: 'Dr. Lucas Oliveira',   oab: 'RJ 52.019', posicao: 3, area: 'Geral',             casosAtivos: 1, recusas: 0, status: 'disponivel' },
  { id: 4, nome: 'Dra. Marcia Santos',   oab: 'RJ 29.874', posicao: 4, area: 'Família',           casosAtivos: 0, recusas: 2, status: 'disponivel' },
  { id: 5, nome: 'Dr. Paulo Carvalho',   oab: 'RJ 61.337', posicao: 5, area: 'Imobiliário',       casosAtivos: 2, recusas: 0, status: 'ocupado'    },
]

const casos: Caso[] = [
  { id: 101, cliente: 'Maria da Silva',       area: 'violencia', prioridade: 'urgente', status: 'aguardando',    advogado: null,              data: '20/06/2026' },
  { id: 102, cliente: 'João Pereira',         area: 'alimentos', prioridade: 'alta',    status: 'em_andamento', advogado: 'Dra. Ana Ferreira', data: '18/06/2026' },
  { id: 103, cliente: 'Carla Souza',          area: 'violencia', prioridade: 'urgente', status: 'aguardando',    advogado: null,              data: '21/06/2026' },
  { id: 104, cliente: 'Roberto Lima',         area: 'outros',    prioridade: 'normal',  status: 'em_andamento', advogado: 'Dr. Carlos Mendes', data: '15/06/2026' },
  { id: 105, cliente: 'Fernanda Costa',       area: 'alimentos', prioridade: 'alta',    status: 'aguardando',    advogado: null,              data: '22/06/2026' },
  { id: 106, cliente: 'Antônio Rodrigues',    area: 'outros',    prioridade: 'normal',  status: 'concluido',     advogado: 'Dr. Lucas Oliveira',data: '10/06/2026' },
]

// ── Helpers de estilo ─────────────────────────────────────
const areaConfig = {
  violencia: { label: 'Violência Doméstica', icon: Shield, cor: '#ef4444', bg: '#fee2e2' },
  alimentos: { label: 'Alimentos/Família',   icon: Scale,  cor: '#f59e0b', bg: '#fef3c7' },
  outros:    { label: 'Outros',              icon: Home,   cor: '#6366f1', bg: '#ede9fe' },
}

const prioConfig = {
  urgente: { label: '🔴 Urgente', cor: '#ef4444', bg: '#fee2e2' },
  alta:    { label: '🟡 Alta',    cor: '#f59e0b', bg: '#fef3c7' },
  normal:  { label: '⚪ Normal',  cor: '#64748b', bg: '#f1f5f9' },
}

const statusAdvConfig = {
  disponivel: { label: 'Disponível', cor: '#10b981', bg: '#d1fae5' },
  ocupado:    { label: 'Ocupado',    cor: '#f59e0b', bg: '#fef3c7' },
  afastado:   { label: 'Afastado',  cor: '#94a3b8', bg: '#f1f5f9' },
}

// ── Componente principal ──────────────────────────────────
export default function GestorPage() {
  const [aba, setAba] = useState<'casos' | 'advogados'>('casos')
  const [buscaAdv, setBuscaAdv] = useState('')
  const [buscaCaso, setBuscaCaso] = useState('')
  const [filtroPrio, setFiltroPrio] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  // Estatísticas
  const totalAdv   = advogados.length
  const disponiveis = advogados.filter(a => a.status === 'disponivel').length
  const casosAbertos   = casos.filter(c => c.status !== 'concluido').length
  const aguardando = casos.filter(c => c.status === 'aguardando').length
  const urgentes   = casos.filter(c => c.prioridade === 'urgente' && c.status !== 'concluido').length

  // Filtros
  const casosFiltrados = casos.filter(c => {
    if (filtroStatus !== 'todos' && c.status !== filtroStatus) return false
    if (filtroPrio !== 'todos' && c.prioridade !== filtroPrio) return false
    if (buscaCaso && !c.cliente.toLowerCase().includes(buscaCaso.toLowerCase())) return false
    return true
  })

  const advFiltrados = advogados.filter(a =>
    !buscaAdv || a.nome.toLowerCase().includes(buscaAdv.toLowerCase())
  )

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

      {/* ── Cabeçalho da página ── */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1e3a5f' }}>
          Meu Município
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
          Gestão de advogados e casos · Advocacia Dativa OAB-RJ
        </p>
      </div>

      {/* ── Cards de resumo ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <Card icon={<Users size={20} color="#1e3a5f" />} valor={totalAdv} label="Advogados" sub={`${disponiveis} disponíveis`} borda="#dbeafe" />
        <Card icon={<FileText size={20} color="#f59e0b" />} valor={casosAbertos} label="Casos Abertos" sub={`${aguardando} sem advogado`} borda="#fef3c7" />
        <Card icon={<AlertCircle size={20} color="#ef4444" />} valor={urgentes} label="Urgentes" sub="Violência doméstica" borda="#fee2e2" cor="#ef4444" />
        <Card icon={<CheckCircle size={20} color="#10b981" />} valor={casos.filter(c=>c.status==='concluido').length} label="Concluídos" sub="Este mês" borda="#d1fae5" cor="#10b981" />
      </div>

      {/* ── Alerta de urgentes sem advogado ── */}
      {casos.filter(c => c.prioridade === 'urgente' && c.status === 'aguardando').length > 0 && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px',
          padding: '12px 16px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
          <div>
            <span style={{ fontWeight: 700, color: '#dc2626', fontSize: '13px' }}>
              {casos.filter(c => c.prioridade === 'urgente' && c.status === 'aguardando').length} caso(s) urgente(s) sem advogado designado
            </span>
            <span style={{ color: '#ef4444', fontSize: '12px', marginLeft: '8px' }}>
              — A fila será acionada automaticamente
            </span>
          </div>
        </div>
      )}

      {/* ── Abas ── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '0' }}>
        {(['casos', 'advogados'] as const).map(a => (
          <button key={a} onClick={() => setAba(a)} style={{
            padding: '8px 18px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            color: aba === a ? '#1e3a5f' : '#94a3b8',
            background: 'none',
            borderBottom: aba === a ? '2px solid #c9a227' : '2px solid transparent',
            marginBottom: '-2px', transition: 'all 0.15s'
          }}>
            {a === 'casos' ? `⚖️ Casos (${casosAbertos})` : `👩‍⚖️ Advogados (${totalAdv})`}
          </button>
        ))}
      </div>

      {/* ── ABA CASOS ── */}
      {aba === 'casos' && (
        <div>
          {/* Filtros */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  value={buscaCaso} onChange={e => setBuscaCaso(e.target.value)}
                  placeholder="Buscar cliente..."
                  style={{ width: '100%', padding: '7px 12px 7px 30px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <FiltroBtn label="Todos" ativo={filtroStatus==='todos'} onClick={() => setFiltroStatus('todos')} />
              <FiltroBtn label="Aguardando" ativo={filtroStatus==='aguardando'} onClick={() => setFiltroStatus('aguardando')} cor="#f59e0b" />
              <FiltroBtn label="Em andamento" ativo={filtroStatus==='em_andamento'} onClick={() => setFiltroStatus('em_andamento')} cor="#1e3a5f" />
              <FiltroBtn label="Concluído" ativo={filtroStatus==='concluido'} onClick={() => setFiltroStatus('concluido')} cor="#10b981" />
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Prioridade:</span>
              <FiltroBtn label="Todas" ativo={filtroPrio==='todos'} onClick={() => setFiltroPrio('todos')} />
              <FiltroBtn label="🔴 Urgente" ativo={filtroPrio==='urgente'} onClick={() => setFiltroPrio('urgente')} cor="#ef4444" />
              <FiltroBtn label="🟡 Alta" ativo={filtroPrio==='alta'} onClick={() => setFiltroPrio('alta')} cor="#f59e0b" />
              <FiltroBtn label="⚪ Normal" ativo={filtroPrio==='normal'} onClick={() => setFiltroPrio('normal')} />
            </div>
          </div>

          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>
            {casosFiltrados.length} caso(s)
          </p>

          {/* Lista de casos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {casosFiltrados.map(caso => {
              const area = areaConfig[caso.area]
              const prio = prioConfig[caso.prioridade]
              const AreaIcon = area.icon
              return (
                <div key={caso.id} style={{
                  background: '#fff', borderRadius: '12px', padding: '14px 16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,.06)',
                  borderLeft: `4px solid ${area.cor}`,
                  display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap'
                }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: area.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AreaIcon size={18} color={area.cor} />
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{caso.cliente}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      {area.label} · #{caso.id} · {caso.data}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: prio.bg, color: prio.cor }}>
                      {prio.label}
                    </span>
                    {caso.advogado ? (
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: '#d1fae5', color: '#065f46' }}>
                        ✓ {caso.advogado}
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: '#fee2e2', color: '#dc2626' }}>
                        ⏳ Sem advogado
                      </span>
                    )}
                    {caso.status === 'concluido' && (
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: '#d1fae5', color: '#10b981' }}>
                        ✓ Concluído
                      </span>
                    )}
                  </div>
                  <button style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#1e3a5f', cursor: 'pointer' }}>
                    Detalhes
                  </button>
                </div>
              )
            })}
          </div>

          {/* Botão vincular cliente */}
          <button style={{
            marginTop: '16px', width: '100%', padding: '12px',
            background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '10px',
            fontWeight: 700, fontSize: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}>
            <Plus size={18} /> Vincular Novo Cliente
          </button>
        </div>
      )}

      {/* ── ABA ADVOGADOS ── */}
      {aba === 'advogados' && (
        <div>
          {/* Busca */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                value={buscaAdv} onChange={e => setBuscaAdv(e.target.value)}
                placeholder="Buscar advogado por nome ou OAB..."
                style={{ width: '100%', padding: '7px 12px 7px 30px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>
            {advFiltrados.length} advogado(s) · Ordem de fila (FIFO)
          </p>

          {/* Lista de advogados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {advFiltrados.map(adv => {
              const sc = statusAdvConfig[adv.status]
              return (
                <div key={adv.id} style={{
                  background: '#fff', borderRadius: '12px', padding: '14px 16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,.06)',
                  display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap'
                }}>
                  {/* Posição na fila */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: adv.posicao === 1 ? '#c9a227' : '#f1f5f9',
                    color: adv.posicao === 1 ? '#fff' : '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: '16px', flexShrink: 0
                  }}>
                    {adv.posicao}
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{adv.nome}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      {adv.oab} · {adv.area}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      <strong>{adv.casosAtivos}</strong> casos ativos
                    </span>
                    {adv.recusas > 0 && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444' }}>
                        ⚠️ {adv.recusas} recusa(s)
                      </span>
                    )}
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: sc.bg, color: sc.cor }}>
                      {sc.label}
                    </span>
                  </div>
                  <button style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', lineHeight: 0 }}>
                    <MoreVertical size={16} color="#64748b" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Botão cadastrar advogado */}
          <button style={{
            marginTop: '16px', width: '100%', padding: '12px',
            background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '10px',
            fontWeight: 700, fontSize: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}>
            <UserPlus size={18} /> Cadastrar Novo Advogado
          </button>
        </div>
      )}

    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────
function Card({ icon, valor, label, sub, borda, cor }: {
  icon: React.ReactNode; valor: number; label: string; sub: string; borda: string; cor?: string
}) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', border: `2px solid ${borda}` }}>
      <div style={{ marginBottom: '6px' }}>{icon}</div>
      <div style={{ fontSize: '26px', fontWeight: 900, color: cor ?? '#1e3a5f' }}>{valor}</div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>{label}</div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>
    </div>
  )
}

function FiltroBtn({ label, ativo, onClick, cor }: {
  label: string; ativo: boolean; onClick: () => void; cor?: string
}) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
      fontSize: '11px', fontWeight: 700, fontFamily: 'inherit',
      background: ativo ? (cor ?? '#1e3a5f') : '#f1f5f9',
      color: ativo ? '#fff' : '#64748b',
      transition: 'all 0.12s'
    }}>
      {label}
    </button>
  )
}
