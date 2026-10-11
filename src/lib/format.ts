// Formats d'affichage de la page de référence (espaces insécables, virgule décimale, vrai signe moins).
import { formatHMS, formatMS } from './pace-model';

export const NB = ' '; // espace insécable
const NNB = ' '; // espace fine insécable (séparateur de milliers)

export { formatHMS as hms, formatMS as ms };

/** 1224.3 → « 1 224 » */
export function int(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NNB);
}

/** 20.9004, 1 → « 20,9 » */
export function dec(n: number, digits: number): string {
  return n.toFixed(digits).replace('.', ',');
}

/** Durée : « 42:59 » sous une heure, « 1:07:31 » au-delà. */
export function dur(seconds: number): string {
  return Math.round(seconds) >= 3600 ? formatHMS(seconds) : formatMS(seconds);
}

/** « +12 », « −5 », « 0 » */
export function signed(n: number): string {
  const r = Math.round(n);
  return (r > 0 ? '+' : r < 0 ? '−' : '') + int(Math.abs(r));
}

/** « +8,1 », « −3,0 » */
export function signedDec(n: number): string {
  const r = Math.round(n * 10) / 10;
  return (r > 0 ? '+' : r < 0 ? '−' : '') + dec(Math.abs(r), 1);
}
