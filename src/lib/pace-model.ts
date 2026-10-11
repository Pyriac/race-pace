/**
 * Plan d'allure par section — calcul pur, sans DOM ni dépendance.
 * Portage TypeScript de .claude/pace-model.mjs (logique identique, valeurs de contrôle dans pace-model.test.ts).
 *
 * Chaîne d'appel :
 *   const prepared = prepareCourse(courseJson);                            // une fois par course
 *   const plan     = computePlan(prepared, { threshold: 20, descentWeight: 1 }); // à chaque réglage
 *
 * Modèle : km-effort de l'ITRA. 1 km de distance vaut 1 km-effort, 100 m de D+ en ajoutent 1 ;
 * le plat et la descente comptent autant (descentWeight ajuste le poids de la descente).
 * Le temps visé est réparti au prorata du coût cumulé.
 *   const schedule = sectionSchedule(plan, totalSeconds);                  // à chaque temps visé
 *
 * Unités : distances en mètres, altitudes en mètres, pentes en %, durées en secondes,
 * allures en secondes par kilomètre.
 */

/** JSON produit par scripts/gpx-to-course.mjs. `ele` : altitudes à pas constant (≈ 10 m) du départ à l'arrivée. */
export interface CourseData {
  id?: string;
  name?: string;
  lengthM: number;
  ele: number[];
}

export interface PreparedCourse {
  id?: string;
  name?: string;
  n: number;
  lengthM: number;
  stepM: number;
  alt: Float64Array;
  grade: Float64Array;
  dPlus: number;
  dMinus: number;
  altMin: number;
  altMax: number;
}

export interface Section {
  index: number;
  startIndex: number;
  endIndex: number;
  startM: number;
  endM: number;
  distM: number;
  netM: number;
  dPlus: number;
  dMinus: number;
  gradePct: number;
  climb: boolean;
  /** Km-effort ITRA de la section : distance + 1 km par 100 m de D+ (indépendant de descentWeight). */
  kmEffort: number;
  /** Allure de la section ÷ allure moyenne du parcours. */
  coef: number;
  /** Part du temps total passée dans la section (somme = 1). */
  share: number;
}

export interface Plan {
  threshold: number;
  descentWeight: number;
  lengthM: number;
  stepM: number;
  /** Km-effort ITRA du parcours (indépendant de descentWeight). */
  kmEffort: number;
  cumCost: Float64Array;
  totalCost: number;
  meanCost: number;
  sections: Section[];
}

export interface ScheduleRow extends Section {
  paceSecPerKm: number;
  seconds: number;
  passageSeconds: number;
}

export interface GroupSummary {
  count: number;
  distM: number;
  seconds: number;
  paceSecPerKm: number | null;
}

export interface Schedule {
  totalSeconds: number;
  meanPaceSecPerKm: number;
  /** Allure sur le plat (s/km) ; à profil équilibré, aussi l'allure au km-effort. */
  flatPaceSecPerKm: number;
  rows: ScheduleRow[];
  climb: GroupSummary;
  descent: GroupSummary;
}

/** Demi-fenêtre du lissage triangulaire, en échantillons (2 × 10 m = ±20 m). */
const SMOOTH_HALF = 2;

/** Seuils d'inversion du découpage, en mètres de dénivelé. */
export const THRESHOLDS = Object.freeze({ fin: 10, moyen: 20, large: 30 });

/** Règle ITRA : 100 m de D+ valent 1 km. */
export const CLIMB_M_PER_KM = 100;
/** Pente (%) à partir de laquelle le poids de la descente joue à plein. */
export const FULL_DESCENT_GRADE = 9;
/** Poids d'un kilomètre de descente : 0,85 descendeur, 1 équilibré, 1,15 grimpeur. */
export const DESCENT_WEIGHT = Object.freeze({ min: 0.85, max: 1.15, step: 0.05, neutral: 1 });

/** Km-effort d'un kilomètre parcouru sur une pente donnée (gradePct en %). */
export function cost(gradePct: number, descentWeight = 1): number {
  if (gradePct >= 0) return 1 + (gradePct * 10) / CLIMB_M_PER_KM;
  return 1 + (descentWeight - 1) * Math.min(1, -gradePct / FULL_DESCENT_GRADE);
}

function smooth(ys: ArrayLike<number>, half: number): Float64Array {
  const n = ys.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    let sw = 0;
    for (let k = -half; k <= half; k++) {
      const j = Math.min(Math.max(i + k, 0), n - 1);
      const w = half + 1 - Math.abs(k);
      s += w * ys[j]!;
      sw += w;
    }
    out[i] = s / sw;
  }
  return out;
}

/** Lisse le profil et précalcule les pentes. À appeler une fois par course. */
export function prepareCourse(course: CourseData): PreparedCourse {
  if (!course || !Array.isArray(course.ele) || course.ele.length < 3) {
    throw new Error('Course invalide : « ele » doit contenir au moins 3 altitudes.');
  }
  if (!(course.lengthM > 0)) throw new Error('Course invalide : « lengthM » doit être une distance en mètres.');
  const n = course.ele.length;
  const lengthM = course.lengthM;
  const stepM = lengthM / (n - 1);
  const alt = smooth(course.ele, SMOOTH_HALF);
  const grade = new Float64Array(n - 1);
  let dPlus = 0;
  let dMinus = 0;
  let altMin = Infinity;
  let altMax = -Infinity;
  for (let i = 0; i < n; i++) {
    if (alt[i]! < altMin) altMin = alt[i]!;
    if (alt[i]! > altMax) altMax = alt[i]!;
  }
  for (let i = 0; i < n - 1; i++) {
    const dz = alt[i + 1]! - alt[i]!;
    grade[i] = (dz / stepM) * 100;
    if (dz > 0) dPlus += dz;
    else dMinus -= dz;
  }
  return { id: course.id, name: course.name, n, lengthM, stepM, alt, grade, dPlus, dMinus, altMin, altMax };
}

/** Points de bascule : une section se termine quand le profil s'inverse d'au moins `threshold` mètres. */
function pivots(alt: Float64Array, threshold: number): number[] {
  const piv = [0];
  let dir = 0;
  let ext = 0;
  for (let i = 1; i < alt.length; i++) {
    const a = alt[i]!;
    if (dir === 0) {
      if (a - alt[0]! >= threshold) { dir = 1; ext = i; }
      else if (alt[0]! - a >= threshold) { dir = -1; ext = i; }
    } else if (dir === 1) {
      if (a > alt[ext]!) ext = i;
      else if (alt[ext]! - a >= threshold) { piv.push(ext); dir = -1; ext = i; }
    } else if (a < alt[ext]!) ext = i;
    else if (a - alt[ext]! >= threshold) { piv.push(ext); dir = 1; ext = i; }
  }
  if (piv[piv.length - 1] !== alt.length - 1) piv.push(alt.length - 1);
  return piv;
}

/** Découpe le parcours en sections et calcule le coefficient de chacune. Indépendant du temps visé. */
export function computePlan(
  prepared: PreparedCourse,
  { threshold = THRESHOLDS.moyen, descentWeight = DESCENT_WEIGHT.neutral }: { threshold?: number; descentWeight?: number } = {},
): Plan {
  const { n, lengthM, stepM, alt, grade } = prepared;
  const cumCost = new Float64Array(n);
  for (let i = 0; i < n - 1; i++) cumCost[i + 1] = cumCost[i]! + cost(grade[i]!, descentWeight) * stepM;
  const totalCost = cumCost[n - 1]!;
  const meanCost = totalCost / lengthM;
  const piv = pivots(alt, threshold);
  const sections: Section[] = [];
  for (let k = 0; k < piv.length - 1; k++) {
    const s = piv[k]!;
    const e = piv[k + 1]!;
    let dPlus = 0;
    let dMinus = 0;
    for (let j = s; j < e; j++) {
      const dz = alt[j + 1]! - alt[j]!;
      if (dz > 0) dPlus += dz;
      else dMinus -= dz;
    }
    const distM = (e - s) * stepM;
    const c = cumCost[e]! - cumCost[s]!;
    const netM = alt[e]! - alt[s]!;
    sections.push({
      index: k + 1, startIndex: s, endIndex: e, startM: s * stepM, endM: e * stepM,
      distM, netM, dPlus, dMinus, gradePct: (netM / distM) * 100, climb: netM > 0,
      kmEffort: distM / 1000 + dPlus / CLIMB_M_PER_KM,
      coef: c / distM / meanCost, share: c / totalCost,
    });
  }
  const kmEffort = lengthM / 1000 + prepared.dPlus / CLIMB_M_PER_KM;
  return { threshold, descentWeight, lengthM, stepM, kmEffort, cumCost, totalCost, meanCost, sections };
}

/** Temps écoulé au point d'index `i` pour un temps total visé. */
export function timeAtIndex(plan: Plan, totalSeconds: number, i: number): number {
  return (totalSeconds * plan.cumCost[i]!) / plan.totalCost;
}

/** Index du profil le plus proche d'une distance en mètres. */
export function indexAtDistance(prepared: PreparedCourse, meters: number): number {
  return Math.max(0, Math.min(prepared.n - 1, Math.round(meters / prepared.stepM)));
}

/** Section (position dans plan.sections) qui contient l'index `i`. */
export function sectionIndexAt(plan: Plan, i: number): number {
  for (let k = 0; k < plan.sections.length; k++) if (i <= plan.sections[k]!.endIndex) return k;
  return plan.sections.length - 1;
}

/** Pente locale en %, mesurée sur ±3 échantillons (±30 m), pour une info-bulle. */
export function localGradePct(prepared: PreparedCourse, i: number): number {
  const a = Math.max(0, i - 3);
  const b = Math.min(prepared.n - 1, i + 3);
  return ((prepared.alt[b]! - prepared.alt[a]!) / ((b - a) * prepared.stepM)) * 100;
}

/** Allure sur le plat pour le temps visé (s/km) : × cost(pente) donne l'allure sur cette pente. */
export function flatPaceSecPerKm(plan: Plan, totalSeconds: number): number {
  return (totalSeconds / plan.totalCost) * 1000;
}

/**
 * Allures et temps de passage pour un temps visé.
 * Passages arrondis à la seconde ; la durée d'une section est la différence de deux passages,
 * donc la somme des durées retombe exactement sur le temps visé.
 */
export function sectionSchedule(plan: Plan, totalSeconds: number): Schedule {
  const km = plan.lengthM / 1000;
  const meanPaceSecPerKm = totalSeconds / km;
  const climb: GroupSummary = { count: 0, distM: 0, seconds: 0, paceSecPerKm: null };
  const descent: GroupSummary = { count: 0, distM: 0, seconds: 0, paceSecPerKm: null };
  let previous = 0;
  const rows = plan.sections.map((section) => {
    const passageSeconds = Math.round(timeAtIndex(plan, totalSeconds, section.endIndex));
    const row: ScheduleRow = {
      ...section,
      paceSecPerKm: meanPaceSecPerKm * section.coef,
      seconds: passageSeconds - previous,
      passageSeconds,
    };
    previous = passageSeconds;
    const group = section.climb ? climb : descent;
    group.count += 1;
    group.distM += section.distM;
    group.seconds += totalSeconds * section.share;
    return row;
  });
  for (const group of [climb, descent]) {
    group.paceSecPerKm = group.distM > 0 ? group.seconds / (group.distM / 1000) : null;
  }
  return { totalSeconds, meanPaceSecPerKm, flatPaceSecPerKm: flatPaceSecPerKm(plan, totalSeconds), rows, climb, descent };
}

/* ---------- Saisie et affichage des durées ---------- */

const pad = (n: number) => (n < 10 ? '0' : '') + n;

/** 9405 → « 2:36:45 » */
export function formatHMS(seconds: number): string {
  const s = Math.round(seconds);
  return `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** 450 → « 7:30 » (allure, ou durée de moins d'une heure) */
export function formatMS(seconds: number): string {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

/**
 * Lit une durée saisie. Renvoie des secondes, ou null si illisible.
 *   'time' : 2:36:45, 2:36 (heures:minutes), 2h36, 2h36m45s, 2h
 *   'pace' : 7:30, 7'30'', 7,5 (minutes décimales)
 */
export function parseDuration(input: string, mode: 'time' | 'pace'): number | null {
  let t = String(input).trim().toLowerCase().replace(/\s+/g, '');
  if (!t) return null;
  t = t.replace(/min/g, 'm').replace(/['’′]/g, ':').replace(/["″]/g, '').replace(/s$/, '');
  if (mode === 'time') t = t.replace(/h/g, ':').replace(/m/g, ':');
  else t = t.replace(/\/km$/, '').replace(/m/g, ':');
  const trailing = /:+$/.test(t);
  t = t.replace(/:+$/, '');
  const parts = t.split(':');
  if (parts.length > 3) return null;
  if (parts.length === 1) {
    if (!/^\d+([.,]\d+)?$/.test(parts[0]!)) return null;
    const x = parseFloat(parts[0]!.replace(',', '.'));
    if (mode === 'pace') return x * 60;
    return trailing ? x * 3600 : null; // « 3h » : trois heures ; « 3 » seul est ambigu
  }
  const v: number[] = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    v.push(parseInt(part, 10));
  }
  if (mode === 'time') {
    const m = v[1]!;
    const s = v.length === 3 ? v[2]! : 0;
    if (m > 59 || s > 59) return null;
    return v[0]! * 3600 + m * 60 + s;
  }
  if (v.length === 3 || v[1]! > 59) return null;
  return v[0]! * 60 + v[1]!;
}
