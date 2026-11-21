/* Motor IFC4 (STEP de texto) independiente de la familia.
   Recibe piezas ya calculadas por una plantilla y escribe el archivo.
   Unidades: metros y grados. */

const B64 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';

export function guid() {
  const b = new Uint8Array(16);
  globalThis.crypto.getRandomValues(b);
  let n = 0n;
  for (const x of b) n = (n << 8n) | BigInt(x);
  let s = '';
  for (let i = 0; i < 22; i++) { s = B64[Number(n & 63n)] + s; n >>= 6n; }
  return s;
}

const f = (x) => { const s = Number(x.toFixed(6)).toString(); return /[.eE]/.test(s) ? s : s + '.'; };
const enc = (s) => String(s).replace(/'/g, "''").replace(/[^\x20-\x7E]/g, (c) =>
  '\\X2\\' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0') + '\\X0\\');
const S = (s) => `'${enc(s)}'`;

/* Valores tipados para propiedades */
export const V = {
  len: (v) => `IFCLENGTHMEASURE(${f(v)})`,
  ang: (v) => `IFCPLANEANGLEMEASURE(${f(v)})`, // grados (unidad del proyecto)
  area: (v) => `IFCAREAMEASURE(${f(v)})`,
  int: (v) => `IFCINTEGER(${Math.round(v)})`,
  real: (v) => `IFCREAL(${f(v)})`,
  text: (v) => `IFCLABEL(${S(v)})`,
};

/* Eje local de una pieza: z = dirección de extrusión, x = eje del perfil, y = z × x */
export function basis(z, x) {
  const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  return { x, y, z };
}

/**
 * @param {object} model
 * @param {string} model.name  nombre del conjunto
 * @param {string} model.objectType
 * @param {Array}  model.parts [{cls, predefined, name, o:[x,y,z], z:[..], x:[..], profile:{dx,dy}, len, psets:[{name, props:[[k, valor tipado]]}]}]
 * @param {Array}  model.psets  propiedades del conjunto
 */
export function writeIFC(model) {
  const L = []; let n = 0;
  const add = (s) => { L.push(`#${++n}=${s};`); return `#${n}`; };
  const pt = (v) => add(`IFCCARTESIANPOINT((${f(v[0])},${f(v[1])},${f(v[2])}))`);
  const dir = (v) => add(`IFCDIRECTION((${f(v[0])},${f(v[1])},${f(v[2])}))`);
  const ax = (o, z, x) => add(`IFCAXIS2PLACEMENT3D(${pt(o)},${dir(z)},${dir(x)})`);
  const lp = (rel, a) => add(`IFCLOCALPLACEMENT(${rel || '$'},${a})`);
  const list = (a) => '(' + a.join(',') + ')';
  const origin = () => ax([0, 0, 0], [0, 0, 1], [1, 0, 0]);

  // Unidades: m, m2, m3, grados
  const uL = add('IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)');
  const uA = add('IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)');
  const uV = add('IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)');
  const uR = add('IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)');
  const dim = add('IFCDIMENSIONALEXPONENTS(0,0,0,0,0,0,0)');
  const mwu = add(`IFCMEASUREWITHUNIT(IFCPLANEANGLEMEASURE(0.0174532925199),${uR})`);
  const uD = add(`IFCCONVERSIONBASEDUNIT(${dim},.PLANEANGLEUNIT.,'DEGREE',${mwu})`);
  const units = add(`IFCUNITASSIGNMENT(${list([uL, uA, uV, uD])})`);

  const ctx = add(`IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,${origin()},$)`);
  const sub = add(`IFCGEOMETRICREPRESENTATIONSUBCONTEXT('Body','Model',*,*,*,*,${ctx},$,.MODEL_VIEW.,$)`);
  const proj = add(`IFCPROJECT('${guid()}',$,${S(model.name)},$,$,$,$,${list([ctx])},${units})`);

  const plSite = lp(null, origin());
  const site = add(`IFCSITE('${guid()}',$,'Sitio',$,$,${plSite},$,$,.ELEMENT.,$,$,$,$,$)`);
  const plB = lp(plSite, origin());
  const bld = add(`IFCBUILDING('${guid()}',$,'Edificio',$,$,${plB},$,$,.ELEMENT.,$,$,$)`);
  const plS = lp(plB, origin());
  const sto = add(`IFCBUILDINGSTOREY('${guid()}',$,'Nivel 0',$,$,${plS},$,$,.ELEMENT.,0.)`);
  add(`IFCRELAGGREGATES('${guid()}',$,$,$,${proj},${list([site])})`);
  add(`IFCRELAGGREGATES('${guid()}',$,$,$,${site},${list([bld])})`);
  add(`IFCRELAGGREGATES('${guid()}',$,$,$,${bld},${list([sto])})`);

  const pset = (obj, psName, props) => {
    const ids = props.map(([k, v]) => add(`IFCPROPERTYSINGLEVALUE(${S(k)},$,${v},$)`));
    const ps = add(`IFCPROPERTYSET('${guid()}',$,${S(psName)},$,${list(ids)})`);
    add(`IFCRELDEFINESBYPROPERTIES('${guid()}',$,$,$,${list([obj])},${ps})`);
  };

  const ids = model.parts.map((q) => {
    const prof = add(`IFCRECTANGLEPROFILEDEF(.AREA.,$,$,${f(q.profile.dx)},${f(q.profile.dy)})`);
    const solid = add(`IFCEXTRUDEDAREASOLID(${prof},${origin()},${dir([0, 0, 1])},${f(q.len)})`);
    const rep = add(`IFCSHAPEREPRESENTATION(${sub},'Body','SweptSolid',${list([solid])})`);
    const pds = add(`IFCPRODUCTDEFINITIONSHAPE($,$,${list([rep])})`);
    const pl = lp(plS, ax(q.o, q.z, q.x));
    const e = add(`${q.cls}('${guid()}',$,${S(q.name)},$,$,${pl},${pds},$,${q.predefined})`);
    (q.psets || []).forEach((ps) => pset(e, ps.name, ps.props));
    return e;
  });

  const plP = lp(plS, origin());
  const asm = add(`IFCBUILDINGELEMENTPROXY('${guid()}',$,${S(model.name)},$,${S(model.objectType || model.name)},${plP},$,$,.USERDEFINED.)`);
  add(`IFCRELAGGREGATES('${guid()}',$,$,$,${asm},${list(ids)})`);
  add(`IFCRELCONTAINEDINSPATIALSTRUCTURE('${guid()}',$,$,$,${list([asm])},${sto})`);
  (model.psets || []).forEach((ps) => pset(asm, ps.name, ps.props));

  const head = [
    'ISO-10303-21;', 'HEADER;',
    "FILE_DESCRIPTION(('ViewDefinition [ReferenceView_V1.2]'),'2;1');",
    `FILE_NAME('familia.ifc','${new Date().toISOString().slice(0, 19)}',(''),(''),'','ifc-bim-families','');`,
    "FILE_SCHEMA(('IFC4'));", 'ENDSEC;', 'DATA;'];
  return head.concat(L, ['ENDSEC;', 'END-ISO-10303-21;']).join('\n');
}
