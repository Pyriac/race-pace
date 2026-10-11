import { useEffect, useState } from 'react';
import { courses, findCourse } from '../data/courses';
import { NO_STOPS, STOP_CHOICES, type AidStops } from './aid-stations';
import { DESCENT_WEIGHT, THRESHOLDS } from './pace-model';

/** Bornes du temps total accepté (0:45:00 à 12:00:00). */
export const TOTAL_MIN = 2700;
export const TOTAL_MAX = 43200;
/** Allure proposée par défaut pour une course jamais réglée. */
const DEFAULT_PACE = 450;

// v3 : passage au km-effort ; l'ancien réglage « profile » (v2) n'a plus de sens et est ignoré.
const KEY = 'nipalou.plan.v3';

export interface PlanSettings {
  courseId: string;
  /** Temps visé par course, en secondes. */
  totals: Record<string, number>;
  threshold: number;
  /** Poids d'un kilomètre de descente (0,85 à 1,15). */
  descentWeight: number;
  /** Temps d'arrêt à chaque ravito, par type (secondes). */
  aidStops: AidStops;
}

const validStop = (v: unknown) => (STOP_CHOICES as readonly number[]).includes(v as number) ? (v as number) : 0;

function load(): PlanSettings {
  const fallback: PlanSettings = { courseId: courses[0]!.id, totals: {}, threshold: THRESHOLDS.moyen, descentWeight: DESCENT_WEIGHT.neutral, aidStops: NO_STOPS };
  let s = fallback;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null') as Partial<PlanSettings> | null;
    if (saved) {
      s = {
        courseId: findCourse(saved.courseId) ? saved.courseId! : fallback.courseId,
        totals: Object.fromEntries(
          Object.entries(saved.totals ?? {}).filter(([, t]) => typeof t === 'number' && t >= TOTAL_MIN && t <= TOTAL_MAX),
        ),
        threshold: [10, 20, 30].includes(saved.threshold!) ? saved.threshold! : fallback.threshold,
        descentWeight:
          typeof saved.descentWeight === 'number' &&
          saved.descentWeight >= DESCENT_WEIGHT.min - 1e-9 &&
          saved.descentWeight <= DESCENT_WEIGHT.max + 1e-9
            ? saved.descentWeight
            : DESCENT_WEIGHT.neutral,
        aidStops: {
          eau: validStop(saved.aidStops?.eau),
          complet: validStop(saved.aidStops?.complet),
        },
      };
    }
  } catch {
    // Stockage indisponible : valeurs par défaut.
  }
  // Un lien ?course=… choisit la course à l'ouverture.
  const fromUrl = new URLSearchParams(window.location.search).get('course');
  if (findCourse(fromUrl)) s = { ...s, courseId: fromUrl! };
  return s;
}

/** Réglages du plan, mémorisés dans localStorage (repli silencieux sans stockage). */
export function usePlanSettings() {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      // Sans stockage.
    }
  }, [settings]);

  const course = findCourse(settings.courseId) ?? courses[0]!;
  const totalSeconds = settings.totals[course.id] ?? Math.round((DEFAULT_PACE * course.data.lengthM) / 1000);

  return {
    course,
    totalSeconds,
    threshold: settings.threshold,
    descentWeight: settings.descentWeight,
    aidStops: settings.aidStops,
    setCourse: (courseId: string) => setSettings((s) => ({ ...s, courseId })),
    setTotal: (total: number) => setSettings((s) => ({ ...s, totals: { ...s.totals, [course.id]: total } })),
    setThreshold: (threshold: number) => setSettings((s) => ({ ...s, threshold })),
    setDescentWeight: (descentWeight: number) => setSettings((s) => ({ ...s, descentWeight })),
    setAidStops: (aidStops: AidStops) => setSettings((s) => ({ ...s, aidStops })),
  };
}
