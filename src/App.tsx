import { useMemo, useState } from 'react';
import logoNightUrl from './assets/nipalou-coureur-logo-nuit.svg';
import logoUrl from './assets/nipalou-coureur-logo.svg';
import { ExportButton } from './components/ExportButton';
import { MethodSection } from './components/MethodSection';
import { PaceSummary } from './components/PaceSummary';
import { PlanControls } from './components/PlanControls';
import { SectionProfile } from './components/SectionProfile';
import { SectionsTable } from './components/SectionsTable';
import { courses } from './data/courses';
import { NB } from './lib/format';
import { mergeAidStations, scheduleWithStops } from './lib/aid-stations';
import { computePlan, prepareCourse, sectionIndexAt } from './lib/pace-model';
import { usePlanSettings } from './lib/usePlanSettings';

export function App() {
  const {
    course, totalSeconds, threshold, descentWeight, aidStops,
    setCourse, setTotal, setThreshold, setDescentWeight, setAidStops,
  } = usePlanSettings();

  // Les trois couches du modèle : profil (par course), découpage (par réglage), passages (par temps visé),
  // les passages intégrant les arrêts aux ravitos.
  const prepared = useMemo(() => prepareCourse(course.data), [course]);
  const plan = useMemo(() => computePlan(prepared, { threshold, descentWeight }), [prepared, threshold, descentWeight]);
  const schedule = useMemo(
    () => scheduleWithStops(prepared, plan, totalSeconds, course.aidStations, aidStops),
    [prepared, plan, totalSeconds, course, aidStops],
  );
  const km = prepared.lengthM / 1000;

  // Ravitos comptés dans le réglage (ceux situés sur le parcours, hors arrivée).
  const aidCounts = useMemo(() => {
    const counts = { eau: 0, complet: 0 };
    for (const l of mergeAidStations([], course.aidStations, prepared.lengthM - 50)) if (l.kind === 'aid') counts[l.aid.type]++;
    return counts;
  }, [course, prepared]);

  // Survol lié : profil ↔ tableau.
  const [cursor, setCursor] = useState(-1);
  const [hoverRow, setHoverRow] = useState(-1);
  const active = hoverRow >= 0 ? hoverRow : cursor >= 0 ? sectionIndexAt(plan, cursor) : -1;

  const resetHover = () => {
    setCursor(-1);
    setHoverRow(-1);
  };

  return (
    <main className="page">
      <header className="head">
        <div className="head__logo">
          {/* Version Jour ou Nuit selon le thème actif (voir global.css). */}
          <img className="head__logo--day" src={logoUrl} alt="Tour du Nipalou" width={374} height={96} />
          <img className="head__logo--night" src={logoNightUrl} alt="Tour du Nipalou" width={374} height={96} />
        </div>
        <div className="head__text">
          <p className="eyebrow">Tour du Nipalou · {course.source}</p>
          <h1>
            Plan d’allure du {course.label.replace(' ', NB)}
          </h1>
          <p className="lede">
            Indiquez votre temps visé. Le parcours est découpé en montées et en descentes, pesées en km-effort : chaque
            section reçoit son allure et son temps de passage.
          </p>
        </div>
      </header>

      {courses.length > 1 && (
        <div className="course-switch">
          <span className="field__label" id="lbl-course">
            Course
          </span>
          <div className="seg" role="radiogroup" aria-labelledby="lbl-course">
            {courses.map((c) => (
              <label key={c.id}>
                <input
                  type="radio"
                  name="course"
                  value={c.id}
                  checked={c.id === course.id}
                  onChange={() => {
                    resetHover();
                    setCourse(c.id);
                  }}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <PlanControls
        km={km}
        totalSeconds={totalSeconds}
        threshold={threshold}
        descentWeight={descentWeight}
        sectionCount={plan.sections.length}
        onTotal={setTotal}
        onThreshold={(t) => {
          resetHover();
          setThreshold(t);
        }}
        onDescentWeight={(w) => {
          resetHover();
          setDescentWeight(w);
        }}
        aidStops={aidStops}
        aidCounts={aidCounts}
        stopSeconds={schedule.stopSeconds}
        onAidStops={setAidStops}
      />

      <PaceSummary schedule={schedule} km={km} />

      <SectionProfile
        prepared={prepared}
        plan={plan}
        schedule={schedule}
        active={active}
        cursor={cursor}
        onCursor={setCursor}
      />

      <SectionsTable schedule={schedule} prepared={prepared} kmEffort={plan.kmEffort} active={active} onHover={setHoverRow} />

      <MethodSection
        plan={plan}
        prepared={prepared}
        flatPaceSecPerKm={schedule.flatPaceSecPerKm}
        courseLabel={course.label}
        officialDPlus={course.officialDPlus}
      />

      <ExportButton courseId={course.id} courseLabel={course.label} prepared={prepared} plan={plan} schedule={schedule} />
    </main>
  );
}
