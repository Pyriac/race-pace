// Image 9:16 du plan d'allure, à garder sur le téléphone pendant la course.
// Mêmes chiffres que le tableau (schedule.rows, rien n'est recalculé), rendu clair fixe indépendant du thème.
// Une ligne par section : pictogramme de pente, distance cumulée, dénivelé et distance de la section, passage.
import logoUrl from '../assets/nipalou-coureur-logo.svg';
import { aidLabel, mergeAidStations, type AidStation, type AidType } from '../lib/aid-stations';
import { NB, dec, hms, int, ms } from '../lib/format';
import type { Plan, PreparedCourse, Schedule } from '../lib/pace-model';

export const IMAGE_WIDTH = 1080;
export const IMAGE_HEIGHT = 1920;

/** Thème Jour du design system en valeurs littérales (les variables CSS ne suivent pas dans un canvas). */
const C = {
  page: '#f7f3ee',
  card: '#fdfbf9',
  ink: '#2d251c',
  inkMuted: '#584f45',
  line: '#d5cec6',
  brand: '#375a45',
  climb: '#a76b4d',
  climbSoft: '#f5e2d9',
  descent: '#3b566d',
  descentSoft: '#e5ecf3',
  /** Bandeau des lignes de ravito (brand-soft du thème Jour). */
  aidSoft: '#deeae2',
};
const FONT_SANS = '"Barlow", system-ui, sans-serif';
const FONT_DISPLAY = '"Barlow Condensed", "Arial Narrow", sans-serif';

const PAD_X = 64;
/** Zone laissée libre pour l'horloge de l'écran verrouillé, réduite si la liste est longue. */
const SAFE_TOP = 360;
const SAFE_TOP_MIN = 110;
const SAFE_BOTTOM = 150;
const PROFILE_H = 290;
const ROW_TARGET = 56;
/** Au-delà, la liste passe sur deux colonnes. */
const TWO_COLUMNS_FROM = 16;
const ROW_MAX = 66;
const LOGO_H = 104;

const THRESHOLD_LABEL: Record<number, string> = { 10: 'fin', 20: 'moyen', 30: 'large' };
const LABELS = { km: 'KM', deniv: 'DÉNIV.', dist: 'DIST.', passage: 'PASS.' };

export interface PlanImageInput {
  /** Libellé court de la course (« 21 km ») : le logo porte déjà « Tour du Nipalou ». */
  courseLabel: string;
  prepared: PreparedCourse;
  plan: Plan;
  schedule: Schedule;
  /** Ravitaillements de la course, insérés comme lignes à leur kilométrage. */
  aidStations?: AidStation[];
}

export async function renderPlanImage({ courseLabel, prepared, plan, schedule, aidStations = [] }: PlanImageInput): Promise<HTMLCanvasElement> {
  const [logo] = await Promise.all([loadImage(logoUrl), loadFonts()]);

  const canvas = document.createElement('canvas');
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D non disponible');

  ctx.fillStyle = C.page;
  ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

  const rows = schedule.rows;
  // Lignes de l'image : sections et ravitos, dans l'ordre du parcours.
  const lines = mergeAidStations(rows, aidStations, prepared.lengthM);
  const contentW = IMAGE_WIDTH - PAD_X * 2;
  const LIST_CHROME = 110; // en-tête de colonnes + marges de la carte
  const profileTop = IMAGE_HEIGHT - SAFE_BOTTOM - PROFILE_H;

  // Parcours longs : deux colonnes, sinon les lignes deviennent illisibles.
  const twoCols = lines.length > TWO_COLUMNS_FROM;
  const perCol = Math.ceil(lines.length / (twoCols ? 2 : 1));

  // En-tête : logo, puis temps visé (128 px) et ligne de réglages.
  const HEADER_H = LOGO_H + 174 + 56 + 40;

  // Hauteur de ligne : la zone de l'horloge est réduite juste assez pour viser ROW_TARGET.
  const free = (t: number) => profileTop - 32 - (t + HEADER_H) - LIST_CHROME;
  const top = Math.max(SAFE_TOP_MIN, Math.min(SAFE_TOP, free(0) - ROW_TARGET * perCol));
  const rowH = Math.min(ROW_MAX, free(top) / perCol);

  /* ---------- En-tête : logo, course, réglages ---------- */
  const logoW = (logo.naturalWidth / logo.naturalHeight) * LOGO_H;
  ctx.drawImage(logo, PAD_X, top, logoW, LOGO_H);
  ctx.textBaseline = 'alphabetic';
  text(ctx, 'PLAN D’ALLURE', IMAGE_WIDTH - PAD_X, top + 34, `600 30px ${FONT_DISPLAY}`, C.inkMuted, 'right', '4px');
  text(ctx, courseLabel, IMAGE_WIDTH - PAD_X, top + LOGO_H - 4, `600 72px ${FONT_DISPLAY}`, C.ink, 'right');

  const figY = top + LOGO_H + 174;
  text(ctx, 'Temps visé', PAD_X, figY - 108, `600 34px ${FONT_SANS}`, C.inkMuted);
  text(ctx, hms(schedule.totalSeconds), PAD_X - 4, figY, `700 128px ${FONT_DISPLAY}`, C.brand);
  text(ctx, 'Allure moyenne', IMAGE_WIDTH - PAD_X, figY - 108, `600 34px ${FONT_SANS}`, C.inkMuted, 'right');
  text(ctx, `${ms(schedule.meanPaceSecPerKm)}${NB}/km`, IMAGE_WIDTH - PAD_X, figY - 4, `600 76px ${FONT_DISPLAY}`, C.ink, 'right');
  // Réglages : le profil n'est indiqué que s'il n'est pas équilibré.
  const w = plan.descentWeight;
  const profileLabel =
    Math.abs(w - 1) < 1e-9 ? '' : ` · ${w < 1 ? 'descendeur' : 'grimpeur'} : descente${NB}×${NB}${dec(w, 2)}`;
  const settings =
    `${dec(prepared.lengthM / 1000, 1)}${NB}km · D+ ${int(prepared.dPlus)}${NB}m · ${dec(plan.kmEffort, 1)} km-effort` +
    ` · découpage ${THRESHOLD_LABEL[plan.threshold] ?? plan.threshold}${profileLabel}`;
  let settingsSize = 30;
  ctx.font = `500 ${settingsSize}px ${FONT_SANS}`;
  while (settingsSize > 22 && ctx.measureText(settings).width > contentW) ctx.font = `500 ${--settingsSize}px ${FONT_SANS}`;
  text(ctx, settings, PAD_X, figY + 56, `500 ${settingsSize}px ${FONT_SANS}`, C.inkMuted);

  /* ---------- Liste des sections ---------- */
  const listTop = top + HEADER_H;
  const listH = LIST_CHROME + rowH * perCol - 40;
  roundRect(ctx, PAD_X, listTop, contentW, listH, 40, C.card, C.line);

  const ix = PAD_X + 32;
  const iw = contentW - 64;
  const COL_GAP = 56;
  const colW = twoCols ? (iw - COL_GAP) / 2 : iw;

  const cells = rows.map((r) => ({
    km: `${dec(r.endM / 1000, 1)}${NB}km`,
    deniv: `${r.climb ? '+' + int(r.dPlus) : '−' + int(r.dMinus)}${NB}m`,
    dist: `${dec(r.distM / 1000, 2)}${NB}km`,
    passage: hms(r.passageSeconds),
  }));
  const widest = (font: string, values: string[]) => {
    ctx.font = font;
    return Math.max(...values.map((v) => ctx.measureText(v).width));
  };
  const MIN_GAP = twoCols ? 16 : 28;
  const headFont = `600 ${twoCols ? 20 : 24}px ${FONT_SANS}`;
  ctx.letterSpacing = '2px';
  const head = {
    km: widest(headFont, [LABELS.km]),
    deniv: widest(headFont, [LABELS.deniv]),
    dist: widest(headFont, [LABELS.dist]),
    passage: widest(headFont, [LABELS.passage]),
  };
  ctx.letterSpacing = '0px';

  // Colonnes calées sur la largeur réelle des textes ; police réduite d'un pixel à la fois si la ligne ne tient pas.
  const fontKm = (f: number) => `600 ${f}px ${FONT_SANS}`;
  const fontVal = (f: number) => `500 ${f}px ${FONT_SANS}`;
  const fontPass = (f: number) => `700 ${Math.round(f * 1.18)}px ${FONT_DISPLAY}`;
  let f = Math.round(Math.min(40, rowH * 0.56));
  let widths = { icon: 0, km: 0, deniv: 0, dist: 0, passage: 0 };
  const used = () => widths.icon + widths.km + widths.deniv + widths.dist + widths.passage;
  for (; f >= 16; f--) {
    widths = {
      icon: f * 1.1,
      km: Math.max(head.km, widest(fontKm(f), cells.map((c) => c.km))),
      deniv: Math.max(head.deniv, widest(fontVal(f), cells.map((c) => c.deniv))),
      dist: Math.max(head.dist, widest(fontVal(f), cells.map((c) => c.dist))),
      passage: Math.max(head.passage, widest(fontPass(f), cells.map((c) => c.passage))),
    };
    if (used() + MIN_GAP * 4 <= colW) break;
  }
  f = Math.max(f, 16);
  const gap = (colW - used()) / 4;
  // Bords droits des colonnes (toutes alignées à droite, sauf le pictogramme), relatifs à la colonne.
  const col = {
    km: widths.icon + gap + widths.km,
    deniv: widths.icon + gap + widths.km + gap + widths.deniv,
    dist: widths.icon + gap + widths.km + gap + widths.deniv + gap + widths.dist,
    passage: colW,
  };

  const headY = listTop + 48;
  ctx.letterSpacing = '2px';
  for (let c = 0; c < (twoCols ? 2 : 1); c++) {
    const cx = ix + c * (colW + COL_GAP);
    text(ctx, LABELS.km, cx + col.km, headY, headFont, C.inkMuted, 'right');
    text(ctx, LABELS.deniv, cx + col.deniv, headY, headFont, C.inkMuted, 'right');
    text(ctx, LABELS.dist, cx + col.dist, headY, headFont, C.inkMuted, 'right');
    text(ctx, LABELS.passage, cx + col.passage, headY, headFont, C.inkMuted, 'right');
  }
  ctx.letterSpacing = '0px';

  // Ravitos : le libellé est raccourci, puis la police réduite, s'il ne tient pas dans la colonne.
  const aidText = (aid: AidStation, short: boolean) => `${aidLabel(aid.type, short)} · km ${dec(aid.km, 1)}`;
  const aidRoom = colW - widths.icon - gap;
  const aidFits = (short: boolean, size: number) =>
    widest(fontKm(size), lines.flatMap((l) => (l.kind === 'aid' ? [aidText(l.aid, short)] : [''])) ) <= aidRoom;
  const aidShort = !aidFits(false, f);
  let aidF = f;
  while (aidF > 16 && !aidFits(aidShort, aidF)) aidF--;

  let sectionIdx = 0;
  lines.forEach((line, k) => {
    const cx = ix + Math.floor(k / perCol) * (colW + COL_GAP);
    const row = k % perCol;
    const y = listTop + 70 + row * rowH;
    const mid = y + rowH / 2;
    const base = mid + f * 0.35;
    if (row > 0) {
      ctx.fillStyle = C.line;
      ctx.fillRect(cx, y, colW, 2);
    }
    if (line.kind === 'aid') {
      // Ligne de ravito sur toute la largeur : bandeau teinté, pictogramme bouteille ou couverts, libellé et km.
      roundRect(ctx, cx - 12, y + 5, colW + 24, rowH - 8, 12, C.aidSoft);
      aidIcon(ctx, cx, mid, f * 1.1, line.aid.type);
      text(ctx, aidText(line.aid, aidShort), cx + widths.icon + gap, mid + aidF * 0.35, fontKm(aidF), C.ink);
      return;
    }
    const r = line.row;
    const c = cells[sectionIdx++]!;
    // Pictogramme de pente (forme et couleur) : seul repère du type de section, avec le signe du dénivelé.
    trendIcon(ctx, cx, mid, f * 1.1, r.climb);
    text(ctx, c.km, cx + col.km, base, fontKm(f), C.ink, 'right');
    text(ctx, c.deniv, cx + col.deniv, base, fontVal(f), r.climb ? C.climb : C.descent, 'right');
    text(ctx, c.dist, cx + col.dist, base, fontVal(f), C.inkMuted, 'right');
    text(ctx, c.passage, cx + col.passage, base + 1, fontPass(f), C.ink, 'right');
  });
  if (twoCols) {
    ctx.fillStyle = C.line;
    ctx.fillRect(ix + colW + COL_GAP / 2 - 1, listTop + 24, 2, listH - 48);
  }

  /* ---------- Profil en bas ---------- */
  drawProfile(ctx, prepared, plan, PAD_X, profileTop, contentW, PROFILE_H);

  return canvas;
}

function drawProfile(ctx: CanvasRenderingContext2D, prepared: PreparedCourse, plan: Plan, x: number, y: number, w: number, h: number) {
  roundRect(ctx, x, y, w, h, 40, C.card, C.line);
  const { n, alt, altMin, altMax, lengthM } = prepared;
  const km = lengthM / 1000;
  const m = { l: x + 32, r: x + w - 32, t: y + 36, b: y + h - 56 };
  const pw = m.r - m.l;
  const ph = m.b - m.t;
  const y0 = Math.floor(altMin / 50) * 50 - 20;
  const y1 = Math.ceil(altMax / 50) * 50;
  const X = (i: number) => m.l + (i / (n - 1)) * pw;
  const Y = (z: number) => m.t + ((y1 - z) / (y1 - y0)) * ph;

  for (const s of plan.sections) {
    const path = new Path2D();
    path.moveTo(X(s.startIndex), Y(alt[s.startIndex]!));
    for (let i = s.startIndex + 1; i <= s.endIndex; i++) path.lineTo(X(i), Y(alt[i]!));
    const area = new Path2D(path);
    area.lineTo(X(s.endIndex), m.b);
    area.lineTo(X(s.startIndex), m.b);
    area.closePath();
    ctx.fillStyle = s.climb ? C.climbSoft : C.descentSoft;
    ctx.fill(area);
    ctx.strokeStyle = s.climb ? C.climb : C.descent;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.stroke(path);
  }
  // Filets de séparation entre sections.
  plan.sections.forEach((s, k) => {
    if (k === 0) return;
    const xa = X(s.startIndex);
    ctx.strokeStyle = C.card;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(xa, Y(alt[s.startIndex]!) + 4);
    ctx.lineTo(xa, m.b);
    ctx.stroke();
  });
  ctx.fillStyle = C.line;
  ctx.fillRect(m.l, m.b, pw, 2);
  const stepKm = [1, 2, 5, 10, 20].find((s) => (s * pw) / km >= 90) ?? 20;
  for (let k = 0; k <= km; k += stepKm) {
    text(ctx, k === 0 ? '0 km' : String(k), m.l + (k / km) * pw, m.b + 38, `500 26px ${FONT_SANS}`, C.inkMuted, k === 0 ? 'left' : 'center');
  }
}

function trendIcon(ctx: CanvasRenderingContext2D, x: number, cy: number, size: number, up: boolean) {
  const s = size / 24;
  ctx.save();
  ctx.translate(x, cy - size / 2);
  ctx.scale(s, s);
  ctx.strokeStyle = up ? C.climb : C.descent;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(new Path2D(up ? 'M22 7 13.5 15.5 8.5 10.5 2 17' : 'M22 17 13.5 8.5 8.5 13.5 2 7'));
  ctx.stroke(new Path2D(up ? 'M16 7h6v6' : 'M16 17h6v-6'));
  ctx.restore();
}

/** Pictogrammes de ravito (tracés Lucide, grille 24 px) : bouteille (« milk ») et couverts (« utensils »). */
const AID_ICON: Record<AidType, string[]> = {
  eau: [
    'M8 2h8',
    'M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2',
    'M7 15a6.472 6.472 0 0 1 5 0 6.47 6.47 0 0 0 5 0',
  ],
  complet: ['M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2', 'M7 2v20', 'M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7'],
};

function aidIcon(ctx: CanvasRenderingContext2D, x: number, cy: number, size: number, type: AidType) {
  const s = size / 24;
  ctx.save();
  ctx.translate(x, cy - size / 2);
  ctx.scale(s, s);
  ctx.strokeStyle = C.brand;
  ctx.lineWidth = 2.25;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const d of AID_ICON[type]) ctx.stroke(new Path2D(d));
  ctx.restore();
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  font: string,
  color: string,
  align: CanvasTextAlign = 'left',
  letterSpacing?: string,
) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  if (letterSpacing) ctx.letterSpacing = letterSpacing;
  ctx.fillText(value, x, y);
  if (letterSpacing) ctx.letterSpacing = '0px';
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image introuvable : ${src}`));
    img.src = src;
  });
}

/** Le canvas n'attend pas les polices web : on force leur chargement avant de dessiner. */
async function loadFonts(): Promise<void> {
  if (!document.fonts) return;
  await Promise.allSettled([
    document.fonts.load(`500 30px ${FONT_SANS}`),
    document.fonts.load(`600 30px ${FONT_SANS}`),
    document.fonts.load(`600 30px ${FONT_DISPLAY}`),
    document.fonts.load(`700 30px ${FONT_DISPLAY}`),
  ]);
  await document.fonts.ready;
}
