/* Plantilla: pérgola bioclimática (lamas orientables).
   Contrato de una plantilla (igual para toda familia futura):
     id, name, discipline, description,
     params: [{key,label,type,unit,default,min,max,step,group,options}]   (valores de UI: mm y grados)
     compute(values) -> { parts, psets, summary, warnings, errors }          (piezas en metros)
*/
import { V } from '../core/ifc.js';

export default {
  id: 'pergola-bioclimatica',
  name: 'Pérgola bioclimática',
  discipline: 'Arquitectura',
  description: 'Estructura perimetral con columnas, vigas y lamas orientables.',
  params: [
    { key: 'nombre', label: 'Nombre', type: 'text', default: 'Pérgola bioclimática', group: 'General' },
    { key: 'ancho', label: 'Ancho (X, largo de lamas)', type: 'number', unit: 'mm', default: 4000, min: 1000, max: 12000, step: 50, group: 'Dimensiones' },
    { key: 'fondo', label: 'Fondo (Y)', type: 'number', unit: 'mm', default: 3000, min: 1000, max: 12000, step: 50, group: 'Dimensiones' },
    { key: 'altura', label: 'Altura total', type: 'number', unit: 'mm', default: 2600, min: 2000, max: 5000, step: 50, group: 'Dimensiones' },
    { key: 'columnas', label: 'Columnas', type: 'select', default: '4', group: 'Estructura',
      options: [['4', '4 (esquinas)'], ['2', '2 (solo frente)']] },
    { key: 'col', label: 'Sección de columna', type: 'number', unit: 'mm', default: 150, min: 50, max: 400, step: 5, group: 'Estructura' },
    { key: 'vigaB', label: 'Viga, ancho', type: 'number', unit: 'mm', default: 150, min: 50, max: 400, step: 5, group: 'Estructura' },
    { key: 'vigaH', label: 'Viga, alto', type: 'number', unit: 'mm', default: 200, min: 50, max: 500, step: 5, group: 'Estructura' },
    { key: 'lamaAncho', label: 'Ancho de lama', type: 'number', unit: 'mm', default: 200, min: 50, max: 500, step: 5, group: 'Lamas' },
    { key: 'lamaEsp', label: 'Espesor de lama', type: 'number', unit: 'mm', default: 30, min: 5, max: 100, step: 1, group: 'Lamas' },
    { key: 'lamaSep', label: 'Separación mínima', type: 'number', unit: 'mm', default: 20, min: 0, max: 200, step: 1, group: 'Lamas' },
    { key: 'angulo', label: 'Ángulo de apertura', type: 'range', unit: '°', default: 0, min: 0, max: 110, step: 1, group: 'Lamas' },
  ],

  compute(v) {
    const errors = [], warnings = [];
    const m = (k) => v[k] / 1000;
    const W = m('ancho'), D = m('fondo'), H = m('altura'), cs = m('col'), bw = m('vigaB'), bh = m('vigaH');
    const lw = m('lamaAncho'), lt = m('lamaEsp'), gap = m('lamaSep'), ang = v.angulo;
    const ncol = parseInt(v.columnas, 10);

    for (const k of ['ancho', 'fondo', 'altura', 'col', 'vigaB', 'vigaH', 'lamaAncho', 'lamaEsp']) {
      if (!(v[k] > 0)) errors.push(`«${k}» debe ser mayor que 0`);
    }
    if (!(v.lamaSep >= 0)) errors.push('La separación no puede ser negativa');
    if (!(ang >= 0 && ang <= 110)) errors.push('El ángulo debe estar entre 0 y 110°');
    if (![2, 4].includes(ncol)) errors.push('Columnas debe ser 2 o 4');
    if (bh >= H) errors.push('La viga es más alta que la pérgola');
    if (D <= 2 * bw || W <= 2 * bw) errors.push('Ancho/fondo demasiado pequeños para las vigas');
    if (errors.length) return { errors, warnings, parts: [], psets: [], summary: '' };

    const zb = H - bh / 2, parts = [];
    const ys = [cs / 2].concat(ncol === 4 ? [D - cs / 2] : []);
    let n = 0;
    ys.forEach((y) => [cs / 2, W - cs / 2].forEach((x) => parts.push({
      cls: 'IFCCOLUMN', predefined: '.COLUMN.', name: `Columna ${++n}`,
      o: [x, y, 0], z: [0, 0, 1], x: [1, 0, 0], profile: { dx: cs, dy: cs }, len: H - bh, kind: 'estructura' })));
    const beam = (name, o, z, x, len) => parts.push({
      cls: 'IFCBEAM', predefined: '.BEAM.', name, o, z, x, profile: { dx: bw, dy: bh }, len, kind: 'estructura' });
    beam('Viga frontal', [0, bw / 2, zb], [1, 0, 0], [0, 1, 0], W);
    beam('Viga trasera', [0, D - bw / 2, zb], [1, 0, 0], [0, 1, 0], W);
    beam('Viga lateral izquierda', [bw / 2, bw, zb], [0, 1, 0], [1, 0, 0], D - 2 * bw);
    beam('Viga lateral derecha', [W - bw / 2, bw, zb], [0, 1, 0], [1, 0, 0], D - 2 * bw);

    const inner = D - 2 * bw;
    const nL = Math.max(1, Math.floor(inner / (lw + gap) + 1e-9));
    const pitch = inner / nL;
    const c = Math.cos(ang * Math.PI / 180), s = Math.sin(ang * Math.PI / 180);
    if (lw * c > pitch + 1e-9) warnings.push('A este ángulo las lamas se solapan en planta.');
    for (let i = 0; i < nL; i++) {
      parts.push({
        cls: 'IFCSHADINGDEVICE', predefined: '.JALOUSIE.', name: `Lama ${i + 1}`, kind: 'lama',
        o: [bw, bw + (i + 0.5) * pitch, zb], z: [1, 0, 0], x: [0, c, s],
        profile: { dx: lw, dy: lt }, len: W - 2 * bw,
        psets: [{ name: 'Pset_Pergola_Lama', props: [['AnguloApertura', V.ang(ang)]] }],
      });
    }

    const psets = [{
      name: 'Pset_Pergola_Parametros', props: [
        ['Ancho', V.len(W)], ['Fondo', V.len(D)], ['AlturaTotal', V.len(H)],
        ['SeccionColumna', V.len(cs)], ['VigaAncho', V.len(bw)], ['VigaAlto', V.len(bh)],
        ['LamaAncho', V.len(lw)], ['LamaEspesor', V.len(lt)], ['LamaSeparacion', V.len(gap)],
        ['PasoLamas', V.len(pitch)], ['AnguloApertura', V.ang(ang)],
        ['NumeroColumnas', V.int(ncol)], ['NumeroLamas', V.int(nL)],
        ['SuperficieEnPlanta', V.area(W * D)],
      ] }];

    return {
      errors, warnings, parts, psets, objectType: 'Pergola bioclimatica',
      summary: `${nL} lamas · paso ${(pitch * 1000).toFixed(0)} mm · ${ncol} columnas`,
      fileName: `pergola_${v.ancho}x${v.fondo}_${ang}deg.ifc`,
    };
  },
};
