import { NB, dec, int, ms, signed } from '../lib/format';
import { CLIMB_M_PER_KM, cost, flatPaceSecPerKm, type Plan, type PreparedCourse } from '../lib/pace-model';
import { Notice } from './ds/Notice';

const GRADES = [-20, -15, -10, -5, 0, 5, 10, 15, 20, 25];

interface Props {
  plan: Plan;
  prepared: PreparedCourse;
  totalSeconds: number;
  courseLabel: string;
  officialDPlus?: number;
}

export function MethodSection({ plan, prepared, totalSeconds, courseLabel, officialDPlus }: Props) {
  const flat = flatPaceSecPerKm(plan, totalSeconds);
  return (
    <section className="block">
      <h2>Comment le temps est réparti</h2>
      <div className="method">
        <div className="method__text">
          <ol>
            <li>Le profil est relu tous les 10{NB}m et légèrement lissé, sur 20{NB}m de part et d’autre.</li>
            <li>
              Une section se termine quand le profil s’inverse d’au moins 20{NB}m de dénivelé (10{NB}m en découpage fin,
              30{NB}m en large).
            </li>
            <li>
              Chaque section est comptée en km-effort, la mesure de l’ITRA : 1{NB}km de distance vaut 1 km-effort, et
              100{NB}m de D+ en ajoutent 1. Le plat et la descente comptent autant.
            </li>
            <li>
              Le temps visé est réparti au prorata des km-effort. Le coefficient d’une section est son allure divisée par
              l’allure moyenne, et la somme des temps redonne toujours le temps visé.
            </li>
          </ol>
          <p className="formula">Temps de la section = km-effort × allure sur le plat</p>
          <Notice tone="info" title="À savoir">
            <p>
              Ce plan suppose un effort régulier du départ à l’arrivée, sans fatigue ni arrêt aux ravitos. Le km-effort
              reflète la difficulté moyenne d’un parcours de trail, pas la technicité d’un chemin en particulier : une
              descente douce y compte autant qu’une descente raide.
            </p>
          </Notice>
          <p className="foot">
            Le km-effort est la mesure de difficulté de l’ITRA.{' '}
            <a href="https://itra.run/About/DiscoverTrailRunning" target="_blank" rel="noopener">
              Voir la définition de l’ITRA
            </a>
            . La formule vaut à profil équilibré. Le réglage « Profil du coureur » fait peser un kilomètre de descente de
            0,85 (Descendeur) à 1,15 (Grimpeur), avec plein effet à partir de −9{NB}% de pente. Repère : Strava mesure en
            moyenne 0,88 dans les descentes les plus favorables.{' '}
            <a href="https://medium.com/strava-engineering/an-improved-gap-model-8b07ae8886c3" target="_blank" rel="noopener">
              Lire l’article de Strava
            </a>
            .
          </p>
          {officialDPlus != null && (
            <p className="foot">
              Le D+ est calculé sur la trace : {int(prepared.dPlus)}{NB}m, contre {int(officialDPlus)}{NB}m annoncés pour le{' '}
              {courseLabel.replace(' ', NB)}. Avec le chiffre annoncé, le parcours vaudrait{' '}
              {dec(prepared.lengthM / 1000 + officialDPlus / CLIMB_M_PER_KM, 1)} km-effort au lieu de {dec(plan.kmEffort, 1)}.
            </p>
          )}
        </div>
        <div className="costs card">
          <table>
            <caption>Un kilomètre selon la pente</caption>
            <thead>
              <tr>
                <th scope="col">Pente</th>
                <th scope="col" className="num">Km-effort</th>
                <th scope="col" className="num">Allure</th>
              </tr>
            </thead>
            <tbody>
              {GRADES.map((p) => {
                const c = cost(p, plan.descentWeight);
                return (
                  <tr key={p}>
                    <td>{p === 0 ? 'Plat' : `${signed(p)}${NB}%`}</td>
                    <td className="num">{dec(c, 2)}</td>
                    <td className="num time">{ms(flat * c)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
