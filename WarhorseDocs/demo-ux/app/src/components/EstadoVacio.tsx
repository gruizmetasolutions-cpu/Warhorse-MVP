import CamionFirma from './CamionFirma'

export default function EstadoVacio({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center text-wh-muted">
      <CamionFirma className="w-24 text-wh-ink/60" />
      <p className="font-semibold">{mensaje}</p>
    </div>
  )
}
