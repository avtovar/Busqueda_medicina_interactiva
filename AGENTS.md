# FarmaciaCerca — contexto para futuras sesiones

Aplicación web para buscar medicamentos y ver **precio de referencia** + **dónde comprar**
(farmacias en Ciudad de Buenos Aires). No compara precios entre farmacias ni muestra stock.

Stack: React 19 + Vite 8 + Tailwind v4 + TypeScript, datos locales en `public/datos/`.

---

## Estado actual (fin de sesión 2026-10-02)

- `HEAD` y `origin/main` están en **`70e813c`** (commit inicial, ya pusheado a GitHub).
- Hay **trabajo sin commitear** en el working tree. **No commitear sin aprobación explícita del
  usuario**: hay una persona externa probando la versión de GitHub y su feedback se pidió
  antes de commitear.
- Una persona está testeando la versión anterior (`70e813c`) descargando de GitHub. Los cambios
  locales no están pusheados, así que lo que pruebe es el "antes".

---

## Qué se hizo en la última sesión

Alineación del código con los nodos `IN USE` del canvas de Kombai
(`.kombai/canvas/farmaciacerca-designs.canvas`):

- Copy exacto de los nodos 02–05 (desktop con/sin resultados, mobile con/sin resultados).
- Se agregó la prop `consulta` a `GrupoCard` para interpolar el término buscado en la
  explicación de asociaciones.
- Se añadió la línea de explicación para tarjetas de tipo `Relacionado`.
- Se añadió `Sin ubicación para calcular distancia` en las tarjetas de farmacia sin GPS.
- Se unificó el subtítulo de "Farmacias registradas en CABA".
- Correcciones de acentos en los datos (`autónoma`, `dispersión`, `presentación`, `más`,
  `ubicación`) en `scripts/build-catalogo.mjs`, `scripts/build-farmacias.mjs` y los JSON.

## Decisiones de diseño (no revertir sin preguntar)

- **Canvas**: los nodos `IN USE` (02–05) son la fuente de verdad del diseño.
- **Vista 01 "Búsqueda primero · BETA"**: está **archivada como referencia histórica**, no es un
  pendiente. Quedó superada por "Dos tareas claras". Está documentado en el README.
- **Deriva de copy en el canvas**: los nodos mobile (04–05) tienen texto viejo respecto de
  desktop (02–03). **Rige el texto de desktop.** Está anotado en el README.
- El usuario pidió explícitamente: preguntar antes de cambiar y decidir antes de modificar.

---

## Problema de datos abierto (documentado, sin resolver a propósito)

El grupo `dexibuprofeno` del catálogo contiene un producto `CEFALEX VL` (cefalexina).
Causa: la agrupación usa el campo `DROGA` de CNPM sin verificación cruzada.
**Decisión conscious: NO se filtran datos por heurística** (riesgo de ocultar información en una
app de salud). Se muestra lo que declara la fuente y se documenta el límite en el README.
El usuario dijo: dejarlo aclarado por ahora y evaluar una solución después.

Posible solución futura: persistir el campo `ACCION` de CNPM (se captura pero se descarta) para
poder cruzar datos y detectar inconsistencias.

---

## Verificación obligatoria antes de dar cualquier cosa por terminada

```bash
npm run lint          # oxlint, debe dar 0 errores
npm run build         # tsc -b && vite build
npm run test:normalizacion
npm run test:fragmentacion
npm run test:layout   # vitest (jsdom)
```

Los datos se generan con `npm run datos` (requiere conectividad a CNPM/PAMI/CABA).
**No regenerar datos innecesariamente**: hace ruido en el diff y los JSON son grandes.
Para cambios de copy no hace falta tocar datos.

---

## Notas del entorno (Windows PowerShell 5.1)

- `curl` es un alias de `Invoke-WebRequest` y falla con URLs. Usar `Invoke-WebRequest`.
- `&&`, `rg`, `grep`, `wc`, `sed`, `head` no funcionan o no están disponibles. Encadenar con `;`.
- Para parsear el canvas (que tiene un encabezado antes del JSON), usar Node:
  `JSON.parse(raw.slice(raw.indexOf('{')))`. `ConvertFrom-Json` de PowerShell falla.

## Herramientas de inspección del canvas

- `tools/inspect-canvas.mjs` — resumen de un nodo.
- `tools/canvas-texto-visible.mjs` — extrae el texto visible de un nodo (muy útil para diff de copy).

## Despliegue / servidor

- Arranque: `npm run dev -- --port 5173 --strictPort`.
- Si aparece un puerto ocupado, buscar y cerrar procesos `node` viejos de Vite antes de reintentar.