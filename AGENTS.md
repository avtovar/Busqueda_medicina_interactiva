# FarmaciaCerca — contexto para futuras sesiones

Aplicación web para buscar medicamentos y ver **precio de referencia** + **dónde comprar**
(farmacias en Ciudad de Buenos Aires). No compara precios entre farmacias ni muestra stock.

Stack: React 19 + Vite 8 + Tailwind v4 + TypeScript, datos locales en `public/datos/`.

---

## Estado actual (2026-10-07)

- `HEAD` está en **`0279e3d`** (commit: correcciones P0 — focus visible, teléfonos, comentarios JSX).
- Fork subido a: **https://github.com/avtovar/Busqueda_medicina_interactiva**
- El repo original (`brianhcaro/Busqueda_medicina`) sigue en `70e813c`.
- `DOCUMENTACION.md` creado con estructura, comandos, conceptos clave, árbol de dependencias, API, paleta.
- Comentarios estilo `// ↑` **eliminados del código fuente** (se renderizaban en JSX).
- `.gitignore` actualizado con `no_subir/` y patrones de secretos.
- Regla `react/jsx-no-comment-textnodes` en `.oxlintrc.json` para prevenir regresión.

---

## Correcciones P0 aplicadas (2026-10-07)

| ID | Problema | Solución |
|----|----------|----------|
| P0-1 | Comentarios `// ↑` visibles en pantalla (18 en inicio, 64 con resultados) | Eliminados con `sed`; regla `react/jsx-no-comment-textnodes: error` en oxlint |
| P0-2 | Foco de teclado invisible (contraste 1.11:1) | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700` en 12 componentes |
| P0-3 | 79 enlaces `tel:` rotos (números concatenados) | `extraerTelefonos()` separa por espacios, `/`, ` y `, `;`, `,`; un enlace por número válido |

---

## Comandos clave

```bash
npm run dev                # Vite en http://localhost:5173
npm run build              # tsc -b && vite build
npm run lint               # oxlint (0 errores obligatorio)
npm run test:layout        # vitest + jsdom (2 tests)
npm run test:normalizacion # tests unitarios de normalización
npm run test:fragmentacion # diagnóstico fragmentación presentaciones
npm run datos              # regenera catálogo + farmacias (requiere red CNPM/PAMI/CABA)
```

**Orden obligatorio antes de cerrar:** `lint → build → test:layout → test:normalizacion → test:fragmentacion`

---

## Decisiones de diseño (no revertir sin preguntar)

- **Canvas**: nodos `IN USE` (02–05) = fuente de verdad visual.
- **Vista 01 "Búsqueda primero · BETA"**: archivada, no es pendiente.
- **Copy mobile vs desktop**: rige texto de desktop (nodos 02–03).
- **Preguntar antes de cambiar** — preferencia explícita del usuario.

---

## Problema de datos conocido (no resolver sin preguntar)

Grupo `dexibuprofeno` contiene `CEFALEX VL` (cefalexina). Causa: agrupación por campo `DROGA` de CNPM sin cruce. **Decisión: no filtrar por heurística** (riesgo en app de salud). Solución futura: persistir campo `ACCION` (se captura, se descarta).

---

## Entorno (Windows PowerShell 5.1)

- `curl` = alias de `Invoke-WebRequest` (falla con URLs). Usar `Invoke-WebRequest`.
- `&&`, `rg`, `grep`, `wc`, `sed`, `head` no existen. Encadenar con `;`.
- Canvas tiene encabezado antes del JSON: parsear con Node:
  `JSON.parse(raw.slice(raw.indexOf('{')))`. `ConvertFrom-Json` falla.

---

## Herramientas canvas

- `tools/inspect-canvas.mjs` — resumen de nodo.
- `tools/canvas-texto-visible.mjs` — texto visible (diff de copy).

---

## Despliegue

```bash
npm run dev -- --port 5173 --strictPort
```
Si puerto ocupado: cerrar procesos `node` viejos de Vite antes de reintentar.

---

## Documentación generada

- `DOCUMENTACION.md` — firma: *Ali Valentín Tovar Morales*
- Comentarios educativos movidos a `DOCUMENTACION.md` (ya no en código fuente)