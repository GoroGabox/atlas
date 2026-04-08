const pptxgen = require("C:/nvm4w/nodejs/node_modules/pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10" x 5.625"
pres.author = "Atlas";
pres.title = "Atlas — El Mapa Vivo del Software";

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
  bg:        "080F1E",  // slide background (near-black navy)
  card:      "0F1F3D",  // card fill
  cardBord:  "1E3A5F",  // card border
  accent:    "6366F1",  // indigo (Atlas primary)
  blue:      "3B82F6",
  green:     "22C55E",
  amber:     "F59E0B",
  red:       "EF4444",
  textHi:    "F8FAFC",  // white-ish
  textMid:   "94A3B8",  // slate-400
  textDim:   "475569",  // slate-600
  divider:   "1E3A5F",
};

const makeShadow = () => ({
  type: "outer", color: "000000", blur: 10, offset: 3, angle: 135, opacity: 0.35,
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function slideBase(slide) {
  slide.background = { color: C.bg };
}

function addTag(slide, text, x, y, color) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: text.length * 0.095 + 0.25, h: 0.25,
    fill: { color, transparency: 80 },
    line: { color, width: 1 },
  });
  slide.addText(text.toUpperCase(), {
    x, y, w: text.length * 0.095 + 0.25, h: 0.25,
    fontSize: 7, bold: true, color, align: "center", valign: "middle", margin: 0,
  });
}

function addCard(slide, x, y, w, h, accentColor) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: C.card },
    line: { color: accentColor ?? C.cardBord, width: 1 },
    shadow: makeShadow(),
  });
  // thin left accent bar
  if (accentColor) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.05, h,
      fill: { color: accentColor },
      line: { color: accentColor, width: 0 },
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — TITLE
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  slideBase(s);

  // Big gradient-like diagonal shape on right side
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.8, y: 0, w: 4.2, h: 5.625,
    fill: { color: "0D1B3E" },
    line: { color: "0D1B3E", width: 0 },
  });

  // Accent vertical bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.8, y: 0, w: 0.06, h: 5.625,
    fill: { color: C.accent },
    line: { color: C.accent, width: 0 },
  });

  // Grid dots pattern on right (decorative circles)
  const cols = 6, rows = 7, gx = 6.3, gy = 0.45, gap = 0.55;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      s.addShape(pres.shapes.OVAL, {
        x: gx + c * gap, y: gy + r * gap, w: 0.07, h: 0.07,
        fill: { color: C.accent, transparency: 70 },
        line: { color: C.accent, width: 0 },
      });
    }
  }

  // Left: title block
  s.addText("ATLAS", {
    x: 0.55, y: 1.1, w: 5.0, h: 1.1,
    fontSize: 72, bold: true, color: C.textHi,
    fontFace: "Calibri", align: "left", valign: "middle", margin: 0,
    charSpacing: 8,
  });

  // Accent underline
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.55, y: 2.2, w: 2.8, h: 0.055,
    fill: { color: C.accent },
    line: { color: C.accent, width: 0 },
  });

  s.addText("El mapa vivo de tu software", {
    x: 0.55, y: 2.4, w: 5.0, h: 0.5,
    fontSize: 18, color: C.textMid, fontFace: "Calibri", align: "left", margin: 0,
  });

  s.addText("Documentación · Visualización · Arquitectura frontend", {
    x: 0.55, y: 2.95, w: 5.0, h: 0.35,
    fontSize: 11, color: C.textDim, fontFace: "Calibri", align: "left", margin: 0,
  });

  // Bottom label
  s.addText("Propuesta para el equipo de desarrollo de RMES", {
    x: 0.55, y: 4.8, w: 5.0, h: 0.3,
    fontSize: 9, color: C.textDim, fontFace: "Calibri", align: "left", margin: 0,
  });

  // Right side: small feature icons
  const feats = [
    { icon: "📦", label: "Módulos" },
    { icon: "⚙️", label: "Funcionalidades" },
    { icon: "↔️", label: "Dependencias" },
    { icon: "📊", label: "Health Score" },
  ];
  feats.forEach((f, i) => {
    const fy = 1.4 + i * 0.75;
    s.addText(f.icon, {
      x: 6.4, y: fy, w: 0.5, h: 0.5,
      fontSize: 22, align: "center", valign: "middle", margin: 0,
    });
    s.addText(f.label, {
      x: 6.95, y: fy + 0.05, w: 2.5, h: 0.4,
      fontSize: 13, color: C.textHi, fontFace: "Calibri", align: "left", valign: "middle", margin: 0,
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — EL PROBLEMA
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  slideBase(s);

  s.addText("El problema", {
    x: 0.5, y: 0.3, w: 9, h: 0.55,
    fontSize: 28, bold: true, color: C.textHi, fontFace: "Calibri", align: "left", margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.88, w: 9, h: 0.03,
    fill: { color: C.divider }, line: { color: C.divider, width: 0 },
  });

  const problems = [
    {
      icon: "🧠",
      title: "Conocimiento concentrado",
      body: "El entendimiento de cómo funciona el sistema vive en la cabeza de 1 o 2 personas. Si se van, el equipo queda a ciegas.",
      color: C.red,
    },
    {
      icon: "📄",
      title: "Documentación inexistente o desactualizada",
      body: "Los wikis se escriben una vez y nunca se actualizan. Nadie confía en ellos. Nadie los lee.",
      color: C.amber,
    },
    {
      icon: "🔍",
      title: "Onboarding lento y costoso",
      body: "Nuevos devs tardan semanas en entender cómo interactúan los módulos, quién llama a qué y por qué.",
      color: C.blue,
    },
  ];

  problems.forEach((p, i) => {
    const x = 0.4 + i * 3.1;
    addCard(s, x, 1.1, 2.9, 3.7, p.color);

    s.addText(p.icon, {
      x: x + 0.15, y: 1.25, w: 2.6, h: 0.8,
      fontSize: 36, align: "center", valign: "middle", margin: 0,
    });
    s.addText(p.title, {
      x: x + 0.15, y: 2.1, w: 2.6, h: 0.6,
      fontSize: 13, bold: true, color: C.textHi, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0, wrap: true,
    });
    s.addText(p.body, {
      x: x + 0.15, y: 2.75, w: 2.6, h: 1.8,
      fontSize: 10, color: C.textMid, fontFace: "Calibri",
      align: "center", valign: "top", margin: 0, wrap: true,
    });
  });

  s.addText("¿Les suena familiar?", {
    x: 0.5, y: 5.0, w: 9, h: 0.35,
    fontSize: 12, color: C.textDim, fontFace: "Calibri", italic: true,
    align: "center", margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — QUÉ ES ATLAS
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  slideBase(s);

  // Left: definition
  s.addText("¿Qué es Atlas?", {
    x: 0.5, y: 0.3, w: 9, h: 0.55,
    fontSize: 28, bold: true, color: C.textHi, fontFace: "Calibri", align: "left", margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.88, w: 9, h: 0.03,
    fill: { color: C.divider }, line: { color: C.divider, width: 0 },
  });

  // Big tagline
  s.addText("Un sistema de gestión de conocimiento de producto.", {
    x: 0.5, y: 1.05, w: 5.6, h: 0.65,
    fontSize: 19, bold: true, color: C.accent, fontFace: "Calibri", align: "left", margin: 0, wrap: true,
  });

  s.addText([
    { text: "Atlas es una herramienta interna que permite a equipos técnicos ", options: {} },
    { text: "documentar y visualizar el frontend", options: { bold: true, color: C.textHi } },
    { text: " de sus sistemas: módulos, pantallas, componentes, flujos de usuario y dependencias entre módulos. Los endpoints documentan el contrato con el backend.", options: {} },
  ], {
    x: 0.5, y: 1.75, w: 5.6, h: 1.1,
    fontSize: 13, color: C.textMid, fontFace: "Calibri", align: "left", valign: "top", margin: 0, wrap: true,
  });

  // Pillars
  const pillars = [
    { emoji: "🗺️", text: "Mapa vivo — siempre actualizable" },
    { emoji: "⚠️", text: "Visibilidad de riesgos y bus factor" },
    { emoji: "🚀", text: "Onboarding acelerado para nuevos devs" },
    { emoji: "🤝", text: "Alineación entre PM y Tech" },
  ];

  pillars.forEach((p, i) => {
    const py = 2.95 + i * 0.6;
    s.addText(p.emoji, {
      x: 0.5, y: py, w: 0.5, h: 0.48,
      fontSize: 18, align: "center", valign: "middle", margin: 0,
    });
    s.addText(p.text, {
      x: 1.1, y: py + 0.04, w: 4.9, h: 0.4,
      fontSize: 12, color: C.textHi, fontFace: "Calibri", align: "left", valign: "middle", margin: 0,
    });
  });

  // Right: visual representation — nested structure diagram
  const rx = 6.2;
  addCard(s, rx, 1.0, 3.4, 4.2, C.accent);

  // Mini hierarchy
  const items = [
    { label: "Frontend (RMES)", indent: 0, color: C.accent },
    { label: "└ Módulo: Auth", indent: 0.3, color: C.blue },
    { label: "  └ Feature: Login SSO", indent: 0.6, color: C.green },
    { label: "    └ Flujo: 8 pasos", indent: 0.9, color: C.textMid },
    { label: "    └ API endpoints: 3", indent: 0.9, color: C.textMid },
    { label: "└ Módulo: Reports", indent: 0.3, color: C.blue },
    { label: "  └ Feature: Exportar", indent: 0.6, color: C.green },
    { label: "    └ Flujo: 5 pasos", indent: 0.9, color: C.textMid },
  ];

  items.forEach((item, i) => {
    s.addText(item.label, {
      x: rx + 0.2 + item.indent, y: 1.15 + i * 0.46, w: 3.0, h: 0.4,
      fontSize: 10, color: item.color, fontFace: "Consolas",
      align: "left", valign: "middle", margin: 0,
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — CARACTERÍSTICAS CLAVE
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  slideBase(s);

  s.addText("Características clave", {
    x: 0.5, y: 0.3, w: 9, h: 0.55,
    fontSize: 28, bold: true, color: C.textHi, fontFace: "Calibri", align: "left", margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.88, w: 9, h: 0.03,
    fill: { color: C.divider }, line: { color: C.divider, width: 0 },
  });

  const features = [
    {
      emoji: "📦",
      title: "Módulos y Features",
      body: "Organiza tu sistema en módulos y funcionalidades con metadatos ricos: goal de negocio, actores, reglas, deuda técnica.",
      color: C.accent,
    },
    {
      emoji: "🌊",
      title: "Flujos Visuales",
      body: "Documenta flujos paso a paso en un swimlane interactivo: actor, pantalla, componentes UI, servicios frontend y los endpoints que consumen.",
      color: C.blue,
    },
    {
      emoji: "↔️",
      title: "Grafo de Dependencias",
      body: "Visualiza relaciones entre módulos: contains, uses, calls, depends_on. Detecta dependencias circulares y puntos de falla.",
      color: C.green,
    },
    {
      emoji: "👥",
      title: "Mapa de Conocimiento",
      body: "Mapa de qué miembro del equipo conoce qué módulo. Identifica bus factor y riesgo de pérdida de conocimiento.",
      color: C.amber,
    },
    {
      emoji: "❤️",
      title: "Health Score",
      body: "Score 0-100 por módulo basado en documentación, riesgo y bus factor. Alertas automáticas para módulos críticos.",
      color: C.red,
    },
    {
      emoji: "📤",
      title: "Exportar a Markdown",
      body: "Exporta cualquier módulo o feature como Markdown listo para Notion, Confluence, GitHub Wiki o tu herramienta favorita.",
      color: "8B5CF6",
    },
  ];

  features.forEach((f, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.4 + col * 3.1;
    const y = 1.1 + row * 2.15;

    addCard(s, x, y, 2.9, 1.95, f.color);

    s.addText(f.emoji, {
      x: x + 0.15, y: y + 0.12, w: 0.55, h: 0.5,
      fontSize: 22, align: "center", valign: "middle", margin: 0,
    });
    s.addText(f.title, {
      x: x + 0.75, y: y + 0.15, w: 2.0, h: 0.5,
      fontSize: 11, bold: true, color: C.textHi, fontFace: "Calibri",
      align: "left", valign: "middle", margin: 0, wrap: true,
    });
    s.addText(f.body, {
      x: x + 0.15, y: y + 0.68, w: 2.6, h: 1.15,
      fontSize: 9.5, color: C.textMid, fontFace: "Calibri",
      align: "left", valign: "top", margin: 0, wrap: true,
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — FLUJO VISUAL (SWIMLANE)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  slideBase(s);

  s.addText("Flujos documentados por paso", {
    x: 0.5, y: 0.3, w: 9, h: 0.55,
    fontSize: 28, bold: true, color: C.textHi, fontFace: "Calibri", align: "left", margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.88, w: 9, h: 0.03,
    fill: { color: C.divider }, line: { color: C.divider, width: 0 },
  });

  // Left explanation
  s.addText([
    { text: "Cada paso del flujo documenta:\n", options: { bold: true, breakLine: true } },
    { text: "• Actor que realiza la acción\n", options: { breakLine: true } },
    { text: "• Pantalla donde ocurre\n", options: { breakLine: true } },
    { text: "• Componentes UI involucrados\n", options: { breakLine: true } },
    { text: "• Servicios frontend (Angular services, stores…)\n", options: { breakLine: true } },
    { text: "• Endpoints consumidos: método, path, payload, response", options: {} },
  ], {
    x: 0.5, y: 1.1, w: 3.4, h: 2.8,
    fontSize: 12, color: C.textMid, fontFace: "Calibri",
    align: "left", valign: "top", margin: 0,
  });

  s.addText("Todo editable inline, sin salir del contexto.", {
    x: 0.5, y: 3.95, w: 3.4, h: 0.4,
    fontSize: 11, color: C.green, fontFace: "Calibri", italic: true,
    align: "left", margin: 0,
  });

  s.addText("El equipo puede documentar flujos frontend completos en minutos, no días.", {
    x: 0.5, y: 4.45, w: 3.4, h: 0.6,
    fontSize: 10, color: C.textDim, fontFace: "Calibri",
    align: "left", margin: 0, wrap: true,
  });

  // Right: swimlane mockup
  const sx = 4.0, sy = 1.0;
  const sw = 5.7, sh = 4.3;

  // Header row
  const headers = ["#", "Actor", "Pantalla", "Componentes", "Servicios", "Endpoints"];
  const colWidths = [0.35, 0.75, 0.85, 1.3, 0.95, 1.5];
  let cx = sx + 0.05;
  headers.forEach((h, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: sy, w: colWidths[i], h: 0.32,
      fill: { color: "111827" }, line: { color: C.divider, width: 1 },
    });
    s.addText(h, {
      x: cx, y: sy, w: colWidths[i], h: 0.32,
      fontSize: 8, bold: true, color: C.textDim, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0,
    });
    cx += colWidths[i];
  });

  // Data rows (svcs = frontend services/Angular services)
  const rows = [
    { num: "1", actor: "Supervisor", screen: "Dashboard", comps: "FilterBar\nDatePicker", svcs: "ReportService", ep: "GET /api/reports" },
    { num: "2", actor: "", screen: "Dashboard", comps: "ReportTable\nPagination", svcs: "AuthService", ep: "GET /api/me" },
    { num: "3", actor: "Supervisor", screen: "ExportModal", comps: "ExportModal\nFormatSelect", svcs: "ExportService", ep: "POST /api/export" },
  ];

  rows.forEach((row, ri) => {
    const ry = sy + 0.32 + ri * 0.95;
    const rowColor = ri % 2 === 0 ? "0D1B3E" : "091428";
    cx = sx + 0.05;
    const cells = [row.num, row.actor, row.screen, row.comps, row.svcs, row.ep];
    cells.forEach((cell, ci) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: ry, w: colWidths[ci], h: 0.88,
        fill: { color: rowColor }, line: { color: C.divider, width: 1 },
      });
      let color = C.textHi;
      if (ci === 1) color = "A5B4FC"; // actor — indigo
      if (ci === 2) color = "93C5FD"; // screen — blue
      if (ci === 3) color = "86EFAC"; // comps — green
      if (ci === 4) color = "FCD34D"; // services — amber
      if (ci === 5) color = "FDE68A"; // endpoints — yellow

      s.addText(cell, {
        x: cx + 0.04, y: ry + 0.05, w: colWidths[ci] - 0.08, h: 0.78,
        fontSize: ci === 0 ? 10 : 8,
        bold: ci === 0,
        color,
        fontFace: ci === 5 ? "Consolas" : "Calibri",
        align: ci === 0 ? "center" : "left",
        valign: "middle",
        margin: 0,
        wrap: true,
      });
      cx += colWidths[ci];
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 6 — HEALTH SCORE & RIESGOS
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  slideBase(s);

  s.addText("Visibilidad del estado real del sistema", {
    x: 0.5, y: 0.3, w: 9, h: 0.55,
    fontSize: 28, bold: true, color: C.textHi, fontFace: "Calibri", align: "left", margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.88, w: 9, h: 0.03,
    fill: { color: C.divider }, line: { color: C.divider, width: 0 },
  });

  // Health score explanation
  s.addText("Health Score (0-100)", {
    x: 0.5, y: 1.05, w: 4.5, h: 0.45,
    fontSize: 16, bold: true, color: C.textHi, fontFace: "Calibri", align: "left", margin: 0,
  });

  const components = [
    { label: "Documentación", weight: "40 pts", color: C.blue },
    { label: "Nivel de Riesgo", weight: "30 pts", color: C.amber },
    { label: "Bus Factor", weight: "30 pts", color: C.red },
  ];

  components.forEach((c, i) => {
    const cy = 1.6 + i * 0.7;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: cy, w: 4.4, h: 0.55,
      fill: { color: C.card }, line: { color: c.color, width: 1 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: cy, w: 0.05, h: 0.55,
      fill: { color: c.color }, line: { color: c.color, width: 0 },
    });
    s.addText(c.label, {
      x: 0.65, y: cy + 0.05, w: 2.5, h: 0.45,
      fontSize: 12, color: C.textHi, fontFace: "Calibri",
      align: "left", valign: "middle", margin: 0,
    });
    s.addText(c.weight, {
      x: 3.5, y: cy + 0.05, w: 1.2, h: 0.45,
      fontSize: 12, bold: true, color: c.color, fontFace: "Calibri",
      align: "right", valign: "middle", margin: 0,
    });
  });

  // Alerts section
  s.addText("Alertas automáticas", {
    x: 0.5, y: 3.85, w: 4.4, h: 0.4,
    fontSize: 13, bold: true, color: C.textHi, fontFace: "Calibri", align: "left", margin: 0,
  });
  const alerts = [
    "⚠️  Documentación < 20 pts",
    "🔴  Features de alto riesgo sin owner",
    "👥  Bus factor crítico (solo 1 persona conoce el módulo)",
  ];
  alerts.forEach((a, i) => {
    s.addText(a, {
      x: 0.5, y: 4.3 + i * 0.3, w: 4.4, h: 0.28,
      fontSize: 10, color: C.textMid, fontFace: "Calibri", align: "left", margin: 0,
    });
  });

  // Right: score cards mockup
  const modules = [
    { name: "Auth", score: 87, risk: "Bajo", color: C.green },
    { name: "Reports", score: 42, risk: "Alto", color: C.amber },
    { name: "Payments", score: 18, risk: "Crítico", color: C.red },
  ];

  s.addText("Dashboard de módulos", {
    x: 5.2, y: 1.05, w: 4.4, h: 0.45,
    fontSize: 13, bold: true, color: C.textMid, fontFace: "Calibri", align: "left", margin: 0,
  });

  modules.forEach((m, i) => {
    const my = 1.6 + i * 1.25;
    addCard(s, 5.2, my, 4.4, 1.1, m.color);

    // Score circle (faked with text)
    s.addShape(pres.shapes.OVAL, {
      x: 5.35, y: my + 0.15, w: 0.75, h: 0.75,
      fill: { color: m.color, transparency: 75 },
      line: { color: m.color, width: 2 },
    });
    s.addText(String(m.score), {
      x: 5.35, y: my + 0.18, w: 0.75, h: 0.68,
      fontSize: 18, bold: true, color: m.color, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0,
    });

    s.addText(m.name, {
      x: 6.2, y: my + 0.15, w: 3.2, h: 0.38,
      fontSize: 15, bold: true, color: C.textHi, fontFace: "Calibri",
      align: "left", valign: "middle", margin: 0,
    });
    s.addText(`Riesgo: ${m.risk}`, {
      x: 6.2, y: my + 0.55, w: 3.2, h: 0.3,
      fontSize: 10, color: m.color, fontFace: "Calibri",
      align: "left", valign: "middle", margin: 0,
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 7 — STACK TÉCNICO
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  slideBase(s);

  s.addText("Stack técnico", {
    x: 0.5, y: 0.3, w: 9, h: 0.55,
    fontSize: 28, bold: true, color: C.textHi, fontFace: "Calibri", align: "left", margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.88, w: 9, h: 0.03,
    fill: { color: C.divider }, line: { color: C.divider, width: 0 },
  });

  const tech = [
    { layer: "Framework", tech: "Next.js 16 · React 19", detail: "App Router · Server Components · Server Actions", color: "000000" },
    { layer: "Lenguaje", tech: "TypeScript 5", detail: "Tipado estricto en toda la app", color: "3178C6" },
    { layer: "Estilos", tech: "Tailwind CSS 4", detail: "Utility-first · Tema oscuro nativo", color: "06B6D4" },
    { layer: "Base de datos", tech: "Prisma 6 + SQLite", detail: "ORM type-safe · Migraciones automáticas", color: "2D3748" },
    { layer: "Grafos", tech: "React Flow (@xyflow)", detail: "Editor de grafos interactivo · drag-and-drop", color: "FF0072" },
    { layer: "React Compiler", tech: "Babel plugin activo", detail: "Optimizaciones automáticas de re-renders", color: "61DAFB" },
  ];

  tech.forEach((t, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const tx = 0.4 + col * 4.85;
    const ty = 1.1 + row * 1.45;

    addCard(s, tx, ty, 4.55, 1.25, C.accent);

    s.addText(t.layer.toUpperCase(), {
      x: tx + 0.15, y: ty + 0.1, w: 4.2, h: 0.25,
      fontSize: 7.5, bold: true, color: C.textDim, fontFace: "Calibri",
      align: "left", valign: "middle", margin: 0, charSpacing: 2,
    });
    s.addText(t.tech, {
      x: tx + 0.15, y: ty + 0.35, w: 4.2, h: 0.4,
      fontSize: 14, bold: true, color: C.textHi, fontFace: "Calibri",
      align: "left", valign: "middle", margin: 0,
    });
    s.addText(t.detail, {
      x: tx + 0.15, y: ty + 0.75, w: 4.2, h: 0.38,
      fontSize: 9.5, color: C.textMid, fontFace: "Calibri",
      align: "left", valign: "middle", margin: 0,
    });
  });

  s.addText("Tecnologías que ya conocen. Cero curva de aprendizaje para contribuir.", {
    x: 0.5, y: 5.2, w: 9, h: 0.3,
    fontSize: 11, color: C.green, fontFace: "Calibri", italic: true,
    align: "center", margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 8 — CALL TO ACTION
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  slideBase(s);

  // Full left accent block
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.12, h: 5.625,
    fill: { color: C.accent },
    line: { color: C.accent, width: 0 },
  });

  s.addText("Próximos pasos", {
    x: 0.55, y: 0.35, w: 8.5, h: 0.55,
    fontSize: 28, bold: true, color: C.textHi, fontFace: "Calibri", align: "left", margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.55, y: 0.93, w: 8.5, h: 0.03,
    fill: { color: C.divider }, line: { color: C.divider, width: 0 },
  });

  const steps = [
    {
      num: "01",
      title: "Demo en vivo",
      body: "Mostrar Atlas documentando un módulo real de RMES — en 30 minutos el equipo ve el valor completo.",
      color: C.accent,
    },
    {
      num: "02",
      title: "Piloto con 1 módulo",
      body: "Documentar un módulo de alta complejidad o alto riesgo. Medir tiempo de onboarding antes/después.",
      color: C.blue,
    },
    {
      num: "03",
      title: "Rollout al equipo",
      body: "Extender a todos los módulos. Integrar en el proceso de PR: cada feature documentada antes de merge.",
      color: C.green,
    },
  ];

  steps.forEach((step, i) => {
    const sy = 1.15 + i * 1.35;

    s.addShape(pres.shapes.OVAL, {
      x: 0.55, y: sy + 0.05, w: 0.7, h: 0.7,
      fill: { color: step.color, transparency: 80 },
      line: { color: step.color, width: 2 },
    });
    s.addText(step.num, {
      x: 0.55, y: sy + 0.05, w: 0.7, h: 0.7,
      fontSize: 13, bold: true, color: step.color, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0,
    });

    s.addText(step.title, {
      x: 1.4, y: sy + 0.05, w: 7.7, h: 0.38,
      fontSize: 15, bold: true, color: C.textHi, fontFace: "Calibri",
      align: "left", valign: "middle", margin: 0,
    });
    s.addText(step.body, {
      x: 1.4, y: sy + 0.45, w: 7.7, h: 0.65,
      fontSize: 11, color: C.textMid, fontFace: "Calibri",
      align: "left", valign: "top", margin: 0, wrap: true,
    });
  });

  // Bottom CTA
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.55, y: 5.1, w: 8.5, h: 0.03,
    fill: { color: C.divider }, line: { color: C.divider, width: 0 },
  });
  s.addText("\"El conocimiento de cómo funciona el sistema es el activo más valioso del equipo. Atlas lo hace visible.\"", {
    x: 0.55, y: 5.2, w: 8.5, h: 0.32,
    fontSize: 10, color: C.textDim, fontFace: "Calibri", italic: true,
    align: "center", margin: 0, wrap: true,
  });
}

// ─── WRITE FILE ───────────────────────────────────────────────────────────────
pres.writeFile({ fileName: "D:/StartUp/atlas/atlas-pitch.pptx" })
  .then(() => console.log("✅  atlas-pitch.pptx creado exitosamente"))
  .catch((e) => { console.error("❌  Error:", e); process.exit(1); });
