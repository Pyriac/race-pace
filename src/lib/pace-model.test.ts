// Valeurs de contrôle du modèle km-effort (ITRA) : 21 km à 7:30/km (2:36:45).
import { describe, expect, it } from 'vitest';
import course from '../data/courses/nipalou-21km.json';
import course53 from '../data/courses/nipalou-53km.json';
import {
  computePlan, cost, formatHMS, formatMS, parseDuration, prepareCourse, sectionSchedule, THRESHOLDS,
} from './pace-model';

const prepared = prepareCourse(course);
const TOTAL = 9405;

describe('pace-model', () => {
  it('chiffres du parcours', () => {
    expect(course.lengthM).toBe(20900.4);
    expect(prepared.n).toBe(2091);
    expect(Math.round(prepared.dPlus)).toBe(957);
    expect(Math.round(prepared.dMinus)).toBe(956);
    expect(Math.round(prepared.altMax)).toBe(1224);
  });

  it('découpage : 16, 12 et 7 sections', () => {
    expect(computePlan(prepared, { threshold: THRESHOLDS.fin }).sections).toHaveLength(16);
    expect(computePlan(prepared, { threshold: THRESHOLDS.moyen }).sections).toHaveLength(12);
    expect(computePlan(prepared, { threshold: THRESHOLDS.large }).sections).toHaveLength(7);
  });

  it('km-effort, coefficients, allures et passages du découpage moyen', () => {
    const schedule = sectionSchedule(computePlan(prepared), TOTAL);
    const got = schedule.rows.map((r) => [
      r.climb ? 'M' : 'D', r.kmEffort.toFixed(2), r.coef.toFixed(2), formatMS(r.paceSecPerKm), formatHMS(r.passageSeconds),
    ]);
    expect(got).toEqual([
      ['M', '9.22', '1.28', '9:35', '0:47:25'],
      ['D', '4.42', '0.76', '5:43', '1:10:10'],
      ['M', '0.51', '1.52', '11:22', '1:12:47'],
      ['D', '1.33', '0.69', '5:11', '1:19:38'],
      ['M', '1.41', '1.26', '9:26', '1:26:54'],
      ['D', '0.18', '0.69', '5:09', '1:27:50'],
      ['M', '1.30', '1.72', '12:52', '1:34:31'],
      ['D', '1.99', '0.72', '5:24', '1:44:46'],
      ['M', '3.65', '1.74', '13:03', '2:03:34'],
      ['D', '2.89', '0.70', '5:14', '2:18:25'],
      ['M', '2.17', '1.06', '7:57', '2:29:33'],
      ['D', '1.40', '0.70', '5:15', '2:36:45'],
    ]);
  });

  it('allures sur le plat, en montée et en descente selon le poids de la descente', () => {
    const got = [1.15, 1, 0.85].map((descentWeight) => {
      const s = sectionSchedule(computePlan(prepared, { descentWeight }), TOTAL);
      return [formatMS(s.flatPaceSecPerKm), formatMS(s.climb.paceSecPerKm!), formatMS(s.descent.paceSecPerKm!)];
    });
    expect(got).toEqual([
      ['4:58', '9:46', '5:40'],
      ['5:09', '10:05', '5:25'],
      ['5:20', '10:26', '5:09'],
    ]);
  });

  it('la somme des durées redonne le temps visé, quels que soient les réglages', () => {
    for (const threshold of [10, 20, 30]) {
      for (const descentWeight of [0.85, 1, 1.15]) {
        const plan = computePlan(prepared, { threshold, descentWeight });
        const schedule = sectionSchedule(plan, TOTAL);
        expect(schedule.rows.reduce((sum, r) => sum + r.seconds, 0)).toBe(TOTAL);
        expect(Math.abs(plan.sections.reduce((sum, s) => sum + s.share, 0) - 1)).toBeLessThan(1e-9);
      }
    }
  });

  it('km-effort du plan = somme des sections (30,47), indépendant du profil', () => {
    const plan = computePlan(prepared);
    expect(plan.kmEffort.toFixed(2)).toBe('30.47');
    expect(plan.sections.reduce((sum, s) => sum + s.kmEffort, 0)).toBeCloseTo(plan.kmEffort, 9);
    expect(computePlan(prepared, { descentWeight: 0.85 }).kmEffort).toBe(plan.kmEffort);
  });

  it('km-effort d’un kilomètre selon la pente', () => {
    expect(cost(0)).toBe(1);
    expect(cost(5)).toBe(1.5);
    expect(cost(10)).toBe(2);
    expect(cost(20)).toBe(3);
    expect(cost(-5)).toBe(1);
    expect(cost(-20)).toBe(1);
    expect(cost(-9, 0.85)).toBeCloseTo(0.85, 12);
    expect(cost(-20, 0.85)).toBeCloseTo(0.85, 12);
    expect(cost(-4.5, 0.85)).toBeCloseTo(0.925, 12);
    expect(cost(10, 0.85)).toBe(2);
  });

  it('53 km : chiffres de la trace et temps visé respecté', () => {
    const p53 = prepareCourse(course53);
    expect(Math.round(course53.lengthM / 100) / 10).toBe(53.5);
    expect(Math.round(p53.dPlus)).toBe(2124);
    expect([10, 20, 30].map((threshold) => computePlan(p53, { threshold }).sections.length)).toEqual([28, 26, 22]);
    const total = 7 * 3600;
    const schedule = sectionSchedule(computePlan(p53), total);
    expect(schedule.rows.reduce((sum, r) => sum + r.seconds, 0)).toBe(total);
    expect(schedule.rows.at(-1)!.passageSeconds).toBe(total);
  });

  it('lecture des saisies', () => {
    expect(parseDuration('2:36:45', 'time')).toBe(9405);
    expect(parseDuration('2h36', 'time')).toBe(9360);
    expect(parseDuration('2h', 'time')).toBe(7200);
    expect(parseDuration('3', 'time')).toBeNull();
    expect(parseDuration('2:75', 'time')).toBeNull();
    expect(parseDuration('7:30', 'pace')).toBe(450);
    expect(parseDuration("7'30''", 'pace')).toBe(450);
    expect(parseDuration('7,5', 'pace')).toBe(450);
    expect(parseDuration('abc', 'pace')).toBeNull();
  });
});
