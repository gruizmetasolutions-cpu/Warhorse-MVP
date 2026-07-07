import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'

// El tour de onboarding se auto-dispara en el primer ingreso por rol; en los
// tests se marca como visto por defecto (el test del tour lo limpia a mano).
beforeEach(() => {
  for (const rol of ['admin', 'taller', 'compras', 'diesel']) {
    localStorage.setItem('wh-tour-visto-' + rol, '1')
  }
})
