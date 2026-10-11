import { useState, type FormEvent } from 'react';
import { STOP_CHOICES, type AidStops } from '../lib/aid-stations';
import { NB, dec, dur, hms, ms } from '../lib/format';
import { DESCENT_WEIGHT, parseDuration } from '../lib/pace-model';
import { TOTAL_MAX, TOTAL_MIN } from '../lib/usePlanSettings';
import { Icon } from './ds/Icon';

type Mode = 'time' | 'pace';

const HINT: Record<Mode, string> = {
  time: 'Sous la forme 2:36:45 ou 2h36.',
  pace: 'En minutes par kilomètre, sous la forme 7:30.',
};
const ERR: Record<Mode, string> = {
  time: 'Écrivez le temps sous la forme 2:36:45 ou 2h36, entre 0:45:00 et 12:00:00.',
  pace: 'Écrivez l’allure sous la forme 7:30, entre 2:10 et 34:00 par kilomètre.',
};

interface Props {
  km: number;
  totalSeconds: number;
  threshold: number;
  descentWeight: number;
  sectionCount: number;
  onTotal: (total: number) => void;
  onThreshold: (threshold: number) => void;
  onDescentWeight: (descentWeight: number) => void;
  aidStops: AidStops;
  /** Nombre de ravitos de la course par type (hors arrivée). */
  aidCounts: Record<keyof AidStops, number>;
  /** Total des arrêts comptés, en secondes. */
  stopSeconds: number;
  onAidStops: (stops: AidStops) => void;
}

export function PlanControls({ km, totalSeconds, threshold, descentWeight, sectionCount, onTotal, onThreshold, onDescentWeight, aidStops, aidCounts, stopSeconds, onAidStops }: Props) {
  // Texte en cours de saisie : affiché tant que le champ a le focus ou est en erreur.
  const [draft, setDraft] = useState<Record<Mode, string | null>>({ time: null, pace: null });
  const [errors, setErrors] = useState<Record<Mode, boolean>>({ time: false, pace: false });

  const formatted = (mode: Mode) => (mode === 'time' ? hms(totalSeconds) : ms(totalSeconds / km));

  const read = (mode: Mode, text: string) => {
    const v = parseDuration(text, mode);
    if (v == null) return null;
    const total = mode === 'time' ? v : v * km;
    return total >= TOTAL_MIN && total <= TOTAL_MAX ? total : null;
  };

  const onInput = (mode: Mode, text: string) => {
    setDraft((d) => ({ ...d, [mode]: text }));
    const total = read(mode, text);
    if (total == null) return; // saisie invalide : rien ne change pendant la frappe
    setErrors({ time: false, pace: false });
    setDraft((d) => ({ ...d, [mode === 'time' ? 'pace' : 'time']: null }));
    onTotal(total);
  };

  const onBlur = (mode: Mode) => {
    const text = draft[mode];
    if (text == null) return;
    if (read(mode, text) == null) setErrors((e) => ({ ...e, [mode]: true }));
    else {
      setErrors((e) => ({ ...e, [mode]: false }));
      setDraft((d) => ({ ...d, [mode]: null }));
    }
  };

  // Curseur à 7 positions (−3 à +3) : descentWeight = 1 − 0,05 × position.
  const position = Math.round((DESCENT_WEIGHT.neutral - descentWeight) / DESCENT_WEIGHT.step);
  const profileMsg =
    position === 0
      ? 'Équilibré : la descente compte comme le plat.'
      : position > 0
        ? `Descendeur : 1${NB}km de descente compte pour ${dec(descentWeight, 2)}${NB}km.`
        : `Grimpeur : 1${NB}km de descente compte pour ${dec(descentWeight, 2)}${NB}km.`;

  const field = (mode: Mode, label: string, unit?: string) => (
    <div className={`field${errors[mode] ? ' field--error' : ''}`}>
      <label className="field__label" htmlFor={`f-${mode}`}>
        {label}
      </label>
      <div className={`field__box${unit ? ' field__box--unit' : ''}`}>
        <input
          className="field__input"
          id={`f-${mode}`}
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          aria-describedby={`msg-${mode}`}
          aria-invalid={errors[mode] || undefined}
          value={draft[mode] ?? formatted(mode)}
          onFocus={() => setDraft((d) => ({ ...d, [mode]: d[mode] ?? formatted(mode) }))}
          onChange={(e) => onInput(mode, e.currentTarget.value)}
          onBlur={() => onBlur(mode)}
        />
        {unit && (
          <span className="field__unit" aria-hidden="true">
            {unit}
          </span>
        )}
      </div>
      <p className="field__msg" id={`msg-${mode}`}>
        {errors[mode] ? (
          <>
            <Icon name="circle-x" size={16} />
            <span>{ERR[mode]}</span>
          </>
        ) : (
          HINT[mode]
        )}
      </p>
    </div>
  );

  return (
    <form className="controls card" noValidate onSubmit={(e: FormEvent) => e.preventDefault()}>
      {field('time', 'Temps visé')}
      {field('pace', 'Allure moyenne', '/km')}

      <div className="field">
        <span className="field__label" id="lbl-split">
          Découpage
        </span>
        <div className="seg" role="radiogroup" aria-labelledby="lbl-split" aria-describedby="msg-split">
          {[
            [10, 'Fin'],
            [20, 'Moyen'],
            [30, 'Large'],
          ].map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name="decoupage"
                value={value}
                checked={threshold === value}
                onChange={() => onThreshold(value as number)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <p className="field__msg" id="msg-split">
          {sectionCount} sections : le profil doit s’inverser d’au moins {threshold}
          {NB}m.
        </p>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="f-profile">
          Profil du coureur
        </label>
        <div className="range">
          <input
            id="f-profile"
            type="range"
            min={-3}
            max={3}
            step={1}
            value={position}
            aria-describedby="msg-profile"
            aria-valuetext={profileMsg}
            onChange={(e) => onDescentWeight(Math.round((1 - DESCENT_WEIGHT.step * Number(e.currentTarget.value)) * 100) / 100)}
          />
        </div>
        <div className="range__ends" aria-hidden="true">
          <span>Grimpeur</span>
          <span>Descendeur</span>
        </div>
        <p className="field__msg" id="msg-profile">
          {profileMsg}
        </p>
      </div>

      {aidCounts.eau + aidCounts.complet > 0 && (
        <div className="field">
          <span className="field__label" id="lbl-stops">
            Arrêts aux ravitos
          </span>
          <div className="stops" role="group" aria-labelledby="lbl-stops" aria-describedby="msg-stops">
            {(['eau', 'complet'] as const)
              .filter((type) => aidCounts[type] > 0)
              .map((type) => (
                <label key={type} className="stops__item">
                  <span className="stops__label">{type === 'eau' ? 'Point d’eau' : 'Complet'}</span>
                  <select
                    className="field__input stops__select"
                    value={aidStops[type]}
                    onChange={(e) => onAidStops({ ...aidStops, [type]: Number(e.currentTarget.value) })}
                  >
                    {STOP_CHOICES.map((s) => (
                      <option key={s} value={s}>
                        {stopLabel(s)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
          </div>
          <p className="field__msg" id="msg-stops">
            {stopSeconds > 0
              ? `${aidCounts.eau + aidCounts.complet} ravitos, ${dur(stopSeconds)} d’arrêt au total : le temps de course est réduit d’autant.`
              : 'Aucun arrêt compté : réglez la durée passée à chaque ravito.'}
          </p>
        </div>
      )}
    </form>
  );
}

/** 0 → « Aucun », 30 → « 30 s », 120 → « 2 min » */
function stopLabel(seconds: number): string {
  if (seconds === 0) return 'Aucun';
  return seconds < 60 ? `${seconds}${NB}s` : `${seconds / 60}${NB}min`;
}
