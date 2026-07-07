import type { DatosDemo } from '../types'
import { datosDemo } from './fixtures'

const delay = (ms = 250): Promise<void> =>
  new Promise((r) => setTimeout(r, import.meta.env.MODE === 'test' ? 0 : ms))

export async function getDatos(): Promise<DatosDemo> {
  await delay()
  return datosDemo
}
