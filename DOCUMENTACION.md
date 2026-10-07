# Documentación - FarmaciaCerca

Aplicación web para buscar medicamentos y ver **precio de referencia** + **dónde comprar** (farmacias en Ciudad de Buenos Aires). No compara precios entre farmacias ni muestra stock. Stack: React 19 + Vite 8 + Tailwind v4 + TypeScript, datos locales en `public/datos/`.

## Estructura

- `src/main.tsx` — Punto de entrada: monta `App` con `StrictMode` e importa `index.css`.
- `src/App.tsx` — Componente raíz: orquesta estado global, carga de datos, geolocalización, tema y renderiza la UI completa.
- `src/index.css` — CSS global con Tailwind v4, tema claro/oscuro vía clase `.dark` en `<html>`, tipografía Inter y resets base.
- `src/types/datos.ts` — Tipos TypeScript compartidos: catálogo, farmacias, resultados de búsqueda, geo, orden y estado de carga.
- `src/utils/busqueda.ts` — Lógica de búsqueda: normalización, índice de marcas, clasificación de coincidencias (jerarquía), ordenamiento y carga de JSON.
- `src/utils/formato.ts` — Formateo de precios (ARS), rangos, dispersión y fechas en español argentino.
- `src/utils/distance.ts` — Fórmula Haversine para distancia entre coordenadas y formateo legible (m/km).
- `src/components/SearchBar.tsx` — Barra de búsqueda con validación de mínimo 3 letras, hint dinámico y botón limpiar.
- `src/components/ResultadosLista.tsx` — Renderiza coincidencias principales y relacionadas (separadas) usando `GrupoCard`.
- `src/components/GrupoCard.tsx` — Tarjeta de una composición: badge de tipo, precio mínimo, presentaciones colapsables y explicaciones según coincidencia.
- `src/components/PresentacionFila.tsx` — Fila de una presentación: rango, más barato, dispersión y lista expandible de ofertas.
- `src/components/OrdenFiltros.tsx` — Select para ordenar resultados (precio asc/desc, más productos, nombre A-Z).
- `src/components/FarmaciasCercanas.tsx` — Directorio de farmacias CABA con filtro, distancia, teléfono y enlace a Google Maps.
- `src/components/LocationStatus.tsx` — Banner de estado de geolocalización (idle/loading/success/error) con reintento.
- `src/components/AvisoFuente.tsx` — Metadatos de fuentes (CNPM, CABA), vigencia, aviso legal y limitaciones en `<details>`.
- `src/components/ThemeToggle.tsx` — Botón para alternar tema claro/oscuro (persiste en `localStorage` y respeta `prefers-color-scheme`).
- `src/App.layout.test.tsx` — Tests de regresión de layout (vitest + testing-library): orden principal → directorio → relacionadas y estado sin coincidencias.
- `scripts/build-catalogo.mjs` — Genera `public/datos/catalogo.json`: descarga semilla PAMI, consulta CNPM por término, normaliza, agrupa por composición y presentación.
- `scripts/build-farmacias.mjs` — Genera `public/datos/farmacias.json`: descarga dataset CABA, limpia, valida coordenadas, deduplica.
- `scripts/lib/medicamentos.mjs` — Helpers puros: ingredientes, clasificación, clave de presentación, potencia, unidades, forma, precio, tipo venta, estadísticas.
- `scripts/lib/fuentes.mjs` — Helpers de red/CSV: descarga con reintentos, decodificación UTF-8/Win-1252, parser CSV con comillas y saltos de línea.
- `scripts/lib/cnpm.mjs` — Cliente CNPM: POST a `/api/vademecum`, vigencia, pausa entre peticiones.
- `scripts/verificar-normalizacion.mjs` — Tests unitarios de normalización, claves, potencia, unidades, clasificación (no falsos amigos).
- `scripts/diagnostico-fragmentacion.mjs` — Diagnóstico de fragmentación de presentaciones por abreviaturas en el catálogo generado.
- `public/datos/catalogo.json` — Snapshot del catálogo (generado por `npm run datos:catalogo`).
- `public/datos/farmacias.json` — Snapshot de farmacias CABA (generado por `npm run datos:farmacias`).
- `public/icons.svg` / `public/favicon.svg` — Assets estáticos.
- `.kombai/canvas/farmaciacerca-designs.canvas` — Canvas de diseño (Kombai): nodos 02–05 `IN USE` son la fuente de verdad visual.
- `CASOS_DE_PRUEBA.md` — Suite de pruebas Playwright (CP-01 a CP-09).
- `README.md` — Documentación de usuario/desarrollador: propósito, arquitectura, scripts, decisiones, límites, testing.

## Comandos

```
npm run dev                -> levanta servidor Vite en http://localhost:5173
npm run build              -> compila TypeScript (tsc -b) y build de producción (vite build)
npm run preview            -> previsualiza el build de producción
npm run lint               -> linter Oxlint (debe dar 0 errores)
npm run datos              -> genera catálogo Y farmacias (requiere conectividad CNPM/PAMI/CABA)
npm run datos:catalogo     -> genera public/datos/catalogo.json
npm run datos:farmacias    -> genera public/datos/farmacias.json
npm run test:normalizacion -> verifica normalización de presentaciones, potencias, dosis decimales
npm run test:fragmentacion -> diagnóstico de fragmentación por abreviaturas
npm run test:layout        -> tests de regresión de layout (vitest + jsdom)
```

## Conceptos clave que se ven en este proyecto

1. **Snapshot local de datos** — Los JSON en `public/datos/` se generan offline (`npm run datos`) y la app los carga por `fetch` en runtime. Evita CORS/preflight del CNPM y garantiza reproducibilidad.
2. **Agrupación por composición y presentación** — Una "composición" = principio activo o asociación exacta (`droga` de CNPM). Una "presentación" = misma dosis, forma, vía, potencia y unidades. Solo se comparan precios dentro de una presentación idéntica.
3. **Jerarquía de coincidencias** — `principio-activo` (exacto/prefijo) > `comercial` (nombre de marca) > `asociacion` (contiene lo buscado + más) > `relacionado` (coincidencia parcial ≥4 letras). Se renderizan en secciones separadas.
4. **Normalización robusta** — `normalizar()` quita acentos, pasa a minúsculas, colapsa espacios y elimina no alfanuméricos. Usada en búsqueda, claves de presentación y filtros.
5. **Clave de presentación estable** — `clavePresentacion()` unifica variantes de formato/abreviaturas (`comp.x 10` ≡ `comp. x 10`) pero **nunca** fusiona potencia o cantidad distintas (ej. `400 mg` ≠ `600 mg`).
6. **Dispersión de precios** — Ratio `max/min` por presentación. `null` si un solo laboratorio. Se muestra como "hasta X,x de diferencia" o "precios iguales".
7. **Geolocalización Haversine** — Distancia en línea recta entre usuario y farmacias CABA. Orden ascendente/descendente cuando hay ubicación; alfabético si no.
8. **Tema claro/oscuro** — Clase `.dark` en `<html>` controlada por `localStorage` + `prefers-color-scheme`. Tailwind `dark:` variant.
9. **Accesibilidad** — Semántica (`<header>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`), `aria-*`, `role`, `sr-only`, `rel="noreferrer"` + `target="_blank"` en enlaces externos, `aria-live` en estados.
10. **Tests de layout** — `vitest` + `jsdom` + `@testing-library/react` verifican el orden visual: coincidencias principales → directorio CABA → relacionadas, y que sin coincidencia principal el directorio sigue disponible.

## Árbol de dependencias

index.html
  └─ src/main.tsx ✅
       ├─ src/index.css ✅
       └─ src/App.tsx ✅
            ├─ src/components/SearchBar.tsx ✅
            ├─ src/components/ResultadosLista.tsx ✅
            │    └─ src/components/GrupoCard.tsx ✅
            │         └─ src/components/PresentacionFila.tsx ✅
            ├─ src/components/OrdenFiltros.tsx ✅
            ├─ src/components/FarmaciasCercanas.tsx ✅
            │    └─ src/components/LocationStatus.tsx ✅ (renderizado condicional)
            ├─ src/components/AvisoFuente.tsx ✅
            ├─ src/components/ThemeToggle.tsx ✅
            ├─ src/utils/busqueda.ts ✅
            ├─ src/utils/formato.ts ✅
            ├─ src/utils/distance.ts ✅
            └─ src/types/datos.ts ✅
src/App.layout.test.tsx ✅ (importa App y types, usa vitest/testing-library)
scripts/build-catalogo.mjs ✅ (usa scripts/lib/medicamentos.mjs, fuentes.mjs, cnpm.mjs)
scripts/build-farmacias.mjs ✅ (usa scripts/lib/fuentes.mjs)
scripts/verificar-normalizacion.mjs ✅ (usa scripts/lib/medicamentos.mjs)
scripts/diagnostico-fragmentacion.mjs ✅ (lee public/datos/catalogo.json)

## Cómo cambiar cosas típicas

- **Color del header / botones**: edita clases Tailwind en `src/App.tsx` (header) y componentes (`bg-sky-600`, `hover:bg-sky-50`, etc.).
- **Mínimo de letras para buscar**: cambia `MIN_LETRAS = 3` en `src/utils/busqueda.ts` (línea 11) y `scripts/lib/cnpm.mjs` (línea 2).
- **Puerto del servidor**: `npm run dev -- --port 5173 --strictPort` (ya configurado en package.json).
- **Umbral de coincidencia parcial**: `MIN_LETRAS_PARCIAL = 4` en `src/utils/busqueda.ts` (línea 56).
- **Cantidad inicial de presentaciones/farmacias visibles**: `PRESENTACIONES_INICIALES = 4` en `GrupoCard.tsx`, `VISIBLES_INICIALES = 8` / `VISIBLES_COMPACTAS = 2` en `FarmaciasCercanas.tsx`.
- **Regenerar datos**: `npm run datos` (tarda varios minutos por las pausas a CNPM). No regenerar innecesariamente: hace ruido en el diff.

## API / Endpoints (fuentes externas usadas en scripts)

| Método | URL | Qué hace |
|--------|-----|----------|
| GET | `http://datos.pami.org.ar/.../rank-medicamento-consumido-.csv` | Descarga semilla PAMI (ranking medicamentos más consumidos) |
| POST | `https://cnpm.msal.gov.ar/api/vademecum` | Consulta Vademécum por término (body: `{searchdata: "termino"}`) |
| GET | `https://cnpm.msal.gov.ar/api/vigencia` | Obtiene vigencia del Vademécum |
| GET | `https://cdn.buenosaires.gob.ar/.../farmacias.csv` | Descarga registro oficial de farmacias CABA |

## Paleta (variables Tailwind v4 / CSS)

| Variable | Valor | Uso |
|----------|-------|-----|
| `--color-sky-600` | `#0284c7` | Brand principal (logo, enlaces, badges "Principio activo") |
| `--color-slate-50` | `#f8fafc` | Fondo claro base |
| `--color-slate-950` | `#020617` | Fondo oscuro base |
| `dark:` variant | clase `.dark` en `<html>` | Alterna todo el esquema de color |

---

*Documentado por Ali Valentín Tovar Morales*