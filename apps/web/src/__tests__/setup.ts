import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'

// El tour se auto-dispara en el primer ingreso (localStorage wh_tour_v1);
// en los tests se marca como visto por defecto y el test del tour lo limpia.
beforeEach(() => {
  localStorage.setItem('wh_tour_v1', 'done')
})
