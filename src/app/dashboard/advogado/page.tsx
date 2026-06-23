// src/app/dashboard/advogado/page.tsx
// Tijolo 5 — Painel do Advogado
// Dados estáticos por enquanto; ligação ao Supabase vem depois
'use client'
import { useState } from 'react'
import {
  Scale, Clock, CheckCircle, XCircle, AlertTriangle,
  FileText, ScrollText, ChevronDown, ChevronUp,
  Shield, Home, MessageSquare
} from 'lucide-react'

// ── Tipos ────────────────────────────────────────────────
type StatusCaso = 'aguardando_aceite' | 'em_andamento' | 'concluido' | 'recusado'
type AreaCaso = 'violencia' | 'alimentos' | 'outros'

type Caso = {
  id: number
  cliente: string
  area: AreaCaso
  descricao: string
  dataDesignacao: string
  prazoAceite: string
  status: StatusCaso
  numeroProceso: string | null
  motivoRecusa: string | null
}

// ── Dados estáticos de exemplo ────────────────────────────
const casoAtual: Caso = {
  id: 201,
  cliente: 'Maria da Silva',
  area: 'violencia',
  descricao: 'Caso de violência doméstica — medida protetiva urgente. Cliente necessita de representação imediata para audiência agendada.',
  dataDesignacao: '23/06/2026',
  prazoAceite: '25/06/2026',
  status: 'aguardando_aceite',
  numeroProceso: null,
  motivoRecusa: null,
}

const historico: Caso[] = [
  { id: 198, cliente: 'Ana Paula Costa',    area: 'alimentos', descricao: 'Ação de alimentos.',           dataDesignacao: '10/06/2026', prazoAceite: '12/06/2026', status: 'concluido',  numeroProceso: '0012345-23.2026.8.19.0001', motivoRecusa: null },
  { id: 195, cliente: 'Roberto Figueiredo', area: 'outros',    descricao: 'Questão imobiliária.',         dataDesignacao: '01/06/2026', prazoAceite: '03/06/2026', status: 'concluido',  numeroProceso: '0098765-11.2026.8.19.0042', motivoRecusa: null },
  { id: 191, cliente: 'Lucia Mendes',       area: 'alimentos', descricao: 'Revisão de pensão alimentícia.',dataDesignacao: '20/05/2026', prazoAceite: '22/05/2026', status: 'recusado',  numeroProceso: null, motivoRecusa: 'Conflito de agenda com audiência já marcada em outro processo.' },
  { id: 188, cliente: 'Paulo Andrade',      area: 'violencia', descricao: 'Violência doméstica.',         dataDesignacao: '10/05/2026', prazoAceite: '12/05/2026', status: 'concluido',  numeroProceso: '0054321-07.2026.8.19.0015', motivoRecusa: null },
]

// ── Config visual ─────────────────────────────────────────
const areaConfig = {
  violencia: { label: 'Violência Doméstica', icon: Shield, cor: '#ef4444', bg: '#fee2e2' },
  alimentos: { label: 'Alimentos / Família', icon: Scale,  cor: '#f59e0b', bg: '#fef3c7' },
  outros:    { label: 'Outros',              icon: Home,   cor: '#6366f1', bg: '#ede9fe' },
}

const statusConfig = {
  aguardando_aceite: { label: 'Aguardando aceite', cor: '#f59e0b', bg: '#fef3c7' },
  em_andamento:      { label: 'Em andamento',       cor: '#1e3a5f', bg: '#dbeafe' },
  concluido:         { label: 'Concluído',           cor: '#10b981', bg: '#d1fae5' },
  recusado:          { label: 'Recusado',            cor: '#94a3b8', bg: '#f1f5f9' },
}

// ── Componente principal ──────────────────────────────────
export default function AdvogadoPage() {
  const [aba, setAba] = useState<'painel' | 'historico'>('painel')
  const [showRecusa, setShowRecusa] = useState(false)
  const [motivoRecusa, setMotivoRecusa] = useState('')
  const [numeroProcesso, setNumeroProcesso] = useState('')
  const [showConcluir, setShowConcluir] = useState(false)
  const [expandido, setExpandido] = useState<number | null>(null)

  // Stats
  const totalConcluidos = historico.filter(c => c.status === 'concluido').length
  const totalRecusas = historico.filter(c => c.status === 'recusado').length
  const maxRecusas = 3
  const posicaoFila = 3 // simulado

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>

      {/* ── Cabeçalho ── */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1e3a5f' }}>
          Meu Painel
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
          Advocacia Dativa OAB-RJ — Programa de atendimento gratuito
        </p>
      </div>

      {/* ── Cards de resumo ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>

        {/* Posição na fila */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', border: '2px solid #dbeafe' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>POSIÇÃO NA FILA</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#1e3a5f' }}>#{posicaoFila}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>ordem de atribuição</div>
        </div>

        {/* Casos concluídos */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', border: '2px solid #d1fae5' }}>
          <CheckCircle size={20} color="#10b981" style={{ marginBottom: '4px' }} />
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981' }}>{totalConcluidos}</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>Concluídos</div>
        </div>

        {/* Recusas */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', border: `2px solid ${totalRecusas >= 2 ? '#fee2e2' : '#f1f5f9'}` }}>
          <XCircle size={20} color={totalRecusas >= 2 ? '#ef4444' : '#94a3b8'} style={{ marginBottom: '4px' }} />
          <div style={{ fontSize: '28px', fontWeight: 900, color: totalRecusas >= 2 ? '#ef4444' : '#374151' }}>
            {totalRecusas}<span style={{ fontSize: '16px', color: '#94a3b8' }}>/{maxRecusas}</span>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>Recusas</div>
          {totalRecusas >= 2 && (
            <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 700, marginTop: '2px' }}>⚠️ Atenção!</div>
          )}
        </div>

      </div>

      {/* ── Alerta de recusas ── */}
      {totalRecusas >= 2 && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px',
          padding: '12px 16px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: '#dc2626' }}>
            <strong>Atenção:</strong> Você está com {totalRecusas} recusas. O limite é {maxRecusas}.
            Uma nova recusa resultará na remoção do programa.
          </div>
        </div>
      )}

      {/* ── Abas ── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '2px solid #e2e8f0' }}>
        {(['painel', 'historico'] as const).map(a => (
          <button key={a} onClick={() => setAba(a)} style={{
            padding: '8px 18px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            color: aba === a ? '#1e3a5f' : '#94a3b8',
            background: 'none',
            borderBottom: aba === a ? '2px solid #c9a227' : '2px solid transparent',
            marginBottom: '-2px', transition: 'all 0.15s'
          }}>
            {a === 'painel' ? '⚖️ Caso Atual' : `📋 Histórico (${historico.length})`}
          </button>
        ))}
      </div>

      {/* ── ABA CASO ATUAL ── */}
      {aba === 'painel' && (
        <div>
          {casoAtual ? (
            <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', borderLeft: `4px solid ${areaConfig[casoAtual.area].cor}` }}>

              {/* Cabeçalho do caso */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>CASO #{casoAtual.id}</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e3a5f' }}>{casoAtual.cliente}</div>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px',
                  background: statusConfig[casoAtual.status].bg,
                  color: statusConfig[casoAtual.status].cor
                }}>
                  {statusConfig[casoAtual.status].label}
                </span>
              </div>

              {/* Área */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: areaConfig[casoAtual.area].bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(() => { const I = areaConfig[casoAtual.area].icon; return <I size={16} color={areaConfig[casoAtual.area].cor} /> })()}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: areaConfig[casoAtual.area].cor }}>
                  {areaConfig[casoAtual.area].label}
                </span>
              </div>

              {/* Descrição */}
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>DESCRIÇÃO DO CASO</div>
                <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>{casoAtual.descricao}</div>
              </div>

              {/* Datas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>DESIGNADO EM</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>{casoAtual.dataDesignacao}</div>
                </div>
                <div style={{ background: '#fef3c7', borderRadius: '10px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 600 }}>⏰ PRAZO PARA ACEITAR</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#92400e', marginTop: '2px' }}>{casoAtual.prazoAceite}</div>
                </div>
              </div>

              {/* Ações — Aceitar / Recusar */}
              {casoAtual.status === 'aguardando_aceite' && !showRecusa && !showConcluir && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowConcluir(false)}
                    style={{
                      flex: 1, padding: '12px', background: '#1e3a5f', color: '#fff',
                      border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <CheckCircle size={18} /> Aceitar Caso
                  </button>
                  <button
                    onClick={() => setShowRecusa(true)}
                    style={{
                      flex: 1, padding: '12px', background: '#fff', color: '#ef4444',
                      border: '2px solid #ef4444', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <XCircle size={18} /> Recusar
                  </button>
                </div>
              )}

              {/* Formulário de recusa */}
              {showRecusa && (
                <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', marginBottom: '10px' }}>
                    ⚠️ Motivo da recusa (obrigatório)
                  </div>
                  <textarea
                    value={motivoRecusa}
                    onChange={e => setMotivoRecusa(e.target.value)}
                    placeholder="Descreva o motivo da recusa. Este registro é obrigatório e ficará no histórico do programa."
                    rows={3}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '1.5px solid #fca5a5', fontSize: '13px', fontFamily: 'inherit',
                      outline: 'none', resize: 'vertical', boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      disabled={motivoRecusa.trim().length < 10}
                      style={{
                        flex: 1, padding: '10px', background: motivoRecusa.trim().length >= 10 ? '#ef4444' : '#fca5a5',
                        color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700,
                        fontSize: '13px', cursor: motivoRecusa.trim().length >= 10 ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Confirmar Recusa
                    </button>
                    <button
                      onClick={() => { setShowRecusa(false); setMotivoRecusa('') }}
                      style={{ padding: '10px 16px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Botão concluir caso — bloqueado sem número do processo */}
              {casoAtual.status === 'em_andamento' && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                    🔒 NÚMERO DO PROCESSO JUDICIAL (obrigatório para concluir)
                  </div>
                  <input
                    value={numeroProcesso}
                    onChange={e => setNumeroProcesso(e.target.value)}
                    placeholder="Ex: 0012345-23.2026.8.19.0001"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '1.5px solid #e2e8f0', fontSize: '13px', fontFamily: 'inherit',
                      outline: 'none', marginBottom: '10px', boxSizing: 'border-box'
                    }}
                  />
                  <button
                    disabled={numeroProcesso.trim().length < 5}
                    style={{
                      width: '100%', padding: '12px',
                      background: numeroProcesso.trim().length >= 5 ? '#10b981' : '#d1fae5',
                      color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700,
                      fontSize: '14px', cursor: numeroProcesso.trim().length >= 5 ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <CheckCircle size={18} /> Marcar como Concluído
                  </button>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '6px' }}>
                    O cliente receberá uma notificação para confirmar a conclusão
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '14px', padding: '48px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚖️</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e3a5f' }}>Nenhum caso no momento</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
                Você está na posição #{posicaoFila} da fila. Aguarde a próxima designação.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ABA HISTÓRICO ── */}
      {aba === 'historico' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {historico.map(caso => {
            const area = areaConfig[caso.area]
            const status = statusConfig[caso.status]
            const aberto = expandido === caso.id
            return (
              <div key={caso.id} style={{
                background: '#fff', borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,.06)',
                borderLeft: `4px solid ${area.cor}`,
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => setExpandido(aberto ? null : caso.id)}
                  style={{
                    width: '100%', padding: '14px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{caso.cliente}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      {area.label} · #{caso.id} · {caso.dataDesignacao}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: status.bg, color: status.cor, flexShrink: 0 }}>
                    {status.label}
                  </span>
                  {aberto ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                </button>

                {aberto && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ paddingTop: '12px', fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>
                      {caso.descricao}
                    </div>
                    {caso.numeroProceso && (
                      <div style={{ marginTop: '10px', background: '#f0fdf4', borderRadius: '8px', padding: '8px 12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534' }}>📄 Nº do Processo: </span>
                        <span style={{ fontSize: '12px', color: '#166534', fontFamily: 'monospace' }}>{caso.numeroProceso}</span>
                      </div>
                    )}
                    {caso.motivoRecusa && (
                      <div style={{ marginTop: '10px', background: '#fff5f5', borderRadius: '8px', padding: '8px 12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626' }}>Motivo da recusa: </span>
                        <span style={{ fontSize: '12px', color: '#dc2626' }}>{caso.motivoRecusa}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
