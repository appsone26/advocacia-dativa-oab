// src/app/dashboard/owner/page.tsx
// Placeholder do Tijolo 7 — sem chamada ao Supabase aqui.
// O middleware já garantiu autenticação. O DashboardShell já tem nome/nível.
export default function OwnerPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏛️</div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1e3a5f' }}>
          Dashboard Geral · OAB-RJ
        </h1>
        <p style={{ color: '#94a3b8', marginTop: '8px', fontSize: '14px' }}>
          Tijolo 7 — em construção
        </p>
      </div>
    </div>
  )
}
