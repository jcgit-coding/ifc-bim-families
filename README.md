# Familias BIM - Generador IFC

Generador paramétrico de IFC4 en el navegador. Cada familia es una plantilla; por ahora: pérgola bioclimática.

## Uso
Abrir la página, elegir la plantilla, ajustar parámetros, y pulsar **Descargar IFC**. El IFC entra a Revit como geometría fija (no como familia .rfa editable).

## Agregar una familia
Crear `src/templates/<familia>.js` con el mismo contrato que `pergola-bioclimatica.js` y registrarla en `src/templates/index.js`.

## Local
`node` o cualquier servidor estático sobre esta carpeta (los módulos ES requieren http, no file://).
