# FarmaciaCerca

Aplicación web para buscar medicamentos y ver **precio de referencia** + **dónde comprar** (farmacias en Ciudad de Buenos Aires). No compara precios entre farmacias ni muestra stock.

## Propósito

- Mostrar **precio de referencia** por presentación (misma dosis, forma y cantidad). Solo se comparan precios entre laboratorios dentro de una misma presentación.
- Indicar **dónde comprar**: listado de farmacias registradas en CABA con coordenadas, dirección y teléfono.
- Búsqueda por **principio activo** o **nombre comercial**, con jerarquía clara (principio activo > comercial > asociación > relacionado).
- **Muestra la marca coincidente** cuando la búsqueda es por nombre comercial.
- Datos **locales** (snapshot pre-generado): funciona offline una vez construida y evita depender de CORS en tiempo de ejecución.

## Arquitectura de datos

### Catálogo (precios + composición)
Fuente: [Vademécum Nacional de Medicamentos (CNPM)](https://cnpm.msal.gov.ar/) consultado a partir de una semilla del [ranking de medicamentos más consumidos (PAMI)](http://datos.pami.org.ar/dataset/71fc4db2-11f8-4f28-a836-eb799174ae61/resource/d0aa734f-8eaa-4df7-ba1c-8a3c1b553b07/download/rank-medicamento-consumido-.csv).

- Generador: `scripts/build-catalogo.mjs` → consulta CNPM por término (mínimo 3 letras), normaliza presentaciones, agrupa por **composición** (`droga`) y por **presentación** (clave estable).
- Salida: `public/datos/catalogo.json` (cargado por fetch en runtime).
- Metadatos incluyen `vigencia` del Vademécum, fecha de generación y estadísticas de la semilla.

### Farmacias (CABA)
Fuente: [Farmacias — Buenos Aires Data](https://cdn.buenosaires.gob.ar/datosabiertos/datasets/ministerio-de-salud/farmacias/farmacias.csv).

- Generador: `scripts/build-farmacias.mjs` → limpieza, normalización y validación de coordenadas.
- Salida: `public/datos/farmacias.json` (1.240 farmacias, cobertura CABA).

## Requisitos

- Node.js 18+
- npm

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Compila TypeScript (`tsc -b`) y construye para producción (`vite build`) |
| `npm run preview` | Previsualiza el build de producción |
| `npm run lint` | Linter (Oxlint) |
| `npm run datos` | Genera catálogo y farmacias: `datos:catalogo && datos:farmacias` |
| `npm run datos:catalogo` | Genera `public/datos/catalogo.json` desde CNPM + semilla PAMI |
| `npm run datos:farmacias` | Genera `public/datos/farmacias.json` desde dataset CABA |
| `npm run test:normalizacion` | Verifica normalización de presentaciones, potencias y dosis decimales |
| `npm run test:fragmentacion` | Diagnóstico de fragmentación de presentaciones por abreviaturas |
| `npm run test:layout` | Regresión de orden principal → directorio → relacionadas y estado sin coincidencias |

## Desarrollo

```bash
# Instalar dependencias
npm ci

# Generar datos locales (requiere conectividad para CNPM/PAMI)
npm run datos

# Ejecutar tests de normalización, diagnóstico y layout
npm run test:normalizacion
npm run test:fragmentacion
npm run test:layout

# Lint + build
npm run lint && npm run build

# Desarrollo
npm run dev
```

## Formas de buscar

| Qué escribís | Qué busca | Resultado principal | Badge |
|---|---|---|---|
| `ibuprofeno`, `ibu`, `paracetamol` | Principio activo (prefijo por palabra) | Grupo monofármaco `ibuprofeno` | **Principio activo** 🔵 |
| `Actron`, `Ibupirac`, `Buscapina` | Nombre comercial (marca) | Grupo del principio activo + **Marca: Actron, Ibupirac** | **Nombre comercial** 🟣 |
| `ibuprofeno cafeina`, `hioscina ibuprofeno` | Asociación (múltiples principios) | Grupos que contienen ambos | **Asociación** 🟠 |
| `profeno`, `tamol` (≥4 letras) | Coincidencia parcial dentro de palabra | Grupos relacionados | **Relacionado** ⚪ |

**Reglas:**
- Mínimo **3 letras** para buscar (coincide con CNPM).
- **Prefijo por palabra**: `ibu` encuentra `ibuprofeno` (no substring arbitrario).
- Coincidencia parcial **≥4 letras** para evitar falsos positivos.
- Jerarquía de resultados: **Principio activo > Nombre comercial > Asociación > Relacionado**.
- Al buscar por marca, la tarjeta muestra **"Marca: Actron, Ibupirac"** en color índigo.

## Decisiones de diseño

- **Mínimo 3 letras** para buscar (coincide con CNPM). Para coincidencias parciales **dentro de palabras** se exige ≥ 4 letras para evitar que marcas desplazen al principio activo.
- **Prefijo por palabra**: `ibu` encuentra `ibuprofeno` por palabra completa, no por substring arbitrario.
- **Comparación válida únicamente por presentación**: dosis, forma, vía, potencia y unidades deben coincidir. No se fusionan potencias/cantidades distintas (p.ej. `400 mg comp.x 10` ≠ `600 mg comp.x 10`).
- **Clasificación de resultados**: `principio-activo` > `comercial` > `asociación` > `relacionado`. Las asociaciones aparecen separadas con aclaración explicativa.
- **Geolocalización**: Haversine sobre farmacias de CABA. Orden por cercanía disponible cuando hay ubicación activa.
- **Accesibilidad**: enlaces externos con `rel="noreferrer"`, `target="_blank"` cuando corresponde. Estructura semántica y aria donde aplica.
- **Snapshot local**: el POST de CNPM requiere JSON y tiene restricciones de preflight; usar JSON generados evita bloqueos CORS en runtime.

## Vistas de diseño (canvas Kombai)

El diseño vive en `.kombai/canvas/farmaciacerca-designs.canvas`. Contiene seis
vistas; **el código implementa las cuatro marcadas `IN USE`**.

| Nodo | Label | Estado |
| --- | --- | --- |
| `var_a17d52782a27` | `00 · Índice de vistas` | Documentación del canvas, no es una vista de producto |
| `var_7d04bac3707e` | `01 · Búsqueda primero · BETA` | **Archivada como referencia** — ver abajo |
| `var_76c29374a767` | `02 · Dos tareas claras · IN USE` | Desktop con resultados — **implementada** |
| `var_7431d544ab2c` | `03 · Dos tareas claras · Sin resultados · IN USE` | Desktop sin resultados — **implementada** |
| `var_e4fed7da5f67` | `04 · Mobile · Resultados · IN USE` | Mobile con resultados — **implementada** |
| `var_9046ac25552e` | `05 · Mobile · Sin resultados · IN USE` | Mobile sin resultados — **implementada** |

### Vista 01 (BETA): archivada, no es un pendiente

`Búsqueda primero` fue la propuesta previa. **No está pendiente de
implementación**: quedó superada por `Dos tareas claras` (nodos 02–05), que es
la que está en producción. Se conserva en el canvas a propósito, como registro
de las decisiones que motivaron el diseño actual:

- Passó de un buscador protagonista con directorio de farmacias al costado a
  **dos tareas separadas y explícitas**: primero precios de referencia, después
  el registro de farmacias.
- Se agregó la aclaración explícita de que el registro de farmacias es
  **independiente de la búsqueda** y no informa precio ni stock.
- Se separaron **coincidencias principales** de **coincidencias relacionadas**,
  con una explicación por tipo de coincidencia.
- Se añadió el bloque `Fuentes y limitaciones` con la advertencia de no consejo
  médico.

No reimplementar esta vista salvo pedido expreso: el código es compartido con
los nodos 02–05 y no puede mostrar ambas variantes a la vez.

### Deriva de copy entre nodos

Los nodos mobile (04–05) tienen texto desactualizado respecto del desktop
(02–03) en dos puntos, porque el copy del desktop se revisa después:

- La explicación de orden: mobile conserva `Ordená por el menor precio de
  referencia de cada composición…`; desktop ya usa `Ordena por el mínimo de cada
  composición…`. **Rige el texto de desktop (nodo 02).**
- Mobile escribe `Sin ubicación activada; la lista está en orden alfabético.`
  con punto y coma; desktop usa coma. **Rige el texto de desktop (nodo 02).**

## Límites conocidos

- Cobertura **solo CABA**.
- Catálogo limitado a los términos derivados de la semilla PAMI (no es el Vademécum completo).
- **Precios de referencia**, no precios confirmados por farmacia. No hay stock ni disponibilidad por sucursal.
- No existe descarga pública completa de CNPM; el snapshot debe regenerarse para actualizar vigencia.
- **Calidad del dato de origen**: la agrupación usa el campo `DROGA` de CNPM sin
  verificaciones cruzadas. Hay registros donde CNPM declara un principio activo
  que no coincide con el nombre del producto (ej. el grupo `dexibuprofeno`
  contiene `CEFALEX VL`, que es cefalexina). Se muestra lo que declara CNPM en
  lugar de filtrar, para no ocultar datos por heurística.

## Testing

Ver [CASOS_DE_PRUEBA.md](./CASOS_DE_PRUEBA.md) para la suite de pruebas ejecutada con Playwright.