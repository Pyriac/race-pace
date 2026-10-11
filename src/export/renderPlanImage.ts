// Image 9:16 du plan d'allure, à garder sur le téléphone pendant la course.
// Règles (.claude/INTEGRATION.md) : mêmes chiffres que le tableau (schedule.rows, rien n'est recalculé),
// type écrit en toutes lettres, profil en bas avec les mêmes numéros, rendu clair fixe indépendant du thème.
import logoUrl from '../assets/logo-tour-du-nipalou.png';
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
};
const FONT_SANS = '"Barlow", system-ui, sans-serif';
const FONT_DISPLAY = '"Barlow Condensed", "Arial Narrow", sans-serif';

const PAD_X = 64;
/** Zone laissée libre pour l'horloge de l'écran verrouillé, réduite si la liste est longue. */
const SAFE_TOP = 360;
const SAFE_TOP_MIN = 110;
const SAFE_BOTTOM = 150;
const PROFILE_H = 330;
const ROW_TARGET = 56;
/** Au-delà, la liste passe sur deux colonnes. */
const TWO_COLUMNS_FROM = 16;
const ROW_MAX = 66;

const THRESHOLD_LABEL: Record<number, string> = { 10: 'fin', 20: 'moyen', 30: 'large' };

export interface PlanImageInput {
  courseName: string;
  prepared: PreparedCourse;
  plan: Plan;
  schedule: Schedule;
}

export async function renderPlanImage({ courseName, prepared, plan, schedule }: PlanImageInput): Promise<HTMLCanvasElement> {
  const [logo] = await Promise.all([loadImage(logoUrl), loadFonts()]);

  const canvas = document.createElement('canvas');
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D non disponible');

  ctx.fillStyle = C.page;
  ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

  const rows = schedule.rows;
  const contentW = IMAGE_WIDTH - PAD_X * 2;
  const LIST_CHROME = 110; // en-tête de colonnes + marges de la carte
  const profileTop = IMAGE_HEIGHT - SAFE_BOTTOM - PROFILE_H;

  // Parcours longs : deux colonnes plus compactes, sinon les lignes deviennent illisibles.
  const twoCols = rows.length > TWO_COLUMNS_FROM;
  const perCol = Math.ceil(rows.length / (twoCols ? 2 : 1));

  const logoW = 150;
  const logoH = (logo.naturalHeight / logo.naturalWidth) * logoW;
  const logoPad = 30;
  const boxW = logoW + logoPad * 2;
  const boxH = logoH + logoPad * 2;
  // En-tête : logo, puis temps visé (128 px) et ligne de réglages.
  const HEADER_H = boxH + 150 + 56 + 40;

  // Hauteur de ligne : la zone de l'horloge est réduite juste assez pour viser ROW_TARGET.
  const free = (t: number) => profileTop - 32 - (t + HEADER_H) - LIST_CHROME;
  const top = Math.max(SAFE_TOP_MIN, Math.min(SAFE_TOP, free(0) - ROW_TARGET * perCol));
  const rowH = Math.min(ROW_MAX, free(top) / perCol);

  /* ---------- En-tête : logo, course, réglages ---------- */
  roundRect(ctx, PAD_X, top, boxW, boxH, 40, C.card, C.line);
  ctx.drawImage(logo, PAD_X + logoPad, top + logoPad, logoW, logoH);

  const tx = PAD_X + boxW + 40;
  const tw = IMAGE_WIDTH - PAD_X - tx;
  ctx.textBaseline = 'alphabetic';
  text(ctx, 'PLAN D’ALLURE', tx, top + boxH / 2 - 30, `600 30px ${FONT_DISPLAY}`, C.inkMuted, 'left', '4px');
  text(ctx, fit(ctx, courseName, tw, `600 64px ${FONT_DISPLAY}`), tx, top + boxH / 2 + 40, `600 64px ${FONT_DISPLAY}`, C.ink);

  const figY = top + boxH + 150;
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
  const b = Math.min(rowH - 12, 52); // pastille du numéro
  // En deux colonnes, le type se lit par l'icône et le signe du dénivelé (+ montée, − descente) ;
  // le mot et la plage de km sont retirés faute de place.
  const words = !twoCols;

  // Colonnes calées sur la largeur réelle des textes ; police réduite si la ligne ne tient pas.
  const cells = rows.map((r) => ({
    type: r.climb ? 'Montée' : 'Descente',
    km: `${dec(r.startM / 1000, 1)} → ${dec(r.endM / 1000, 1)}`,
    deniv: `${r.climb ? '+' + int(r.dPlus) : '−' + int(r.dMinus)}${NB}m`,
    keff: dec(r.kmEffort, 2),
    pace: ms(r.paceSecPerKm),
    passage: hms(r.passageSeconds),
  }));
  const widest = (font: string, values: string[]) => {
    ctx.font = font;
    return Math.max(...values.map((v) => ctx.measureText(v).width));
  };
  const MIN_GAP = twoCols ? 14 : 22;
  const headFont = `600 ${twoCols ? 18 : 24}px ${FONT_SANS}`;
  // Intitulés abrégés en deux colonnes, faute de place.
  const LABELS = twoCols
    ? { deniv: 'DÉN.', keff: 'KM-E.', pace: 'ALL.', passage: 'PASS.' }
    : { deniv: 'DÉNIV.', keff: 'KM-EFF.', pace: 'ALLURE', passage: 'PASSAGE' };
  ctx.letterSpacing = '2px';
  const label = (v: string) => widest(headFont, [v]);
  const head = { deniv: label(LABELS.deniv), keff: label(LABELS.keff), pace: label(LABELS.pace), passage: label(LABELS.passage) };
  ctx.letterSpacing = '0px';
  const gaps = words ? 5 : 4;
  const lead = b + 16;
  let f = Math.round(Math.min(34, rowH * 0.52));
  let widths = { type: 0, km: 0, deniv: 0, keff: 0, pace: 0, passage: 0 };
  const used = () => lead + widths.type + widths.km + widths.deniv + widths.keff + widths.pace + widths.passage;
  // Police réduite d'un pixel à la fois jusqu'à ce que la ligne tienne (les intitulés ne rétrécissent pas).
  for (; f >= 16; f--) {
    widths = {
      type: f * 1.25 + (words ? widest(`600 ${f}px ${FONT_SANS}`, cells.map((c) => c.type)) : 0),
      km: words ? widest(`500 ${f}px ${FONT_SANS}`, cells.map((c) => c.km)) : 0,
      deniv: Math.max(head.deniv, widest(`500 ${f}px ${FONT_SANS}`, cells.map((c) => c.deniv))),
      keff: Math.max(head.keff, widest(`500 ${f}px ${FONT_SANS}`, cells.map((c) => c.keff))),
      pace: Math.max(head.pace, widest(`600 ${f}px ${FONT_SANS}`, cells.map((c) => c.pace))),
      passage: Math.max(head.passage, widest(`700 ${Math.round(f * 1.18)}px ${FONT_DISPLAY}`, cells.map((c) => c.passage))),
    };
    if (used() + MIN_GAP * gaps <= colW) break;
  }
  f = Math.max(f, 16);
  const gap = (colW - used()) / gaps;
  // Positions relatives au bord gauche d'une colonne.
  const kmX = lead + widths.type + (words ? gap : 0);
  const denivX = kmX + widths.km + gap + widths.deniv;
  const keffX = denivX + gap + widths.keff;
  const col = { type: lead, km: kmX, deniv: denivX, keff: keffX, pace: keffX + gap + widths.pace, passage: colW };

  const headY = listTop + 48;
  ctx.letterSpacing = '2px';
  for (let c = 0; c < (twoCols ? 2 : 1); c++) {
    const cx = ix + c * (colW + COL_GAP);
    text(ctx, twoCols ? 'N°' : 'SECTION', cx, headY, headFont, C.inkMuted);
    if (words) text(ctx, 'KM', cx + col.km, headY, headFont, C.inkMuted);
    text(ctx, LABELS.deniv, cx + col.deniv, headY, headFont, C.inkMuted, 'right');
    text(ctx, LABELS.keff, cx + col.keff, headY, headFont, C.inkMuted, 'right');
    text(ctx, LABELS.pace, cx + col.pace, headY, headFont, C.inkMuted, 'right');
    text(ctx, LABELS.passage, cx + col.passage, headY, headFont, C.inkMuted, 'right');
  }
  ctx.letterSpacing = '0px';

  rows.forEach((r, k) => {
    const c = cells[k]!;
    const cx = ix + Math.floor(k / perCol) * (colW + COL_GAP);
    const row = k % perCol;
    const y = listTop + 70 + row * rowH;
    const mid = y + rowH / 2;
    const base = mid + f * 0.35;
    if (row > 0) {
      ctx.fillStyle = C.line;
      ctx.fillRect(cx, y, colW, 2);
    }
    // Numéro dans sa pastille, comme dans le tableau et sur le profil.
    roundRect(ctx, cx, mid - b / 2, b, b, 12, r.climb ? C.climbSoft : C.descentSoft);
    text(ctx, String(r.index), cx + b / 2, mid + b * 0.24, `700 ${Math.round(b * 0.62)}px ${FONT_DISPLAY}`, C.ink, 'center');
    // Icône de pente, et le type en toutes lettres quand la place le permet.
    trendIcon(ctx, cx + col.type, mid, f * 0.95, r.climb);
    if (words) {
      text(ctx, c.type, cx + col.type + f * 1.25, base, `600 ${f}px ${FONT_SANS}`, C.ink);
      text(ctx, c.km, cx + col.km, base, `500 ${f}px ${FONT_SANS}`, C.inkMuted);
    }
    text(ctx, c.deniv, cx + col.deniv, base, `500 ${f}px ${FONT_SANS}`, C.ink, 'right');
    text(ctx, c.keff, cx + col.keff, base, `500 ${f}px ${FONT_SANS}`, C.inkMuted, 'right');
    text(ctx, c.pace, cx + col.pace, base, `600 ${f}px ${FONT_SANS}`, C.ink, 'right');
    text(ctx, c.passage, cx + col.passage, base + 1, `700 ${Math.round(f * 1.18)}px ${FONT_DISPLAY}`, C.ink, 'right');
  });
  if (twoCols) {
    ctx.fillStyle = C.line;
    ctx.fillRect(ix + colW + COL_GAP / 2 - 1, listTop + 24, 2, listH - 48);
  }

  /* ---------- Profil en bas, numéroté comme la liste ---------- */
  drawProfile(ctx, prepared, plan, PAD_X, profileTop, contentW, PROFILE_H);

  return canvas;
}

function drawProfile(ctx: CanvasRenderingContext2D, prepared: PreparedCourse, plan: Plan, x: number, y: number, w: number, h: number) {
  roundRect(ctx, x, y, w, h, 40, C.card, C.line);
  const { n, alt, altMin, altMax, lengthM } = prepared;
  const km = lengthM / 1000;
  const m = { l: x + 32, r: x + w - 32, t: y + 70, b: y + h - 56 };
  const pw = m.r - m.l;
  const ph = m.b - m.t;
  const y0 = Math.floor(altMin / 50) * 50 - 20;
  const y1 = Math.ceil(altMax / 50) * 50;
  const X = (i: number) => m.l + (i / (n - 1)) * pw;
  const Y = (z: number) => m.t + ((y1 - z) / (y1 - y0)) * ph;

  for (const s of plan.sections) {
    const color = s.climb ? C.climb : C.descent;
    const soft = s.climb ? C.climbSoft : C.descentSoft;
    const path = new Path2D();
    path.moveTo(X(s.startIndex), Y(alt[s.startIndex]!));
    for (let i = s.startIndex + 1; i <= s.endIndex; i++) path.lineTo(X(i), Y(alt[i]!));
    const area = new Path2D(path);
    area.lineTo(X(s.endIndex), m.b);
    area.lineTo(X(s.startIndex), m.b);
    area.closePath();
    ctx.fillStyle = soft;
    ctx.fill(area);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.stroke(path);
  }
  // Filets de séparation et numéros des sections.
  plan.sections.forEach((s, k) => {
    const xa = X(s.startIndex);
    const xb = X(s.endIndex);
    if (k > 0) {
      ctx.strokeStyle = C.card;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(xa, Y(alt[s.startIndex]!) + 4);
      ctx.lineTo(xa, m.b);
      ctx.stroke();
    }
    if (xb - xa >= (s.index > 9 ? 40 : 28)) {
      text(ctx, String(s.index), (xa + xb) / 2, m.t - 22, `600 30px ${FONT_DISPLAY}`, C.inkMuted, 'center');
    }
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
  ctx.lineWidth = 2.25;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(new Path2D(up ? 'M22 7 13.5 15.5 8.5 10.5 2 17' : 'M22 17 13.5 8.5 8.5 13.5 2 7'));
  ctx.stroke(new Path2D(up ? 'M16 7h6v6' : 'M16 17h6v-6'));
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

/** Tronque avec « … » si le texte dépasse maxWidth. */
function fit(ctx: CanvasRenderingContext2D, value: string, maxWidth: number, font: string): string {
  ctx.font = font;
  if (ctx.measureText(value).width <= maxWidth) return value;
  let t = value;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
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
