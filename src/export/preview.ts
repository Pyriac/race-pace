// Aperçu de l'image exportée pour chaque course et chaque découpage (page de dev : /export-preview.html).
// ?t=9405 pour changer le temps visé, ?w=0.85 pour le poids de la descente (profil du coureur).
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import { courses } from '../data/courses';
import { computePlan, prepareCourse, sectionSchedule, THRESHOLDS } from '../lib/pace-model';
import { renderPlanImage } from './renderPlanImage';

const params = new URLSearchParams(location.search);
const descentWeight = Number(params.get('w') ?? 1);
document.body.style.background = '#ece5de';

const root = document.getElementById('previews')!;
for (const course of courses) {
  const prepared = prepareCourse(course.data);
  const total = Number(params.get('t')) || Math.round((450 * prepared.lengthM) / 1000);
  for (const threshold of [THRESHOLDS.large, THRESHOLDS.moyen, THRESHOLDS.fin]) {
    const plan = computePlan(prepared, { threshold, descentWeight });
    const canvas = await renderPlanImage({
      courseName: course.data.name ?? course.label,
      prepared,
      plan,
      schedule: sectionSchedule(plan, total),
    });
    canvas.style.width = '360px';
    canvas.style.borderRadius = '24px';
    root.appendChild(canvas);
  }
}
document.body.dataset.ready = 'true';
