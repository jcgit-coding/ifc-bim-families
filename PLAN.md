# Plan: app web de familias BIM paramétricas (IFC4)

Objetivo: una herramienta publicada en GitHub Pages donde colegas eligen una familia (pérgola, viga, tubería…), ajustan parámetros, la ven en 3D y descargan el IFC. Por ahora solo la pérgola, pero la arquitectura debe permitir agregar familias de arquitectura, estructura, plomería, etc. escribiendo un solo módulo.

## Estado actual
- `pergola-web/` (index.html + pergola.js): generador IFC4 en JavaScript sin dependencias, con vista previa isométrica 2D. Validado con IfcOpenShell (cajas envolventes, conteo de piezas, propiedades). El botón de descarga y el dibujo en pantalla aún no se probaron en un navegador.
- `pergola_ifc.py`: versión de referencia en Python (IfcOpenShell).
- Límite conocido: el IFC entra a Revit como geometría fija, no como familia `.rfa` con parámetros editables. Una vía `.rfa` (pyRevit/Dynamo) sería un proyecto aparte.

## Arquitectura propuesta
- Sitio estático con Vite + JavaScript, desplegado en GitHub Pages.
- `core/ifc`: escritor STEP/IFC4 (GUIDs, unidades, jerarquía espacial, psets).
- `core/geometry`: perfiles (rectángulo, círculo, L, I, tubo) y operaciones básicas.
- `families/<nombre>.js`: esquema de parámetros, función `layout(params)` que devuelve piezas, reglas de validación, clase IFC y propiedades.
- `ui`: formulario generado automáticamente desde el esquema de cada familia.
- `viewer`: visor three.js que dibuja las mismas piezas que se exportan.

## Interfaz
- Barra lateral con catálogo por disciplina (Arquitectura, Estructura, Plomería…).
- Panel de parámetros agrupado, con unidades, rangos y valores por defecto.
- Visor 3D con órbita, vistas estándar (planta, frontal, isométrica), cotas y selección de piezas.
- Exportación: IFC, parámetros en JSON y enlace compartible con los valores en la URL.
- Tema claro y oscuro, y uso en móvil.

## Fases
1. **Base:** pasar el generador a módulos, crear el esquema de parámetros y montar el visor three.js con la pérgola.
2. **Interfaz profesional:** catálogo, formulario automático, presets, enlace compartible y guía corta de uso.
3. **Calidad:** pruebas con GitHub Actions que generan IFCs de muestra y los validan con IfcOpenShell.
4. **Segunda familia:** una estructural (viga/columna con perfil I o L) o de plomería (tubería con codos), para comprobar que el diseño modular aguanta.
5. **Publicación:** repositorio, GitHub Pages y README para colegas con los pasos para abrir el IFC en Revit.

## Riesgos
- Plomería necesita barridos y arcos (tubos con curvas); el motor actual solo hace extrusiones de perfil.
- IFC grandes (muchas lamas) pueden ralentizar el visor; se mitiga con instancias en three.js.
- Revit puede no asignar la categoría esperada a los elementos importados; probar con la pérgola y documentar el mapeo.

## Pendientes inmediatos
- Probar `pergola-web/index.html` en un navegador real (dibujo, deslizador y descarga).
- Decidir la segunda familia (estructural o plomería).
- Crear el repositorio de GitHub y elegir si es público.
- Pendiente aparte: la carpeta vacía «Familias Revit» puede borrarse al cerrar la sesión que la tenía abierta.
