import { aidLabel, type TimedSchedule } from '../lib/aid-stations';
import { NB, dec, dur, hms, int, ms, signedDec } from '../lib/format';
import type { PreparedCourse } from '../lib/pace-model';
import { Icon } from './ds/Icon';

interface Props {
  /** Plan avec ravitos : une ligne par ravito (arrêt et heure d'arrivée) entre les sections. */
  schedule: TimedSchedule;
  prepared: PreparedCourse;
  /** Km-effort ITRA du parcours (ligne de total). */
  kmEffort: number;
  active: number;
  onHover: (k: number) => void;
}

export function SectionsTable({ schedule, prepared, kmEffort, active, onHover }: Props) {
  const km = prepared.lengthM / 1000;
  return (
    <section className="block">
      <h2>Sections</h2>
      <p className="block__intro">
        Chaque section vaut un nombre de km-effort : sa distance, plus 1{NB}km par 100{NB}m de D+. Le temps visé est
        réparti au prorata. Le coefficient compare l’allure de la section à l’allure moyenne et ne change pas avec le temps
        visé.
      </p>
      <div className="results card">
        <table>
          <thead>
            <tr>
              <th scope="col">Section</th>
              <th scope="col" className="num hide-sm">Du km au km</th>
              <th scope="col" className="num">Dist.</th>
              <th scope="col" className="num show-sm">Déniv.</th>
              <th scope="col" className="num hide-sm">D+</th>
              <th scope="col" className="num hide-sm">D−</th>
              <th scope="col" className="num hide-sm">Pente</th>
              <th scope="col" className="num hide-sm">Km-effort</th>
              <th scope="col" className="num">Coef.</th>
              <th scope="col" className="num">Allure</th>
              <th scope="col" className="num">Temps</th>
              <th scope="col" className="num">Passage</th>
            </tr>
          </thead>
          <tbody onPointerLeave={() => onHover(-1)}>
            {schedule.lines.map((line) => {
              if (line.kind === 'aid') {
                const { aid } = line;
                return (
                  <tr key={`aid-${aid.km}`} className="aid-row" onPointerOver={() => onHover(-1)}>
                    <td colSpan={9}>
                      <span className="aid">
                        <Icon name={aid.type === 'eau' ? 'milk' : 'utensils'} size={18} className="aid__icon" />
                        <span>
                          {aidLabel(aid.type)} · km {dec(aid.km, 1)}
                        </span>
                      </span>
                    </td>
                    <td className="num time" data-label="Arrêt">{line.stopSeconds ? dur(line.stopSeconds) : '–'}</td>
                    <td className="num time" data-label="Arrivée">{hms(line.arrivalSeconds)}</td>
                  </tr>
                );
              }
              const r = line.row;
              const k = r.index - 1;
              return (
              <tr key={r.index} className={k === active ? 'is-active' : undefined} onPointerOver={() => onHover(k)}>
                <td>
                  <span className="sec">
                    <span className={`sec__n ${r.climb ? 'sec__n--up' : 'sec__n--down'}`}>{r.index}</span>
                    <span className="sec__type">
                      <Icon name={r.climb ? 'trend-up' : 'trend-down'} size={18} className={r.climb ? 'ico--up' : 'ico--down'} />
                      <span className="sec__label">{r.climb ? 'Montée' : 'Descente'}</span>
                    </span>
                  </span>
                </td>
                <td className="num muted hide-sm" data-label="Du km au km">
                  {dec(r.startM / 1000, 1)} → {dec(r.endM / 1000, 1)}
                </td>
                <td className="num" data-label="Dist.">{dec(r.distM / 1000, 2)}{NB}km</td>
                <td className="num show-sm" data-label="Déniv.">
                  {r.climb ? `+${int(r.dPlus)}` : `−${int(r.dMinus)}`}{NB}m
                </td>
                <td className={`num hide-sm${Math.round(r.dPlus) ? '' : ' muted'}`} data-label="D+">{int(r.dPlus)}{NB}m</td>
                <td className={`num hide-sm${Math.round(r.dMinus) ? '' : ' muted'}`} data-label="D−">{int(r.dMinus)}{NB}m</td>
                <td className="num muted hide-sm" data-label="Pente">{signedDec(r.gradePct)}{NB}%</td>
                <td className="num hide-sm" data-label="Km-effort">{dec(r.kmEffort, 2)}</td>
                <td className="num coef" data-label="Coef.">{dec(r.coef, 2)}</td>
                <td className="num" data-label="Allure">{ms(r.paceSecPerKm)}</td>
                <td className="num time" data-label="Temps">{dur(r.seconds)}</td>
                <td className="num time" data-label="Passage">{hms(r.passageSeconds)}</td>
              </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td>Parcours</td>
              <td className="num muted hide-sm" data-label="Du km au km">0,0 → {dec(km, 1)}</td>
              <td className="num" data-label="Dist.">{dec(km, 2)}{NB}km</td>
              <td className="num show-sm" data-label="Déniv.">+{int(prepared.dPlus)}{NB}m</td>
              <td className="num hide-sm" data-label="D+">{int(prepared.dPlus)}{NB}m</td>
              <td className="num hide-sm" data-label="D−">{int(prepared.dMinus)}{NB}m</td>
              <td className="num muted hide-sm" data-label="Pente" />
              <td className="num hide-sm" data-label="Km-effort">{dec(kmEffort, 2)}</td>
              <td className="num coef" data-label="Coef.">1,00</td>
              <td className="num" data-label="Allure">{ms(schedule.meanPaceSecPerKm)}</td>
              <td className="num time" data-label="Temps">{hms(schedule.totalSeconds)}</td>
              <td className="num time" data-label="Passage">{hms(schedule.totalSeconds)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
