import type { CSSProperties } from 'react'
import { PAGE_SIZES, type SortDir, type TablaControls } from '../lib/useTabla'
import { FD, filtroPill } from '../lib/estilos'

/* ── tiny helpers ─────────────────────────────────────── */
const selStyle: CSSProperties = {
  padding: '7px 10px',
  border: '1px solid #D8D2C4',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  background: '#fff',
  color: '#16191E',
  cursor: 'pointer',
}

const pgBtn = (active: boolean, disabled?: boolean): CSSProperties => ({
  padding: '6px 11px',
  border: '1px solid ' + (active ? '#16191E' : '#D8D2C4'),
  borderRadius: 7,
  fontSize: 13,
  fontWeight: 700,
  background: active ? '#16191E' : '#fff',
  color: active ? '#F3EFE7' : '#4A4438',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.4 : 1,
})

/* ── SortTh ── clickable column header ─────────────────── */
interface SortThProps {
  col: string
  label: string
  sortCol: string
  sortDir: SortDir
  onSort: (col: string) => void
  style?: CSSProperties
}

export function SortTh({ col, label, sortCol, sortDir, onSort, style }: SortThProps) {
  const active = sortCol === col
  const arrow = active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'
  return (
    <th
      onClick={() => onSort(col)}
      style={{
        padding: '12px 10px',
        borderBottom: '2px solid #16191E',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <span style={{ opacity: active ? 1 : 0.55, fontSize: 11, marginLeft: 2 }}>{arrow}</span>
      {' '}{label}
    </th>
  )
}

/* ── TablaToolbar ── filters + page-size row ────────────── */
interface PillFilter<T extends string> {
  value: T
  label?: string
}

interface TablaToolbarProps<TFilter extends string> {
  /** Controls object from useTabla */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctrl: Pick<TablaControls<any>, 'total' | 'pageSize' | 'setPageSize' | 'resetPage'>
  /** Optional pill-filter strip */
  filtros?: PillFilter<TFilter>[]
  filtroActivo?: TFilter
  onFiltro?: (f: TFilter) => void
  /** Optional right-side slot for extra buttons (e.g. + Agregar) */
  rightSlot?: React.ReactNode
  /** Optional search box */
  busqueda?: string
  onBusqueda?: (v: string) => void
  busquedaPlaceholder?: string
}

export function TablaToolbar<TFilter extends string>({
  ctrl,
  filtros,
  filtroActivo,
  onFiltro,
  rightSlot,
  busqueda,
  onBusqueda,
  busquedaPlaceholder = 'Buscar…',
}: TablaToolbarProps<TFilter>) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        marginBottom: 10,
        justifyContent: 'space-between',
      }}
    >
      {/* left: pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {filtros?.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              onFiltro?.(f.value)
              ctrl.resetPage()
            }}
            className="hv-borde-ink"
            style={filtroPill(filtroActivo === f.value)}
          >
            {f.label ?? f.value}
          </button>
        ))}
        {onBusqueda && (
          <input
            type="search"
            value={busqueda}
            onChange={(e) => {
              onBusqueda(e.target.value)
              ctrl.resetPage()
            }}
            placeholder={busquedaPlaceholder}
            style={{
              padding: '7px 12px',
              border: '1px solid #D8D2C4',
              borderRadius: 8,
              fontSize: 13,
              background: '#FAF7F0',
              color: '#16191E',
              minWidth: 180,
            }}
          />
        )}
      </div>

      {/* right: page-size + extra slot */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {rightSlot}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12.5, color: '#8A8374', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Mostrar
          </span>
          <select
            value={ctrl.pageSize}
            onChange={(e) => ctrl.setPageSize(Number(e.target.value))}
            style={selStyle}
            aria-label="Filas por página"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span style={{ fontSize: 12.5, color: '#8A8374', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            de {ctrl.total}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── TablaFooter ── pagination controls ─────────────────── */
interface TablaFooterProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctrl: Pick<TablaControls<any>, 'page' | 'totalPages' | 'setPage' | 'total' | 'pageSize' | 'filasPagina'>
}

export function TablaFooter({ ctrl }: TablaFooterProps) {
  if (ctrl.totalPages <= 1) return null

  const { page, totalPages, setPage } = ctrl
  const start = (page - 1) * ctrl.pageSize + 1
  const end = start + ctrl.filasPagina.length - 1

  // generate page numbers with ellipsis
  const pages: (number | '…')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 14,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 12.5, color: '#8A8374', fontWeight: 600, fontFamily: FD, letterSpacing: '0.05em' }}>
        {start}–{end} de {ctrl.total}
      </span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          style={pgBtn(false, page === 1)}
          aria-label="Página anterior"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={'e' + i} style={{ padding: '0 4px', color: '#8A8374', fontSize: 13 }}>…</span>
          ) : (
            <button key={p} onClick={() => setPage(p)} style={pgBtn(p === page)}>
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          style={pgBtn(false, page === totalPages)}
          aria-label="Página siguiente"
        >
          ›
        </button>
      </div>
    </div>
  )
}
