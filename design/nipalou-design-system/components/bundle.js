/* @ds-bundle: {"format":4,"namespace":"Nipalou","components":[{"name":"Button"},{"name":"Tag"},{"name":"Notice"},{"name":"Bib"},{"name":"RaceCard"},{"name":"ElevationProfile"},{"name":"ResultsTable"},{"name":"TextField"},{"name":"Icon"}]} */
(function () {
  'use strict';
  var React = window.React;
  var h = React.createElement;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }
  function omit(obj, keys) {
    var out = {};
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) < 0) out[k] = obj[k];
    return out;
  }
  var nf = function (n, d) {
    try { return Number(n).toLocaleString('fr-FR', { maximumFractionDigits: d == null ? 0 : d }); }
    catch (e) { return String(n); }
  };

  /* ---------- Icon (Lucide-style strokes, 24px grid) ---------- */
  var PATHS = {
    'arrow-right': [['path', { d: 'M5 12h14' }], ['path', { d: 'm12 5 7 7-7 7' }]],
    'clock': [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'M12 6v6l4 2' }]],
    'mountain': [['path', { d: 'm8 3 4 8 5-5 5 15H2L8 3z' }]],
    'map-pin': [['path', { d: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z' }], ['circle', { cx: 12, cy: 10, r: 3 }]],
    'users': [['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }], ['circle', { cx: 9, cy: 7, r: 4 }], ['path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87' }], ['path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }]],
    'flag': [['path', { d: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z' }], ['path', { d: 'M4 22v-7' }]],
    'info': [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'M12 16v-4' }], ['path', { d: 'M12 8h.01' }]],
    'circle-check': [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'm9 12 2 2 4-4' }]],
    'triangle-alert': [['path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' }], ['path', { d: 'M12 9v4' }], ['path', { d: 'M12 17h.01' }]],
    'circle-x': [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'm15 9-6 6' }], ['path', { d: 'm9 9 6 6' }]]
  };
  function Icon(props) {
    var size = props.size || 20;
    var shapes = PATHS[props.name] || PATHS.info;
    var a11y = props.title ? { role: 'img', 'aria-label': props.title } : { 'aria-hidden': 'true' };
    return h('svg', Object.assign({
      className: cx('np-icon', props.className), width: size, height: size, viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', strokeWidth: props.strokeWidth || 1.75,
      strokeLinecap: 'round', strokeLinejoin: 'round', focusable: 'false'
    }, a11y), shapes.map(function (s, i) { return h(s[0], Object.assign({ key: i }, s[1])); }));
  }
  Icon.names = Object.keys(PATHS);

  /* ---------- Button ---------- */
  function Button(props) {
    var variant = props.variant || 'primary';
    var size = props.size || 'md';
    var rest = omit(props, ['variant', 'size', 'className', 'children', 'icon', 'href']);
    var cls = cx('np-btn', 'np-btn--' + variant, 'np-btn--' + size, props.className);
    var kids = [h('span', { key: 'l' }, props.children)];
    if (props.icon) kids.push(h(Icon, { key: 'i', name: props.icon, size: size === 'lg' ? 22 : 18 }));
    if (props.href) return h('a', Object.assign({ href: props.href, className: cls }, rest), kids);
    return h('button', Object.assign({ type: 'button', className: cls }, rest), kids);
  }

  /* ---------- Tag ---------- */
  function Tag(props) {
    var tone = props.tone || 'neutral';
    return h('span', { className: cx('np-tag', 'np-tag--' + tone, props.className) },
      props.icon ? h(Icon, { name: props.icon, size: 14 }) : null,
      props.children);
  }

  /* ---------- Notice ---------- */
  var NOTICE = {
    info: { icon: 'info', word: 'Info' },
    success: { icon: 'circle-check', word: 'Confirmé' },
    warning: { icon: 'triangle-alert', word: 'Attention' },
    danger: { icon: 'circle-x', word: 'Erreur' }
  };
  function Notice(props) {
    var tone = NOTICE[props.tone] ? props.tone : 'info';
    var t = NOTICE[tone];
    return h('div', { className: cx('np-notice', 'np-notice--' + tone, props.className) },
      h(Icon, { name: t.icon, size: 20, className: 'np-notice__icon' }),
      h('div', { className: 'np-notice__body' },
        h('p', { className: 'np-notice__title' }, props.title || t.word),
        props.children ? h('div', { className: 'np-notice__text' }, props.children) : null));
  }

  /* ---------- Bib (dossard) ---------- */
  function Bib(props) {
    var size = props.size || 'md';
    var label = 'Dossard ' + props.number + (props.race ? ', ' + props.race : '');
    return h('div', { className: cx('np-bib', 'np-bib--' + size, props.className), role: 'img', 'aria-label': label },
      ['tl', 'tr', 'bl', 'br'].map(function (p) { return h('span', { key: p, className: 'np-bib__pin np-bib__pin--' + p }); }),
      h('div', { className: 'np-bib__band' }, props.event || 'Tour du Nipalou'),
      h('div', { className: 'np-bib__number' }, props.number),
      props.race ? h('div', { className: 'np-bib__race' }, props.race) : null);
  }

  /* ---------- RaceCard ---------- */
  function RaceCard(props) {
    var tone = props.tone || 'brand';
    var details = props.details || [];
    var tags = props.tags || [];
    return h('article', { className: cx('np-race', 'np-race--' + tone, props.className) },
      h('header', { className: 'np-race__head' },
        h('p', { className: 'np-race__distance' },
          h('span', { className: 'np-race__num' }, props.distance),
          h('span', { className: 'np-race__unit' }, props.unit || 'km')),
        h('h3', { className: 'np-race__title' }, props.title)),
      details.length ? h('dl', { className: 'np-race__details' }, details.map(function (d, i) {
        return h('div', { key: i, className: 'np-race__row' },
          d.icon ? h(Icon, { name: d.icon, size: 18 }) : null,
          h('dt', null, d.label), h('dd', null, d.value));
      })) : null,
      tags.length ? h('div', { className: 'np-race__tags' }, tags.map(function (t, i) {
        return h(Tag, { key: i, tone: t.tone || 'neutral' }, t.label);
      })) : null,
      (props.ctaLabel || props.secondaryLabel) ? h('footer', { className: 'np-race__foot' },
        props.ctaLabel ? h(Button, { variant: props.ctaVariant || 'accent', href: props.href, onClick: props.onCta, icon: 'arrow-right' }, props.ctaLabel) : null,
        props.secondaryLabel ? h(Button, { variant: 'ghost', href: props.secondaryHref }, props.secondaryLabel) : null) : null);
  }

  /* ---------- ElevationProfile ---------- */
  function niceStep(range, target) {
    var raw = range / target, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  }
  function ElevationProfile(props) {
    var pts = (props.points || []).slice().sort(function (a, b) { return a[0] - b[0]; });
    var markers = props.markers || [];
    var height = props.height || 240;
    var ref = React.useRef(null);
    var ws = React.useState(640), width = ws[0], setWidth = ws[1];
    var hs = React.useState(null), hover = hs[0], setHover = hs[1];
    React.useEffect(function () {
      var el = ref.current; if (!el) return;
      var set = function () { setWidth(Math.max(280, el.clientWidth)); };
      set();
      if (typeof ResizeObserver === 'undefined') return;
      var ro = new ResizeObserver(set); ro.observe(el);
      return function () { ro.disconnect(); };
    }, []);
    if (pts.length < 2) return h('div', { className: 'np-profile', ref: ref });

    var up = 0, down = 0, maxAlt = -Infinity, minAlt = Infinity;
    pts.forEach(function (p, i) {
      maxAlt = Math.max(maxAlt, p[1]); minAlt = Math.min(minAlt, p[1]);
      if (i) { var d = p[1] - pts[i - 1][1]; if (d > 0) up += d; else down -= d; }
    });
    var km = pts[pts.length - 1][0];
    var yStep = niceStep(maxAlt - minAlt || 100, 4);
    var y0 = Math.floor(minAlt / yStep) * yStep, y1 = Math.ceil(maxAlt / yStep) * yStep;
    if (y1 === y0) y1 = y0 + yStep;
    var xStep = niceStep(km, Math.max(3, Math.floor(width / 110)));
    var m = { t: 28, r: 16, b: 28, l: 48 };
    var iw = width - m.l - m.r, ih = height - m.t - m.b;
    var X = function (v) { return m.l + (v / km) * iw; };
    var Y = function (v) { return m.t + ih - ((v - y0) / (y1 - y0)) * ih; };
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join(' ');
    var area = line + ' L' + X(km).toFixed(1) + ' ' + (m.t + ih) + ' L' + X(0).toFixed(1) + ' ' + (m.t + ih) + ' Z';
    var altAt = function (k) {
      for (var i = 1; i < pts.length; i++) if (pts[i][0] >= k) {
        var a = pts[i - 1], b = pts[i], t = (k - a[0]) / ((b[0] - a[0]) || 1);
        return a[1] + t * (b[1] - a[1]);
      }
      return pts[pts.length - 1][1];
    };
    var yTicks = []; for (var v = y0; v <= y1 + 1e-6; v += yStep) yTicks.push(v);
    var xTicks = []; for (var k = 0; k <= km + 1e-6; k += xStep) xTicks.push(k);

    function onMove(e) {
      var r = e.currentTarget.getBoundingClientRect();
      var x = (e.clientX - r.left) * (width / r.width);
      var kk = Math.max(0, Math.min(km, ((x - m.l) / iw) * km));
      setHover(kk);
    }
    var tip = null;
    if (hover != null) {
      var hx = X(hover), ha = altAt(hover);
      var tipLeft = Math.min(Math.max(hx - 70, 0), width - 140);
      tip = h('div', { className: 'np-profile__tip', style: { left: tipLeft + 'px', top: '0px' } },
        h('strong', null, nf(ha) + ' m'), h('span', null, 'km ' + nf(hover, 1)));
    }
    var label = props.title || ('Profil de ' + nf(km, 1) + ' km, D+ ' + nf(up) + ' m');

    return h('figure', { className: cx('np-profile', props.className) },
      (props.title || props.showStats !== false) ? h('figcaption', { className: 'np-profile__head' },
        props.title ? h('span', { className: 'np-profile__title' }, props.title) : null,
        props.showStats !== false ? h('dl', { className: 'np-profile__stats' },
          h('div', null, h('dt', null, 'Distance'), h('dd', null, nf(km, 1) + ' km')),
          h('div', null, h('dt', null, 'D+'), h('dd', null, nf(up) + ' m')),
          h('div', null, h('dt', null, 'D−'), h('dd', null, nf(down) + ' m')),
          h('div', null, h('dt', null, 'Alt. max'), h('dd', null, nf(maxAlt) + ' m'))) : null) : null,
      h('div', { className: 'np-profile__plot', ref: ref, style: { height: height + 'px' } },
        h('svg', {
          width: width, height: height, viewBox: '0 0 ' + width + ' ' + height, role: 'img', 'aria-label': label,
          onMouseMove: onMove, onMouseLeave: function () { setHover(null); }
        },
          yTicks.map(function (t) {
            return h('g', { key: 'y' + t },
              h('line', { className: 'np-profile__grid', x1: m.l, x2: width - m.r, y1: Y(t), y2: Y(t) }),
              h('text', { className: 'np-profile__axis', x: m.l - 8, y: Y(t) + 4, textAnchor: 'end' }, nf(t)));
          }),
          xTicks.map(function (t) {
            return h('text', { key: 'x' + t, className: 'np-profile__axis', x: X(t), y: height - 8, textAnchor: t === 0 ? 'start' : 'middle' }, nf(t, 1) + (t === 0 ? ' km' : ''));
          }),
          h('path', { className: 'np-profile__area', d: area }),
          h('path', { className: 'np-profile__line', d: line }),
          markers.map(function (mk, i) {
            var mx = X(mk.km), my = Y(altAt(mk.km));
            return h('g', { key: 'm' + i },
              h('line', { className: 'np-profile__stem', x1: mx, x2: mx, y1: my, y2: m.t + ih }),
              h('circle', { className: 'np-profile__dot', cx: mx, cy: my, r: 5 }),
              h('text', { className: 'np-profile__marker', x: mx, y: my - 12, textAnchor: 'middle' }, mk.label));
          }),
          hover != null ? h('g', null,
            h('line', { className: 'np-profile__cross', x1: X(hover), x2: X(hover), y1: m.t, y2: m.t + ih }),
            h('circle', { className: 'np-profile__focus', cx: X(hover), cy: Y(altAt(hover)), r: 5 })) : null),
        tip));
  }

  /* ---------- ResultsTable ---------- */
  function ResultsTable(props) {
    var rows = props.rows || [];
    var podium = props.podium !== false;
    return h('div', { className: cx('np-results', props.className) },
      h('table', null,
        props.caption ? h('caption', null, props.caption) : null,
        h('thead', null, h('tr', null,
          h('th', { scope: 'col', className: 'np-num' }, 'Rang'),
          h('th', { scope: 'col', className: 'np-num' }, 'Dossard'),
          h('th', { scope: 'col' }, 'Nom'),
          h('th', { scope: 'col' }, 'Cat.'),
          h('th', { scope: 'col', className: 'np-hide-sm' }, 'Club'),
          h('th', { scope: 'col', className: 'np-num' }, 'Temps'))),
        h('tbody', null, rows.map(function (r, i) {
          var rank = r.rank != null ? r.rank : i + 1;
          var medal = podium && rank <= 3 ? ' np-rank--' + rank : '';
          return h('tr', { key: i },
            h('td', { className: 'np-num' }, h('span', { className: 'np-rank' + medal }, rank)),
            h('td', { className: 'np-num np-muted' }, r.bib),
            h('td', { className: 'np-name' }, r.name),
            h('td', null, r.category),
            h('td', { className: 'np-hide-sm np-muted' }, r.club),
            h('td', { className: 'np-num np-time' }, r.time));
        }))));
  }

  /* ---------- TextField ---------- */
  var uid = 0;
  function TextField(props) {
    var idRef = React.useRef(props.id || ('np-field-' + (++uid)));
    var id = idRef.current;
    var hintId = id + '-hint';
    var rest = omit(props, ['label', 'hint', 'error', 'className', 'id']);
    var describedBy = (props.error || props.hint) ? hintId : undefined;
    return h('div', { className: cx('np-field', props.error ? 'np-field--error' : null, props.className) },
      h('label', { htmlFor: id, className: 'np-field__label' }, props.label),
      h('input', Object.assign({ id: id, className: 'np-field__input', 'aria-invalid': props.error ? 'true' : undefined, 'aria-describedby': describedBy }, rest)),
      props.error ? h('p', { id: hintId, className: 'np-field__msg np-field__msg--error' }, h(Icon, { name: 'circle-x', size: 16 }), props.error)
        : props.hint ? h('p', { id: hintId, className: 'np-field__msg' }, props.hint) : null);
  }

  var api = { Button: Button, Tag: Tag, Notice: Notice, Bib: Bib, RaceCard: RaceCard, ElevationProfile: ElevationProfile, ResultsTable: ResultsTable, TextField: TextField, Icon: Icon };
  window.Nipalou = Object.assign(window.Nipalou || {}, api);
})();
