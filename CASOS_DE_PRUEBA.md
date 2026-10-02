# Casos de prueba — FarmaciaCerca

Plan ejecutado con Playwright contra el servidor de desarrollo (`npm run dev`, http://localhost:5173).
Viewport de escritorio: 1280 × 900. Catálogo local: snapshot CNPM + PAMI (`public/datos/catalogo.json`, 116 grupos, 1.923 productos, 1.018 presentaciones). Registro de farmacias CABA (`public/datos/farmacias.json`, 1.240 farmacias).

| ID | Caso | Resultado |
|----|------|-----------|
| CP-01 | Carga inicial y layout | OK. Aprobado |
| CP-02 | Búsqueda por mínimo 3 letras | OK. Aprobado |
| CP-03 | Búsqueda por principio activo y nombre comercial | OK. Aprobado |
| CP-04 | Jerarquía de coincidencias (exacto / relacionado) | OK. Aprobado |
| CP-05 | Ordenamiento por precio y por ofertas | OK. Aprobado |
| CP-06 | Geolocalización y distancia Haversine | OK. Aprobado |
| CP-07 | Estado vacío, hint mínimo de letras y botón Limpiar | OK. Aprobado |
| CP-08 | Vista responsive y enlaces telefónicos/ruta | OK. Aprobado |

---

## CP-01 Carga inicial y layout

**Objetivo:** la app carga el catálogo local y muestra la interfaz base sin errores.

**Pasos**
1. Abrir la raíz de la aplicación.
2. Verificar estado de carga, título y aviso de fuentes.

**Esperado**
- Título principal "FarmaciaCerca" visible.
- Sección de búsqueda con placeholder adecuado.
- Aviso de fuentes visible con vigencia CNPM.
- No aparecen errores en consola.

**Resultado real**
- Interfaz cargada correctamente. Consola limpia. JSON `/datos/catalogo.json` y `/datos/farmacias.json` responden HTTP 200.

---

## CP-02 Búsqueda por mínimo 3 letras

**Objetivo:** la búsqueda exige al menos 3 caracteres, tal como indica la API oficial.

**Pasos**
1. Escribir `ab` en el campo de búsqueda.
2. Escribir `ibu` (3 letras).
3. Escribir `ibup` (4).

**Esperado**
- Con `ab`: título "Buscá un medicamento para ver precios", hint "Escribí 1 letra más para buscar". Sin resultados.
- Con `ibu`: se muestran resultados (≥1 grupo).
- Con `ibup`: se muestran resultados (jerarquía correcta).

**Resultado real**
- `ab`: cumple el mínimo (hint correcto).
- `ibu`: 12 composiciones (7 que coinciden + 5 relacionadas). El principio activo `ibuprofeno` aparece como **Principio activo** en primer lugar.
- `ibup`: 13 composiciones (6 que coinciden + 7 relacionadas), `ibuprofeno` continúa como primer resultado exacto.

---

## CP-03 Búsqueda por principio activo y nombre comercial

**Objetivo:** soportar búsqueda por principio activo o nombre comercial. Se respeta el prefijo por palabra (no se desplaza el principio activo por coincidencias parciales en marcas).

**Pasos**
1. Escribir `ibuprofeno`.
2. Escribir `actron`.
3. Escribir `buscapina`.
4. Escribir `paracetamol`.

**Esperado**
- `ibuprofeno`: 1 composición que coincide (Principio activo: ibuprofeno), resto relacionadas (asociaciones).
- `actron`: resultados clasificados como **Nombre comercial** (principalmente grupos que contienen ibuprofeno u otras asociaciones).
- `buscapina`: resultados clasificados como **Nombre comercial** (asociaciones hioscina + n-butilbr. + ibuprofeno/paracetamol).
- `paracetamol`: principio activo en primer lugar cuando coincide por palabra completa.

**Resultado real**
- `ibuprofeno`: 13 composiciones (1 coincide + 12 relacionadas). Primer resultado: badge **Principio activo**, nombre `ibuprofeno`, 159 productos en 78 presentaciones.
- `actron`: 3 composiciones que coinciden, todas con badge **Nombre comercial** e incluyen grupos con ibuprofeno.
- `buscapina`: 2 composiciones que coinciden (**Nombre comercial**) — `hioscina + n-butilbr. + ibuprofeno` y `hioscina + n-butilbr. + paracetamol`.
- `paracetamol`: 18 composiciones (4 coinciden + 14 relacionadas). Primer resultado: **Principio activo** `paracetamol` (82 productos en 61 presentaciones).

---

## CP-04 Jerarquía de coincidencias (exacto / relacionado)

**Objetivo:** una coincidencia por prefijo/palabra completa tiene prioridad sobre coincidencias parciales en nombres comerciales. Coincidencias parciales solo se aceptan con ≥4 letras.

**Pasos**
1. Comparar resultados para `ibu`, `ibup`, `ibuprofeno`.
2. Verificar que `ibuprofeno` (grupo monofármaco) aparece con badge **Principio activo** y primero en la sección de coincidencias.
3. Verificar que las asociaciones aparecen como **Relacionado/Asociación** según corresponda.

**Esperado**
- `ibu`: grupo `ibuprofeno` con badge **Principio activo** aparece en primer lugar (no desplazado por marcas que contienen "ibu").
- `ibuprofeno`: exactamente 1 coincidencia exacta (principio activo puro). Las asociaciones que lo contienen aparecen en "relacionadas".
- `xyzqqq`: sin resultados.

**Resultado real**
- `ibu`: primer resultado **Principio activo** `ibuprofeno`. Se mantienen separados "composiciones que coinciden" vs "relacionadas".
- `ibuprofeno`: 1 composición que coincide (**Principio activo**). Asociaciones (`ibuprofeno + codeína`, `ibuprofeno + cafeína`, etc.) aparecen correctamente como **Asociación** en la sección de relacionadas.
- `xyzqqq`: 0 composiciones. Título y hint coherentes.

---

## CP-05 Ordenamiento por precio y por ofertas

**Objetivo:** permitir ordenar los resultados mostrados.

**Pasos**
1. Buscar `ibuprofeno`.
2. Cambiar orden a "Menor precio primero", "Mayor precio primero", "Más ofertas primero", "Por nombre (A–Z)".

**Esperado**
- "Menor precio primero": ordena por `precioDesde` ascendente.
- "Mayor precio primero": descendente.
- "Más ofertas primero": por `totalProductos` descendente.
- "Por nombre (A–Z)": alfabético por etiqueta del grupo.

**Resultado real**
- El selector de orden funciona sobre los resultados listados. Los grupos con menor precioDesde aparecen primero en ascendente. El conteo de presentaciones/ofertas se respeta en cada tarjeta.

---

## CP-06 Geolocalización y distancia Haversine

**Objetivo:** calcular distancias a farmacias de CABA y habilitar orden por cercanía cuando hay ubicación.

**Pasos**
1. Pulsar "Usar mi ubicación" sin conceder permiso (timeout o denegado).
2. Conceder permiso con ubicación simulada (CABA, p.ej. -34.6037, -58.3816).
3. Verificar que aparece "Ubicación activada" y distancias en las tarjetas de farmacias.
4. Ordenar por "Más cercanas primero" / "Más lejanas primero".

**Esperado**
- Sin permiso: mensaje de error legible con botón "Reintentar". La opción de ordenar por distancia puede mantenerse deshabilitada.
- Con permiso: distancias calculadas (km o m) en resultados de farmacias. Orden por distancia funciona correctamente (asc/desc).
- Cálculo Haversine aplicado correctamente.

**Resultado real**
- Comportamiento correcto ante permisos/timeout. Con ubicación activa, cada farmacia muestra su distancia respecto al punto actual. Los ordenamientos por cercanía funcionan.

---

## CP-07 Estado vacío, hint mínimo de letras y botón Limpiar

**Objetivo:** guiar al usuario cuando no hay resultados o no alcanza el mínimo.

**Pasos**
1. Buscar `ab` → verificar hint.
2. Buscar `xyzqqq` → estado vacío.
3. Usar botón "Limpiar búsqueda" para volver al estado inicial.

**Esperado**
- `ab`: "Escribí 1 letra más para buscar." (mínimo 3).
- `xyzqqq`: mensaje "Sin resultados" + explicación para intentar con principio activo o nombre comercial. Botón "Limpiar búsqueda" visible.
- Al limpiar, vuelve al estado inicial "Buscá un medicamento para ver precios".

**Resultado real**
- Todos los estados cumplen lo esperado. Botón Limpiar funciona correctamente.

---

## CP-08 Vista responsive y enlaces telefónicos/ruta

**Objetivo:** la interfaz es responsive y los enlaces de farmacia son seguros.

**Pasos**
1. Viewport 375×812 (móvil), 768×1024 (tablet), 1280×900 (desktop).
2. Buscar `ibuprofeno` y expandir presentaciones si corresponde.
3. Verificar enlace "Ver ruta" a Google Maps (coordenadas) y enlaces telefónicos (`tel:`).

**Esperado**
- Sin scroll horizontal en ningún tamaño.
- 1 columna en móvil, 2 en tablet, ≥2 o layout adaptado en desktop.
- Enlace "Ver ruta": apunta a Google Maps con `destination` (lat,lng), abre en pestaña nueva, con `rel="noreferrer"`.
- Teléfono: enlace `tel:` cuando existe.

**Resultado real**
- Layout responsive correcto en los tres viewports. Sin desbordamiento horizontal.
- Enlaces a Google Maps con coordenadas correctas, `target="_blank"`, `rel="noreferrer"`.
- Enlaces telefónicos funcionales cuando el registro tiene teléfono.

---

## Notas

- Los datos son **snapshot locales** (no scraping en runtime). Esto evita bloqueos por CORS/preflight del CNPM y garantiza reproducibilidad.
- No hay stock ni precios por sucursal: la app muestra **precio de referencia por presentación** (comparación válida solo entre laboratorios de la misma presentación). Las farmacias son un registro de CABA para "dónde comprar", no para comparar precios entre ellas.
- Cobertura inicial: **solo CABA**.
- Los scripts `npm run datos`, `npm run test:normalizacion`, `npm run test:fragmentacion`, `npm run lint`, `npm run build` pasan correctamente con los cambios aplicados.