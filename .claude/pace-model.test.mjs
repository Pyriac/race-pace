// Valeurs de contrôle : celles de la page de référence pour le 21 km à 7:30/km (2:36:45).
// Lancer avec : node --test pace-model.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  prepareCourse, computePlan, sectionSchedule, cost, parseDuration, formatHMS, formatMS, THRESHOLDS,
} from './pace-model.mjs';

const course = JSON.parse(readFileSync(new URL('./nipalou-21km.json', import.meta.url), 'utf8'));
const prepared = prepareCourse(course);
const TOTAL = 9405; // 2:36:45, soit 7:30/km sur 20,9 km

test('chiffres du parcours', () => {
  assert.equal(course.lengthM, 20900.4);
  assert.equal(prepared.n, 2091);
  assert.equal(Math.round(prepared.dPlus), 957);
  assert.equal(Math.round(prepared.dMinus), 956);
  assert.equal(Math.round(prepared.altMax), 1224);
});

test('découpage : 16, 12 et 7 sections', () => {
  assert.equal(computePlan(prepared, { threshold: THRESHOLDS.fin }).sections.length, 16);
  assert.equal(computePlan(prepared, { threshold: THRESHOLDS.moyen }).sections.length, 12);
  assert.equal(computePlan(prepared, { threshold: THRESHOLDS.large }).sections.length, 7);
});

test('coefficients, allures et passages du découpage moyen', () => {
  const schedule = sectionSchedule(computePlan(prepared), TOTAL);
  const got = schedule.rows.map((r) => [r.climb ? 'M' : 'D', r.coef.toFixed(2), formatMS(r.paceSecPerKm), formatHMS(r.passageSeconds)]);
  assert.deepEqual(got, [
    ['M', '1.16', '8:41', '0:42:59'],
    ['D', '0.82', '6:10', '1:07:31'],
    ['M', '1.30', '9:46', '1:09:46'],
    ['D', '0.78', '5:50', '1:17:28'],
    ['M', '1.13', '8:29', '1:24:00'],
    ['D', '0.87', '6:33', '1:25:11'],
    ['M', '1.48', '11:04', '1:30:57'],
    ['D', '0.84', '6:17', '1:42:53'],
    ['M', '1.55', '11:36', '1:59:36'],
    ['D', '0.86', '6:26', '2:17:51'],
    ['M', '1.01', '7:36', '2:28:30'],
    ['D', '0.80', '6:02', '2:36:45'],
  ]);
  assert.equal(formatMS(schedule.climb.paceSecPerKm), '9:07');
  assert.equal(formatMS(schedule.descent.paceSecPerKm), '6:12');
});

test('la somme des durées redonne le temps visé, quels que soient les réglages', () => {
  for (const threshold of [10, 20, 30]) {
    for (const profile of [-0.3, 0, 0.2]) {
      const plan = computePlan(prepared, { threshold, profile });
      const schedule = sectionSchedule(plan, TOTAL);
      assert.equal(schedule.rows.reduce((sum, r) => sum + r.seconds, 0), TOTAL);
      assert.ok(Math.abs(plan.sections.reduce((sum, s) => sum + s.share, 0) - 1) < 1e-9);
    }
  }
});

test('profil du coureur : +0,2 creuse l\'écart montée/descente', () => {
  const schedule = sectionSchedule(computePlan(prepared, { profile: 0.2 }), TOTAL);
  assert.equal(formatMS(schedule.climb.paceSecPerKm), '10:11');
  assert.equal(formatMS(schedule.descent.paceSecPerKm), '5:20');
});

test('coût selon la pente', () => {
  assert.equal(cost(0).toFixed(2), '1.00');
  assert.equal(cost(-9).toFixed(2), '0.88');
  assert.equal(cost(-18).toFixed(2), '1.00');
  assert.equal(cost(10).toFixed(2), '1.41');
  assert.equal(cost(20).toFixed(2), '2.13');
});

test('lecture des saisies', () => {
  assert.equal(parseDuration('2:36:45', 'time'), 9405);
  assert.equal(parseDuration('2h36', 'time'), 9360);
  assert.equal(parseDuration('2h', 'time'), 7200);
  assert.equal(parseDuration('3', 'time'), null);
  assert.equal(parseDuration('2:75', 'time'), null);
  assert.equal(parseDuration('7:30', 'pace'), 450);
  assert.equal(parseDuration("7'30''", 'pace'), 450);
  assert.equal(parseDuration('7,5', 'pace'), 450);
  assert.equal(parseDuration('abc', 'pace'), null);
});
