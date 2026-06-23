// ============================================================
// ADVOCACIA DATIVA — Tipos TypeScript
// Espelha o schema do Supabase (9 tabelas)
// ============================================================

// --- NÍVEIS DE USUÁRIO ---
// IMPORTANTE: valores em texto, conforme a constraint do banco:
// CHECK (nivel = ANY (ARRAY['owner','comissao','gestor','advogado','cliente']))
export type NivelUsuario = 'owner' | 'comissao' | 'gestor' | 'advogado' | 'cliente'

export const NIVEL_LABEL: Record<NivelUsuario, string> = {
  owner:    'OAB / Owner',
  comissao: 'Comissão',
  gestor:   'Gestor Municipal',
  advogado: 'Advogado',
  cliente:  'Cliente',
}

// --- ÁREAS JURÍDICAS ---
export type AreaJuridica =
  | 'violencia_domestica'
  | 'familia_alimentos'
  | 'imobiliario'
  | 'outros'

export const AREAS_JURIDICAS: Record<AreaJuridica, { label: string; prioridade: 'alta' | 'media' | 'normal'; cor: string }> = {
  violencia_domestica: { label: 'Violência doméstica', prioridade: 'alta', cor: '#ef4444' },
  familia_alimentos:   { label: 'Família / Alimentos', prioridade: 'media', cor: '#f59e0b' },
  imobiliario:         { label: 'Imobiliário',          prioridade: 'normal', cor: '#6b7280' },
  outros:              { label: 'Outros',               prioridade: 'normal', cor: '#6b7280' },
}

// --- STATUS DE CASO ---
export type StatusCaso =
  | 'aguardando_advogado'   // Nenhum advogado escalado ainda
  | 'aguardando_aceite'     // Advogado escalado, esperando aceite
  | 'em_andamento'          // Aceito, em atendimento
  | 'concluido'             // Concluído com número de processo
  | 'cancelado'             // Cancelado pelo gestor ou owner

// --- TABELAS DO BANCO ---

export interface Municipio {
  id: string
  nome: string
  slug: string
  regiao: string
  populacao: number
  renda_per_capita: number
  total_advogados_oab: number
  logo_url?: string
  created_at: string
}

export interface Profile {
  id: string // UUID = auth.users.id
  nome: string
  email: string
  nivel: NivelUsuario
  municipio_id?: string | null // null para owner e comissão sem restrição regional
  oab_numero?: string | null   // preenchido para advogados
  cargo?: string | null        // preenchido para membros da comissão
  primeiro_acesso: boolean     // default true; cliente define false no auto-cadastro
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface Advogado {
  id: string
  profile_id: string // FK → profiles.id
  municipio_id: string
  numero_oab: string
  areas: AreaJuridica[]
  posicao_fila: number // Posição na fila de rodízio (ordem de cadastro)
  total_recusas: number
  total_casos_concluidos: number
  ativo: boolean
  created_at: string
  // Join
  profile?: Profile
}

export interface Cliente {
  id: string
  profile_id: string // FK → profiles.id
  municipio_id: string
  cpf: string
  data_nascimento: string
  endereco: string
  lgpd_aceito_em: string
  numero_protocolo: string // Gerado no auto-cadastro
  created_at: string
  // Join
  profile?: Profile
  municipio?: Municipio
}

export interface Caso {
  id: string
  cliente_id: string
  advogado_id?: string // null até ser linkado
  municipio_id: string
  area: AreaJuridica
  descricao: string
  prioridade: 'alta' | 'media' | 'normal' // Definida pelo gestor, não pelo cliente
  status: StatusCaso
  numero_processo?: string // Obrigatório antes de concluir (antifraude)
  prazo_aceite?: string // Data limite para o advogado aceitar
  linkado_em?: string
  aceito_em?: string
  concluido_em?: string
  created_at: string
  updated_at: string
  // Joins
  cliente?: Cliente
  advogado?: Advogado
  municipio?: Municipio
}

export interface Recusa {
  id: string
  caso_id: string
  advogado_id: string
  motivo: string // Obrigatório
  tipo: 'manual' | 'automatica' // Automática = prazo expirado sem resposta
  created_at: string
  edited_at?: string
  edited_motivo?: string
  // Joins
  advogado?: Advogado
  caso?: Caso
}

export interface Notificacao {
  id: string
  profile_id: string // Destinatário
  titulo: string
  mensagem: string
  tipo: 'caso_atribuido' | 'caso_aceito' | 'caso_recusado' | 'caso_concluido' | 'mensagem_massa' | 'sistema'
  lida: boolean
  caso_id?: string
  created_at: string
}

export interface ConfiguracaoMunicipio {
  municipio_id: string
  prazo_aceite_dias: number   // Padrão: 2 dias
  max_recusas: number          // Padrão: 3
  logo_url?: string
  updated_at: string
  updated_by: string // profile_id do gestor que alterou
}

export interface LogAuditoria {
  id: string
  profile_id: string // Quem fez a ação
  acao: string // Ex: 'caso.linkar', 'advogado.criar', 'configuracao.alterar'
  tabela: string
  registro_id: string
  dados_antes?: Record<string, unknown>
  dados_depois?: Record<string, unknown>
  ip?: string
  created_at: string
  // Join
  profile?: Profile
}

// --- TIPOS DE SESSÃO / AUTH ---

export interface UserSession {
  id: string
  email: string
  nivel: NivelUsuario
  nome: string
  municipio_id?: string
  primeiro_acesso: boolean
}

// user_metadata que fica no JWT do Supabase (= raw_user_meta_data)
// Acessível no middleware sem query ao banco
export interface UserMetadata {
  nivel: NivelUsuario       // 'owner' | 'comissao' | 'gestor' | 'advogado' | 'cliente'
  nome: string
  municipio_id?: string
  primeiro_acesso?: boolean
}
