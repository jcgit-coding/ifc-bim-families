/**
 * Low-level helpers for writing ISO 10303-21 (STEP) text, the encoding used by IFC files.
 */

const GUID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';
const GUID_LENGTH = 22;
const GUID_BYTES = 16;
const BITS_PER_GUID_CHAR = 6n;

/** Creates a random 22-character IFC GlobalId (base-64 encoded 128-bit value). */
export function createGuid() {
  const bytes = new Uint8Array(GUID_BYTES);
  globalThis.crypto.getRandomValues(bytes);
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  let guid = '';
  for (let i = 0; i < GUID_LENGTH; i += 1) {
    guid = GUID_ALPHABET[Number(value & 63n)] + guid;
    value >>= BITS_PER_GUID_CHAR;
  }
  return guid;
}

/** Formats a number as a STEP REAL (always contains a decimal point). */
export function formatReal(value) {
  if (!Number.isFinite(value)) throw new RangeError(`Cannot write non-finite number: ${value}`);
  const text = Number(value.toFixed(6)).toString();
  return /[.eE]/.test(text) ? text : `${text}.`;
}

/** Escapes a JavaScript string for STEP (quotes doubled, non-ASCII as \X2\ sequences). */
export function encodeString(text) {
  return String(text)
    .replace(/'/g, "''")
    .replace(/[^\x20-\x7E]/g, (char) =>
      `\\X2\\${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}\\X0\\`);
}

/** Wraps text as a quoted STEP string literal. */
export const quote = (text) => `'${encodeString(text)}'`;

/** Joins entity references or values as a STEP list. */
export const toList = (items) => `(${items.join(',')})`;

/** Accumulates numbered STEP entity lines (#1, #2, ...). */
export class StepBuilder {
  #lines = [];

  /** Adds an entity definition and returns its reference (for example "#12"). */
  add(entity) {
    const reference = `#${this.#lines.length + 1}`;
    this.#lines.push(`${reference}=${entity};`);
    return reference;
  }

  get lines() {
    return this.#lines;
  }
}
