import { useState } from 'react'
import { useNavigate } from 'react-router'
import Avatar from '../components/Avatar'
import Boton from '../components/Boton'
import CamionFirma from '../components/CamionFirma'
import { CampoTexto } from '../components/Campo'
import { emailPorRol, useSesion, type RolDemo } from '../lib/session'

const roles: { rol: RolDemo; titulo: string; descripcion: string; nombre: string }[] = [
  { rol: 'admin', titulo: 'Dirección', descripcion: 'Tablero directivo, catálogos y usuarios', nombre: 'Dirección WarHorse' },
  { rol: 'taller', titulo: 'Taller', descripcion: 'Requisiciones de refacciones y catálogo', nombre: 'Edgar Fraga' },
  { rol: 'compras', titulo: 'Compras', descripcion: 'Ciclo de compra y catálogo', nombre: 'Montzay Vázquez' },
]

export default function Login() {
  const { entrar } = useSesion()
  const navigate = useNavigate()
  const [rol, setRol] = useState<RolDemo>('admin')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const arrancar = async () => {
    setCargando(true)
    setError(null)
    try {
      const s = await entrar(rol)
      navigate('/' + s.landing)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.')
      setCargando(false)
    }
  }

  return (
    <main className="min-h-screen md:grid md:grid-cols-[3fr_2fr]">
      <section className="flex flex-col justify-center gap-6 bg-wh-ink px-8 py-10 text-wh-on-dark md:px-14 md:py-16">
        <CamionFirma className="w-36 text-wh-orange md:w-44" />
        <h1 className="font-display text-[clamp(40px,6vw,68px)] font-bold uppercase leading-[0.98] text-white">
          Hub de Gastos
          <br />
          por Tracto
        </h1>
        <p className="max-w-md text-lg">
          ¿Vale la pena meterle más lana a este tracto? Diésel, refacciones y taller bajo una sola
          llave: el ID del tracto.
        </p>
        <p className="font-display text-[13px] font-semibold uppercase tracking-[0.2em] text-wh-nav-idle">
          WarHorse México · Dataholics
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-10 md:px-10">
        <form
          className="flex w-full max-w-sm flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            void arrancar()
          }}
        >
          <h2 className="font-display text-[34px] font-bold uppercase leading-none">
            Iniciar sesión
          </h2>

          <fieldset>
            <legend className="mb-2 font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-wh-muted-2">
              Entrar como
            </legend>
            <div className="grid gap-2">
              {roles.map((r) => (
                <button
                  type="button"
                  key={r.rol}
                  onClick={() => setRol(r.rol)}
                  aria-pressed={rol === r.rol}
                  className={`flex items-center gap-3 rounded-[13px] border p-3 text-left transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-wh-orange-focus ${
                    rol === r.rol
                      ? 'border-wh-orange bg-wh-orange-soft shadow-[0_2px_8px_rgba(242,98,15,0.18)]'
                      : 'border-wh-border bg-white hover:border-wh-muted-2'
                  }`}
                >
                  <Avatar nombre={r.nombre} rol={r.rol} />
                  <span>
                    <span className="block font-display font-bold uppercase">{r.titulo}</span>
                    <span className="block text-sm text-wh-muted">{r.descripcion}</span>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <CampoTexto etiqueta="Correo" value={emailPorRol[rol]} readOnly />
          <CampoTexto etiqueta="Contraseña" type="password" value="demo-warhorse" readOnly />

          {error && (
            <p className="text-sm font-semibold text-wh-orange-ink" role="alert">
              {error}
            </p>
          )}

          <Boton type="submit" cargando={cargando}>
            Arrancar
          </Boton>

          <p className="text-sm text-wh-muted">
            Demo navegable: los datos son simulados y el acceso solo fija el rol activo. Nada se
            persiste ni sale a internet.
          </p>
        </form>
      </section>
    </main>
  )
}
