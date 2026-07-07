import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import BarrasGasto from '../components/BarrasGasto'
import Badge from '../components/Badge'
import Boton from '../components/Boton'
import { CampoTexto } from '../components/Campo'
import DonutMantenimiento from '../components/DonutMantenimiento'
import Gauge from '../components/Gauge'
import KpiCard from '../components/KpiCard'
import Panel from '../components/Panel'
import Skeleton from '../components/Skeleton'
import { useToast } from '../components/Toast'
import * as api from '../lib/api'
import type { Dashboard as DatosDashboard, Veredicto } from '../lib/types'

const dinero = (n: number) => '$' + n.toLocaleString('en-US')

const estiloVeredicto: Record<Veredicto, { borde: string; texto: string }> = {
  Vender: { borde: 'border-wh-orange', texto: 'text-wh-orange-ink' },
  Evaluar: { borde: 'border-wh-amber-border', texto: 'text-wh-amber-ink' },
  Mantener: { borde: 'border-wh-green-border', texto: 'text-wh-green-ink' },
}

export default function Dashboard() {
  const [datos, setDatos] = useState<DatosDashboard | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [umbral, setUmbral] = useState('40')
  const [ventana, setVentana] = useState('12')
  const [errorParam, setErrorParam] = useState<string | null>(null)
  const [aplicando, setAplicando] = useState(false)
  const { avisar } = useToast()
  const navigate = useNavigate()

  const cargar = useCallback(async (idUnidad?: string) => {
    setCargando(true)
    setError(null)
    try {
      const d = await api.getDashboard(idUnidad)
      setDatos(d)
      setUmbral(String(d.parametros.umbral_pct))
      setVentana(String(d.parametros.ventana_meses))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const aplicarParametros = async () => {
    setAplicando(true)
    setErrorParam(null)
    try {
      const d = await api.setParametrosVeredicto({
        umbral_pct: Number(umbral),
        ventana_meses: Number(ventana),
      })
      setDatos(d)
      avisar('Parámetros del veredicto actualizados')
    } catch (e) {
      setErrorParam(e instanceof Error ? e.message : 'No se pudieron aplicar los parámetros.')
    } finally {
      setAplicando(false)
    }
  }

  const sel = datos?.seleccion

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[34px] font-bold uppercase leading-none">
        Tablero directivo
      </h1>

      <section aria-label="KPIs consolidados de la flota" data-tour="kpis" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard etiqueta="Diésel" valor={datos ? dinero(datos.kpis.diesel) : null} cargando={cargando} />
        <KpiCard etiqueta="Refacciones" valor={datos ? dinero(datos.kpis.refacciones) : null} cargando={cargando} />
        <KpiCard etiqueta="Taller" valor={datos ? dinero(datos.kpis.taller) : null} cargando={cargando} />
        <KpiCard etiqueta="Costo real acumulado" valor={datos ? dinero(datos.kpis.costo_real_acumulado) : null} cargando={cargando} />
      </section>

      {error ? (
        <Panel className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="font-semibold text-wh-orange-ink">{error}</p>
          <Boton variante="outline" onClick={() => void cargar()}>
            Reintentar
          </Boton>
        </Panel>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
          <Panel titulo="Gasto por tracto" dataTour="barras">
            {cargando || !datos ? (
              <Skeleton className="h-56 w-full" />
            ) : datos.ranking.length === 0 ? (
              <p className="py-10 text-center text-wh-muted">Sin datos suficientes</p>
            ) : (
              <>
                <BarrasGasto
                  ranking={datos.ranking}
                  seleccionada={datos.seleccion.id_unidad}
                  onSeleccionar={(id) => void cargar(id)}
                />
                <div className="mt-5 flex justify-end">
                  <Boton variante="oscuro" onClick={() => navigate(`/ficha/${datos.seleccion.id_unidad}`)}>
                    Ver ficha completa
                  </Boton>
                </div>
              </>
            )}
          </Panel>

          <div className="flex flex-col gap-6">
            <section
              data-tour="veredicto"
              aria-label={
                sel
                  ? `Veredicto de rentabilidad de ${sel.id_unidad}: ${sel.veredicto ?? 'pendiente'}. ${sel.razon}`
                  : 'Veredicto de rentabilidad'
              }
              className={`rounded-[13px] border-2 bg-wh-surface p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] ${
                sel?.veredicto ? estiloVeredicto[sel.veredicto].borde : 'border-wh-border'
              }`}
            >
              <h3 className="font-display text-[19px] font-bold uppercase">
                Veredicto — {sel?.id_unidad ?? '…'}
              </h3>
              {cargando || !sel ? (
                <Skeleton className="mt-3 h-16 w-full" />
              ) : sel.veredicto === null ? (
                <div className="mt-3 flex flex-col items-start gap-2">
                  <Badge tipo="neutral" valor="Valor de referencia pendiente" />
                  <p className="text-sm text-wh-muted">{sel.razon}</p>
                </div>
              ) : (
                <>
                  <p
                    className={`mt-1 font-display text-[38px] font-bold uppercase leading-none ${
                      estiloVeredicto[sel.veredicto].texto
                    }`}
                  >
                    {sel.veredicto}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">{sel.razon}</p>
                </>
              )}
            </section>

            <Panel titulo="Eficiencia de rendimiento">
              {cargando || !sel ? <Skeleton className="h-32 w-full" /> : <Gauge kmPorLitro={sel.eficiencia_km_l} />}
            </Panel>

            <Panel titulo="Análisis de mantenimiento">
              {cargando || !sel ? (
                <Skeleton className="h-28 w-full" />
              ) : (
                <DonutMantenimiento
                  pctTotal={sel.pct_reparacion_total}
                  pctMejoralito={sel.pct_mejoralito}
                />
              )}
            </Panel>

            <Panel titulo="Parámetros del veredicto" dataTour="parametros">
              <form
                className="flex flex-wrap items-end gap-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  void aplicarParametros()
                }}
              >
                <div className="w-28">
                  <CampoTexto
                    etiqueta="Umbral (%)"
                    type="number"
                    min={20}
                    max={80}
                    value={umbral}
                    onChange={(e) => setUmbral(e.target.value)}
                  />
                </div>
                <div className="w-36">
                  <CampoTexto
                    etiqueta="Ventana (meses)"
                    type="number"
                    min={1}
                    max={36}
                    value={ventana}
                    onChange={(e) => setVentana(e.target.value)}
                  />
                </div>
                <Boton type="submit" cargando={aplicando}>
                  Aplicar
                </Boton>
                {errorParam && (
                  <p className="w-full text-sm font-semibold text-wh-orange-ink" role="alert">
                    {errorParam}
                  </p>
                )}
              </form>
            </Panel>
          </div>
        </div>
      )}
    </div>
  )
}
