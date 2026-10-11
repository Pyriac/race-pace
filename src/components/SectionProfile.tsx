// Profil altimétrique coloré par section : variante d'ElevationProfile décrite dans .claude/INTEGRATION.md.
import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { NB, dec, hms, int, ms, signed } from '../lib/format';
import { localGradePct, sectionIndexAt, timeAtIndex, type Plan, type PreparedCourse } from '../lib/pace-model';

interface Props {
  prepared: PreparedCourse;
  plan: Plan;
  totalSeconds: number;
  /** Section surlignée (position dans plan.sections), -1 sinon. */
  active: number;
  cursor: number;
  onCursor: (index: number) => void;
}

const M = { l: 54, r: 10, t: 30, b: 28 };

export function SectionProfile({ prepared, plan, totalSeconds, active, cursor, onCursor }: Props) {
  const plotRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(0);

  useLayoutEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const measure = () => setW(Math.max(280, Math.floor(el.clientWidth)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { n, alt, altMin, altMax, stepM, lengthM } = prepared;
  const km = lengthM / 1000;
  const narrow = W < 560;
  const H = narrow ? 230 : 320;
  const pw = W - M.l - M.r;
  const ph = H - M.t - M.b;

  // Géométrie fixe : recalculée seulement si la largeur, la course ou le découpage changent.
  const geo = useMemo(() => {
    if (W === 0) return null;
    let y0 = Math.floor(altMin / 50) * 50;
    const y1 = Math.ceil(altMax / 50) * 50;
    if (y0 === Math.floor(altMin)) y0 -= 50;
    const X = (i: number) => M.l + (i / (n - 1)) * pw;
    const Y = (z: number) => M.t + ((y1 - z) / (y1 - y0)) * ph;

    const yTicks: { y: number; label: string }[] = [];
    for (let z = Math.ceil(y0 / 100) * 100; z <= y1; z += 100) {
      yTicks.push({ y: Y(z), label: int(z) + (z + 100 > y1 ? `${NB}m` : '') });
    }
    // Pas des kilomètres : au moins 60 px entre deux repères.
    const stepKm = [1, 2, 5, 10, 20].find((s) => (s * pw) / km >= 60) ?? 20;
    const xTicks: { x: number; label: string; km: number }[] = [];
    for (let k = 0; k <= km; k += stepKm) xTicks.push({ x: M.l + (k / km) * pw, label: k === 0 ? '0 km' : String(k), km: k });

    const secs = plan.sections.map((s) => {
      let d = '';
      for (let i = s.startIndex; i <= s.endIndex; i++) d += `${i === s.startIndex ? 'M' : 'L'}${X(i).toFixed(1)} ${Y(alt[i]!).toFixed(1)}`;
      const xa = X(s.startIndex);
      const xb = X(s.endIndex);
      return {
        kind: s.climb ? 'up' : 'down',
        line: d,
        area: `${d}L${xb.toFixed(1)} ${M.t + ph}L${xa.toFixed(1)} ${M.t + ph}Z`,
        xa,
        xb,
        gapY: Y(alt[s.startIndex]!) + 2,
        showNum: xb - xa >= (s.index > 9 ? 20 : 14),
        index: s.index,
      };
    });
    return { X, Y, yTicks, xTicks, secs };
  }, [W, n, alt, altMin, altMax, km, pw, ph, plan]);

  const hasCursor = cursor >= 0 && geo != null;
  const cx = hasCursor ? geo.X(cursor) : 0;
  const cy = hasCursor ? geo.Y(alt[cursor]!) : 0;
  const cursorSection = hasCursor ? plan.sections[sectionIndexAt(plan, cursor)]! : null;

  // Info-bulle à droite du repère, ou à gauche si elle déborde.
  useLayoutEffect(() => {
    const tip = tipRef.current;
    if (!tip || !hasCursor) return;
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let left = cx + 14;
    if (left + tw > W) left = cx - 14 - tw;
    if (left < 0) left = 0;
    const top = Math.max(0, Math.min(H - th - 30, cy - th - 14));
    tip.style.transform = `translate(${Math.round(left)}px,${Math.round(top)}px)`;
  });

  const indexFromEvent = (ev: PointerEvent<HTMLDivElement>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(n - 1, Math.round(((ev.clientX - r.left - M.l) / pw) * (n - 1))));
  };

  const onKeyDown = (ev: KeyboardEvent<HTMLDivElement>) => {
    const step = Math.round((ev.shiftKey ? 1000 : 100) / stepM);
    let i = cursor < 0 ? 0 : cursor;
    if (ev.key === 'ArrowRight') i += cursor < 0 ? 0 : step;
    else if (ev.key === 'ArrowLeft') i -= step;
    else if (ev.key === 'Home') i = 0;
    else if (ev.key === 'End') i = n - 1;
    else if (ev.key === 'Escape') return onCursor(-1);
    else return;
    ev.preventDefault();
    onCursor(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <figure className="profile card">
      <div className="profile__head">
        <h2>Profil et sections</h2>
        <dl className="profile__stats">
          <div><dt>Distance</dt><dd>{dec(km, 1)}{NB}km</dd></div>
          <div><dt>D+</dt><dd>{int(prepared.dPlus)}{NB}m</dd></div>
          <div><dt>D−</dt><dd>{int(prepared.dMinus)}{NB}m</dd></div>
          <div><dt>Km-effort</dt><dd>{dec(plan.kmEffort, 1)}</dd></div>
          <div><dt>Alt. max</dt><dd>{int(altMax)}{NB}m</dd></div>
        </dl>
      </div>
      <div
        className="plot"
        ref={plotRef}
        tabIndex={0}
        role="img"
        aria-label="Profil altimétrique du parcours, coloré par section. Les flèches gauche et droite déplacent le repère ; toutes les valeurs figurent dans le tableau qui suit."
        style={{ height: geo ? H : undefined }}
        onPointerMove={(e) => geo && onCursor(indexFromEvent(e))}
        onPointerDown={(e) => geo && onCursor(indexFromEvent(e))}
        onPointerLeave={(e) => e.pointerType === 'mouse' && onCursor(-1)}
        onBlur={() => onCursor(-1)}
        onKeyDown={onKeyDown}
      >
        {geo && (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            {geo.yTicks.map((t) => (
              <g key={t.label}>
                <line className="p-grid" x1={M.l} x2={W - M.r} y1={t.y} y2={t.y} />
                <text className="p-axis" x={M.l - 8} y={t.y + 4} textAnchor="end">{t.label}</text>
              </g>
            ))}
            <line className="p-grid" x1={M.l} x2={W - M.r} y1={M.t + ph} y2={M.t + ph} />
            {geo.xTicks.map((t) => (
              <text key={t.km} className="p-axis" x={t.x} y={H - 8} textAnchor={t.km === 0 ? 'start' : 'middle'}>{t.label}</text>
            ))}
            {geo.secs.map((s, k) => (
              <rect key={`b${k}`} className={`p-band${k === active ? ' is-active' : ''}`} x={s.xa} y={M.t} width={s.xb - s.xa} height={ph} />
            ))}
            {geo.secs.map((s, k) => (
              <g key={`s${k}`}>
                <path className={`p-area--${s.kind}`} d={s.area} />
                <path className={`p-line p-line--${s.kind}`} d={s.line} />
              </g>
            ))}
            {geo.secs.map((s, k) => (
              <g key={`n${k}`}>
                {k > 0 && <line className="p-gap" x1={s.xa} x2={s.xa} y1={s.gapY} y2={M.t + ph} />}
                {s.showNum && (
                  <text className={`p-num${k === active ? ' is-active' : ''}`} x={(s.xa + s.xb) / 2} y={M.t - 10} textAnchor="middle">
                    {s.index}
                  </text>
                )}
              </g>
            ))}
            {hasCursor && (
              <>
                <line className="p-cross" x1={cx} x2={cx} y1={M.t} y2={M.t + ph} />
                <circle className="p-focus" cx={cx} cy={cy} r={5} />
              </>
            )}
            <rect className="p-hit" x={M.l} y={0} width={pw} height={H} />
          </svg>
        )}
        {hasCursor && cursorSection && (
          <div className="tip" ref={tipRef}>
            <div className="tip__head">
              <span className={`key ${cursorSection.climb ? 'key--up' : 'key--down'}`} />
              <span>Section {cursorSection.index} · {cursorSection.climb ? 'montée' : 'descente'}</span>
            </div>
            {[
              ['Passage', hms(timeAtIndex(plan, totalSeconds, cursor))],
              ['Distance', `${dec((cursor * stepM) / 1000, 2)}${NB}km`],
              ['Altitude', `${int(alt[cursor]!)}${NB}m`],
              ['Pente', `${signed(localGradePct(prepared, cursor))}${NB}%`],
              ['Allure section', ms((totalSeconds / km) * cursorSection.coef)],
            ].map(([label, value]) => (
              <div className="tip__row" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
      <figcaption className="legend">
        <span className="legend__item"><span className="swatch swatch--up" />Montée</span>
        <span className="legend__item"><span className="swatch swatch--down" />Descente</span>
        <span className="legend__hint">Survolez le profil pour lire le temps de passage à chaque point.</span>
      </figcaption>
    </figure>
  );
}
