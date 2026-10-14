// Tema dinâmico: aplica a paleta no site inteiro e tenta extrair as cores da arte do campeão.

export function aplicarCores([c1, c2, c3]) {
  const raiz = document.documentElement.style;
  raiz.setProperty('--c1', c1);
  raiz.setProperty('--c2', c2);
  raiz.setProperty('--c3', c3);
}

/**
 * Lê a arte (precisa de CORS liberado na CDN) e devolve [principal, secundária, clara].
 * Se o navegador não puder ler os pixels, devolve null e a página fica com a paleta da região.
 */
export function extrairCores(url) {
  return new Promise((resolver) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onerror = () => resolver(null);
    img.onload = () => {
      try {
        const largura = 48;
        const altura = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * largura));
        const canvas = document.createElement('canvas');
        canvas.width = largura;
        canvas.height = altura;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, largura, altura);
        resolver(paletaDosPixels(ctx.getImageData(0, 0, largura, altura).data));
      } catch {
        resolver(null); // canvas "contaminado" (sem CORS)
      }
    };
    img.src = url;
  });
}

export function paletaDosPixels(pixels) {
  const FAIXAS = 24;
  const faixas = Array.from({ length: FAIXAS }, () => ({ peso: 0, r: 0, g: 0, b: 0 }));
  for (let i = 0; i < pixels.length; i += 4) {
    const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
    const [h, s, l] = rgbParaHsl(r, g, b);
    if (l < 0.18 || l > 0.88 || s < 0.28) continue;
    const peso = s * (1 - Math.abs(l - 0.55));
    const f = faixas[Math.floor((h / 360) * FAIXAS) % FAIXAS];
    f.peso += peso; f.r += r * peso; f.g += g * peso; f.b += b * peso;
  }
  const ordenadas = faixas.map((f, i) => ({ ...f, i })).filter((f) => f.peso > 0).sort((a, b) => b.peso - a.peso);
  if (!ordenadas.length) return null;

  const principal = ordenadas[0];
  const distancia = (a, b) => Math.min(Math.abs(a - b), FAIXAS - Math.abs(a - b));
  const secundaria = ordenadas.find((f) => distancia(f.i, principal.i) >= 4 && f.peso > principal.peso * 0.08) ?? principal;

  const cor = (f, minL, maxL) => {
    let [h, s, l] = rgbParaHsl(f.r / f.peso, f.g / f.peso, f.b / f.peso);
    s = Math.max(s, 0.55);
    l = Math.min(maxL, Math.max(minL, l));
    return hslParaHex(h, s, l);
  };
  const [h] = rgbParaHsl(principal.r / principal.peso, principal.g / principal.peso, principal.b / principal.peso);
  return [cor(principal, 0.58, 0.7), cor(secundaria, 0.45, 0.62), hslParaHex(h, 0.7, 0.9)];
}

function rgbParaHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslParaHex(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return `#${[f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
