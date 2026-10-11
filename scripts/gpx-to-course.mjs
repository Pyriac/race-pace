#!/usr/bin/env node
/**
 * Convertit une trace GPX en JSON de course pour pace-model.mjs.
 * Sans dépendance : Node 18 ou plus suffit.
 *
 *   node gpx-to-course.mjs trace.gpx --id nipalou-21km --name "Tour du Nipalou 21 km" --out nipalou-21km.json
 *
 * Options :
 *   --id    identifiant de la course (défaut : nom du fichier)
 *   --name  nom affiché (défaut : balise <name> du GPX)
 *   --step  pas de rééchantillonnage en mètres (défaut : 10 ; le calculateur est réglé pour 10)
 *   --out   fichier de sortie (défaut : sortie standard)
 *
 * Le JSON ne garde que le profil : distance totale et une altitude tous les 10 m environ.
 * Les coordonnées ne sont pas conservées.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';

function parseArgs(argv) {
  const args = { step: 10 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const value = argv[++i];
      if (value === undefined) throw new Error(`Valeur manquante pour --${key}`);
      args[key] = key === 'step' ? Number(value) : value;
    } else if (!args.input) args.input = a;
    else throw new Error(`Argument en trop : ${a}`);
  }
  if (!args.input) throw new Error('Indiquez le fichier GPX à convertir.');
  if (!(args.step > 0)) throw new Error('--step doit être un nombre de mètres positif.');
  return args;
}

/** Lit les points d'une trace (trkpt) ou, à défaut, d'un itinéraire (rtept). */
function readPoints(xml) {
  for (const tag of ['trkpt', 'rtept']) {
    const re = new RegExp(`<${tag}\\b([^>]*?)(?:/>|>([\\s\\S]*?)</${tag}>)`, 'g');
    const points = [];
    let m;
    while ((m = re.exec(xml))) {
      const lat = /\blat\s*=\s*["']([^"']+)["']/.exec(m[1]);
      const lon = /\blon\s*=\s*["']([^"']+)["']/.exec(m[1]);
      const ele = /<ele>\s*([^<\s]+)\s*<\/ele>/.exec(m[2] || '');
      if (!lat || !lon) continue;
      points.push({ lat: Number(lat[1]), lon: Number(lon[1]), ele: ele ? Number(ele[1]) : NaN });
    }
    if (points.length) return points;
  }
  return [];
}

function haversine(a, b) {
  const R = 6371008.8;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function gpxToCourse(xml, { id, name, step = 10 } = {}) {
  const points = readPoints(xml);
  if (points.length < 2) throw new Error('Aucun point de trace trouvé dans ce GPX.');
  const missing = points.filter((p) => !Number.isFinite(p.ele)).length;
  if (missing) {
    throw new Error(`${missing} point(s) sans altitude : exportez la trace avec l'altitude, le calcul en dépend.`);
  }
  const dist = [0];
  for (let i = 1; i < points.length; i++) dist.push(dist[i - 1] + haversine(points[i - 1], points[i]));
  const lengthM = Math.round(dist[dist.length - 1] * 10) / 10;
  if (lengthM < step * 3) throw new Error('Trace trop courte pour être découpée.');

  // Pas constant : le dernier échantillon tombe exactement sur l'arrivée.
  const count = Math.round(lengthM / step);
  const stepM = lengthM / count;
  const ele = [];
  let j = 1;
  for (let i = 0; i <= count; i++) {
    const x = i * stepM;
    while (j < dist.length - 1 && dist[j] <= x) j++;
    const span = dist[j] - dist[j - 1];
    const t = span > 0 ? Math.min(1, Math.max(0, (x - dist[j - 1]) / span)) : 0;
    ele.push(Math.round((points[j - 1].ele + t * (points[j].ele - points[j - 1].ele)) * 10) / 10);
  }

  const gpxName = /<name>\s*([^<]+?)\s*<\/name>/.exec(xml);
  return { id, name: name || (gpxName ? gpxName[1] : id), lengthM, ele };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const id = args.id || basename(args.input).replace(/\.gpx$/i, '');
    const course = gpxToCourse(readFileSync(args.input, 'utf8'), { id, name: args.name, step: args.step });
    const json = JSON.stringify(course);
    if (args.out) {
      writeFileSync(args.out, json + '\n');
      console.error(`${args.out} : ${(course.lengthM / 1000).toFixed(2)} km, ${course.ele.length} altitudes`);
    } else process.stdout.write(json + '\n');
  } catch (error) {
    console.error(`Erreur : ${error.message}`);
    process.exit(1);
  }
}
