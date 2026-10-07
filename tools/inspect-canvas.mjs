import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const ruta = process.argv[2] ?? '.kombai/canvas/farmaciacerca-designs.canvas'
const modo = process.argv[3] ?? 'resumen'

const raw = readFileSync(ruta, 'utf8')
const doc = JSON.parse(raw.slice(raw.indexOf('{')))
const nodos = doc.nodes ?? {}

// 1. Comentarios del canvas
console.log('=== COMENTARIOS DEL CANVAS ===')
const comentarios = doc.comments ?? []
if (comentarios.length === 0) console.log('(ninguno)')
for (const c of comentarios) {
  const nodo = nodos[c.nodeId ?? '']
  console.log(`- [${c.created ?? ''}] en "${nodo?.label ?? c.nodeId}": ${c.text ?? c.content ?? JSON.stringify(c)}`)
}
console.log('')

// 2. Estructura de cada nodo
console.log('=== ESTRUCTURA POR NODO ===')

/** Extrae headings, botones, labels y textos visibles del HTML. */
function resumir(html) {
  const texto = (m) => m.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const out = []
  const push = (tipo, valor) => {
    if (valor) out.push(`${tipo}: ${valor}`)
  }

  for (const m of html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g)) {
    push(`H${m[1]}`, texto(m[2]))
  }
  for (const m of html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)) {
    push('BTN', texto(m[1]))
  }
  for (const m of html.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/g)) {
    push('LINK', texto(m[1]))
  }
  for (const m of html.matchAll(/data-name="([^"]+)"/g)) {
    push('NAME', m[1])
  }
  for (const m of html.matchAll(/<label[^>]*>([\s\S]*?)<\/label>/g)) {
    push('LABEL', texto(m[1]))
  }
  for (const m of html.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]*)</g)) {
    push('OPT', `${m[1]} => ${m[2].trim()}`)
  }
  for (const m of html.matchAll(/placeholder="([^"]*)"/g)) {
    push('PLACEHOLDER', m[1])
  }
  return out
}

/** Paletas usadas en el nodo. */
function colores(html) {
  const set = new Set()
  for (const m of html.matchAll(/(?:bg|text|border|ring|from|via|to)-(slate|sky|teal|indigo|amber|rose|emerald|cyan|blue)-(\d{2,3})/g)) {
    set.add(`${m[1]}-${m[2]}`)
  }
  return [...set].sort()
}

for (const [clave, n] of Object.entries(nodos)) {
  const html = n.html ?? ''
  console.log('')
  console.log('#'.repeat(78))
  console.log(`# ${clave}  ${n.label}`)
  console.log(`# ${n.rect.w}x${n.rect.h}   html=${html.length}ch`)
  console.log('#'.repeat(78))

  if (modo === 'html') {
    console.log(html)
    continue
  }

  const r = resumir(html)
  const c = colores(html)
  console.log('\n-- COLORES USADOS (' + c.length + ') --')
  console.log(c.join('  '))
  console.log('\n-- ESTRUCTURA --')
  for (const linea of r) console.log('  ' + linea)
}

if (modo === 'dump') {
  mkdirSync('tools/canvas-dump', { recursive: true })
  for (const [clave, n] of Object.entries(nodos)) {
    const archivo = `tools/canvas-dump/${clave}-${(n.label ?? 'nodo').replace(/[^\w-]+/g, '_')}.html`
    writeFileSync(archivo, n.html ?? '', 'utf8')
    console.log('escrito:', archivo)
  }
}