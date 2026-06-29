// CB Render — microservicio SVG → PNG para el motor de redes (plantilla de marca).
// Self-host en EasyPanel (Hostinger). Sin coste por imagen. Render con @resvg/resvg-js (nativo, sin navegador).
//   GET  /         -> health
//   POST /render   -> JSON { variant, format, eyebrow, headline ([[acento]]), subtext, cta, site, image? } -> image/png
//     image: URL opcional de foto real/stock para el slot; si falta, fondo abstracto de marca (nunca vacío).
import express from 'express';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { buildSVG } from './template.mjs';

const PORT = process.env.PORT || 3000;
const FONT_DIR = path.join(os.tmpdir(), 'cbfonts');
const FONTS = {
  'Playfair.ttf': 'https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf',
  'Playfair-Italic.ttf': 'https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay-Italic%5Bwght%5D.ttf',
  'Outfit.ttf': 'https://github.com/google/fonts/raw/main/ofl/outfit/Outfit%5Bwght%5D.ttf',
  'DMMono.ttf': 'https://github.com/google/fonts/raw/main/ofl/dmmono/DMMono-Regular.ttf',
  'Gelasio.ttf': 'https://github.com/google/fonts/raw/main/ofl/gelasio/Gelasio%5Bwght%5D.ttf',
  'Gelasio-Italic.ttf': 'https://github.com/google/fonts/raw/main/ofl/gelasio/Gelasio-Italic%5Bwght%5D.ttf',
};

async function ensureFonts() {
  fs.mkdirSync(FONT_DIR, { recursive: true });
  for (const [name, url] of Object.entries(FONTS)) {
    const fp = path.join(FONT_DIR, name);
    if (fs.existsSync(fp) && fs.statSync(fp).size > 1000) continue;
    const res = await fetch(url);
    if (!res.ok) throw new Error('font download failed: ' + name);
    fs.writeFileSync(fp, Buffer.from(await res.arrayBuffer()));
  }
  return Object.keys(FONTS).map(n => path.join(FONT_DIR, n));
}

// Descarga una imagen y la devuelve como data URI (resvg embebe data URIs de forma fiable).
async function toDataURI(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 8 * 1024 * 1024) return null;
    return `data:${ct};base64,${buf.toString('base64')}`;
  } catch { return null; }
}

let FONT_FILES = [];
const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/', (_req, res) => res.json({ ok: true, service: 'cb-render', fonts: FONT_FILES.length }));

app.post('/render', async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.headline) return res.status(400).json({ error: 'headline requerido (sin titular no se genera)' });
    if (b.image && /^https?:\/\//.test(b.image)) b.imageHref = await toDataURI(b.image);
    const svg = buildSVG(b);
    const r = new Resvg(svg, { font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Outfit' } });
    res.set('Content-Type', 'image/png').send(r.render().asPng());
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

ensureFonts().then(files => {
  FONT_FILES = files;
  app.listen(PORT, () => console.log('cb-render escuchando en :' + PORT));
}).catch(e => { console.error('No se pudieron cargar las fuentes:', e); process.exit(1); });
