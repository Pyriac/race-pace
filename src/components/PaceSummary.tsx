import { NB, dec, dur, hms, ms } from '../lib/format';
import type { TimedSchedule } from '../lib/aid-stations';
import type { GroupSummary } from '../lib/pace-model';
import { Icon } from './ds/Icon';

function detail(g: GroupSummary) {
  return `${dec(g.distM / 1000, 1)}${NB}km en ${dur(g.seconds)} · ${g.count} ${g.count > 1 ? 'sections' : 'section'}`;
}

export function PaceSummary({ schedule, km }: { schedule: TimedSchedule; km: number }) {
  const { climb, descent } = schedule;
  return (
    <section className="summary" aria-label="Allures résumées">
      <div className="stat">
        <span className="stat__label">Allure moyenne</span>
        <span className="stat__value">
          <span>{ms(schedule.meanPaceSecPerKm)}</span>
          <span className="stat__unit">/km</span>
        </span>
        <span className="stat__detail">
          {dec(km, 1)}
          {NB}km en {hms(schedule.totalSeconds)} · {ms(schedule.flatPaceSecPerKm)} sur le plat
          {schedule.stopSeconds > 0 && ` · dont ${dur(schedule.stopSeconds)} d’arrêt`}
        </span>
      </div>
      <div className="stat">
        <span className="stat__label">
          <Icon name="trend-up" className="ico--up" />
          En montée
        </span>
        <span className="stat__value">
          <span>{climb.paceSecPerKm != null ? ms(climb.paceSecPerKm) : '–'}</span>
          <span className="stat__unit">/km</span>
        </span>
        <span className="stat__detail">{detail(climb)}</span>
      </div>
      <div className="stat">
        <span className="stat__label">
          <Icon name="trend-down" className="ico--down" />
          En descente
        </span>
        <span className="stat__value">
          <span>{descent.paceSecPerKm != null ? ms(descent.paceSecPerKm) : '–'}</span>
          <span className="stat__unit">/km</span>
        </span>
        <span className="stat__detail">{detail(descent)}</span>
      </div>
    </section>
  );
}
