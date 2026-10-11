// Aperçu de l'image exportée pour chaque course et chaque découpage (page de dev : /export-preview.html).
// ?t=9405 temps visé, ?w=0.85 poids de la descente, ?ravitos=demo ravitos fictifs, ?eau=30&complet=180 arrêts (s).
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import { courses } from '../data/courses';
import { scheduleWithStops, type AidStation } from '../lib/aid-stations';
import { computePlan, prepareCourse, THRESHOLDS } from '../lib/pace-model';
import { renderPlanImage } from './renderPlanImage';

const params = new URLSearchParams(location.search);
const descentWeight = Number(params.get('w') ?? 1);
// ?eau=30&complet=180 : temps d'arrêt aux ravitos, en secondes.
const stopEau = Number(params.get('eau') ?? 0);
const stopComplet = Number(params.get('complet') ?? 0);
// ?ravitos=demo : ravitos fictifs (alternance eau / complet tous les ~7 km) pour vérifier la mise en page.
const demoAid = params.get('ravitos') === 'demo';
function demoAidStations(km: number): AidStation[] {
  const list: AidStation[] = [];
  for (let k = 7, i = 0; k < km; k += 7, i++) list.push({ km: Math.round(k * 10) / 10, type: i % 2 ? 'complet' : 'eau' });
  return list;
}
document.body.style.background = '#ece5de';

const root = document.getElementById('previews')!;
for (const course of courses) {
  const prepared = prepareCourse(course.data);
  const total = Number(params.get('t')) || Math.round((450 * prepared.lengthM) / 1000);
  for (const threshold of [THRESHOLDS.large, THRESHOLDS.moyen, THRESHOLDS.fin]) {
    const plan = computePlan(prepared, { threshold, descentWeight });
    const canvas = await renderPlanImage({
      courseLabel: course.label,
      prepared,
      plan,
      schedule: scheduleWithStops(
        prepared,
        plan,
        total,
        demoAid ? demoAidStations(prepared.lengthM / 1000) : course.aidStations,
        { eau: stopEau, complet: stopComplet },
      ),
    });
    canvas.style.width = '360px';
    canvas.style.borderRadius = '24px';
    root.appendChild(canvas);
  }
}
document.body.dataset.ready = 'true';
