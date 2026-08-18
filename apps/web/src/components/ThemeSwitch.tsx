import { useTheme } from '../lib/useTheme'

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="hv-borde-naranja"
      style={{
        background: 'transparent',
        border: '1px solid var(--border-color, rgba(243,239,231,0.18))',
        color: 'var(--text-muted, #B8B2A6)',
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
      title="Cambiar tema"
    >
      {theme === 'dark' ? '☀ Claro' : '🌙 Oscuro'}
    </button>
  )
}
