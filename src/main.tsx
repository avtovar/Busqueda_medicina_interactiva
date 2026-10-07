import { StrictMode } from 'react'
// ↑ Modo estricto de React: ayuda a detectar efectos secundarios y patrones inseguros en desarrollo
import { createRoot } from 'react-dom/client'
// ↑ createRoot es la API moderna (React 18+) para crear la raíz de la app en un nodo del DOM
import './index.css'
// ↑ Importa el CSS global (Tailwind v4 + resets + tema claro/oscuro). Vite lo inyecta en <style>.
import App from './App.tsx'
// ↑ Importa el componente raíz de la aplicación

createRoot(document.getElementById('root')!).render(
  // ↑ Busca el div #root en index.html y crea la raíz de React allí. El ! le dice a TS que nunca es null.
  <StrictMode>
    {/* ↑ StrictMode monta/desmonta dos veces en dev para encontrar bugs de limpieza (useEffect, etc.) */}
    <App />
    {/* ↑ Renderiza el componente App como hijo de la raíz */}
  </StrictMode>,
)
