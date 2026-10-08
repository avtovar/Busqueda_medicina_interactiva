import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* ↑ StrictMode monta/desmonta dos veces en dev para encontrar bugs de limpieza (useEffect, etc.) */}
    <App />
    {/* ↑ Renderiza el componente App como hijo de la raíz */}
  </StrictMode>,
)
