/* Catálogo de plantillas. Para agregar una familia nueva:
   1) crear src/templates/<familia>.js con el mismo contrato que pergola-bioclimatica.js
   2) importarla aquí y añadirla a la lista. La interfaz la muestra sola. */
import pergola from './pergola-bioclimatica.js';

export const templates = [pergola];
export const byId = (id) => templates.find((t) => t.id === id);
