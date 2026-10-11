import { describe, expect, it } from 'vitest';
import { courses } from '../data/courses';
import course from '../data/courses/nipalou-21km.json';
import { mergeAidStations, scheduleWithStops } from './aid-stations';
import { computePlan, prepareCourse, sectionSchedule } from './pace-model';

const prepared = prepareCourse(course);
const rows = sectionSchedule(computePlan(prepared), 9405).rows;
const kinds = (lines: ReturnType<typeof mergeAidStations>) =>
  lines.map((l) => (l.kind === 'aid' ? `R${l.aid.km}` : `S${l.row.index}`));

describe('mergeAidStations', () => {
  it('sans ravito, la liste est celle des sections', () => {
    expect(kinds(mergeAidStations(rows))).toEqual(rows.map((r) => `S${r.index}`));
  });

  it('insère chaque ravito avant la section qui le contient, dans l’ordre des km', () => {
    // Section 1 : 0 → 4,95 km ; section 2 : 4,95 → 8,93 km.
    const lines = mergeAidStations(rows, [
      { km: 6, type: 'complet' },
      { km: 2.5, type: 'eau' },
    ]);
    expect(kinds(lines).slice(0, 4)).toEqual(['R2.5', 'S1', 'R6', 'S2']);
    expect(lines).toHaveLength(rows.length + 2);
  });

  it('ravitos déclarés : tous sur le parcours, triés par km', () => {
    for (const c of courses) {
      const km = c.data.lengthM / 1000;
      const aids = c.aidStations ?? [];
      expect(aids.every((a) => a.km > 0 && a.km < km)).toBe(true);
      expect(aids.map((a) => a.km)).toEqual([...aids.map((a) => a.km)].sort((a, b) => a - b));
    }
  });

  it('sans arrêt, le plan avec ravitos donne exactement les chiffres du plan seul', () => {
    const plan = computePlan(prepared);
    const timed = scheduleWithStops(prepared, plan, 9405, courses[0]!.aidStations, { eau: 0, complet: 0 });
    expect(timed.rows.map((r) => r.passageSeconds)).toEqual(rows.map((r) => r.passageSeconds));
    expect(timed.stopSeconds).toBe(0);
  });

  it('avec arrêts : le temps visé reste l’arrivée, les arrêts sont retirés du temps de course', () => {
    const plan = computePlan(prepared);
    // 21 km : 1 point d'eau (km 4,1) et 2 ravitos complets (km 11,3 et 17,5).
    const timed = scheduleWithStops(prepared, plan, 9405, courses[0]!.aidStations, { eau: 30, complet: 180 });
    expect(timed.stopSeconds).toBe(30 + 2 * 180);
    expect(timed.movingSeconds).toBe(9405 - 390);
    expect(timed.rows.at(-1)!.passageSeconds).toBe(9405);
    // Temps de course des sections + arrêts = temps visé.
    expect(timed.rows.reduce((s, r) => s + r.seconds, 0) + timed.stopSeconds).toBe(9405);
    // Allure moyenne affichée : celle du temps visé ; allures de section : plus rapides que sans arrêt.
    expect(timed.meanPaceSecPerKm).toBeCloseTo(9405 / 20.9004, 6);
    expect(timed.rows[0]!.paceSecPerKm).toBeLessThan(rows[0]!.paceSecPerKm);
    // Chaque passage de section intègre les arrêts déjà faits : l'heure ne recule jamais.
    const times = timed.lines.map((l) => (l.kind === 'aid' ? l.arrivalSeconds : l.row.passageSeconds));
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('un ravito à l’arrivée ne compte pas dans les arrêts', () => {
    const plan = computePlan(prepared);
    const timed = scheduleWithStops(prepared, plan, 9405, [{ km: 20.9, type: 'complet' }], { eau: 0, complet: 300 });
    expect(timed.stopSeconds).toBe(0);
    expect(timed.rows.at(-1)!.passageSeconds).toBe(9405);
  });

  it('un ravito à l’arrivée vient en dernier, un ravito hors parcours est ignoré', () => {
    const lines = mergeAidStations(rows, [{ km: 20.9, type: 'complet' }, { km: 35, type: 'eau' }], prepared.lengthM);
    expect(kinds(lines).at(-1)).toBe('R20.9');
    expect(lines).toHaveLength(rows.length + 1);
  });
});
