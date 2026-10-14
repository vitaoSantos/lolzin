// Partículas de fundo com a cara de cada modo: neve no ARAM, brasas na Arena, poeira de dados na ranqueada.

const PRESETS = {
  ranqueada: { quantidade: 46, tamanho: [1, 2.2], velocidade: [-0.25, -0.08], vento: 0.05, cor: 'c1', brilho: 0.7 },
  aram: { quantidade: 90, tamanho: [1, 3.2], velocidade: [0.35, 0.9], vento: 0.25, cor: '#dff3ff', brilho: 0.8 },
  arena: { quantidade: 60, tamanho: [1, 2.6], velocidade: [-1.1, -0.4], vento: 0.35, cor: '#ffb35c', brilho: 1, piscar: true },
  normal: { quantidade: 36, tamanho: [2, 5], velocidade: [-0.15, 0.15], vento: 0.12, cor: 'c3', brilho: 0.35 },
  evento: { quantidade: 50, tamanho: [1.5, 4], velocidade: [-0.4, 0.4], vento: 0.3, cor: 'c2', brilho: 0.6, piscar: true },
};

export function iniciarParticulas(canvas, modo) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const preset = PRESETS[modo] ?? PRESETS.normal;
  const ctx = canvas.getContext('2d');
  let largura = 0;
  let altura = 0;
  let particulas = [];

  const entre = ([a, b]) => a + Math.random() * (b - a);
  const nova = (emQualquerLugar) => ({
    x: Math.random() * largura,
    y: emQualquerLugar ? Math.random() * altura : preset.velocidade[0] < 0 ? altura + 10 : -10,
    r: entre(preset.tamanho),
    vy: entre(preset.velocidade) || 0.1,
    fase: Math.random() * Math.PI * 2,
  });

  function redimensionar() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    largura = innerWidth;
    altura = innerHeight;
    canvas.width = largura * dpr;
    canvas.height = altura * dpr;
    canvas.style.width = `${largura}px`;
    canvas.style.height = `${altura}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const quantidade = Math.round(preset.quantidade * Math.min(1, largura / 1200 + 0.3));
    particulas = Array.from({ length: quantidade }, () => nova(true));
  }

  let cor = '#ffffff';
  const lerCor = () => {
    cor = preset.cor.startsWith('#') ? preset.cor : getComputedStyle(document.documentElement).getPropertyValue(`--${preset.cor}`).trim() || '#ffffff';
  };

  let quadro = 0;
  function desenhar() {
    if (document.hidden) { requestAnimationFrame(desenhar); return; }
    if (quadro++ % 30 === 0) lerCor();
    ctx.clearRect(0, 0, largura, altura);
    ctx.fillStyle = cor;
    ctx.shadowColor = cor;
    ctx.shadowBlur = 8;
    for (const p of particulas) {
      p.fase += 0.02;
      p.y += p.vy;
      p.x += Math.sin(p.fase) * preset.vento;
      if (p.y < -12 || p.y > altura + 12 || p.x < -12 || p.x > largura + 12) Object.assign(p, nova(false));
      ctx.globalAlpha = preset.brilho * (preset.piscar ? 0.45 + Math.abs(Math.sin(p.fase * 2)) * 0.55 : 0.8);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(desenhar);
  }

  redimensionar();
  lerCor();
  addEventListener('resize', redimensionar);
  requestAnimationFrame(desenhar);
}
