import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Catalogo, Farmacia, GrupoComposicion, Farmacias } from './types/datos'
import App from './App'

// ── Fixtures mínimos para testear layout ──

const presentacionPrincipal = {
  clave: 'ibuprofeno-400-mg-comp-10',
  presentacion: '400 mg comp.x 10',
  forma: 'Comprimido',
  via: 'Oral',
  potencia: { valor: 400, unidad: 'mg' },
  unidades: 10,
  precioMin: 100,
  precioMax: 100,
  precioMediana: 100,
  dispersion: null,
  economico: { nombre: 'ibuprofeno 400 mg comp.x 10', laboratorio: 'Lab Test', precio: 100 },
  ofertas: [
    {
      gtin: 'test-gtin-principal',
      nombre: 'ibuprofeno 400 mg comp.x 10',
      laboratorio: 'Lab Test',
      precio: 100,
      precioPami: null,
      tipoVenta: 'Venta Libre' as const,
    },
  ],
}

const grupoPrincipal: GrupoComposicion = {
  clave: 'ibuprofeno',
  etiqueta: 'ibuprofeno',
  droga: 'ibuprofeno',
  ingredientes: ['ibuprofeno'],
  esAsociacion: false,
  totalProductos: 1,
  presentaciones: [presentacionPrincipal],
}

const grupoRelacionado: GrupoComposicion = {
  clave: 'ibuprofeno-cafeina',
  etiqueta: 'ibuprofeno + cafeína',
  droga: 'ibuprofeno+cafeina',
  ingredientes: ['ibuprofeno', 'cafeina'],
  esAsociacion: true,
  totalProductos: 1,
  presentaciones: [
    {
      ...presentacionPrincipal,
      clave: 'ibuprofeno-cafeina-400-mg-comp-10',
      presentacion: 'Asociación de prueba comp.x 10',
      economico: { nombre: 'combinado de prueba', laboratorio: 'Lab Test', precio: 120 },
      ofertas: presentacionPrincipal.ofertas.map((oferta) => ({
        ...oferta,
        gtin: 'test-gtin-relacionado',
        nombre: 'combinado de prueba',
        precio: 120,
      })),
    },
  ],
}

const catalogo: Catalogo = {
  meta: {
    generadoEn: '2026-01-01',
    vigencia: '2026-01',
    fuente: 'Fuente de prueba',
    semilla: 'Fixture de test',
    aviso: 'Catálogo de prueba parcial.',
    totalTerminos: 1,
    totalFilasSemilla: 1,
    totalPrincipiosActivosSemilla: 1,
    totalMarcasSemilla: 0,
    totalProductos: 2,
    totalGrupos: 2,
    rangoRankSemilla: [1, 1],
  },
  grupos: [grupoPrincipal, grupoRelacionado],
}

const farmacia: Farmacia = {
  id: 'farmacia-test',
  nombre: 'Farmacia de prueba',
  lat: -34.6,
  lng: -58.4,
  telefono: null,
  direccion: 'Calle de prueba 123',
  barrio: 'Balvanera',
  comuna: 'Comuna 3',
}

const farmacias: Farmacias = {
  meta: {
    generadoEn: '2026-01-01',
    fuente: 'Registro de prueba',
    cobertura: 'CABA',
    totalFarmacias: 1,
    conTelefono: 0,
    aviso: 'Registro de prueba.',
  },
  farmacias: [farmacia],
}

// ── Helper de aserción de orden en el DOM ──

function expectBefore(first: Element, second: Element) {
  expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
}

// ── Setup/teardown por test ──

beforeEach(() => {
  window.localStorage.clear()
  window.matchMedia = vi.fn().mockImplementation((media: string) => ({
    matches: false,
    media,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => ({
      ok: true,
      json: async () => String(input).endsWith('/datos/catalogo.json') ? catalogo : farmacias,
    }) as Response),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

// ── Tests de regresión de layout ──

describe('FarmaciaCerca result and directory layout', () => {
  it('places the independent CABA directory between principal and related matches', async () => {
    render(<App />)
    const search = await screen.findByRole('searchbox', { name: /buscar por principio activo/i })
    fireEvent.change(search, { target: { value: 'ibuprofeno' } })

    const relatedHeading = await screen.findByRole('heading', { name: 'Coincidencias relacionadas' })
    const principalHeading = screen.getByRole('heading', { name: 'Coincidencias principales' })
    const pharmacyHeading = screen.getByRole('heading', { name: 'Farmacias registradas en CABA' })
    const principalCard = screen.getByRole('heading', { name: 'ibuprofeno' }).closest('article')

    expect(principalCard).not.toBeNull()
    expectBefore(principalHeading, pharmacyHeading)
    expectBefore(principalCard!, pharmacyHeading)
    expectBefore(pharmacyHeading, relatedHeading)
  })

  it('keeps the CABA directory visible for a no-match search without related results', async () => {
    render(<App />)
    const search = await screen.findByRole('searchbox', { name: /buscar por principio activo/i })
    fireEvent.change(search, { target: { value: 'xyzqqq' } })

    const noMatchHeading = await screen.findByRole('heading', { name: /sin resultados para/i })
    const emptyMessage = screen.getByRole('heading', { name: 'No encontramos coincidencias' })
    const pharmacyHeading = screen.getByRole('heading', { name: 'Farmacias registradas en CABA' })

    expect(screen.queryByRole('heading', { name: 'Coincidencias relacionadas' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Coincidencias principales' })).toBeNull()
    expectBefore(noMatchHeading, pharmacyHeading)
    expectBefore(emptyMessage, pharmacyHeading)
  })
})
