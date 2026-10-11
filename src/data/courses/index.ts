import type { CourseData } from '../../lib/pace-model';
import nipalou21 from './nipalou-21km.json';
import nipalou53 from './nipalou-53km.json';

export interface CourseEntry {
  /** Identifiant stable (localStorage, ?course=…). */
  id: string;
  /** Libellé court du sélecteur et du titre : « 21 km ». */
  label: string;
  /** Surtitre : origine de la trace. */
  source: string;
  /** D+ officiel annoncé, pour la note d'écart avec la trace (optionnel). */
  officialDPlus?: number;
  data: CourseData;
}

/**
 * Courses proposées, dans l'ordre du sélecteur.
 * Ajouter une course : générer le JSON avec scripts/gpx-to-course.mjs, l'importer ici, l'ajouter au tableau.
 */
export const courses: CourseEntry[] = [
  { id: 'nipalou-21km', label: '21 km', source: 'Trace GPX 2024', officialDPlus: 1020, data: nipalou21 },
  { id: 'nipalou-53km', label: '53 km', source: 'Trace GPX 2025', officialDPlus: 2120, data: nipalou53 },
];

export function findCourse(id: string | null | undefined): CourseEntry | undefined {
  return courses.find((c) => c.id === id);
}
