/** Unit conversion helpers. The model works in metres and degrees; the UI uses millimetres. */

export const MM_PER_METRE = 1000;

export const mmToMetres = (millimetres) => millimetres / MM_PER_METRE;
export const degreesToRadians = (degrees) => (degrees * Math.PI) / 180;
