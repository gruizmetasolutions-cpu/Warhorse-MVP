import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <h1>Warhorse</h1>
  </StrictMode>,
)
