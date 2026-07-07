export type Escenario = 'normal' | 'vacio' | 'error'

const KEY = 'wh-escenario'

const leerInicial = (): Escenario => {
  try {
    const guardado = sessionStorage.getItem(KEY)
    if (guardado === 'vacio' || guardado === 'error') return guardado
  } catch {
    /* sin sessionStorage (SSR/tests): escenario normal */
  }
  return 'normal'
}

let actual: Escenario = leerInicial()

export const setEscenario = (e: Escenario): void => {
  actual = e
  try {
    sessionStorage.setItem(KEY, e)
  } catch {
    /* ignorar */
  }
}

export const getEscenario = (): Escenario => actual
