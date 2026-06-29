// FRAME MAESTRO de marca CB Ventures / CB Digital + compositor.
// El DISEÑO (frame: logo, geometría, ventana, pie, acentos) está fijo. n8n solo rellena imagen + titular.
// buildSVG(o): si o.headline vacío y o.imageHref vacío => sale el FRAME a aprobar; con datos => pieza compuesta.
// Logo OFICIAL (CB-Ventures-horizontal.svg) incrustado, serif Gelasio (≈Georgia). CB Digital = " Digital" en teal.

export const VARIANTS = {
  cbdigital:  { accent: '#2DD4BF', accent2: '#C9952A', tag: 'Digital', eyebrow: 'IA aplicada al negocio',     cta: 'Diagnóstico gratuito →' },
  cbventures: { accent: '#4F6EF7', accent2: '#C9952A', tag: '',        eyebrow: 'Expansión B2B internacional', cta: 'Reserva tu diagnóstico →' },
};
export const FORMATS = { ig: [1080, 1350], li: [1200, 1200], story: [1080, 1920] };

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function wrap(text, max) {
  const tokens = String(text).split(/(\[\[|\]\])/);
  let accent = false; const words = [];
  for (const t of tokens) {
    if (t === '[[') { accent = true; continue; }
    if (t === ']]') { accent = false; continue; }
    for (const w of t.split(/\s+/).filter(Boolean)) words.push({ w, a: accent });
  }
  const lines = []; let cur = []; let len = 0;
  for (const tk of words) {
    if (len + tk.w.length + 1 > max && cur.length) { lines.push(cur); cur = []; len = 0; }
    cur.push(tk); len += tk.w.length + 1;
  }
  if (cur.length) lines.push(cur);
  return lines.map(line => ({ t: line.map(x => x.w).join(' '), a: line.filter(x => x.a).length > line.length / 2 }));
}

// Logo oficial (hexágono degradado + wordmark CB[blanco]Ventures[azul], serif Gelasio). digital => + " Digital" teal.
function logoGroup(x, y, targetHexH, digital) {
  const s = targetHexH / 294.4, tx = x - 40 * s, ty = y - 72.8 * s;
  const dig = digital ? '<tspan fill="#2DD4BF"> Digital</tspan>' : '';
  return `<g transform="translate(${tx},${ty}) scale(${s})">
    <polygon points="380,220 295,367.2 125,367.2 40,220 125,72.8 295,72.8" fill="none" stroke="url(#hexgrad)" stroke-width="12" stroke-linejoin="round"/>
    <polygon points="346,220 278,337.8 142,337.8 74,220 142,102.2 278,102.2" fill="none" stroke="url(#hexgrad)" stroke-width="7" stroke-linejoin="round"/>
    <text x="210" y="226" font-family="Gelasio" font-size="98" font-weight="700" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle" letter-spacing="-3">CB</text>
    <text x="468" y="226" font-family="Gelasio" font-size="150" font-weight="700" dominant-baseline="middle" letter-spacing="-2"><tspan fill="#FFFFFF">CB</tspan><tspan fill="#4F6EF7">Ventures</tspan>${dig}</text>
  </g>`;
}

// L-brackets en las esquinas de la ventana (acento de marca)
function brackets(x, y, w, h, accent, len = 46, sw = 4) {
  const c = (cx, cy, dx, dy) => `<path d="M ${cx + dx * len} ${cy} L ${cx} ${cy} L ${cx} ${cy + dy * len}" fill="none" stroke="${accent}" stroke-width="${sw}" stroke-linecap="round"/>`;
  return c(x, y, 1, 1) + c(x + w, y, -1, 1) + c(x, y + h, 1, -1) + c(x + w, y + h, -1, -1);
}

// Relleno de la ventana: foto real (cover) o fondo abstracto de marca (malla + hexágonos). NUNCA vacío/negro.
function windowFill(x, y, w, h, accent, accent2, imageHref) {
  const clip = 'win';
  let inner;
  if (imageHref) {
    inner = `<image href="${imageHref}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#tint)"/>`;
  } else {
    const hexes = [];
    for (let i = 0; i < 6; i++) {
      const cx = x + 60 + i * (w / 6), cy = y + (i % 2 ? h * 0.66 : h * 0.32), r = 64 + (i % 3) * 30;
      hexes.push(`<polygon points="${cx},${cy - r} ${cx + r * 0.87},${cy - r / 2} ${cx + r * 0.87},${cy + r / 2} ${cx},${cy + r} ${cx - r * 0.87},${cy + r / 2} ${cx - r * 0.87},${cy - r / 2}" fill="none" stroke="${accent}" stroke-width="1.4" opacity="0.16"/>`);
    }
    // motivo de datos: línea ascendente
    const px = x + w * 0.12, py = y + h * 0.72, step = (w * 0.76) / 5, pts = [0, 0.28, 0.16, 0.5, 0.42, 0.82];
    const path = pts.map((p, i) => `${px + i * step},${py - p * h * 0.42}`).join(' ');
    inner = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#winA)"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#winB)"/>
      ${hexes.join('')}
      <polyline points="${path}" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`;
  }
  return `<clipPath id="${clip}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20"/></clipPath>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="#0a1020"/>
    <g clip-path="url(#${clip})">${inner}</g>`;
}

export function buildSVG(o) {
  const v = VARIANTS[o.variant] || VARIANTS.cbdigital;
  const [W, H] = FORMATS[o.format] || FORMATS.li;
  const ACCENT = v.accent, GOLD = '#C9952A';
  const digital = (o.variant || 'cbdigital') === 'cbdigital';
  const eyebrow = (o.eyebrow || v.eyebrow), cta = o.cta || v.cta, site = o.site || 'cbventures.eu';
  const HEAD = wrap(o.headline || '', 22);
  const SUB = o.subtext ? wrap(o.subtext, 40).map(l => l.t) : [];
  const pad = 64;
  const logoTopY = 58, logoHexH = 100;
  const winX = pad, winY = 210, winW = W - 2 * pad, winH = Math.round(H * 0.36);
  const headY = winY + winH + 96, lh = 72;
  const subY = headY + (Math.max(HEAD.length, 1) - 1) * lh + 60;
  const barY = H - 150, rowY = H - 90;
  const headSVG = HEAD.map((ln, i) => `<text x="${pad}" y="${headY + i * lh}" font-family="Playfair Display" font-weight="800" font-size="60" letter-spacing="-1" fill="${ln.a ? ACCENT : '#F4F6FF'}">${esc(ln.t)}</text>`).join('');
  const subSVG = SUB.map((t, i) => `<text x="${pad}" y="${subY + i * 40}" font-family="Outfit" font-weight="500" font-size="27" fill="#CDD3EE">${esc(t)}</text>`).join('');
  const ctaW = 52 + cta.length * 13.5;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="80%" cy="0%" r="100%"><stop offset="0%" stop-color="#0e1638"/><stop offset="60%" stop-color="#05070F"/></radialGradient>
    <linearGradient id="hexgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7B8DFF"/><stop offset="0.5" stop-color="#4F6EF7"/><stop offset="1" stop-color="#8A78F0"/></linearGradient>
    <linearGradient id="acc" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${ACCENT}"/><stop offset="100%" stop-color="${GOLD}"/></linearGradient>
    <radialGradient id="winA" cx="18%" cy="14%" r="80%"><stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.85"/><stop offset="55%" stop-color="${ACCENT}" stop-opacity="0.06"/><stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/></radialGradient>
    <radialGradient id="winB" cx="90%" cy="95%" r="75%"><stop offset="0%" stop-color="${GOLD}" stop-opacity="0.45"/><stop offset="60%" stop-color="${GOLD}" stop-opacity="0.03"/><stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>
    <linearGradient id="tint" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#05070F" stop-opacity="0.10"/><stop offset="70%" stop-color="#05070F" stop-opacity="0.05"/><stop offset="100%" stop-color="#05070F" stop-opacity="0.50"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- geometría de marca: hexágono grande (dead space) + diagonal teal→dorado -->
  <g opacity="0.13"><polygon transform="translate(${W * 0.62},${H * 0.30}) scale(3.1)" points="0,-100 86.6,-50 86.6,50 0,100 -86.6,50 -86.6,-50" fill="none" stroke="url(#hexgrad)" stroke-width="2.2"/></g>
  <line x1="${-40}" y1="${H * 0.86}" x2="${W * 0.5}" y2="${H * 1.06}" stroke="url(#acc)" stroke-width="3" opacity="0.5"/>
  <line x1="${W * 0.58}" y1="${-30}" x2="${W + 40}" y2="${H * 0.22}" stroke="${GOLD}" stroke-width="2" opacity="0.35"/>

  ${logoGroup(pad, logoTopY, logoHexH, digital)}
  <text x="${W - pad}" y="${logoTopY + logoHexH + 22}" text-anchor="end" font-family="DM Mono" font-size="18" letter-spacing="3" fill="${ACCENT}">${esc(eyebrow.toUpperCase())}</text>

  ${windowFill(winX, winY, winW, winH, ACCENT, GOLD, o.imageHref)}
  <rect x="${winX}" y="${winY}" width="${winW}" height="3" fill="url(#acc)"/>
  ${brackets(winX, winY, winW, winH, ACCENT)}

  ${headSVG}
  ${subSVG}

  <rect x="${pad}" y="${barY}" width="${W - 2 * pad}" height="6" rx="3" fill="url(#acc)"/>
  <text x="${pad}" y="${rowY + 8}" font-family="DM Mono" font-size="22" letter-spacing="1" fill="#F4F6FF">${esc(site)}</text>
  <rect x="${W - pad - ctaW}" y="${rowY - 28}" width="${ctaW}" height="50" rx="25" fill="#0B1224" stroke="${ACCENT}" stroke-width="2"/>
  <text x="${W - pad - ctaW / 2}" y="${rowY + 4}" text-anchor="middle" font-family="Outfit" font-weight="700" font-size="23" fill="${ACCENT}">${esc(cta)}</text>
</svg>`;
}
