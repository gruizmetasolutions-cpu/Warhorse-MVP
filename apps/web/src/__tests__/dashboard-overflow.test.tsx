import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import Dashboard from '../pages/Dashboard'

const mockGetDashboard = vi.fn()
const mockGetSaludDatos = vi.fn()
const mockSetSelTractoId = vi.fn()
const mockToast = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../lib/demo', () => ({
  useDemo: () => ({
    selTractoId: 'WH125',
    setSelTractoId: mockSetSelTractoId,
    toast: mockToast,
  }),
}))

vi.mock('../components/Ayuda', () => ({
  default: ({ tip }: { tip: string }) => <span>{tip}</span>,
}))

vi.mock('../components/Kicker', () => ({
  default: ({ texto }: { texto: string }) => <div>{texto}</div>,
}))

vi.mock('../lib/api', () => ({
  ApiError: class ApiError extends Error {
    constructor(message: string, public fields?: Record<string, string[]>) {
      super(message)
      this.name = 'ApiError'
    }
  },
  ajustarParametros: vi.fn(),
  getDashboard: (...args: unknown[]) => mockGetDashboard(...args),
  getSaludDatos: (...args: unknown[]) => mockGetSaludDatos(...args),
}))

describe('Dashboard chart sizing', () => {
  beforeEach(() => {
    mockGetDashboard.mockResolvedValue({
      kpis: {
        diesel: 140900,
        refacciones: 100885,
        taller: 63400,
        costo_real_acumulado: 305185,
      },
      ranking: [
        { id: '1', id_unidad: 'WH125', costo_total: 99900, critico: true },
        { id: '2', id_unidad: 'WH101', costo_total: 64550, critico: false },
        { id: '3', id_unidad: 'WH104', costo_total: 46700, critico: false },
      ],
      seleccion: {
        id_unidad: 'WH125',
        eficiencia_km_l: 1.2,
        pct_reparacion_total: 33,
        veredicto: 'Vender',
        razon: 'Costo acumulado superior al umbral.',
      },
      parametros: { umbral_pct: 20, ventana_meses: 13 },
    })
    mockGetSaludDatos.mockResolvedValue({
      requisiciones: {
        pct: 100,
        con_foto_y_origen: 29,
        total: 29,
      },
      liberaciones: {
        pct: 100,
        con_tipo: 15,
        total: 15,
      },
      yonke: {
        pct: 100,
        total: 5,
        por_origen: {
          catalogo: 4,
          ultima_compra: 0,
          manual: 1,
        },
      },
    })
  })

  test('the dashboard bars shrink to fit inside the card without forcing a wide layout', async () => {
    render(<Dashboard />)

    await waitFor(() => expect(screen.getByText('Gasto consolidado por tracto')).toBeInTheDocument())

    const chartCard = screen.getByText('Gasto consolidado por tracto').closest('[data-tour="barras"]') as HTMLElement
    const firstBar = chartCard.querySelector('button') as HTMLButtonElement

    expect(chartCard).toHaveStyle({ overflow: 'hidden', maxWidth: '100%' })
    expect(firstBar.style.minWidth).toBe('0')
    expect(firstBar.style.maxWidth).toBe('100%')
  })
})
