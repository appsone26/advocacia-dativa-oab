// ============================================================
// src/config/modulos.ts
// Interruptores de módulos — "adormecer, não apagar"
// ------------------------------------------------------------
// Trocar false <-> true religa/desliga um módulo inteiro.
// O código e as tabelas continuam no repo/banco: NADA é apagado.
// Lido por: middleware.ts (bloqueio de rota) e Sidebar.tsx (menu).
// ============================================================

export const MODULOS = {
  // --- Escopo antigo (OAB) — ADORMECIDOS na virada Defensoria ---
  gestor:    false,  // painel do gestor municipal
  advogado:  false,  // painel do advogado + loop de casos
  clienteQR: false,  // auto-cadastro público por QR Code (/cadastro/*)

  // --- Fase Defensoria — ATIVOS ---
  monitorCidades: true,  // visão geral + status por município
  agenda:         true,  // reuniões, relatórios, acordos
  imprensa:       true,  // aba de imprensa + export PDF
} as const

export type Modulo = keyof typeof MODULOS
