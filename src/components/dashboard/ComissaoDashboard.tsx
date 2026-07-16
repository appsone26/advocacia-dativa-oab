'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MapPin, Users, FileText, Calendar, Send,
  CheckCircle, Clock, AlertCircle, ChevronRight,
  Building2, Scale, Plus, X, Edit2, Trash2,
  Eye, Shield, Bell
} from 'lucide-react'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Municipio {
  id: string
  nome: string
  regiao: string
  status_parceria: string
  gestor_id: string | null
  prazo_resposta_dias: number
  max_recusas: number
}

interface Caso {
  id: string
  status: string
  area_juridica: string
  municipio_id: string
  municipio_nome?: string
  criado_em: string
}

interface EventoAgenda {
  id: string
  titulo: string
  descricao: string | null
  tipo: string
  municipio_id: string | null
  municipio_nome?: string
  data_inicio: string
  data_fim: string | null
  criado_por: string | null
}

interface MembroComissao {
  id: string
  regioes: string[]
  liberar_tudo: boolean
  permissoes: string[]
  bio: string | null
}

interface ComissaoDashboardProps {
  perfil: {
    nome: string
    email: string
    cargo: string | null
  }
  membro: MembroComissao | null
  municipios: Municipio[]
  casos: Caso[]
  agenda: EventoAgenda[]
  regioes: string[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, { label: string; cor: string }> = {
  ativa:       { label: 'Ativa',       cor: 'bg-emerald-100 text-emerald-700' },
  negociando:  { label: 'Negociando',  cor: 'bg-amber-100 text-amber-700' },
  pendente:    { label: 'Pendente',    cor: 'bg-red-100 text-red-700' },
}

const AREA_COR: Record<string, string> = {
  'Violência doméstica': 'text-red-600',
  'Família':             'text-amber-600',
  'Alimentos':           'text-amber-600',
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

// ─── Permissões ──────────────────────────────────────────────────────────────

const TODAS_PERMISSOES = [
  { key: 'cadastrar_gestor',    label: 'Cadastrar gestor',      icon: Users },
  { key: 'ver_relatorios',      label: 'Ver relatórios',        icon: FileText },
  { key: 'exportar_relatorios', label: 'Exportar relatórios',   icon: FileText },
  { key: 'mensagens_em_massa',  label: 'Mensagens em massa',    icon: Send },
  { key: 'ver_agenda',          label: 'Ver agenda',            icon: Calendar },
  { key: 'editar_agenda',       label: 'Editar agenda',         icon: Edit2 },
]

function temPermissao(membro: MembroComissao | null, perm: string): boolean {
  if (!membro) return false
  if (membro.liberar_tudo) return true
  return membro.permissoes?.includes(perm) ?? false
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ComissaoDashboard({
  perfil, membro, municipios, casos, agenda, regioes
}: ComissaoDashboardProps) {
  const router = useRouter()
  const [aba, setAba] = useState<'visao' | 'municipios' | 'casos' | 'agenda'>('visao')
  const [modalAgenda, setModalAgenda] = useState(false)
  const [novoEvento, setNovoEvento] = useState({
    titulo: '', descricao: '', tipo: 'reuniao', data_inicio: '', data_fim: '', municipio_id: '', responsavel: ''
  })
  const [salvando, setSalvando] = useState(false)
  const [msgSucesso, setMsgSucesso] = useState('')
  const [erroAgenda, setErroAgenda] = useState('')

  const podeEditarAgenda   = temPermissao(membro, 'editar_agenda')
  const podeVerAgenda      = temPermissao(membro, 'ver_agenda')
  const podeMensagens      = temPermissao(membro, 'mensagens_em_massa')
  const podeVerRelatorios  = temPermissao(membro, 'ver_relatorios')
  const podeCadastrarGestor = temPermissao(membro, 'cadastrar_gestor')

  // Cards resumo
  const totalMunicipios  = municipios.length
  const comParceria      = municipios.filter(m => m.status_parceria === 'ativa').length
  const semGestor        = municipios.filter(m => !m.gestor_id).length
  const casosAbertos     = casos.filter(c => c.status === 'aberto').length

  // Salvar evento
  async function salvarEvento() {
    // Município e responsável são obrigatórios nos dois tipos.
    if (!novoEvento.titulo || !novoEvento.data_inicio || !novoEvento.municipio_id || !novoEvento.responsavel.trim()) return
    setSalvando(true)
    setErroAgenda('')
    try {
      const res = await fetch('/api/agenda/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoEvento)
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setMsgSucesso('Evento criado com sucesso!')
        setModalAgenda(false)
        setNovoEvento({ titulo: '', descricao: '', tipo: 'reuniao', data_inicio: '', data_fim: '', municipio_id: '', responsavel: '' })
        router.refresh() // re-puxa a agenda e o status atualizado da cidade
        setTimeout(() => setMsgSucesso(''), 3000)
      } else {
        setErroAgenda(json?.error ?? 'Não foi possível criar o evento.')
      }
    } catch {
      setErroAgenda('Falha de rede ao criar o evento.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">
            Olá, {perfil.nome.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {perfil.cargo ?? 'Membro da Comissão'} · Regiões:{' '}
            <span className="font-medium text-[#1e3a5f]">{regioes.join(', ')}</span>
          </p>
        </div>

        {/* Badge de acesso */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
          ${membro?.liberar_tudo
            ? 'bg-[#c9a227]/10 text-[#c9a227] border border-[#c9a227]/30'
            : 'bg-[#1e3a5f]/10 text-[#1e3a5f] border border-[#1e3a5f]/20'
          }`}>
          <Shield size={14} />
          {membro?.liberar_tudo ? 'Acesso completo' : 'Acesso configurado'}
        </div>
      </div>

      {/* Mensagem de sucesso */}
      {msgSucesso && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
          <CheckCircle size={16} />
          {msgSucesso}
        </div>
      )}

      {/* Cards resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card
          icon={<MapPin size={18} className="text-[#2d5986]" />}
          titulo="Municípios"
          valor={totalMunicipios}
          sub={`${comParceria} com parceria ativa`}
          cor="bg-blue-50"
        />
        <Card
          icon={<CheckCircle size={18} className="text-emerald-600" />}
          titulo="Parcerias ativas"
          valor={comParceria}
          sub={`${Math.round((comParceria/totalMunicipios)*100)}% da região`}
          cor="bg-emerald-50"
        />
        <Card
          icon={<AlertCircle size={18} className="text-amber-500" />}
          titulo="Sem gestor"
          valor={semGestor}
          sub="municípios descobertos"
          cor="bg-amber-50"
          destaque={semGestor > 0}
        />
        <Card
          icon={<Scale size={18} className="text-red-500" />}
          titulo="Casos abertos"
          valor={casosAbertos}
          sub="aguardando advogado"
          cor="bg-red-50"
          destaque={casosAbertos > 0}
        />
      </div>

      {/* Abas */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          {[
            { key: 'visao',      label: 'Visão geral', icon: Eye },
            { key: 'municipios', label: 'Municípios',  icon: MapPin },
            { key: 'casos',      label: 'Casos',       icon: Scale },
            ...(podeVerAgenda ? [{ key: 'agenda', label: 'Agenda', icon: Calendar }] : []),
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setAba(key as typeof aba)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                ${aba === key
                  ? 'border-[#1e3a5f] text-[#1e3a5f]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Aba: Visão Geral */}
      {aba === 'visao' && (
        <div className="grid md:grid-cols-2 gap-6">

          {/* Municípios prioritários */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-[#1e3a5f] text-sm">Atenção necessária</h2>
              <span className="text-xs text-gray-400">{semGestor} sem gestor</span>
            </div>
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {municipios.filter(m => !m.gestor_id).slice(0, 8).map(m => (
                <div key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.nome}</p>
                    <p className="text-xs text-gray-400">{m.regiao}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABEL[m.status_parceria]?.cor}`}>
                      {STATUS_LABEL[m.status_parceria]?.label}
                    </span>
                    {podeCadastrarGestor && (
                      <button className="text-xs text-[#2d5986] hover:underline">
                        + Gestor
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {semGestor === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">
                  Todos os municípios têm gestor ✓
                </div>
              )}
            </div>
          </div>

          {/* Minhas permissões */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-[#1e3a5f] text-sm">Minhas permissões</h2>
            </div>
            <div className="p-4 space-y-2">
              {TODAS_PERMISSOES.map(({ key, label, icon: Icon }) => {
                const ativo = temPermissao(membro, key)
                return (
                  <div key={key} className={`flex items-center gap-3 px-3 py-2 rounded-lg
                    ${ativo ? 'bg-emerald-50' : 'bg-gray-50 opacity-50'}`}>
                    <Icon size={15} className={ativo ? 'text-emerald-600' : 'text-gray-400'} />
                    <span className={`text-sm ${ativo ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
                    {ativo && <CheckCircle size={13} className="text-emerald-500 ml-auto" />}
                  </div>
                )
              })}
            </div>

            {/* Atalhos de ação */}
            <div className="px-4 pb-4 flex flex-wrap gap-2">
              {podeVerRelatorios && (
                <a href="/dashboard/relatorios"
                  className="flex items-center gap-1.5 text-xs bg-[#1e3a5f] text-white px-3 py-1.5 rounded-lg hover:bg-[#2d5986] transition-colors">
                  <FileText size={13} /> Ver relatórios
                </a>
              )}
              {podeMensagens && (
                <button className="flex items-center gap-1.5 text-xs bg-[#c9a227] text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
                  <Send size={13} /> Mensagem em massa
                </button>
              )}
            </div>
          </div>

          {/* Próximos eventos */}
          {podeVerAgenda && (
            <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-[#1e3a5f] text-sm">Próximos eventos</h2>
                {podeEditarAgenda && (
                  <button
                    onClick={() => setModalAgenda(true)}
                    className="flex items-center gap-1 text-xs text-[#2d5986] hover:underline">
                    <Plus size={13} /> Novo evento
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-50">
                {agenda.slice(0, 4).map(ev => (
                  <div key={ev.id} className="flex items-start gap-3 px-4 py-3">
                    <div className={`mt-0.5 p-1.5 rounded-lg ${ev.tipo === 'reuniao' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                      {ev.tipo === 'reuniao'
                        ? <Users size={14} className="text-blue-600" />
                        : <MapPin size={14} className="text-purple-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{ev.titulo}</p>
                      <p className="text-xs text-gray-400">{formatarDataHora(ev.data_inicio)}{ev.municipio_nome ? ` · ${ev.municipio_nome}` : ''}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${ev.tipo === 'reuniao' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                      {ev.tipo === 'reuniao' ? 'Reunião' : 'Visita'}
                    </span>
                  </div>
                ))}
                {agenda.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    Nenhum evento agendado.{' '}
                    {podeEditarAgenda && (
                      <button onClick={() => setModalAgenda(true)} className="text-[#2d5986] hover:underline">
                        Criar o primeiro.
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Aba: Municípios */}
      {aba === 'municipios' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#1e3a5f] text-sm">
              Municípios da região ({totalMunicipios})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2 text-left">Município</th>
                  <th className="px-4 py-2 text-left">Região</th>
                  <th className="px-4 py-2 text-left">Parceria</th>
                  <th className="px-4 py-2 text-left">Gestor</th>
                  {podeCadastrarGestor && <th className="px-4 py-2 text-left">Ação</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {municipios.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{m.nome}</td>
                    <td className="px-4 py-3 text-gray-500">{m.regiao}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABEL[m.status_parceria]?.cor}`}>
                        {STATUS_LABEL[m.status_parceria]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.gestor_id
                        ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle size={13} /> Definido</span>
                        : <span className="text-amber-500 flex items-center gap-1"><AlertCircle size={13} /> Sem gestor</span>
                      }
                    </td>
                    {podeCadastrarGestor && (
                      <td className="px-4 py-3">
                        {!m.gestor_id && (
                          <button className="text-xs text-[#2d5986] hover:underline flex items-center gap-1">
                            <Plus size={12} /> Vincular gestor
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {municipios.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">
                Nenhum município encontrado para suas regiões.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aba: Casos */}
      {aba === 'casos' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#1e3a5f] text-sm">
              Casos na região ({casos.length})
            </h2>
            {podeVerRelatorios && (
              <a href="/dashboard/relatorios" className="text-xs text-[#2d5986] hover:underline flex items-center gap-1">
                Ver relatório completo <ChevronRight size={13} />
              </a>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2 text-left">Área</th>
                  <th className="px-4 py-2 text-left">Município</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Aberto em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {casos.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className={`px-4 py-3 font-medium ${AREA_COR[c.area_juridica] ?? 'text-gray-700'}`}>
                      {c.area_juridica}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.municipio_nome ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${c.status === 'aberto' ? 'bg-amber-100 text-amber-700'
                        : c.status === 'em_andamento' ? 'bg-blue-100 text-blue-700'
                        : c.status === 'concluido' ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatarData(c.criado_em)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {casos.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">
                Nenhum caso registrado na região ainda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aba: Agenda */}
      {aba === 'agenda' && podeVerAgenda && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#1e3a5f] text-sm">Agenda de eventos</h2>
            {podeEditarAgenda && (
              <button
                onClick={() => setModalAgenda(true)}
                className="flex items-center gap-1.5 text-xs bg-[#1e3a5f] text-white px-3 py-1.5 rounded-lg hover:bg-[#2d5986] transition-colors">
                <Plus size={13} /> Novo evento
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {agenda.map(ev => (
              <div key={ev.id} className="flex items-start gap-4 px-4 py-4">
                <div className={`p-2 rounded-lg shrink-0 ${ev.tipo === 'reuniao' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                  {ev.tipo === 'reuniao'
                    ? <Users size={16} className="text-blue-600" />
                    : <MapPin size={16} className="text-purple-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800">{ev.titulo}</p>
                  {ev.descricao && <p className="text-sm text-gray-500 mt-0.5">{ev.descricao}</p>}
                  <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {formatarDataHora(ev.data_inicio)}
                    </span>
                    {ev.municipio_nome && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {ev.municipio_nome}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0
                  ${ev.tipo === 'reuniao' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                  {ev.tipo === 'reuniao' ? 'Reunião' : 'Visita'}
                </span>
              </div>
            ))}
            {agenda.length === 0 && (
              <div className="py-12 text-center">
                <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">Nenhum evento agendado.</p>
                {podeEditarAgenda && (
                  <button
                    onClick={() => setModalAgenda(true)}
                    className="mt-3 text-sm text-[#2d5986] hover:underline">
                    Criar o primeiro evento
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Novo Evento */}
      {modalAgenda && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-[#1e3a5f]">Novo evento</h3>
              <button onClick={() => { setModalAgenda(false); setErroAgenda('') }} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {erroAgenda && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  <AlertCircle size={15} /> {erroAgenda}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
                <input
                  type="text"
                  value={novoEvento.titulo}
                  onChange={e => setNovoEvento(p => ({ ...p, titulo: e.target.value }))}
                  placeholder="Ex: Reunião mensal da Comissão"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo *</label>
                <div className="flex gap-2">
                  {[
                    { value: 'reuniao', label: 'Reunião', icon: Users },
                    { value: 'visita',  label: 'Visita municipal', icon: MapPin },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setNovoEvento(p => ({ ...p, tipo: value }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors
                        ${novoEvento.tipo === value
                          ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}>
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data/hora início *</label>
                  <input
                    type="datetime-local"
                    value={novoEvento.data_inicio}
                    onChange={e => setNovoEvento(p => ({ ...p, data_inicio: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data/hora fim</label>
                  <input
                    type="datetime-local"
                    value={novoEvento.data_fim}
                    onChange={e => setNovoEvento(p => ({ ...p, data_fim: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Município *</label>
                <select
                  value={novoEvento.municipio_id}
                  onChange={e => setNovoEvento(p => ({ ...p, municipio_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]">
                  <option value="">Selecione...</option>
                  {municipios.map(m => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Responsável / anfitrião *</label>
                <input
                  type="text"
                  value={novoEvento.responsavel}
                  onChange={e => setNovoEvento(p => ({ ...p, responsavel: e.target.value }))}
                  placeholder="Ex: Dr. João — Sec. de Assistência Social"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                <textarea
                  value={novoEvento.descricao}
                  onChange={e => setNovoEvento(p => ({ ...p, descricao: e.target.value }))}
                  rows={2}
                  placeholder="Detalhes do evento (opcional)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] resize-none"
                />
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button
                onClick={() => { setModalAgenda(false); setErroAgenda('') }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                Cancelar
              </button>
              <button
                onClick={salvarEvento}
                disabled={salvando || !novoEvento.titulo || !novoEvento.data_inicio || !novoEvento.municipio_id || !novoEvento.responsavel.trim()}
                className="px-4 py-2 text-sm bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5986] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {salvando ? 'Salvando...' : 'Criar evento'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Sub-componente Card ──────────────────────────────────────────────────────

function Card({ icon, titulo, valor, sub, cor, destaque }: {
  icon: React.ReactNode
  titulo: string
  valor: number
  sub: string
  cor: string
  destaque?: boolean
}) {
  return (
    <div className={`rounded-xl border p-4 ${cor} ${destaque ? 'border-current/20' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{titulo}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-[#1e3a5f]">{valor}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
    </div>
  )
}
