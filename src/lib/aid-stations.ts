// Ravitaillements : insertion dans la liste des sections, dans l'ordre du parcours, et temps d'arrêt.
import {
  indexAtDistance, sectionSchedule, timeAtIndex,
  type Plan, type PreparedCourse, type Schedule, type ScheduleRow,
} from './pace-model';

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

/** Temps d'arrêt par type de ravito, en secondes. */
export type AidStops = Record<AidType, number>;
export const NO_STOPS: AidStops = Object.freeze({ eau: 0, complet: 0 });
/** Durées proposées dans le réglage, en secondes. */
export const STOP_CHOICES = [0, 30, 60, 120, 180, 300, 600] as const;

export type TimedLine =
  | { kind: 'section'; row: ScheduleRow }
  | { kind: 'aid'; aid: AidStation; arrivalSeconds: number; stopSeconds: number };

export interface TimedSchedule extends Schedule {
  /** Temps de course, arrêts déduits : c'est lui qui est réparti entre les sections. */
  movingSeconds: number;
  /** Total des arrêts aux ravitos (hors ravito placé à l'arrivée). */
  stopSeconds: number;
  /** Sections et ravitos dans l'ordre du parcours, avec heure d'arrivée et arrêt de chaque ravito. */
  lines: TimedLine[];
}

/**
 * Plan avec arrêts aux ravitos. Le temps visé reste l'heure d'arrivée :
 * - les arrêts sont déduits, le temps de course restant est réparti comme sans ravito (sectionSchedule) ;
 * - le passage d'une section inclut les arrêts déjà faits, la durée d'une section reste son temps de course ;
 * - un ravito à l'arrivée (à 50 m près) ne compte pas : on s'y arrête une fois la course finie.
 * Les allures (sections, montée, descente, plat) sont celles du temps de course ;
 * l'allure moyenne affichée reste celle du temps visé, arrêts compris.
 */
export function scheduleWithStops(
  prepared: PreparedCourse,
  plan: Plan,
  totalSeconds: number,
  aidStations: AidStation[] = [],
  stops: AidStops = NO_STOPS,
): TimedSchedule {
  const atFinish = (a: AidStation) => a.km * 1000 >= prepared.lengthM - AT_SECTION_END_M;
  const stopOf = (a: AidStation) => (atFinish(a) ? 0 : Math.max(0, stops[a.type] ?? 0));
  const merged = mergeAidStations([], aidStations, prepared.lengthM).map((l) => (l.kind === 'aid' ? l.aid : null));
  const onCourse = merged.filter((a): a is AidStation => a !== null);
  const stopSeconds = onCourse.reduce((sum, a) => sum + stopOf(a), 0);
  // Garde-fou : il reste toujours au moins une minute de course.
  const movingSeconds = Math.max(60, totalSeconds - stopSeconds);
  const base = sectionSchedule(plan, movingSeconds);

  let stopsSoFar = 0;
  let previous: ScheduleRow | null = null;
  const lines: TimedLine[] = mergeAidStations(base.rows, onCourse, prepared.lengthM).map((line) => {
    if (line.kind === 'section') {
      const row = { ...line.row, passageSeconds: line.row.passageSeconds + stopsSoFar };
      previous = line.row;
      return { kind: 'section', row };
    }
    const { aid } = line;
    // Ravito en fin de section : même heure que le passage de la section, pour rester cohérent avec le tableau.
    const atPreviousEnd = previous !== null && Math.abs(aid.km * 1000 - (previous as ScheduleRow).endM) <= AT_SECTION_END_M;
    const running = atPreviousEnd
      ? (previous as ScheduleRow).passageSeconds
      : Math.round(timeAtIndex(plan, movingSeconds, indexAtDistance(prepared, aid.km * 1000)));
    const stop = stopOf(aid);
    const arrivalSeconds = running + stopsSoFar;
    stopsSoFar += stop;
    return { kind: 'aid', aid, arrivalSeconds, stopSeconds: stop };
  });

  return {
    ...base,
    totalSeconds,
    meanPaceSecPerKm: totalSeconds / (prepared.lengthM / 1000),
    rows: lines.flatMap((l) => (l.kind === 'section' ? [l.row] : [])),
    lines,
    movingSeconds,
    stopSeconds,
  };
}

/** Temps de passage au point d'index `i` du profil, arrêts aux ravitos situés avant ce point compris. */
export function passageAtIndex(prepared: PreparedCourse, plan: Plan, schedule: TimedSchedule, i: number): number {
  const meters = i * prepared.stepM;
  let stops = 0;
  for (const line of schedule.lines) if (line.kind === 'aid' && line.aid.km * 1000 < meters) stops += line.stopSeconds;
  return timeAtIndex(plan, schedule.movingSeconds, i) + stops;
}

/** Libellé affiché sur la ligne du ravito. */
export function aidLabel(type: AidType, short = false): string {
  if (type === 'eau') return 'Point d’eau';
  return short ? 'Ravito complet' : 'Ravitaillement complet';
}
