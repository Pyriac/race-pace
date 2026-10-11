import { describe, expect, it } from 'vitest';
import { courses } from '../data/courses';
import course from '../data/courses/nipalou-21km.json';
import { mergeAidStations } from './aid-stations';
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

  it('un ravito à l’arrivée vient en dernier, un ravito hors parcours est ignoré', () => {
    const lines = mergeAidStations(rows, [{ km: 20.9, type: 'complet' }, { km: 35, type: 'eau' }], prepared.lengthM);
    expect(kinds(lines).at(-1)).toBe('R20.9');
    expect(lines).toHaveLength(rows.length + 1);
  });
});
