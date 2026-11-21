/* Catálogo de plantillas. Para agregar una familia nueva:
   1) crear src/templates/<familia>.js con el mismo contrato que pergola-bioclimatica.js
   2) importarla aquí y añadirla a la lista. La interfaz la muestra sola. */
import pergola from './pergola-bioclimatica.js';

export const templates = [pergola];

/* Familias previstas (solo se muestran como "Próximamente" en el inicio). */
export const planned = [
  { discipline: 'Estructura', name: 'Vigas y columnas', description: 'Perfiles I, L, tubulares y rectangulares.' },
  { discipline: 'Estructura', name: 'Cerchas', description: 'Cerchas y armaduras paramétricas.' },
  { discipline: 'Plomería', name: 'Tuberías y accesorios', description: 'Tramos, codos y derivaciones.' },
  { discipline: 'Arquitectura', name: 'Escaleras y barandas', description: 'Tramos, peldaños y pasamanos.' },
];
export const byId = (id) => templates.find((t) => t.id === id);
