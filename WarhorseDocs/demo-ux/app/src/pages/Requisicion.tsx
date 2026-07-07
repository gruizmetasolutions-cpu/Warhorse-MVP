import { Camera, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import Badge from '../components/Badge'
import Boton from '../components/Boton'
import { CampoArea, CampoSelect, CampoTexto } from '../components/Campo'
import Panel from '../components/Panel'
import { useToast } from '../components/Toast'
import * as api from '../lib/api'
import type { Origen, Unidad, Urgencia } from '../lib/types'

const urgencias: { valor: Urgencia; clase: string }[] = [
  { valor: 'Rápida', clase: 'bg-wh-green-soft text-wh-green-ink border-wh-green-border' },
  { valor: 'Media', clase: 'bg-wh-amber-soft text-wh-amber-ink border-wh-amber-border' },
  { valor: 'Crítica', clase: 'bg-wh-orange-soft text-wh-orange-ink border-wh-orange' },
]

type CampoError = 'destino' | 'descripcion' | 'donante' | 'costo' | 'foto' | 'general'

const campoDeError = (mensaje: string): CampoError => {
  if (mensaje.includes('tracto destino')) return 'destino'
  if (mensaje.includes('Describe la pieza')) return 'descripcion'
  if (mensaje.includes('unidad donante')) return 'donante'
  if (mensaje.includes('costo estimado')) return 'costo'
  if (mensaje.includes('foto')) return 'foto'
  return 'general'
}

export default function Requisicion() {
  const { avisar } = useToast()
  const [activas, setActivas] = useState<Unidad[]>([])
  const [yonkes, setYonkes] = useState<Unidad[]>([])
  const [destino, setDestino] = useState('')
  const [origen, setOrigen] = useState<Origen>('Compra')
  const [donante, setDonante] = useState('')
  const [costo, setCosto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [numeroParte, setNumeroParte] = useState('')
  const [urgencia, setUrgencia] = useState<Urgencia>('Media')
  const [fotoAdjunta, setFotoAdjunta] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errores, setErrores] = useState<Partial<Record<CampoError, string>>>({})

  useEffect(() => {
    void Promise.all([api.getUnidades('Activo'), api.getUnidades('Yonke')]).then(([a, y]) => {
      setActivas(a)
      setYonkes(y)
    })
  }, [])

  const enviar = async () => {
    setEnviando(true)
    setErrores({})
    try {
      await api.crearRequisicion({
        unidad_destino_id: destino ? Number(destino) : null,
        origen,
        unidad_donante_id: donante ? Number(donante) : null,
        descripcion_pieza: descripcion,
        numero_parte: numeroParte || null,
        urgencia,
        costo_estimado_manual: costo ? Number(costo) : null,
        foto_adjunta: fotoAdjunta,
      })
      avisar('Requisición enviada — Compras la verá en su panel')
      setDestino('')
      setOrigen('Compra')
      setDonante('')
      setCosto('')
      setDescripcion('')
      setNumeroParte('')
      setUrgencia('Media')
      setFotoAdjunta(false)
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : 'No se pudo enviar la requisición.'
      setErrores({ [campoDeError(mensaje)]: mensaje })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="font-display text-[34px] font-bold uppercase leading-none">
        Requisición de refacciones
      </h1>

      <Panel>
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            void enviar()
          }}
        >
          <div data-tour="destino">
            <CampoSelect
              etiqueta="Tracto destino"
              placeholder="Selecciona la unidad"
              opciones={activas.map((u) => ({ valor: String(u.id), texto: `${u.id_unidad} · ${u.tipo}` }))}
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              error={errores.destino}
            />
          </div>

          <fieldset data-tour="origen">
            <legend className="mb-2 font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-wh-muted-2">
              Origen de la pieza
            </legend>
            <div className="inline-flex rounded-full border border-wh-border bg-white p-1" role="group">
              {(['Compra', 'Yonke'] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={origen === o}
                  onClick={() => setOrigen(o)}
                  className={`rounded-full px-5 py-2 font-display font-bold uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-wh-orange-focus ${
                    origen === o ? 'bg-wh-orange text-white' : 'text-wh-muted hover:text-wh-ink'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </fieldset>

          {origen === 'Yonke' && (
            <div className="grid gap-5 rounded-[13px] border border-wh-orange bg-wh-orange-soft/40 p-4 md:grid-cols-2">
              <CampoSelect
                etiqueta="Unidad donante"
                placeholder="Selecciona el Yonke"
                opciones={yonkes.map((u) => ({ valor: String(u.id), texto: u.id_unidad }))}
                value={donante}
                onChange={(e) => setDonante(e.target.value)}
                error={errores.donante}
              />
              <div>
                <CampoTexto
                  etiqueta="Costo estimado"
                  type="number"
                  min={1}
                  inputMode="decimal"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  error={errores.costo}
                  ayuda="Aunque no exista factura, la pieza donada debe llevar costo (ADR-002)."
                />
                <div className="mt-2">
                  <Badge tipo="origen" valor="Yonke" texto="Yonke · Estimado" />
                </div>
              </div>
            </div>
          )}

          <CampoArea
            etiqueta="Descripción de la pieza"
            placeholder="Ej. Turbo, balatas delanteras, sensor de nivel…"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            error={errores.descripcion}
          />

          <CampoTexto
            etiqueta="Número de parte (opcional)"
            value={numeroParte}
            onChange={(e) => setNumeroParte(e.target.value)}
          />

          <fieldset>
            <legend className="mb-2 font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-wh-muted-2">
              Urgencia
            </legend>
            <div className="flex flex-wrap gap-2" role="group">
              {urgencias.map((u) => (
                <button
                  key={u.valor}
                  type="button"
                  aria-pressed={urgencia === u.valor}
                  onClick={() => setUrgencia(u.valor)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-wh-orange-focus ${
                    urgencia === u.valor ? u.clase : 'border-wh-border bg-white text-wh-muted hover:text-wh-ink'
                  }`}
                >
                  {u.valor}
                </button>
              ))}
            </div>
          </fieldset>

          <div data-tour="foto">
            <p className="mb-2 font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-wh-muted-2">
              Foto de la pieza *
            </p>
            {fotoAdjunta ? (
              <div className="flex items-center gap-3 rounded-[9px] border border-wh-border bg-white p-3">
                <span className="flex size-12 items-center justify-center rounded-md bg-wh-chip-neutral text-wh-ink-soft">
                  <Camera size={22} aria-hidden="true" />
                </span>
                <span className="flex-1 text-sm font-semibold">foto-pieza.jpg (simulada)</span>
                <button
                  type="button"
                  onClick={() => setFotoAdjunta(false)}
                  aria-label="Quitar foto"
                  className="rounded-md p-2 text-wh-muted hover:text-wh-orange-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-wh-orange-focus"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setFotoAdjunta(true)}
                className={`flex w-full flex-col items-center gap-2 rounded-[9px] border-2 border-dashed p-6 text-wh-muted transition-colors hover:border-wh-orange hover:text-wh-orange-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-wh-orange-focus ${
                  errores.foto ? 'border-wh-orange' : 'border-wh-border'
                }`}
              >
                <Camera size={26} aria-hidden="true" />
                <span className="font-semibold">Adjuntar foto simulada</span>
                <span className="text-xs">En el demo la foto es un placeholder; no se sube nada.</span>
              </button>
            )}
            {errores.foto && (
              <p className="mt-1.5 text-sm font-semibold text-wh-orange-ink" role="alert">
                {errores.foto}
              </p>
            )}
          </div>

          {errores.general && (
            <p className="text-sm font-semibold text-wh-orange-ink" role="alert">
              {errores.general}
            </p>
          )}

          <Boton type="submit" cargando={enviando}>
            Enviar requisición
          </Boton>
        </form>
      </Panel>
    </div>
  )
}
