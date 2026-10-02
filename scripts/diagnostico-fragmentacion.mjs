import { readFileSync } from 'node:fs'

const doc = JSON.parse(readFileSync('public/datos/catalogo.json', 'utf8'))

console.log('=== TAMAÑO DE LOS GRUPOS DE PRESENTACION ===')
const todos = doc.grupos.flatMap((g) => g.presentaciones.map((p) => ({ g, p })))
const porTam = new Map()
for (const { p } of todos) porTam.set(p.ofertas.length, (porTam.get(p.ofertas.length) ?? 0) + 1)
;[...porTam.entries()].sort((a, b) => a[0] - b[0]).slice(0, 10).forEach(([n, c]) => {
  console.log(`  ${String(n).padStart(3)} laboratorios: ${String(c).padStart(4)} presentaciones`)
})

console.log('\n=== GRUPOS MONOFARMACOS (los que el usuario busca de verdad) ===')
for (const g of doc.grupos.filter((x) => !x.esAsociacion).sort((a, b) => b.totalProductos - a.totalProductos)) {
  const multi = g.presentaciones.filter((p) => p.ofertas.length > 1).length
  console.log(`\n  ${g.etiqueta.toUpperCase()}  (${g.totalProductos} productos, ${g.presentaciones.length} presentaciones, ${multi} comparables)`)
  g.presentaciones
    .slice(0, 14)
    .forEach((p) => console.log(`     ${p.ofertas.length === 1 ? ' ' : '*'} ${p.clave.padEnd(34)} ${String(p.ofertas.length).padStart(2)} labs  $${p.precioMin} - $${p.precioMax}`))
  if (g.presentaciones.length > 14) console.log(`     ... y ${g.presentaciones.length - 14} mas`)
}

console.log('\n=== POSIBLES FUSIONES PENDIENTES: claves que se parecen mucho ===')
const mono = doc.grupos.filter((x) => !x.esAsociacion)
for (const g of mono.slice(0, 6)) {
  const claves = g.presentaciones.map((p) => p.clave)
  const casi = new Map()
  for (const a of claves) {
    for (const b of claves) {
      if (a === b) continue
      const base = (s) => s.replace(/\b\w{2,7}\b/g, '').replace(/\s+/g, '').trim()
      if (base(a) === base(b) && base(a).length > 4) {
        if (!casi.has(a)) casi.set(a, new Set())
        casi.get(a).add(b)
      }
    }
  }
  if (casi.size === 0) continue
  console.log(`\n  ${g.etiqueta}:`)
  for (const [a, bs] of casi) console.log(`     "${a}"  <->  ${[...bs].map((x) => `"${x}"`).join(', ')}`)
}

console.log('\n=== PALABRAS MAS FRECUENTES EN LAS CLAVES (para ampliar el diccionario) ===')
const palabras = new Map()
for (const { p } of todos) for (const w of p.clave.split(/\s+/)) palabras.set(w, (palabras.get(w) ?? 0) + 1)
;[...palabras.entries()].sort((a, b) => b[1] - a[1]).slice(0, 55).forEach(([w, c]) => {
  console.log(`  ${String(c).padStart(4)}  ${w}`)
})
