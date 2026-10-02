import {
  clavePresentacion,
  extraerPotencia,
  ingredientesDe,
  clasificar,
  unidadesDe,
} from '../scripts/lib/medicamentos.mjs'

let fallos = 0
const check = (titulo, condicion, detalle = '') => {
  if (condicion) {
    console.log(`  OK   ${titulo}`)
  } else {
    console.log(`  FALLA ${titulo} ${detalle}`)
    fallos += 1
  }
}

console.log('=== A. ingredientesDe() con composiciones reales ===')
check('monofarmaco', JSON.stringify(ingredientesDe('ibuprofeno')) === '["ibuprofeno"]')
check('asociacion de 2 grupos', ingredientesDe('hioscina,n-butilbr.+ibuprofeno').length === 3)
check('asociacion de 3', ingredientesDe('clorfeniramina maleato+ibuprofeno+pseudoef.').length === 3)
check('normaliza acentos', ingredientesDe('acetilsalicílico,ác.')[0] === 'acetilsalicilico')

console.log('\n=== B. clasificar() ===')
check('monofarmaco', clasificar('ibuprofeno', ['ibuprofeno']) === 'monofarmaco')
check('asociacion', clasificar('hioscina,n-butilbr.+ibuprofeno', ['ibuprofeno']) === 'asociacion')
check('falso amigo descartado', clasificar('dexibuprofeno', ['ibuprofeno']) === 'otro')
check('otro principio descartado', clasificar('paracetamol', ['ibuprofeno']) === 'otro')
check('consulta asociacion exacta', clasificar('Losartán+hidroclorotiazida', ingredientesDe('Losartán+hidroclorotiazida')) === 'monofarmaco')
check('consulta asociacion, monofarmaco no entra', clasificar('Losartán', ingredientesDe('Losartán+hidroclorotiazida')) === 'otro')

console.log('\n=== C. clavePresentacion() unifica solo variantes de formato ===')
const misma = (a, b) => clavePresentacion(a) === clavePresentacion(b)
check('600mg escrito de 4 formas unifica',
  misma('600 mg comp.x 10', '600mg comp.x 10') &&
  misma('600 mg comp.x 10', '600 mg comp. x 10') &&
  misma('600 mg comp.x 10', '600 mg comp.x10'))
check('capsulas/gelatin unifica con cáp/gelat',
  misma('cáps.gelat.blanda x 10', 'cápsulas gelatin.blanda x 10'),
  `-> "${clavePresentacion('cáps.gelat.blanda x 10')}" vs "${clavePresentacion('cápsulas gelatin.blanda x 10')}"`)
check('susp con y sin espacios unifica', misma('susp.x 90 ml', 'susp. x 90ml'))
check('porcentaje con y sin espacio unifica', misma('2% susp.x 90 ml', '2 % susp.x 90 ml'))

console.log('\n=== D. NO debe fusionar nunca potency ni cantidad distintas ===')
const distintas = [
  ['600 mg comp.x 10', '400 mg comp.x 10'],
  ['600 mg comp.x 10', '800 mg comp.x 10'],
  ['600 mg comp.x 10', '600 mg comp.x 20'],
  ['600 mg comp.x 10', '600 mg comp.x 50'],
  ['susp.x 90 ml', 'susp.x 100 ml'],
  ['2% susp.x 90 ml', '4% susp.x 90 ml'],
  ['400 mg cáp.x 10', '400 mg comp.x 10'],
  ['comp.rec.x 20', 'comp.x 20'],
]
for (const [a, b] of distintas) {
  check(`"${a}"  !=  "${b}"`, clavePresentacion(a) !== clavePresentacion(b),
    `-> ambas dieron "${clavePresentacion(a)}"`)
}

console.log('\n=== E. puntos decimales: la dosis NUNCA puede partirse ===')
check('0.5 mg no se parte', clavePresentacion('0.5 mg comp.x 30') === '0.5 mg comp x 30',
  `-> "${clavePresentacion('0.5 mg comp.x 30')}"`)
check('2.5 mg no se parte', clavePresentacion('2.5 mg comp.x 30').startsWith('2.5 mg'),
  `-> "${clavePresentacion('2.5 mg comp.x 30')}"`)
check('0,25 mg en coma', clavePresentacion('0,25 mg comp.x 30') === '0.25 mg comp x 30',
  `-> "${clavePresentacion('0,25 mg comp.x 30')}"`)
check('0.5 != 0 5 (no fusiona dosis distintas)', clavePresentacion('0.5 mg comp.x 30') !== clavePresentacion('0 5 mg comp.x 30'))
check('0.5 mg != 5 mg', clavePresentacion('0.5 mg comp.x 30') !== clavePresentacion('5 mg comp.x 30'))
check('2.5 mg != 25 mg', clavePresentacion('2.5 mg comp.x 30') !== clavePresentacion('25 mg comp.x 30'))
check('1000 mg no se parte en 1000', clavePresentacion('1000 mg comp.x 8') === '1000 mg comp x 8',
  `-> "${clavePresentacion('1000 mg comp.x 8')}"`)
check('1 g != 1000 mg son claves distintas pero NO se confunden entre si',
  clavePresentacion('1 g comp.x 8') !== clavePresentacion('1000 mg comp.x 8'))

console.log('\n=== F. extraerPotencia() y unidadesDe() ===')
check('600 mg', extraerPotencia('600 mg comp.x 10')?.valor === 600)
check('2 %', extraerPotencia('2% susp.x 90 ml')?.valor === 2)
check('sin potencia -> null', extraerPotencia('comp.x 10') === null)
check('envase desde el texto', unidadesDe('comp.x 30', 1) === 30)
check('suspension corrige UNIDADES=1', unidadesDe('susp.x 90 ml', 1) === 90)
check('envase grande', unidadesDe('600mg comp.x500 bl.50x10', 1) === 500)

console.log(`\n${fallos === 0 ? 'TODO OK' : `${fallos} FALLAS`}`)
process.exit(fallos === 0 ? 0 : 1)
