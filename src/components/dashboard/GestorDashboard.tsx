'use client'
// src/components/dashboard/GestorDashboard.tsx
// Painel do Gestor ligado ao Supabase (dados reais).
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, FileText, CheckCircle, AlertCircle, Search, UserPlus, X, Inbox,
} from 'lucide-react'

type Advogado = {
  id: string; nome: string; oab: string | null; areas: string[]
  posicao_fila: number; total_recusas: number; status: string
}
type Caso = {
  id: string; status: string; area_juridica: string
  cliente_nome: string; advogado_nome: string | null; concluido: boolean; criado_em: string
}
type Props = { municipioNome: string; temMunicipio: boolean; advogados: Advogado[]; casos: Caso[] }

const AREA_LABEL = (a: string) => {
  const k = (a || '').toLowerCase()
  if (k.includes('violenc') || k.includes('viol')) return 'Violência Doméstica'
  if (k.includes('familia') || k.includes('aliment')) return 'Família / Alimentos'
  return a || 'Outros'
}
const dataBR = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')

export default function GestorDashboard({ municipioNome, temMunicipio, advogados, casos }: Props) {
  const router = useRouter()
  const [aba, setAba] = useState<'casos' | 'advogados'>('casos')
  const [buscaAdv, setBuscaAdv] = useState('')
  const [buscaCaso, setBuscaCaso] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [modal, setModal] = useState(false)

  const casosAbertos = casos.filter(c => !c.concluido && c.status !== 'cancelado').length
  const aguardando = casos.filter(c => c.status === 'aguardando').length
  const concluidos = casos.filter(c => c.concluido).length
  const ativos = advogados.filter(a => a.status === 'ativo').length

  const casosFiltrados = casos.filter(c => {
    if (filtroStatus === 'aguardando' && c.status !== 'aguardando') return false
    if (filtroStatus === 'em_andamento' && (c.status !== 'em_andamento' || c.concluido)) return false
    if (filtroStatus === 'concluido' && !c.concluido) return false
    if (buscaCaso && !c.cliente_nome.toLowerCase().includes(buscaCaso.toLowerCase())) return false
    return true
  })
  const advFiltrados = advogados.filter(a =>
    !buscaAdv || a.nome.toLowerCase().includes(buscaAdv.toLowerCase()) || (a.oab ?? '').toLowerCase().includes(buscaAdv.toLowerCase()))

  async function toggleAdv(id: string, ativar: boolean) {
    await fetch('/api/advogados/criar', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ativar }),
    })
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1e3a5f' }}>Meu Município</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>{municipioNome} · Advocacia Dativa OAB-RJ</p>
      </div>

      {!temMunicipio && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#92400e' }}>
          Sua conta ainda não está vinculada a um município. Solicite à Comissão/Owner a vinculação.
        </div>
      )}

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <Card icon={<Users size={20} color="#1e3a5f" />} valor={advogados.length} label="Advogados" sub={`${ativos} ativos`} borda="#dbeafe" />
        <Card icon={<FileText size={20} color="#f59e0b" />} valor={casosAbertos} label="Casos Abertos" sub={`${aguardando} sem advogado`} borda="#fef3c7" />
        <Card icon={<AlertCircle size={20} color="#ef4444" />} valor={aguardando} label="Na Fila" sub="Aguardando advogado" borda="#fee2e2" cor="#ef4444" />
        <Card icon={<CheckCircle size={20} color="#10b981" />} valor={concluidos} label="Concluídos" sub="Total" borda="#d1fae5" cor="#10b981" />
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '2px solid #e2e8f0' }}>
        {(['casos', 'advogados'] as const).map(a => (
          <button key={a} onClick={() => setAba(a)} style={{
            padding: '8px 18px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            color: aba === a ? '#1e3a5f' : '#94a3b8', background: 'none',
            borderBottom: aba === a ? '2px solid #c9a227' : '2px solid transparent', marginBottom: '-2px',
          }}>{a === 'casos' ? `⚖️ Casos (${casos.length})` : `👩‍⚖️ Advogados (${advogados.length})`}</button>
        ))}
      </div>

      {/* CASOS */}
      {aba === 'casos' && (
        <div>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input value={buscaCaso} onChange={e => setBuscaCaso(e.target.value)} placeholder="Buscar cliente..."
                style={{ width: '100%', padding: '7px 12px 7px 30px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            {[['todos', 'Todos'], ['aguardando', 'Na fila'], ['em_andamento', 'Em andamento'], ['concluido', 'Concluídos']].map(([v, l]) => (
              <FiltroBtn key={v} label={l} ativo={filtroStatus === v} onClick={() => setFiltroStatus(v)} />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {casosFiltrados.length === 0 && <Vazio texto="Nenhum caso para os filtros atuais." />}
            {casosFiltrados.map(c => (
              <div key={c.id} style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{c.cliente_nome}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{AREA_LABEL(c.area_juridica)} · #{c.id.slice(0, 8)} · {dataBR(c.criado_em)}</div>
                </div>
                {c.concluido ? (
                  <span style={badge('#d1fae5', '#10b981')}>✓ Concluído</span>
                ) : c.advogado_nome ? (
                  <span style={badge('#dbeafe', '#1e3a5f')}>Em andamento · {c.advogado_nome}</span>
                ) : (
                  <span style={badge('#fee2e2', '#dc2626')}>⏳ Sem advogado</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADVOGADOS */}
      {aba === 'advogados' && (
        <div>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input value={buscaAdv} onChange={e => setBuscaAdv(e.target.value)} placeholder="Buscar advogado por nome ou OAB..."
                style={{ width: '100%', padding: '7px 12px 7px 30px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>{advFiltrados.length} advogado(s) · Ordem de fila (FIFO)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {advFiltrados.length === 0 && <Vazio texto="Nenhum advogado cadastrado neste município." />}
            {advFiltrados.map(a => (
              <div key={a.id} style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: a.posicao_fila === 1 ? '#c9a227' : '#f1f5f9', color: a.posicao_fila === 1 ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '15px', flexShrink: 0 }}>{a.posicao_fila}</div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{a.nome}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{a.oab ?? 'OAB —'} · {(a.areas ?? []).map(AREA_LABEL).join(', ') || 'Geral'}</div>
                </div>
                {a.total_recusas > 0 && <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444' }}>⚠️ {a.total_recusas} recusa(s)</span>}
                <span style={badge(a.status === 'ativo' ? '#d1fae5' : '#f1f5f9', a.status === 'ativo' ? '#10b981' : '#94a3b8')}>{a.status === 'ativo' ? 'Ativo' : 'Suspenso'}</span>
                <button onClick={() => toggleAdv(a.id, a.status !== 'ativo')} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: a.status === 'ativo' ? '#ef4444' : '#10b981', cursor: 'pointer' }}>
                  {a.status === 'ativo' ? 'Suspender' : 'Reativar'}
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => setModal(true)} disabled={!temMunicipio} style={{ marginTop: '16px', width: '100%', padding: '12px', background: temMunicipio ? '#1e3a5f' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: temMunicipio ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <UserPlus size={18} /> Cadastrar Novo Advogado
          </button>
        </div>
      )}

      {modal && <ModalAdvogado onClose={() => setModal(false)} onSaved={() => { setModal(false); router.refresh() }} />}
    </div>
  )
}

// ── modal cadastrar advogado ──
function ModalAdvogado({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [oab, setOab] = useState('')
  const [areas, setAreas] = useState<string[]>(['outros'])
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState('')

  const AREAS = [['violencia_domestica', 'Violência Doméstica'], ['familia_alimentos', 'Família / Alimentos'], ['outros', 'Outros']]
  const toggleArea = (v: string) => setAreas(a => a.includes(v) ? a.filter(x => x !== v) : [...a, v])

  async function salvar() {
    setBusy(true); setErro('')
    try {
      const res = await fetch('/api/advogados/criar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, oab_numero: oab, areas }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setErro(json.error ?? 'Falha ao cadastrar'); return }
      onSaved()
    } catch { setErro('Erro de conexão') } finally { setBusy(false) }
  }

  const valido = nome.trim().length >= 3 && /^\S+@\S+\.\S+$/.test(email) && areas.length > 0

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,51,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 8px 40px rgba(30,58,95,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1e3a5f' }}>Cadastrar Advogado</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', lineHeight: 0 }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>Senha inicial padrão <strong>Dativa@2026</strong> (troca obrigatória no 1º acesso). Entra no fim da fila FIFO.</p>
        {(['Nome completo', 'Email', 'Número OAB (opcional)'] as const).map((label, i) => (
          <div key={label} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>{label}</label>
            <input
              value={i === 0 ? nome : i === 1 ? email : oab}
              onChange={e => (i === 0 ? setNome : i === 1 ? setEmail : setOab)(e.target.value)}
              type={i === 1 ? 'email' : 'text'}
              placeholder={i === 1 ? 'advogado@email.com' : i === 2 ? 'RJ 123.456' : ''}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ))}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Áreas de atuação</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {AREAS.map(([v, l]) => (
              <button key={v} onClick={() => toggleArea(v)} style={{ padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: areas.includes(v) ? '#1e3a5f' : '#f1f5f9', color: areas.includes(v) ? '#fff' : '#64748b' }}>{l}</button>
            ))}
          </div>
        </div>
        {erro && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '12px' }}>{erro}</div>}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={salvar} disabled={!valido || busy} style={{ flex: 1, padding: '12px', background: valido && !busy ? '#1e3a5f' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: valido && !busy ? 'pointer' : 'not-allowed' }}>{busy ? 'Salvando...' : 'Cadastrar'}</button>
        </div>
      </div>
    </div>
  )
}

// ── helpers ──
const badge = (bg: string, cor: string): React.CSSProperties => ({ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: bg, color: cor })

function Card({ icon, valor, label, sub, borda, cor }: { icon: React.ReactNode; valor: number; label: string; sub: string; borda: string; cor?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', border: `2px solid ${borda}` }}>
      <div style={{ marginBottom: '6px' }}>{icon}</div>
      <div style={{ fontSize: '26px', fontWeight: 900, color: cor ?? '#1e3a5f' }}>{valor}</div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>{label}</div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>
    </div>
  )
}

function FiltroBtn({ label, ativo, onClick }: { label: string; ativo: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', background: ativo ? '#1e3a5f' : '#f1f5f9', color: ativo ? '#fff' : '#64748b' }}>{label}</button>
  )
}

function Vazio({ texto }: { texto: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: '14px', padding: '36px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
      <Inbox size={34} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
      <div style={{ fontSize: '13px', color: '#94a3b8' }}>{texto}</div>
    </div>
  )
}
