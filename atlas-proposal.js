const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  ExternalHyperlink,
} = require("C:/nvm4w/nodejs/node_modules/docx");
const fs = require("fs");

// ─── COLORS & HELPERS ────────────────────────────────────────────────────────
const ACCENT  = "4F46E5"; // indigo-600
const ACCENT_L = "EEF2FF"; // indigo-50
const DARK    = "1E293B"; // slate-800
const MID     = "475569"; // slate-600
const LIGHT   = "94A3B8"; // slate-400
const BORDER  = "CBD5E1"; // slate-300
const WHITE   = "FFFFFF";
const RED_L   = "FEE2E2";
const AMBER_L = "FEF3C7";
const GREEN_L = "DCFCE7";
const BLUE_L  = "DBEAFE";

const PAGE_W  = 12240; // 8.5" in DXA
const PAGE_H  = 15840; // 11" in DXA
const MARGIN  = 1440;  // 1" margins
const CONTENT = PAGE_W - MARGIN * 2; // 9360 DXA

const border = (color = BORDER) => ({ style: BorderStyle.SINGLE, size: 1, color });
const borders = (color = BORDER) => ({
  top: border(color), bottom: border(color),
  left: border(color), right: border(color),
});
const noBorders = () => ({
  top:    { style: BorderStyle.NONE, size: 0, color: WHITE },
  bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
  left:   { style: BorderStyle.NONE, size: 0, color: WHITE },
  right:  { style: BorderStyle.NONE, size: 0, color: WHITE },
});
const cellPad = { top: 100, bottom: 100, left: 140, right: 140 };
const spacingAfter = (n) => ({ spacing: { after: n } });

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: DARK })],
    spacing: { before: 360, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: ACCENT, space: 4 } },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: ACCENT })],
    spacing: { before: 280, after: 120 },
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: DARK })],
    spacing: { before: 200, after: 80 },
  });
}

function body(text, { color = DARK, bold = false, italic = false, after = 140 } = {}) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Arial", size: 22, color, bold, italic })],
    spacing: { after },
  });
}

function bullet(text, { color = DARK, bold = false, indentLevel = 0 } = {}) {
  return new Paragraph({
    numbering: { reference: "bullets", level: indentLevel },
    children: [new TextRun({ text, font: "Arial", size: 22, color, bold })],
    spacing: { after: 60 },
  });
}

function spacer(size = 160) {
  return new Paragraph({ children: [], spacing: { after: size } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function infoBox(lines, fillColor, accentColor) {
  // A colored full-width box built from a 1-row table
  const cellContent = lines.map((l) =>
    new Paragraph({
      children: typeof l === "string"
        ? [new TextRun({ text: l, font: "Arial", size: 22, color: DARK })]
        : l,
      spacing: { after: 60 },
    })
  );
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: [80, CONTENT - 80],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: WHITE },
              bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
              left: border(accentColor),
              right: { style: BorderStyle.NONE, size: 0, color: WHITE },
            },
            width: { size: 80, type: WidthType.DXA },
            shading: { fill: accentColor, type: ShadingType.CLEAR },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            borders: {
              top: border(accentColor),
              bottom: border(accentColor),
              left: { style: BorderStyle.NONE, size: 0, color: WHITE },
              right: border(accentColor),
            },
            width: { size: CONTENT - 80, type: WidthType.DXA },
            shading: { fill: fillColor, type: ShadingType.CLEAR },
            margins: cellPad,
            children: cellContent,
          }),
        ],
      }),
    ],
  });
}

function featureRow(emoji, title, description, fill) {
  return new TableRow({
    children: [
      new TableCell({
        borders: borders(BORDER),
        width: { size: 700, type: WidthType.DXA },
        shading: { fill, type: ShadingType.CLEAR },
        margins: cellPad,
        verticalAlign: VerticalAlign.TOP,
        children: [new Paragraph({
          children: [new TextRun({ text: emoji, font: "Arial", size: 28 })],
          alignment: AlignmentType.CENTER,
        })],
      }),
      new TableCell({
        borders: borders(BORDER),
        width: { size: 2200, type: WidthType.DXA },
        shading: { fill, type: ShadingType.CLEAR },
        margins: cellPad,
        verticalAlign: VerticalAlign.TOP,
        children: [new Paragraph({
          children: [new TextRun({ text: title, font: "Arial", size: 22, bold: true, color: DARK })],
        })],
      }),
      new TableCell({
        borders: borders(BORDER),
        width: { size: CONTENT - 2900, type: WidthType.DXA },
        shading: { fill: WHITE, type: ShadingType.CLEAR },
        margins: cellPad,
        verticalAlign: VerticalAlign.TOP,
        children: [new Paragraph({
          children: [new TextRun({ text: description, font: "Arial", size: 22, color: MID })],
        })],
      }),
    ],
  });
}

// ─── DOCUMENT ────────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22, color: DARK } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: DARK },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: ACCENT },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: DARK },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "ATLAS — Propuesta para el equipo de desarrollo de RMES", font: "Arial", size: 18, color: LIGHT }),
                new TextRun({ text: "\t", font: "Arial", size: 18 }),
              ],
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: ACCENT, space: 4 } },
              tabStops: [{ type: "right", position: CONTENT }],
              spacing: { after: 0 },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Atlas  ·  Gestión de conocimiento frontend  ·  Pág. ", font: "Arial", size: 18, color: LIGHT }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: LIGHT }),
              ],
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 2, color: BORDER, space: 4 } },
            }),
          ],
        }),
      },
      children: [

        // ─── PORTADA ─────────────────────────────────────────────────────────
        // Título principal
        spacer(1200),
        new Paragraph({
          children: [new TextRun({ text: "ATLAS", font: "Arial", size: 96, bold: true, color: ACCENT, characterSpacing: 200 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "El mapa vivo de tu frontend", font: "Arial", size: 36, color: DARK, italic: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 320 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Propuesta para el equipo de desarrollo de RMES", font: "Arial", size: 22, color: MID })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Abril 2026", font: "Arial", size: 22, color: LIGHT })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
        }),
        spacer(2000),
        // Divider line via paragraph border
        new Paragraph({
          children: [new TextRun({ text: "" })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 2 } },
          spacing: { after: 240 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Documentación  ·  Visualización  ·  Arquitectura frontend", font: "Arial", size: 20, color: LIGHT, italic: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
        }),

        pageBreak(),

        // ─── 1. RESUMEN EJECUTIVO ─────────────────────────────────────────────
        h1("1. Resumen ejecutivo"),
        body(
          "Atlas es una herramienta interna de gestión de conocimiento diseñada para mapear el " +
          "frontend de sistemas de software. Permite a los equipos de desarrollo documentar módulos, " +
          "pantallas, componentes, flujos de usuario, servicios frontend y los endpoints que conectan " +
          "la interfaz con el backend.",
          { after: 160 }
        ),
        body(
          "El objetivo es crear un mapa vivo del frontend del producto: siempre actualizable, " +
          "siempre confiable, accesible para todo el equipo.",
          { after: 160 }
        ),
        infoBox(
          [
            [
              new TextRun({ text: "Alcance de Atlas v1: ", font: "Arial", size: 22, bold: true, color: DARK }),
              new TextRun({
                text: "Atlas mapea exclusivamente el frontend. Los endpoints documentados representan el contrato " +
                      "de comunicación entre el frontend y el backend — no el interior del backend. " +
                      "El mapeo del backend es una extensión planificada para versiones futuras.",
                font: "Arial", size: 22, color: MID,
              }),
            ],
          ],
          BLUE_L,
          "3B82F6"
        ),
        spacer(240),

        // ─── 2. EL PROBLEMA ───────────────────────────────────────────────────
        h1("2. El problema"),
        body("El frontend de RMES — como el de cualquier sistema en crecimiento — acumula tres problemas estructurales:"),
        spacer(80),

        // Problema 1
        h3("2.1  Conocimiento concentrado en pocas personas"),
        body(
          "El entendimiento real de cómo funciona el frontend — qué componente pertenece a qué módulo, " +
          "qué servicio llama qué endpoint, qué flujo sigue el usuario — vive en la cabeza de 1 o 2 " +
          "personas. Si esas personas cambian de proyecto o se van del equipo, ese conocimiento desaparece.",
          { after: 100 }
        ),
        infoBox(
          ["Bus factor = 1: si esa persona no está disponible, nadie puede dar soporte ni continuar el desarrollo con confianza."],
          RED_L, "EF4444"
        ),
        spacer(160),

        // Problema 2
        h3("2.2  Documentación inexistente o desactualizada"),
        body(
          "Los wikis, READMEs y diagramas se crean una vez y nunca se mantienen. El código evoluciona, " +
          "los flujos cambian, aparecen nuevos módulos — pero la documentación queda congelada en el " +
          "momento en que se escribió. Nadie confía en ella. Nadie la lee.",
          { after: 100 }
        ),
        infoBox(
          ["Documentación estática = documentación muerta."],
          AMBER_L, "F59E0B"
        ),
        spacer(160),

        // Problema 3
        h3("2.3  Onboarding lento y costoso"),
        body(
          "Un desarrollador nuevo puede tardar semanas en entender cómo está organizado el frontend: " +
          "qué módulos existen, cómo se relacionan, cuáles son las pantallas de cada módulo, " +
          "qué servicios frontend se usan en cada feature, qué endpoints se consumen. " +
          "Este tiempo es puro costo para el equipo.",
          { after: 0 }
        ),
        spacer(240),

        pageBreak(),

        // ─── 3. LA SOLUCIÓN ───────────────────────────────────────────────────
        h1("3. La solución: Atlas"),
        body(
          "Atlas es un sistema de gestión de conocimiento de producto centrado en el frontend. " +
          "No es un wiki estático — es una herramienta de edición activa donde el equipo documenta " +
          "y navega el sistema directamente desde la interfaz, con datos siempre en sincronía con el código real."
        ),
        spacer(100),
        h2("Modelo de datos"),
        body("Atlas organiza el conocimiento en capas jerárquicas:"),
        spacer(80),
        new Table({
          width: { size: CONTENT, type: WidthType.DXA },
          columnWidths: [1800, 7560],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: borders(BORDER),
                  width: { size: 1800, type: WidthType.DXA },
                  shading: { fill: ACCENT_L, type: ShadingType.CLEAR },
                  margins: cellPad,
                  children: [new Paragraph({ children: [new TextRun({ text: "Nivel", font: "Arial", size: 22, bold: true, color: ACCENT })] })],
                }),
                new TableCell({
                  borders: borders(BORDER),
                  width: { size: 7560, type: WidthType.DXA },
                  shading: { fill: ACCENT_L, type: ShadingType.CLEAR },
                  margins: cellPad,
                  children: [new Paragraph({ children: [new TextRun({ text: "Descripción", font: "Arial", size: 22, bold: true, color: ACCENT })] })],
                }),
              ],
            }),
            ...[
              ["Módulo", "Agrupación de funcionalidades relacionadas. Tiene owner técnico, owner de negocio, nivel de criticidad y estado de documentación."],
              ["Feature (Funcionalidad)", "Funcionalidad específica dentro de un módulo. Tiene goal de negocio, actores, reglas de negocio, deuda técnica y nivel de bus factor."],
              ["Flujo", "Secuencia de pasos que describe cómo el usuario interactúa con el frontend para completar una tarea. Se visualiza como swimlane."],
              ["Paso de flujo (FlowStep)", "Unidad atómica del flujo: actor, pantalla, componentes UI, servicios frontend, y endpoints consumidos hacia el backend."],
              ["Screen / Component", "Pantallas y componentes UI asociados al módulo."],
              ["Endpoints", "Contratos de API documentados por cada paso: método HTTP, path, payload y response esperado. Representan el límite frontend→backend."],
            ].map(([level, desc]) =>
              new TableRow({
                children: [
                  new TableCell({
                    borders: borders(BORDER),
                    width: { size: 1800, type: WidthType.DXA },
                    shading: { fill: WHITE, type: ShadingType.CLEAR },
                    margins: cellPad,
                    children: [new Paragraph({ children: [new TextRun({ text: level, font: "Arial", size: 22, bold: true, color: DARK })] })],
                  }),
                  new TableCell({
                    borders: borders(BORDER),
                    width: { size: 7560, type: WidthType.DXA },
                    shading: { fill: WHITE, type: ShadingType.CLEAR },
                    margins: cellPad,
                    children: [new Paragraph({ children: [new TextRun({ text: desc, font: "Arial", size: 22, color: MID })] })],
                  }),
                ],
              })
            ),
          ],
        }),
        spacer(240),

        pageBreak(),

        // ─── 4. CARACTERÍSTICAS ───────────────────────────────────────────────
        h1("4. Características clave"),
        spacer(80),
        new Table({
          width: { size: CONTENT, type: WidthType.DXA },
          columnWidths: [700, 2200, CONTENT - 2900],
          rows: [
            // Header
            new TableRow({
              children: [
                new TableCell({ borders: borders(BORDER), width: { size: 700, type: WidthType.DXA },
                  shading: { fill: ACCENT_L, type: ShadingType.CLEAR }, margins: cellPad,
                  children: [new Paragraph({ children: [new TextRun({ text: "", font: "Arial", size: 22 })] })],
                }),
                new TableCell({ borders: borders(BORDER), width: { size: 2200, type: WidthType.DXA },
                  shading: { fill: ACCENT_L, type: ShadingType.CLEAR }, margins: cellPad,
                  children: [new Paragraph({ children: [new TextRun({ text: "Característica", font: "Arial", size: 22, bold: true, color: ACCENT })] })],
                }),
                new TableCell({ borders: borders(BORDER), width: { size: CONTENT - 2900, type: WidthType.DXA },
                  shading: { fill: ACCENT_L, type: ShadingType.CLEAR }, margins: cellPad,
                  children: [new Paragraph({ children: [new TextRun({ text: "Descripción", font: "Arial", size: 22, bold: true, color: ACCENT })] })],
                }),
              ],
            }),
            featureRow("📦", "Módulos y Features",
              "CRUD completo de módulos y funcionalidades con metadatos ricos: goal de negocio, actores, reglas, deuda técnica, complejidad técnica y de negocio.", WHITE),
            featureRow("🌊", "FlowSwimlane",
              "Editor swimlane interactivo para documentar flujos paso a paso. Cada paso registra actor, pantalla, componentes UI, servicios frontend y endpoints consumidos.", ACCENT_L),
            featureRow("🔗", "Grafo de dependencias",
              "Visualización interactiva de relaciones entre módulos del frontend: contains, uses, calls, depends_on. Detecta dependencias y puntos de falla.", WHITE),
            featureRow("👥", "Mapa de conocimiento",
              "Diagrama de qué miembro del equipo conoce qué módulo. Identifica bus factor y riesgo de pérdida de conocimiento ante cambios de personal.", ACCENT_L),
            featureRow("❤️", "Health Score",
              "Score 0-100 automático por módulo basado en estado de documentación (40 pts), nivel de riesgo (30 pts) y bus factor (30 pts). Genera alertas automáticas.", WHITE),
            featureRow("📤", "Exportar a Markdown",
              "Exporta módulos y features completos como Markdown estructurado, listo para Notion, Confluence, GitHub Wiki o cualquier herramienta del equipo.", ACCENT_L),
          ],
        }),
        spacer(240),

        pageBreak(),

        // ─── 5. SERVICIO FRONTEND VS BACKEND ──────────────────────────────────
        h1("5. Frontend · Endpoints · Backend"),
        body(
          "Es importante entender el límite que Atlas documenta: el frontend y su contrato con el backend."
        ),
        spacer(100),
        new Table({
          width: { size: CONTENT, type: WidthType.DXA },
          columnWidths: [3120, 3120, 3120],
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: borders(BORDER), width: { size: 3120, type: WidthType.DXA },
                  shading: { fill: ACCENT_L, type: ShadingType.CLEAR }, margins: cellPad, verticalAlign: VerticalAlign.TOP,
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "Frontend (en Atlas)", font: "Arial", size: 22, bold: true, color: ACCENT })], spacing: { after: 80 } }),
                    new Paragraph({ children: [new TextRun({ text: "Módulos, features, pantallas, componentes UI, servicios frontend (Angular services, stores, providers) y flujos de usuario.", font: "Arial", size: 20, color: DARK })], spacing: { after: 80 } }),
                    new Paragraph({ children: [new TextRun({ text: "✔ Documentado en Atlas", font: "Arial", size: 20, bold: true, color: "16A34A" })], spacing: { after: 0 } }),
                  ],
                }),
                new TableCell({ borders: borders(BORDER), width: { size: 3120, type: WidthType.DXA },
                  shading: { fill: AMBER_L, type: ShadingType.CLEAR }, margins: cellPad, verticalAlign: VerticalAlign.TOP,
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "Endpoints (contrato)", font: "Arial", size: 22, bold: true, color: "92400E" })], spacing: { after: 80 } }),
                    new Paragraph({ children: [new TextRun({ text: "Método HTTP, path, payload esperado y response. Son el límite entre el frontend y el backend. Atlas los documenta desde la perspectiva del frontend.", font: "Arial", size: 20, color: DARK })], spacing: { after: 80 } }),
                    new Paragraph({ children: [new TextRun({ text: "✔ Documentado en Atlas (como contrato)", font: "Arial", size: 20, bold: true, color: "16A34A" })], spacing: { after: 0 } }),
                  ],
                }),
                new TableCell({ borders: borders(BORDER), width: { size: 3120, type: WidthType.DXA },
                  shading: { fill: "F1F5F9", type: ShadingType.CLEAR }, margins: cellPad, verticalAlign: VerticalAlign.TOP,
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "Backend (fuera de alcance v1)", font: "Arial", size: 22, bold: true, color: MID })], spacing: { after: 80 } }),
                    new Paragraph({ children: [new TextRun({ text: "Servicios del servidor, base de datos, lógica de negocio backend, microservicios internos.", font: "Arial", size: 20, color: LIGHT })], spacing: { after: 80 } }),
                    new Paragraph({ children: [new TextRun({ text: "○ Extensión planificada para v2", font: "Arial", size: 20, italic: true, color: LIGHT })], spacing: { after: 0 } }),
                  ],
                }),
              ],
            }),
          ],
        }),
        spacer(200),
        body(
          "Esta separación clara permite que Atlas v1 sea útil de inmediato para el equipo frontend, " +
          "sin esperar a resolver la complejidad adicional de mapear el backend. El contrato de API " +
          "(endpoints) sirve de puente hasta que el mapeo backend sea implementado.",
          { color: MID, after: 240 }
        ),

        pageBreak(),

        // ─── 6. HEALTH SCORE ──────────────────────────────────────────────────
        h1("6. Health Score — visibilidad del riesgo"),
        body(
          "Cada módulo del frontend recibe un score automático de 0 a 100 basado en tres dimensiones:"
        ),
        spacer(100),
        new Table({
          width: { size: CONTENT, type: WidthType.DXA },
          columnWidths: [2200, 1400, 5760],
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: borders(BORDER), width: { size: 2200, type: WidthType.DXA },
                  shading: { fill: ACCENT_L, type: ShadingType.CLEAR }, margins: cellPad,
                  children: [new Paragraph({ children: [new TextRun({ text: "Dimensión", font: "Arial", size: 22, bold: true, color: ACCENT })] })],
                }),
                new TableCell({ borders: borders(BORDER), width: { size: 1400, type: WidthType.DXA },
                  shading: { fill: ACCENT_L, type: ShadingType.CLEAR }, margins: cellPad,
                  children: [new Paragraph({ children: [new TextRun({ text: "Peso", font: "Arial", size: 22, bold: true, color: ACCENT })] })],
                }),
                new TableCell({ borders: borders(BORDER), width: { size: 5760, type: WidthType.DXA },
                  shading: { fill: ACCENT_L, type: ShadingType.CLEAR }, margins: cellPad,
                  children: [new Paragraph({ children: [new TextRun({ text: "Criterio", font: "Arial", size: 22, bold: true, color: ACCENT })] })],
                }),
              ],
            }),
            ...[
              ["Documentación", "40 pts", "Estado de documentación del módulo (30%) + promedio de sus features (70%)."],
              ["Nivel de Riesgo", "30 pts", "Riesgo del módulo (30%) + promedio de riesgo de sus features (70%)."],
              ["Bus Factor",     "30 pts", "Promedio del bus factor de las features (máximo 3 personas por feature)."],
            ].map(([dim, pts, crit]) =>
              new TableRow({
                children: [
                  new TableCell({ borders: borders(BORDER), width: { size: 2200, type: WidthType.DXA },
                    shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: cellPad,
                    children: [new Paragraph({ children: [new TextRun({ text: dim, font: "Arial", size: 22, bold: true, color: DARK })] })],
                  }),
                  new TableCell({ borders: borders(BORDER), width: { size: 1400, type: WidthType.DXA },
                    shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: cellPad,
                    children: [new Paragraph({ children: [new TextRun({ text: pts, font: "Arial", size: 22, bold: true, color: ACCENT })] })],
                  }),
                  new TableCell({ borders: borders(BORDER), width: { size: 5760, type: WidthType.DXA },
                    shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: cellPad,
                    children: [new Paragraph({ children: [new TextRun({ text: crit, font: "Arial", size: 22, color: MID })] })],
                  }),
                ],
              })
            ),
          ],
        }),
        spacer(160),
        h3("Alertas automáticas"),
        bullet("Documentación < 20 pts — módulo en estado crítico de conocimiento."),
        bullet("Features de alto riesgo sin owner técnico asignado."),
        bullet("Bus factor crítico — solo 1 persona conoce el módulo."),
        spacer(240),

        pageBreak(),

        // ─── 7. STACK TÉCNICO ─────────────────────────────────────────────────
        h1("7. Stack técnico"),
        body("Atlas está construido con tecnologías que el equipo ya conoce:"),
        spacer(100),
        new Table({
          width: { size: CONTENT, type: WidthType.DXA },
          columnWidths: [2000, 3000, 4360],
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: borders(BORDER), width: { size: 2000, type: WidthType.DXA },
                  shading: { fill: ACCENT_L, type: ShadingType.CLEAR }, margins: cellPad,
                  children: [new Paragraph({ children: [new TextRun({ text: "Capa", font: "Arial", size: 22, bold: true, color: ACCENT })] })],
                }),
                new TableCell({ borders: borders(BORDER), width: { size: 3000, type: WidthType.DXA },
                  shading: { fill: ACCENT_L, type: ShadingType.CLEAR }, margins: cellPad,
                  children: [new Paragraph({ children: [new TextRun({ text: "Tecnología", font: "Arial", size: 22, bold: true, color: ACCENT })] })],
                }),
                new TableCell({ borders: borders(BORDER), width: { size: 4360, type: WidthType.DXA },
                  shading: { fill: ACCENT_L, type: ShadingType.CLEAR }, margins: cellPad,
                  children: [new Paragraph({ children: [new TextRun({ text: "Notas", font: "Arial", size: 22, bold: true, color: ACCENT })] })],
                }),
              ],
            }),
            ...[
              ["Framework",       "Next.js 16 + React 19",       "App Router, Server Components, Server Actions"],
              ["Lenguaje",        "TypeScript 5",                 "Tipado estricto en toda la app"],
              ["Estilos",         "Tailwind CSS 4",               "Utility-first, tema oscuro nativo"],
              ["ORM / Base datos","Prisma 6 + SQLite",            "Type-safe, migraciones automáticas, fácil de migrar a Postgres"],
              ["Grafos",          "React Flow (@xyflow/react)",   "Editor de grafos interactivo, drag-and-drop"],
              ["Compilador",      "React Compiler (babel plugin)","Optimizaciones automáticas de re-renders"],
            ].map(([layer, tech, note]) =>
              new TableRow({
                children: [
                  new TableCell({ borders: borders(BORDER), width: { size: 2000, type: WidthType.DXA },
                    shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: cellPad,
                    children: [new Paragraph({ children: [new TextRun({ text: layer, font: "Arial", size: 22, bold: true, color: DARK })] })],
                  }),
                  new TableCell({ borders: borders(BORDER), width: { size: 3000, type: WidthType.DXA },
                    shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: cellPad,
                    children: [new Paragraph({ children: [new TextRun({ text: tech, font: "Arial", size: 22, color: ACCENT })] })],
                  }),
                  new TableCell({ borders: borders(BORDER), width: { size: 4360, type: WidthType.DXA },
                    shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: cellPad,
                    children: [new Paragraph({ children: [new TextRun({ text: note, font: "Arial", size: 22, color: MID })] })],
                  }),
                ],
              })
            ),
          ],
        }),
        spacer(240),

        pageBreak(),

        // ─── 8. PLAN DE ADOPCIÓN ──────────────────────────────────────────────
        h1("8. Plan de adopción para RMES"),
        spacer(80),

        h3("Fase 1 — Demo en vivo (Semana 1)"),
        body(
          "Mostrar Atlas documentando un módulo real de RMES. En 30-45 minutos el equipo verifica " +
          "el valor completo: navegación de módulos, edición de flujos en el swimlane, health score " +
          "y grafo de dependencias.",
          { after: 60 }
        ),
        bullet("Preparar 1 módulo de RMES como ejemplo antes de la demo."),
        bullet("Invitar a todo el equipo de desarrollo + PM."),
        spacer(140),

        h3("Fase 2 — Piloto con 1 módulo (Semanas 2-3)"),
        body(
          "Documentar el módulo de mayor complejidad o mayor riesgo de RMES. Medir el tiempo de " +
          "documentación y el feedback del equipo.",
          { after: 60 }
        ),
        bullet("Seleccionar el módulo con mayor bus factor actual."),
        bullet("El equipo documenta features, flujos y endpoints en Atlas."),
        bullet("Medir: tiempo invertido vs. calidad del conocimiento capturado."),
        spacer(140),

        h3("Fase 3 — Rollout completo (Mes 2+)"),
        body(
          "Extender a todos los módulos del frontend de RMES. Integrar Atlas en el proceso de " +
          "desarrollo: cada nueva feature se documenta en Atlas antes de considerar el trabajo completo.",
          { after: 60 }
        ),
        bullet("Definir política: feature sin documentar en Atlas = feature incompleta."),
        bullet("Asignar owners de módulo para mantener el health score."),
        bullet("Revisar health score en cada sprint review."),
        spacer(240),

        // ─── 9. CONCLUSIÓN ────────────────────────────────────────────────────
        h1("9. Conclusión"),
        body(
          "El conocimiento de cómo funciona el frontend de RMES es el activo más valioso del equipo. " +
          "Hoy ese conocimiento está distribuido entre personas, conversaciones y código sin documentar. " +
          "Atlas lo hace visible, estructurado y accesible para todos."
        ),
        spacer(100),
        infoBox(
          [
            [
              new TextRun({ text: "La pregunta no es si documentar. ", font: "Arial", size: 22, bold: true, color: DARK }),
              new TextRun({ text: "La pregunta es cuánto cuesta ", font: "Arial", size: 22, color: DARK }),
              new TextRun({ text: "no documentar.", font: "Arial", size: 22, bold: true, color: DARK }),
            ],
          ],
          GREEN_L, "16A34A"
        ),
        spacer(240),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("D:/StartUp/atlas/atlas-proposal.docx", buffer);
  console.log("✅  atlas-proposal.docx creado exitosamente");
}).catch((e) => {
  console.error("❌  Error:", e);
  process.exit(1);
});
