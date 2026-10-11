// Ravitaillements : insertion dans la liste des sections, dans l'ordre du parcours.
import type { ScheduleRow } from './pace-model';

export type AidType = 'eau' | 'complet';

export interface AidStation {
  /** Position sur le parcours, en km depuis le départ (ex. 12.3). */
  km: number;
  /** « eau » : point d'eau ; « complet » : ravitaillement solide et liquide. */
  type: AidType;
  /** Nom du lieu, facultatif (non affiché dans l'image pour l'instant). */
  name?: string;
}

export type PlanLine = { kind: 'section'; row: ScheduleRow } | { kind: 'aid'; aid: AidStation };

/**
 * Tolérance (m) : les km des ravitos sont donnés au dixième, un ravito à moins de 50 m
 * de la fin d'une section est considéré comme situé à sa fin.
 */
const AT_SECTION_END_M = 50;

/**
 * Fusionne sections et ravitos par kilométrage.
 * Une section est repérée par son km de fin ; un ravito situé à la fin d'une section
 * (à AT_SECTION_END_M près) vient juste après elle : on y arrive en fin de section.
 * Les ravitos hors du parcours (km < 0 ou au-delà de l'arrivée) sont ignorés.
 */
export function mergeAidStations(rows: ScheduleRow[], aidStations: AidStation[] = [], lengthM = Infinity): PlanLine[] {
  const aids = aidStations
    .filter((a) => Number.isFinite(a.km) && a.km >= 0 && a.km * 1000 <= lengthM + AT_SECTION_END_M)
    .slice()
    .sort((a, b) => a.km - b.km);
  const lines: PlanLine[] = [];
  let i = 0;
  for (const row of rows) {
    while (i < aids.length && aids[i]!.km * 1000 < row.endM - AT_SECTION_END_M) lines.push({ kind: 'aid', aid: aids[i++]! });
    lines.push({ kind: 'section', row });
  }
  while (i < aids.length) lines.push({ kind: 'aid', aid: aids[i++]! });
  return lines;
}

/** Libellé affiché sur la ligne du ravito. */
export function aidLabel(type: AidType, short = false): string {
  if (type === 'eau') return 'Point d’eau';
  return short ? 'Ravito complet' : 'Ravitaillement complet';
}
