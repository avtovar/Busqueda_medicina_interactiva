import { readFileSync } from 'node:fs'

const raw = readFileSync('.kombai/canvas/farmaciacerca-designs.canvas', 'utf8')
const doc = JSON.parse(raw.slice(raw.indexOf('{')))

/** Texto visible de un nodo, en orden de aparición, con saltos de línea entre bloques. */
function textoVisible(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(div|section|article|li|p|h[1-6]|header|footer|main|button|label|option|dt|dd|a)>/g, '\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&middot;/g, '·')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&[a-z]+;/gi, ' ')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

const objetivo = process.argv[2] ?? 'var_76c29374a767'
const n = doc.nodes[objetivo]
if (!n) {
  console.error('nodo no encontrado:', objetivo)
  console.error('disponibles:', Object.keys(doc.nodes).join(', '))
  process.exit(1)
}

console.log('### ' + objetivo + '  ' + n.label + '  (' + n.rect.w + 'x' + n.rect.h + ')')
console.log('### ' + textoVisible(n.html).length + ' lineas de texto visible\n')

const lineas = textoVisible(n.html)
lineas.forEach((l, i) => {
  console.log(String(i + 1).padStart(3, ' ') + '  ' + l)
})