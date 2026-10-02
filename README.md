# FarmaciaCerca

Aplicación web para buscar medicamentos y ver **precio de referencia** + **dónde comprar** (farmacias en Ciudad de Buenos Aires). No compara precios entre farmacias ni muestra stock.

## Propósito

- Mostrar **precio de referencia** por presentación (misma dosis, forma y cantidad). Solo se comparan precios entre laboratorios dentro de una misma presentación.
- Indicar **dónde comprar**: listado de farmacias registradas en CABA con coordenadas, dirección y teléfono.
- Búsqueda por **principio activo** o **nombre comercial**, con jerarquía clara (principio activo > comercial > asociación > relacionado).
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

## Desarrollo

```bash
# Instalar dependencias
npm ci

# Generar datos locales (requiere conectividad para CNPM/PAMI)
npm run datos

# Ejecutar tests de normalización y diagnóstico
npm run test:normalizacion
npm run test:fragmentacion

# Lint + build
npm run lint && npm run build

# Desarrollo
npm run dev
```

## Decisiones de diseño

- **Mínimo 3 letras** para buscar (coincide con CNPM). Para coincidencias parciales **dentro de palabras** se exige ≥ 4 letras para evitar que marcas desplazen al principio activo.
- **Prefijo por palabra**: `ibu` encuentra `ibuprofeno` por palabra completa, no por substring arbitrario.
- **Comparación válida únicamente por presentación**: dosis, forma, vía, potencia y unidades deben coincidir. No se fusionan potencias/cantidades distintas (p.ej. `400 mg comp.x 10` ≠ `600 mg comp.x 10`).
- **Clasificación de resultados**: `principio-activo` > `comercial` > `asociación` > `relacionado`. Las asociaciones aparecen separadas con aclaración explicativa.
- **Geolocalización**: Haversine sobre farmacias de CABA. Orden por cercanía disponible cuando hay ubicación activa.
- **Accesibilidad**: enlaces externos con `rel="noreferrer"`, `target="_blank"` cuando corresponde. Estructura semántica y aria donde aplica.
- **Snapshot local**: el POST de CNPM requiere JSON y tiene restricciones de preflight; usar JSON generados evita bloqueos CORS en runtime.

## Límites conocidos

- Cobertura **solo CABA**.
- Catálogo limitado a los términos derivados de la semilla PAMI (no es el Vademécum completo).
- **Precios de referencia**, no precios confirmados por farmacia. No hay stock ni disponibilidad por sucursal.
- No existe descarga pública completa de CNPM; el snapshot debe regenerarse para actualizar vigencia.

## Testing

Ver [CASOS_DE_PRUEBA.md](./CASOS_DE_PRUEBA.md) para la suite de pruebas ejecutada con Playwright.