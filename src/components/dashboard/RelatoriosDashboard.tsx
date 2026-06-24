'use client'

import { useState, useMemo } from 'react'
import {
  BarChart2, ShieldCheck, Download, Filter,
  CheckCircle2, Clock, XCircle, AlertTriangle,
  FileText, TrendingUp
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface Caso {
  id: string
  status: string
  area_juridica: string
  municipio_id: string
  criado_em: string
  atualizado_em: string
}

interface AuditEntry {
  id: string
  usuario_id?: string
  usuario_nome?: string
  acao: string
  detalhe?: string
  municipio_id?: string
  municipio_nome?: string
  criado_em: string
}

interface Municipio {
  id: string
  nome: string
  regiao: string
}

interface Props {
  casos: Caso[]
  auditLog: AuditEntry[]
  municipios: Municipio[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const PERIODO_OPCOES = [
  { label: 'Últimos 30 dias', dias: 30 },
  { label: 'Últimos 90 dias', dias: 90 },
  { label: 'Últimos 6 meses', dias: 180 },
  { label: 'Este ano', dias: 365 },
]

const AREAS = ['Todas as áreas', 'Violência doméstica', 'Família/Alimentos', 'Imobiliário', 'Previdenciário', 'Outros']

const REGIOES = ['Todas as regiões', 'Baixada Fluminense', 'Centro-Sul', 'Costa Verde', 'Lagos', 'Metropolitana', 'Noroeste', 'Norte Fluminense', 'Serrana', 'Sul Fluminense']

const ACOES_AUDIT = ['Todas as ações', 'Login', 'Cadastro', 'Atualização', 'Recusa', 'Conclusão', 'Remoção']

function corStatus(status: string) {
  if (status === 'concluido') return 'bg-emerald-100 text-emerald-700'
  if (status === 'em_andamento') return 'bg-amber-100 text-amber-700'
  if (status === 'recusado') return 'bg-red-100 text-red-600'
  return 'bg-gray-100 text-gray-500'
}

function labelStatus(status: string) {
  if (status === 'concluido') return 'Concluído'
  if (status === 'em_andamento') return 'Em andamento'
  if (status === 'recusado') return 'Recusado'
  if (status === 'aberto') return 'Aberto'
  return status
}

function corAcao(acao: string) {
  if (acao === 'Conclusão') return 'bg-emerald-100 text-emerald-700'
  if (acao === 'Recusa' || acao === 'Remoção') return 'bg-red-100 text-red-600'
  if (acao === 'Atualização') return 'bg-blue-100 text-blue-700'
  if (acao === 'Cadastro') return 'bg-purple-100 text-purple-700'
  return 'bg-gray-100 text-gray-500'
}

function formatData(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
      ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

function filtrarPorPeriodo<T extends { criado_em: string }>(items: T[], dias: number): T[] {
  const limite = new Date()
  limite.setDate(limite.getDate() - dias)
  return items.filter(i => new Date(i.criado_em) >= limite)
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function RelatoriosDashboard({ casos, auditLog, municipios }: Props) {
  const [aba, setAba] = useState<'relatorios' | 'auditoria'>('relatorios')

  // Filtros relatórios
  const [periodo, setPeriodo] = useState(30)
  const [filtroArea, setFiltroArea] = useState('Todas as áreas')
  const [filtroRegiao, setFiltroRegiao] = useState('Todas as regiões')

  // Filtros auditoria
  const [filtroAcao, setFiltroAcao] = useState('Todas as ações')
  const [periodoAudit, setPeriodoAudit] = useState(30)

  // Mapa município id → regiao
  const municipioMap = useMemo(() => {
    const m: Record<string, Municipio> = {}
    municipios.forEach(mu => { m[mu.id] = mu })
    return m
  }, [municipios])

  // ---------------------------------------------------------------------------
  // Casos filtrados
  // ---------------------------------------------------------------------------
  const casosFiltrados = useMemo(() => {
    let lista = filtrarPorPeriodo(casos, periodo)
    if (filtroArea !== 'Todas as áreas') {
      lista = lista.filter(c => c.area_juridica === filtroArea)
    }
    if (filtroRegiao !== 'Todas as regiões') {
      lista = lista.filter(c => municipioMap[c.municipio_id]?.regiao === filtroRegiao)
    }
    return lista
  }, [casos, periodo, filtroArea, filtroRegiao, municipioMap])

  const totais = useMemo(() => {
    const total = casosFiltrados.length
    const concluidos = casosFiltrados.filter(c => c.status === 'concluido').length
    const andamento = casosFiltrados.filter(c => c.status === 'em_andamento' || c.status === 'aberto').length
    const recusados = casosFiltrados.filter(c => c.status === 'recusado').length
    const resolucao = total > 0 ? Math.round((concluidos / total) * 100) : 0
    return { total, concluidos, andamento, recusados, resolucao }
  }, [casosFiltrados])

  // Casos por área
  const porArea = useMemo(() => {
    const mapa: Record<string, number> = {}
    casosFiltrados.forEach(c => {
      const area = c.area_juridica || 'Outros'
      mapa[area] = (mapa[area] || 0) + 1
    })
    return Object.entries(mapa).sort((a, b) => b[1] - a[1])
  }, [casosFiltrados])

  const maxArea = porArea.length > 0 ? porArea[0][1] : 1

  // Casos por status para donut
  const donutData = [
    { label: 'Concluídos', valor: totais.concluidos, cor: '#10b981' },
    { label: 'Em andamento', valor: totais.andamento, cor: '#f59e0b' },
    { label: 'Recusados', valor: totais.recusados, cor: '#ef4444' },
  ]
  const donutTotal = donutData.reduce((s, d) => s + d.valor, 0) || 1
  let offset = 0
  const circum = 2 * Math.PI * 34

  // ---------------------------------------------------------------------------
  // Auditoria filtrada
  // ---------------------------------------------------------------------------
  const auditFiltrado = useMemo(() => {
    let lista = filtrarPorPeriodo(auditLog, periodoAudit)
    if (filtroAcao !== 'Todas as ações') {
      lista = lista.filter(e => e.acao === filtroAcao)
    }
    return lista
  }, [auditLog, periodoAudit, filtroAcao])

  // ---------------------------------------------------------------------------
  // Exportar CSV simples
  // ---------------------------------------------------------------------------
  function exportarCSV() {
    if (aba === 'relatorios') {
      const header = 'id,status,area_juridica,municipio,data\n'
      const rows = casosFiltrados.map(c =>
        `${c.id},${c.status},${c.area_juridica},${municipioMap[c.municipio_id]?.nome ?? ''},${c.criado_em}`
      ).join('\n')
      download('relatorios.csv', header + rows)
    } else {
      const header = 'data,usuario,acao,detalhe,municipio\n'
      const rows = auditFiltrado.map(e =>
        `${e.criado_em},${e.usuario_nome ?? ''},${e.acao},${e.detalhe ?? ''},${e.municipio_nome ?? ''}`
      ).join('\n')
      download('auditoria.csv', header + rows)
    }
  }

  function download(nome: string, conteudo: string) {
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nome
    a.click()
    URL.revokeObjectURL(url)
  }

  // ---------------------------------------------------------------------------
  // Estado vazio (banco ainda sem dados)
  // ---------------------------------------------------------------------------
  const semDados = casos.length === 0

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">Relatórios &amp; Auditoria</h1>
            <p className="text-sm text-gray-500 mt-1">Visão consolidada do programa — todos os municípios</p>
          </div>
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setAba('relatorios')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              aba === 'relatorios'
                ? 'border-[#1e3a5f] text-[#1e3a5f]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Relatórios
          </button>
          <button
            onClick={() => setAba('auditoria')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              aba === 'auditoria'
                ? 'border-[#1e3a5f] text-[#1e3a5f]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Auditoria
          </button>
        </div>

        {/* ── ABA RELATÓRIOS ── */}
        {aba === 'relatorios' && (
          <div className="space-y-5">

            {/* Cards resumo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <CardResumo
                icone={<FileText className="w-5 h-5 text-[#1e3a5f]" />}
                label="Total de casos"
                valor={totais.total}
                sub="no período"
                borda="border-[#1e3a5f]"
              />
              <CardResumo
                icone={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                label="Concluídos"
                valor={totais.concluidos}
                sub={`${totais.resolucao}% de resolução`}
                borda="border-emerald-500"
              />
              <CardResumo
                icone={<Clock className="w-5 h-5 text-amber-500" />}
                label="Em andamento"
                valor={totais.andamento}
                sub="aguardando"
                borda="border-amber-400"
              />
              <CardResumo
                icone={<XCircle className="w-5 h-5 text-red-500" />}
                label="Recusados"
                valor={totais.recusados}
                sub={totais.total > 0 ? `${Math.round((totais.recusados / totais.total) * 100)}% do total` : '—'}
                borda="border-red-400"
              />
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Período</label>
                <select
                  value={periodo}
                  onChange={e => setPeriodo(Number(e.target.value))}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white"
                >
                  {PERIODO_OPCOES.map(op => (
                    <option key={op.dias} value={op.dias}>{op.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Região</label>
                <select
                  value={filtroRegiao}
                  onChange={e => setFiltroRegiao(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white"
                >
                  {REGIOES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Área</label>
                <select
                  value={filtroArea}
                  onChange={e => setFiltroArea(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white"
                >
                  {AREAS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {semDados ? (
              <EstadoVazio
                icone={<TrendingUp className="w-10 h-10 text-gray-300" />}
                titulo="Sem dados ainda"
                descricao="Os gráficos aparecerão aqui assim que os primeiros casos forem registrados no sistema."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Barras por área */}
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">Casos por área jurídica</h2>
                  {porArea.length === 0 ? (
                    <p className="text-sm text-gray-400">Sem dados no período.</p>
                  ) : (
                    <div className="space-y-3">
                      {porArea.map(([area, qtd]) => (
                        <div key={area} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-28 text-right shrink-0 truncate">{area}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-[#2d5986] transition-all duration-500"
                              style={{ width: `${Math.round((qtd / maxArea) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-6 text-right">{qtd}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Donut status */}
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">Status dos casos</h2>
                  <div className="flex items-center gap-6">
                    <svg width="90" height="90" viewBox="0 0 90 90">
                      {donutData.map(d => {
                        const pct = d.valor / donutTotal
                        const dash = pct * circum
                        const gap = circum - dash
                        const el = (
                          <circle
                            key={d.label}
                            cx="45" cy="45" r="34"
                            fill="none"
                            stroke={d.cor}
                            strokeWidth="14"
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={-offset}
                            transform="rotate(-90 45 45)"
                          />
                        )
                        offset += dash
                        return el
                      })}
                      {donutTotal === 0 && (
                        <circle cx="45" cy="45" r="34" fill="none" stroke="#e5e7eb" strokeWidth="14" />
                      )}
                      <text x="45" y="49" textAnchor="middle" fontSize="13" fontWeight="500" fill="#1e3a5f">
                        {totais.total}
                      </text>
                    </svg>
                    <div className="space-y-2">
                      {donutData.map(d => (
                        <div key={d.label} className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.cor }} />
                          {d.label} ({d.valor})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ABA AUDITORIA ── */}
        {aba === 'auditoria' && (
          <div className="space-y-5">

            {/* Filtros auditoria */}
            <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Período</label>
                <select
                  value={periodoAudit}
                  onChange={e => setPeriodoAudit(Number(e.target.value))}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white"
                >
                  {PERIODO_OPCOES.map(op => (
                    <option key={op.dias} value={op.dias}>{op.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Ação</label>
                <select
                  value={filtroAcao}
                  onChange={e => setFiltroAcao(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white"
                >
                  {ACOES_AUDIT.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <span className="ml-auto text-xs text-gray-400">{auditFiltrado.length} registros</span>
            </div>

            {auditFiltrado.length === 0 ? (
              <EstadoVazio
                icone={<ShieldCheck className="w-10 h-10 text-gray-300" />}
                titulo="Sem registros de auditoria"
                descricao="As ações do sistema aparecerão aqui assim que os usuários começarem a operar."
              />
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Data/hora</th>
                        <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Usuário</th>
                        <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Ação</th>
                        <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Detalhe</th>
                        <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Município</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {auditFiltrado.map(entry => (
                        <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatData(entry.criado_em)}</td>
                          <td className="px-4 py-3 text-gray-700 font-medium text-xs">{entry.usuario_nome ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${corAcao(entry.acao)}`}>
                              {entry.acao}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs max-w-xs truncate">{entry.detalhe ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{entry.municipio_nome ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------
function CardResumo({
  icone, label, valor, sub, borda,
}: {
  icone: React.ReactNode
  label: string
  valor: number
  sub: string
  borda: string
}) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${borda}`}>
      <div className="flex items-center gap-2 mb-2">
        {icone}
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-3xl font-bold text-[#1e3a5f]">{valor}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

function EstadoVazio({
  icone, titulo, descricao,
}: {
  icone: React.ReactNode
  titulo: string
  descricao: string
}) {
  return (
    <div className="bg-white rounded-xl p-12 shadow-sm text-center">
      <div className="flex justify-center mb-3">{icone}</div>
      <p className="text-sm font-medium text-gray-600 mb-1">{titulo}</p>
      <p className="text-xs text-gray-400 max-w-sm mx-auto">{descricao}</p>
    </div>
  )
}
