import type { CSSProperties } from 'react'

// Helpers de estilo portados literalmente del demo validado.

export const FD = "'Barlow Condensed',sans-serif"

export const fmt = (n: number): string => '$' + Math.round(n).toLocaleString('es-MX')

export const badge = (bg: string, fg: string, br?: string): CSSProperties => ({
  fontSize: 12,
  fontWeight: 700,
  padding: '3px 10px',
  borderRadius: 6,
  background: bg,
  color: fg,
  border: '1px solid ' + (br || bg),
  whiteSpace: 'nowrap',
  letterSpacing: '0.02em',
})

export const critStyle = (c: string): CSSProperties => {
  if (c === 'Inmediato') return badge('#FBEBE8', '#C53030', '#FEB2B2')
  if (c === 'Crítico' || c === 'Crítica') return badge('#FDE8DC', '#B4430A', '#C5A059')
  if (c === 'Media' || c === 'Medio') return badge('#FBF3D9', '#8A6D1A', '#E0C36A')
  return badge('#E5F3E9', '#2C7A44', '#9FD4B0')
}

export const estadoReqColors: Record<string, [string, string, string]> = {
  Solicitado: ['#EAE6DC', '#4A4438', '#C9C2B2'],
  'En aprobación': ['#EAE6DC', '#4A4438', '#C9C2B2'],
  'En pago': ['#EAE6DC', '#4A4438', '#C9C2B2'],
  'En recolección': ['#EAE6DC', '#4A4438', '#C9C2B2'],
  'En trayecto': ['#FDF3EC', '#B4430A', '#C5A059'],
  'Bajo pedido': ['#FBF3D9', '#8A6D1A', '#E0C36A'],
  'Más información': ['#FBF3D9', '#8A6D1A', '#E0C36A'],
  Cotizado: ['#FBF3D9', '#8A6D1A', '#E0C36A'],
  Comprado: ['#E3ECF7', '#1B4E8C', '#9FC0E4'],
  Instalado: ['#E5F3E9', '#2C7A44', '#9FD4B0'],
  Cancelado: ['#FBEBE8', '#C53030', '#FEB2B2'],
  Rechazado: ['#FBEBE8', '#C53030', '#FEB2B2'],
}

export const estadoUnidadColors: Record<string, [string, string, string]> = {
  Activo: ['#E5F3E9', '#2C7A44', '#9FD4B0'],
  Yonke: ['#FDE8DC', '#B4430A', '#C5A059'],
  Inactivo: ['#EAE6DC', '#4A4438', '#C9C2B2'],
  Vendido: ['#FBEBE8', '#C53030', '#FEB2B2'],
}

export const urgColors: Record<string, [string, string, string]> = {
  Bajo: ['#E5F3E9', '#2C7A44', '#9FD4B0'],
  Medio: ['#FBF3D9', '#8A6D1A', '#E0C36A'],
  Crítico: ['#FDE8DC', '#B4430A', '#C5A059'],
  Inmediato: ['#FBEBE8', '#C53030', '#FEB2B2'],
  Rápida: ['#E5F3E9', '#2C7A44', '#3FA65C'],
  Media: ['#FBF3D9', '#8A6D1A', '#E0C36A'],
  Crítica: ['#FDE8DC', '#B4430A', '#C5A059'],
}

export const card: CSSProperties = {
  background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid var(--border-color)',
  borderRadius: 12,
  padding: 22,
  boxShadow: '0 1px 2px rgba(20,24,29,0.05)',
}

export const h2Titulo: CSSProperties = {
  fontFamily: FD,
  fontWeight: 700,
  fontSize: 34,
  color: 'var(--text-main)',
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: '0.01em',
}

export const h3Titulo: CSSProperties = {
  fontFamily: FD,
  fontWeight: 700,
  fontSize: 19,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-main)',
  margin: 0,
}

export const subTitulo: CSSProperties = {
  margin: '4px 0 0',
  fontSize: 14.5,
  color: 'var(--text-muted)',
}

export const thCell: CSSProperties = { padding: '12px 10px', borderBottom: '2px solid rgba(197, 160, 89, 0.3)' }
export const tdCell: CSSProperties = { padding: '11px 10px', borderBottom: '1px solid rgba(197, 160, 89, 0.1)' }

export const theadRow: CSSProperties = {
  textAlign: 'left',
  color: 'var(--text-muted)',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

export const filtroPill = (activo: boolean): CSSProperties => ({
  padding: '8px 14px',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  background: activo ? '#C5A059' : 'rgba(15, 15, 16, 0.8)',
  color: activo ? '#000' : '#9ca3af',
  border: activo ? '1px solid #C5A059' : '1px solid rgba(197, 160, 89, 0.2)',
})

export const rayado = 'repeating-linear-gradient(135deg,#C5A059 0 12px,#14181D 12px 24px)'
