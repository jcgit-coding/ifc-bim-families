import { formatReal, quote } from './step.js';

/**
 * Typed IFC property values. Lengths are metres, angles are degrees
 * (the writer declares degrees as the project plane-angle unit).
 */
export const Measure = Object.freeze({
  length: (metres) => `IFCLENGTHMEASURE(${formatReal(metres)})`,
  angle: (degrees) => `IFCPLANEANGLEMEASURE(${formatReal(degrees)})`,
  area: (squareMetres) => `IFCAREAMEASURE(${formatReal(squareMetres)})`,
  integer: (value) => `IFCINTEGER(${Math.round(value)})`,
  real: (value) => `IFCREAL(${formatReal(value)})`,
  boolean: (value) => `IFCBOOLEAN(${value ? '.T.' : '.F.'})`,
  label: (text) => `IFCLABEL(${quote(text)})`,
});
