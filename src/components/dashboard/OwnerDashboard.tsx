'use client'

import { useState, useMemo } from 'react'
import {
  MapPin, Users, Briefcase, AlertTriangle, CheckCircle2,
  Search, ChevronRight, X, Building2, Clock, Shield,
  TrendingDown, Filter, RefreshCw, UserCheck, Globe
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface Municipio {
  id: string
  nome: string
  regiao: string
  logo_url: string | null
  gestor_id: string | null
  prazo_resposta_dias: number
  max_recusas: number
  status_parceria: string
  criado_em: string
  atualizado_em: string
}

interface Gestor {
  id: string
  nome: string
  email: string
}

interface Props {
  municipios: Municipio[]
  gestores: Gestor[]
}

// ---------------------------------------------------------------------------
// Dados estáticos complementares (população e região detalhada do RJ)
// Fonte: IBGE 2022 — usados apenas para exibição visual
// ---------------------------------------------------------------------------
const DADOS_ESTATICOS: Record<string, { populacao: number }> = {
  'Angra dos Reis': { populacao: 213027 },
  'Aperibé': { populacao: 11025 },
  'Araruama': { populacao: 135640 },
  'Areal': { populacao: 12024 },
  'Armação dos Búzios': { populacao: 34509 },
  'Arraial do Cabo': { populacao: 32017 },
  'Barra do Piraí': { populacao: 100488 },
  'Barra Mansa': { populacao: 182017 },
  'Belford Roxo': { populacao: 523406 },
  'Bom Jardim': { populacao: 24987 },
  'Bom Jesus do Itabapoana': { populacao: 35124 },
  'Cabo Frio': { populacao: 230528 },
  'Cachoeiras de Macacu': { populacao: 59128 },
  'Cambuci': { populacao: 14891 },
  'Campos dos Goytacazes': { populacao: 511110 },
  'Cantagalo': { populacao: 20112 },
  'Cardoso Moreira': { populacao: 12440 },
  'Carmo': { populacao: 17645 },
  'Casimiro de Abreu': { populacao: 47011 },
  'Comendador Levy Gasparian': { populacao: 8432 },
  'Conceição de Macabu': { populacao: 22013 },
  'Cordeiro': { populacao: 22217 },
  'Duas Barras': { populacao: 11240 },
  'Duque de Caxias': { populacao: 924624 },
  'Engenheiro Paulo de Frontin': { populacao: 14012 },
  'Guapimirim': { populacao: 70219 },
  'Iguaba Grande': { populacao: 25403 },
  'Itaboraí': { populacao: 246141 },
  'Itaguaí': { populacao: 130456 },
  'Italva': { populacao: 14302 },
  'Itaocara': { populacao: 23218 },
  'Itaperuna': { populacao: 106019 },
  'Itatiaia': { populacao: 36308 },
  'Japeri': { populacao: 105776 },
  'Laje do Muriaé': { populacao: 7941 },
  'Macaé': { populacao: 262577 },
  'Macuco': { populacao: 5474 },
  'Magé': { populacao: 240547 },
  'Mangaratiba': { populacao: 47300 },
  'Maricá': { populacao: 178277 },
  'Mendes': { populacao: 17981 },
  'Mesquita': { populacao: 174025 },
  'Miguel Pereira': { populacao: 25009 },
  'Miracema': { populacao: 27011 },
  'Natividade': { populacao: 15214 },
  'Nilópolis': { populacao: 157483 },
  'Niterói': { populacao: 515317 },
  'Nova Friburgo': { populacao: 185752 },
  'Nova Iguaçu': { populacao: 820245 },
  'Paracambi': { populacao: 51447 },
  'Paraíba do Sul': { populacao: 42014 },
  'Paraty': { populacao: 43027 },
  'Paty do Alferes': { populacao: 28219 },
  'Petrópolis': { populacao: 295917 },
  'Pinheiral': { populacao: 24118 },
  'Piraí': { populacao: 30107 },
  'Porciúncula': { populacao: 17511 },
  'Porto Real': { populacao: 21447 },
  'Quatis': { populacao: 13519 },
  'Queimados': { populacao: 145107 },
  'Quissamã': { populacao: 23016 },
  'Resende': { populacao: 131408 },
  'Rio Bonito': { populacao: 57014 },
  'Rio Claro': { populacao: 17841 },
  'Rio das Flores': { populacao: 9016 },
  'Rio das Ostras': { populacao: 147077 },
  'Rio de Janeiro': { populacao: 6748000 },
  'Santa Maria Madalena': { populacao: 10119 },
  'Santo Antônio de Pádua': { populacao: 40514 },
  'São Fidélis': { populacao: 36811 },
  'São Francisco de Itabapoana': { populacao: 41014 },
  'São Gonçalo': { populacao: 1084839 },
  'São João da Barra': { populacao: 37219 },
  'São João de Meriti': { populacao: 471038 },
  'São José de Ubá': { populacao: 7514 },
  'São José do Vale do Rio Preto': { populacao: 21812 },
  'São Pedro da Aldeia': { populacao: 104219 },
  'São Sebastião do Alto': { populacao: 9011 },
  'Sapucaia': { populacao: 17219 },
  'Saquarema': { populacao: 101718 },
  'Seropédica': { populacao: 89007 },
  'Silva Jardim': { populacao: 22019 },
  'Sumidouro': { populacao: 15319 },
  'Tanguá': { populacao: 33519 },
  'Teresópolis': { populacao: 178210 },
  'Trajano de Moraes': { populacao: 10819 },
  'Três Rios': { populacao: 77912 },
  'Valença': { populacao: 74512 },
  'Varre-Sai': { populacao: 9912 },
  'Vassouras': { populacao: 35714 },
  'Volta Redonda': { populacao: 272029 },
}

function formatPopulacao(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`
  return n.toString()
}

const STATUS_CONFIG = {
  ativa: { label: 'Parceria Ativa', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  negociando: { label: 'Em Negociação', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  pendente: { label: 'Não Iniciada', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
}

const REGIOES = [
  'Todas as regiões',
  'Baixada Fluminense',
  'Centro-Sul',
  'Costa Verde',
  'Lagos',
  'Metropolitana',
  'Noroeste',
  'Norte Fluminense',
  'Serrana',
  'Sul Fluminense',
]

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function OwnerDashboard({ municipios, gestores }: Props) {
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroRegiao, setFiltroRegiao] = useState('Todas as regiões')
  const [municipioSelecionado, setMunicipioSelecionado] = useState<Municipio | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [novoStatus, setNovoStatus] = useState('')
  const [novoGestor, setNovoGestor] = useState('')
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  // ---------------------------------------------------------------------------
  // Contadores para os cards
  // ---------------------------------------------------------------------------
  const totais = useMemo(() => {
    const ativas = municipios.filter(m => m.status_parceria === 'ativa').length
    const negociando = municipios.filter(m => m.status_parceria === 'negociando').length
    const pendentes = municipios.filter(m => m.status_parceria === 'pendente').length
    const semGestor = municipios.filter(m => !m.gestor_id).length
    return { ativas, negociando, pendentes, semGestor }
  }, [municipios])

  const cobertura = Math.round((totais.ativas / 92) * 100)

  // ---------------------------------------------------------------------------
  // Lista filtrada
  // ---------------------------------------------------------------------------
  const municipiosFiltrados = useMemo(() => {
    return municipios.filter(m => {
      const matchBusca = m.nome.toLowerCase().includes(busca.toLowerCase())
      const matchStatus = filtroStatus === 'todos' || m.status_parceria === filtroStatus
      const matchRegiao = filtroRegiao === 'Todas as regiões' || m.regiao === filtroRegiao
      return matchBusca && matchStatus && matchRegiao
    })
  }, [municipios, busca, filtroStatus, filtroRegiao])

  // Ranking: municípios sem gestor ordenados por população (maior primeiro = mais urgente)
  const rankingSemGestor = useMemo(() => {
    return municipios
      .filter(m => !m.gestor_id)
      .sort((a, b) => {
        const popA = DADOS_ESTATICOS[a.nome]?.populacao ?? 0
        const popB = DADOS_ESTATICOS[b.nome]?.populacao ?? 0
        return popB - popA
      })
      .slice(0, 5)
  }, [municipios])

  // ---------------------------------------------------------------------------
  // Abrir painel lateral
  // ---------------------------------------------------------------------------
  function abrirMunicipio(m: Municipio) {
    setMunicipioSelecionado(m)
    setNovoStatus(m.status_parceria)
    setNovoGestor(m.gestor_id ?? '')
    setMensagem(null)
  }

  // ---------------------------------------------------------------------------
  // Salvar alterações (chama API Route)
  // ---------------------------------------------------------------------------
  async function salvarAlteracoes() {
    if (!municipioSelecionado) return
    setSalvando(true)
    setMensagem(null)
    try {
      const res = await fetch('/api/municipios/atualizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: municipioSelecionado.id,
          status_parceria: novoStatus,
          gestor_id: novoGestor || null,
        }),
      })
      if (!res.ok) throw new Error('Falha ao salvar')
      setMensagem({ tipo: 'ok', texto: 'Alterações salvas com sucesso.' })
      // Atualiza localmente o município selecionado (sem reload)
      setMunicipioSelecionado(prev =>
        prev ? { ...prev, status_parceria: novoStatus, gestor_id: novoGestor || null } : prev
      )
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao salvar. Tente novamente.' })
    } finally {
      setSalvando(false)
    }
  }

  const gestorNome = (id: string | null) =>
    id ? (gestores.find(g => g.id === id)?.nome ?? 'Gestor não encontrado') : null

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Cabeçalho ── */}
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Painel Geral — Estado do Rio de Janeiro</h1>
          <p className="text-sm text-gray-500 mt-1">
            Acompanhe a cobertura da Advocacia Dativa nos 92 municípios
          </p>
        </div>

        {/* ── Cards de resumo ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <CardResumo
            icone={<Globe className="w-5 h-5 text-[#1e3a5f]" />}
            label="Total"
            valor={92}
            sub="municípios RJ"
            cor="bg-white border-l-4 border-[#1e3a5f]"
          />
          <CardResumo
            icone={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            label="Parcerias Ativas"
            valor={totais.ativas}
            sub={`${cobertura}% de cobertura`}
            cor="bg-white border-l-4 border-emerald-500"
          />
          <CardResumo
            icone={<Clock className="w-5 h-5 text-amber-500" />}
            label="Em Negociação"
            valor={totais.negociando}
            sub="aguardando acordo"
            cor="bg-white border-l-4 border-amber-400"
          />
          <CardResumo
            icone={<AlertTriangle className="w-5 h-5 text-red-500" />}
            label="Sem Gestor"
            valor={totais.semGestor}
            sub="requerem atenção"
            cor="bg-white border-l-4 border-red-400"
          />
        </div>

        {/* ── Barra de progresso ── */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#1e3a5f]">Cobertura do Estado</span>
            <span className="text-sm font-bold text-[#1e3a5f]">{cobertura}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-[#2d5986] to-[#1e3a5f] transition-all duration-700"
              style={{ width: `${cobertura}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{totais.ativas} com parceria ativa</span>
            <span>{92 - totais.ativas} municípios restantes</span>
          </div>
        </div>

        {/* ── Corpo: Lista + Ranking ── */}
        <div className="flex gap-6 items-start">

          {/* ── Lista de municípios ── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Filtros */}
            <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar município..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="flex-1 text-sm outline-none bg-transparent"
                />
                {busca && (
                  <button onClick={() => setBusca('')}>
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {/* Status */}
                {[
                  { v: 'todos', label: 'Todos' },
                  { v: 'ativa', label: 'Ativas' },
                  { v: 'negociando', label: 'Negociando' },
                  { v: 'pendente', label: 'Pendentes' },
                ].map(op => (
                  <button
                    key={op.v}
                    onClick={() => setFiltroStatus(op.v)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      filtroStatus === op.v
                        ? 'bg-[#1e3a5f] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
                {/* Região */}
                <div className="flex items-center gap-1 ml-auto">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                  <select
                    value={filtroRegiao}
                    onChange={e => setFiltroRegiao(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none bg-white text-gray-600"
                  >
                    {REGIOES.map(r => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                {municipiosFiltrados.length} de 92 municípios
              </p>
            </div>

            {/* Tabela / lista */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {municipiosFiltrados.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    Nenhum município encontrado com os filtros selecionados.
                  </div>
                ) : (
                  municipiosFiltrados.map(m => {
                    const cfg = STATUS_CONFIG[m.status_parceria as keyof typeof STATUS_CONFIG]
                    const pop = DADOS_ESTATICOS[m.nome]?.populacao
                    const selecionado = municipioSelecionado?.id === m.id
                    return (
                      <button
                        key={m.id}
                        onClick={() => abrirMunicipio(m)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left ${
                          selecionado ? 'bg-blue-50 border-r-2 border-[#1e3a5f]' : ''
                        }`}
                      >
                        {/* Dot status */}
                        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg?.dot ?? 'bg-gray-300'}`} />

                        {/* Nome + região */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{m.nome}</p>
                          <p className="text-xs text-gray-400 truncate">{m.regiao}</p>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 shrink-0">
                          {pop && (
                            <span className="text-xs text-gray-400 hidden sm:block">
                              {formatPopulacao(pop)} hab.
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg?.color ?? ''}`}>
                            {cfg?.label ?? m.status_parceria}
                          </span>
                          {!m.gestor_id && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-medium hidden sm:block">
                              Sem gestor
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* ── Coluna direita: Painel lateral ou Ranking ── */}
          <div className="w-80 shrink-0 hidden lg:block space-y-4">
            {municipioSelecionado ? (
              <PainelMunicipio
                municipio={municipioSelecionado}
                gestores={gestores}
                gestorNome={gestorNome(municipioSelecionado.gestor_id)}
                novoStatus={novoStatus}
                setNovoStatus={setNovoStatus}
                novoGestor={novoGestor}
                setNovoGestor={setNovoGestor}
                salvando={salvando}
                mensagem={mensagem}
                onSalvar={salvarAlteracoes}
                onFechar={() => setMunicipioSelecionado(null)}
              />
            ) : (
              <RankingSemGestor municipios={rankingSemGestor} onSelecionar={abrirMunicipio} />
            )}
          </div>
        </div>

        {/* ── Painel lateral em mobile (bottom sheet simplificado) ── */}
        {municipioSelecionado && (
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
            <PainelMunicipio
              municipio={municipioSelecionado}
              gestores={gestores}
              gestorNome={gestorNome(municipioSelecionado.gestor_id)}
              novoStatus={novoStatus}
              setNovoStatus={setNovoStatus}
              novoGestor={novoGestor}
              setNovoGestor={setNovoGestor}
              salvando={salvando}
              mensagem={mensagem}
              onSalvar={salvarAlteracoes}
              onFechar={() => setMunicipioSelecionado(null)}
            />
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
  icone, label, valor, sub, cor,
}: {
  icone: React.ReactNode
  label: string
  valor: number
  sub: string
  cor: string
}) {
  return (
    <div className={`rounded-xl p-4 shadow-sm ${cor}`}>
      <div className="flex items-center gap-2 mb-2">
        {icone}
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-3xl font-bold text-[#1e3a5f]">{valor}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

function RankingSemGestor({
  municipios,
  onSelecionar,
}: {
  municipios: Municipio[]
  onSelecionar: (m: Municipio) => void
}) {
  if (municipios.length === 0) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-700">Todos os municípios têm gestor!</p>
      </div>
    )
  }
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <TrendingDown className="w-4 h-4 text-red-500" />
        <span className="text-sm font-semibold text-gray-700">Prioritários sem Gestor</span>
      </div>
      <div className="divide-y divide-gray-50">
        {municipios.map((m, i) => {
          const pop = DADOS_ESTATICOS[m.nome]?.populacao
          return (
            <button
              key={m.id}
              onClick={() => onSelecionar(m)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left"
            >
              <span className="text-xs font-bold text-red-400 w-5 shrink-0">{i + 1}º</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{m.nome}</p>
                <p className="text-xs text-gray-400">{pop ? formatPopulacao(pop) + ' hab.' : m.regiao}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
          )
        })}
      </div>
      <div className="px-4 py-2 bg-red-50">
        <p className="text-xs text-red-500">Ordenados por população — mais urgentes primeiro</p>
      </div>
    </div>
  )
}

function PainelMunicipio({
  municipio,
  gestores,
  gestorNome,
  novoStatus,
  setNovoStatus,
  novoGestor,
  setNovoGestor,
  salvando,
  mensagem,
  onSalvar,
  onFechar,
}: {
  municipio: Municipio
  gestores: Gestor[]
  gestorNome: string | null
  novoStatus: string
  setNovoStatus: (v: string) => void
  novoGestor: string
  setNovoGestor: (v: string) => void
  salvando: boolean
  mensagem: { tipo: 'ok' | 'erro'; texto: string } | null
  onSalvar: () => void
  onFechar: () => void
}) {
  const cfg = STATUS_CONFIG[municipio.status_parceria as keyof typeof STATUS_CONFIG]
  const pop = DADOS_ESTATICOS[municipio.nome]?.populacao

  const alterado =
    novoStatus !== municipio.status_parceria ||
    (novoGestor || null) !== municipio.gestor_id

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Cabeçalho */}
      <div className="bg-[#1e3a5f] px-4 py-4 flex items-start justify-between">
        <div>
          <p className="text-xs text-blue-300 uppercase tracking-wide font-medium">{municipio.regiao}</p>
          <h2 className="text-white font-bold text-lg leading-tight">{municipio.nome}</h2>
        </div>
        <button
          onClick={onFechar}
          className="text-blue-300 hover:text-white transition-colors mt-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Info estática */}
        {pop && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{pop.toLocaleString('pt-BR')} habitantes</span>
          </div>
        )}

        {/* Status atual */}
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Status da Parceria</p>
          <span className={`text-sm px-2 py-1 rounded-full font-medium ${cfg?.color ?? ''}`}>
            {cfg?.label ?? municipio.status_parceria}
          </span>
        </div>

        {/* Gestor atual */}
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Gestor Municipal</p>
          {gestorNome ? (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              {gestorNome}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertTriangle className="w-4 h-4" />
              Sem gestor vinculado
            </div>
          )}
        </div>

        {/* Configurações */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs text-gray-400">Prazo</p>
            </div>
            <p className="text-sm font-semibold text-gray-700">{municipio.prazo_resposta_dias} dias</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <Shield className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs text-gray-400">Máx. Recusas</p>
            </div>
            <p className="text-sm font-semibold text-gray-700">{municipio.max_recusas}</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Edição */}
        <div className="space-y-3">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Editar</p>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Status da parceria</label>
            <select
              value={novoStatus}
              onChange={e => setNovoStatus(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2d5986] bg-white"
            >
              <option value="ativa">Parceria Ativa</option>
              <option value="negociando">Em Negociação</option>
              <option value="pendente">Não Iniciada</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Vincular gestor</label>
            <select
              value={novoGestor}
              onChange={e => setNovoGestor(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2d5986] bg-white"
            >
              <option value="">— Sem gestor —</option>
              {gestores.map(g => (
                <option key={g.id} value={g.id}>{g.nome}</option>
              ))}
            </select>
          </div>

          {mensagem && (
            <div className={`text-xs px-3 py-2 rounded-lg ${
              mensagem.tipo === 'ok'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-600'
            }`}>
              {mensagem.texto}
            </div>
          )}

          <button
            onClick={onSalvar}
            disabled={!alterado || salvando}
            className="w-full flex items-center justify-center gap-2 bg-[#1e3a5f] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#2d5986] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {salvando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar alterações'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
