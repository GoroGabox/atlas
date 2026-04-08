import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// JSON array de strings
const arr = (...items: string[]) => JSON.stringify(items);
// JSON array de IDs a partir de entidades
const jids = (...items: { id: string }[]) => JSON.stringify(items.map((i) => i.id));

async function main() {
  // ── Limpiar en orden de dependencias ────────────────────────────────────
  await prisma.relation.deleteMany();
  await prisma.flowStep.deleteMany();
  await prisma.flow.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.screen.deleteMany();
  await prisma.service.deleteMany();
  await prisma.component.deleteMany();
  await prisma.endpoint.deleteMany();
  await prisma.module.deleteMany();

  // ══════════════════════════════════════════════════════════════════════════
  // MÓDULOS
  // ══════════════════════════════════════════════════════════════════════════
  const tutorialMod = await prisma.module.create({
    data: {
      name:                "Tutorial — Cómo usar Atlas",
      description:         "Guía completa para documentar proyectos nuevos y existentes usando Atlas del Producto.",
      domain:              "Meta / Onboarding",
      criticality:         "high",
      pmOwner:             "Equipo Atlas",
      techOwner:           "Equipo Atlas",
      riskLevel:           "low",
      documentationStatus: "complete",
    },
  });

  const exploreMod = await prisma.module.create({
    data: {
      name:                "Explore — Confiabilidad Operacional",
      description:         "Análisis estadístico de disponibilidad, fallas y eficiencia de activos industriales. Módulo piloto usado como ejemplo en el tutorial.",
      domain:              "Analytics / Operaciones",
      criticality:         "high",
      pmOwner:             "Ana López",
      techOwner:           "Carlos Díaz",
      riskLevel:           "medium",
      documentationStatus: "partial",
    },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // COMPONENTES GLOBALES
  // ══════════════════════════════════════════════════════════════════════════

  // ── Atlas UI ─────────────────────────────────────────────────────────────
  const cModuleForm = await prisma.component.create({
    data: {
      name:     "ModuleForm",
      type:     "form",
      purpose:  "Formulario de creación y edición de módulos con campos de dominio, criticidad, owners y estado de documentación.",
      services: arr(),
    },
  });
  const cFeatureForm = await prisma.component.create({
    data: {
      name:     "FeatureForm",
      type:     "form",
      purpose:  "Formulario rico para crear y editar features: objetivo de negocio, actores, complejidades, reglas y deuda técnica.",
      services: arr(),
    },
  });
  const cFlowSwimlane = await prisma.component.create({
    data: {
      name:     "FlowSwimlane",
      type:     "visualization",
      purpose:  "Swimlane de pasos de flujo dividido en capas: Actor, Pantalla, Componentes, Servicios y Endpoints.",
      services: arr(),
    },
  });
  const cFlowStepForm = await prisma.component.create({
    data: {
      name:     "FlowStepForm",
      type:     "form",
      purpose:  "Formulario inline para agregar y editar pasos de flujo funcional dentro de una feature.",
      services: arr(),
    },
  });
  const cDependencyGraph = await prisma.component.create({
    data: {
      name:     "DependencyGraph",
      type:     "visualization",
      purpose:  "Grafo interactivo de dependencias y relaciones tipadas entre módulos y features del sistema.",
      services: arr(),
    },
  });
  const cKnowledgeGraph = await prisma.component.create({
    data: {
      name:     "KnowledgeGraph",
      type:     "visualization",
      purpose:  "Mapa de conocimiento del equipo: quién conoce qué módulo y detección de bus factor crítico.",
      services: arr(),
    },
  });
  const cHealthScoreCard = await prisma.component.create({
    data: {
      name:     "HealthScoreCard",
      type:     "kpi-card",
      purpose:  "Tarjeta de salud del módulo con score 0-100 calculado por documentación, riesgo y bus factor, e incluye alertas automáticas.",
      services: arr(),
    },
  });
  const cRelationForm = await prisma.component.create({
    data: {
      name:     "RelationForm",
      type:     "form",
      purpose:  "Formulario para crear relaciones tipadas entre entidades: contains, uses, depends_on, calls, owned_by, etc.",
      services: arr(),
    },
  });

  // ── Explore UI ────────────────────────────────────────────────────────────
  const cDateRangePicker = await prisma.component.create({
    data: {
      name:     "DateRangePicker",
      type:     "ui-control",
      purpose:  "Selector de rango de fechas con validación de máximo 90 días. Emite eventos onChange con {dateFrom, dateTo}.",
      services: arr(),
    },
  });
  const cTurnoFilter = await prisma.component.create({
    data: {
      name:     "TurnoFilter",
      type:     "ui-control",
      purpose:  "Filtro de turno de trabajo con opciones Mañana, Tarde y Noche. Permite selección múltiple.",
      services: arr(),
    },
  });
  const cLineSelector = await prisma.component.create({
    data: {
      name:     "LineSelector",
      type:     "ui-control",
      purpose:  "Selector de línea de producción cargado desde el catálogo de activos del módulo.",
      services: arr("AssetService"),
    },
  });
  const cParetoChart = await prisma.component.create({
    data: {
      name:     "ParetoChart",
      type:     "chart",
      purpose:  "Gráfico de barras Pareto ordenado por tiempo de paro acumulado. Incluye línea del 80% y selección por click para drill-down.",
      services: arr("AvailabilityService"),
    },
  });
  const cAssetGrid = await prisma.component.create({
    data: {
      name:     "AssetGrid",
      type:     "data-grid",
      purpose:  "Grilla de activos industriales con columnas de disponibilidad, tiempo de paro y última falla. Soporta ordenamiento y paginación.",
      services: arr("AssetService"),
    },
  });
  const cAssetRankingTable = await prisma.component.create({
    data: {
      name:     "AssetRankingTable",
      type:     "data-grid",
      purpose:  "Tabla de ranking de activos por tiempo de paro acumulado con porcentaje del total y posición en el Pareto.",
      services: arr("AvailabilityService"),
    },
  });
  const cDrillDownPanel = await prisma.component.create({
    data: {
      name:     "DrillDownPanel",
      type:     "panel",
      purpose:  "Panel lateral deslizable con detalle de fallas del activo seleccionado: timeline, MTBF y clasificación por tipo.",
      services: arr("FailureService"),
    },
  });
  const cFallasTimeline = await prisma.component.create({
    data: {
      name:     "FallasTimeline",
      type:     "chart",
      purpose:  "Línea de tiempo de eventos de falla del activo con timestamps, duración y tipo de falla codificado por color.",
      services: arr("FailureService"),
    },
  });
  const cMTBFCard = await prisma.component.create({
    data: {
      name:     "MTBFCard",
      type:     "kpi-card",
      purpose:  "Tarjeta con el MTBF (Mean Time Between Failures) calculado para el activo en el período seleccionado.",
      services: arr("FailureService"),
    },
  });
  const cExportButton = await prisma.component.create({
    data: {
      name:     "ExportButton",
      type:     "ui-control",
      purpose:  "Botón que dispara el proceso de exportación. Muestra estado de carga y abre el diálogo de confirmación.",
      services: arr("ExportService"),
    },
  });
  const cFormatSelector = await prisma.component.create({
    data: {
      name:     "FormatSelector",
      type:     "ui-control",
      purpose:  "Selector de formato de exportación: XLSX (con estilos y fórmulas) o CSV (texto plano).",
      services: arr(),
    },
  });
  const cExportDialog = await prisma.component.create({
    data: {
      name:     "ExportDialog",
      type:     "modal",
      purpose:  "Modal de confirmación con resumen del reporte, selector de formato y botón de generación final.",
      services: arr("ExportService"),
    },
  });
  const cDownloadLink = await prisma.component.create({
    data: {
      name:     "DownloadLink",
      type:     "ui-control",
      purpose:  "Enlace de descarga del archivo generado. Expira a las 24h. Incluye copia al portapapeles.",
      services: arr("ExportService"),
    },
  });
  const cProgressIndicator = await prisma.component.create({
    data: {
      name:     "ProgressIndicator",
      type:     "feedback",
      purpose:  "Indicador de progreso para exportaciones asíncronas. Muestra estado polling hasta recibir la URL de descarga.",
      services: arr("ExportService"),
    },
  });
  const cReportGrid = await prisma.component.create({
    data: {
      name:     "ReportGrid",
      type:     "data-grid",
      purpose:  "Grilla de datos de producción filtrados con columnas configurables, totales por columna y exportación directa.",
      services: arr("ReportService"),
    },
  });
  const cKpiBar = await prisma.component.create({
    data: {
      name:     "KpiBar",
      type:     "kpi-card",
      purpose:  "Barra de KPIs resumen del período: total producido, disponibilidad promedio, horas de paro y OEE.",
      services: arr("ReportService"),
    },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PANTALLAS — Tutorial (scoped al módulo tutorial)
  // ══════════════════════════════════════════════════════════════════════════
  const sDashboard = await prisma.screen.create({
    data: {
      moduleId:   tutorialMod.id,
      name:       "Dashboard",
      route:      "/",
      purpose:    "Panel principal con health scores de todos los módulos, alertas automáticas y acceso rápido a módulos recientes.",
      components: arr("HealthScoreCard", "AlertasBusFactor", "ModuleList"),
    },
  });
  const sModulos = await prisma.screen.create({
    data: {
      moduleId:   tutorialMod.id,
      name:       "Módulos",
      route:      "/modules",
      purpose:    "Lista de todos los módulos del sistema con filtros por dominio, riesgo y estado de documentación.",
      components: arr("ModuleCard", "SearchBar", "Btn Nuevo módulo"),
    },
  });
  const sNuevoModulo = await prisma.screen.create({
    data: {
      moduleId:   tutorialMod.id,
      name:       "Nuevo Módulo",
      route:      "/modules/new",
      purpose:    "Formulario de creación de módulo nuevo con campos de nombre, dominio, criticidad, owners y riesgo.",
      components: arr("ModuleForm", "Btn Guardar"),
    },
  });
  const sModuloDetalle = await prisma.screen.create({
    data: {
      moduleId:   tutorialMod.id,
      name:       "Módulo Detalle",
      route:      "/modules/[id]",
      purpose:    "Vista de un módulo con su health score, lista de features y botón para crear nueva feature.",
      components: arr("HealthScoreCard", "FeatureList", "Btn Nueva feature"),
    },
  });
  const sNuevaFeature = await prisma.screen.create({
    data: {
      moduleId:   tutorialMod.id,
      name:       "Nueva Feature",
      route:      "/features/new",
      purpose:    "Formulario de creación de feature con campos de objetivo de negocio, actores y complejidades.",
      components: arr("FeatureForm", "Btn Guardar"),
    },
  });
  const sFeatureDetalle = await prisma.screen.create({
    data: {
      moduleId:   tutorialMod.id,
      name:       "Feature Detalle",
      route:      "/features/[id]",
      purpose:    "Vista de feature con swimlane de flujo, árbol de pasos y panel de detalle con entidades referenciadas.",
      components: arr("FlowSwimlane", "FlowStepTree", "FeatureDetailPanel"),
    },
  });
  const sFeatureEditar = await prisma.screen.create({
    data: {
      moduleId:   tutorialMod.id,
      name:       "Feature Editar",
      route:      "/features/[id]/edit",
      purpose:    "Formulario de edición completa de feature: todos los campos ricos, reglas de negocio y deuda técnica.",
      components: arr("FeatureForm", "Btn Guardar", "Btn Eliminar"),
    },
  });
  const sNuevaEntidad = await prisma.screen.create({
    data: {
      moduleId:   tutorialMod.id,
      name:       "Nueva Entidad",
      route:      "/entities/new",
      purpose:    "Formulario de creación de entidades del catálogo: Screen, Component, Service o Endpoint.",
      components: arr("EntityTypeSelector", "ScreenForm", "ComponentForm", "ServiceForm", "EndpointForm"),
    },
  });
  const sDependencias = await prisma.screen.create({
    data: {
      moduleId:   tutorialMod.id,
      name:       "Dependencias",
      route:      "/dependencies",
      purpose:    "Grafo interactivo de relaciones tipadas entre módulos y features con panel de detalle y creación de relaciones.",
      components: arr("DependencyGraph", "RelationForm", "RelationDetailPanel"),
    },
  });
  const sConocimiento = await prisma.screen.create({
    data: {
      moduleId:   tutorialMod.id,
      name:       "Conocimiento",
      route:      "/knowledge",
      purpose:    "Mapa de conocimiento del equipo sobre módulos con detección de bus factor crítico y alertas.",
      components: arr("KnowledgeGraph", "MemberPanel"),
    },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PANTALLAS — Explore (scoped al módulo explore)
  // ══════════════════════════════════════════════════════════════════════════
  const sExploreDash = await prisma.screen.create({
    data: {
      moduleId:   exploreMod.id,
      name:       "Dashboard Explore",
      route:      "/explore",
      purpose:    "Panel principal de análisis de confiabilidad. Contiene filtros globales de fecha, turno y línea, y acceso a todos los paneles.",
      components: arr("DateRangePicker", "TurnoFilter", "LineSelector", "AssetGrid", "KpiBar"),
    },
  });
  const sPanelPareto = await prisma.screen.create({
    data: {
      moduleId:   exploreMod.id,
      name:       "Panel Pareto",
      route:      "/explore/pareto",
      purpose:    "Visualización Pareto de activos ordenados por tiempo de paro acumulado con línea del 80% y drill-down por click.",
      components: arr("ParetoChart", "AssetRankingTable", "DrillDownPanel", "FallasTimeline", "MTBFCard"),
    },
  });
  const sPanelFallas = await prisma.screen.create({
    data: {
      moduleId:   exploreMod.id,
      name:       "Panel Fallas",
      route:      "/explore/failures",
      purpose:    "Listado cronológico de eventos de falla filtrable por activo, tipo y período. Incluye botón de exportación.",
      components: arr("FallasTimeline", "ExportButton", "FormatSelector"),
    },
  });
  const sPanelDetalleActivo = await prisma.screen.create({
    data: {
      moduleId:   exploreMod.id,
      name:       "Panel Detalle Activo",
      route:      "/explore/assets/[id]",
      purpose:    "Vista completa de un activo industrial: disponibilidad histórica, eventos de falla, MTBF y tendencias.",
      components: arr("MTBFCard", "FallasTimeline", "AssetGrid"),
    },
  });
  const sExportDialogScreen = await prisma.screen.create({
    data: {
      moduleId:   exploreMod.id,
      name:       "Export Dialog",
      route:      "/explore/export",
      purpose:    "Modal de exportación con resumen del reporte, opciones de formato y confirmación antes de generar el archivo.",
      components: arr("ExportDialog", "FormatSelector", "DownloadLink", "ProgressIndicator"),
    },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SERVICIOS — Explore (scoped al módulo explore)
  // (Tutorial usa Server Actions de Next.js — no tiene servicios frontend)
  // ══════════════════════════════════════════════════════════════════════════
  const svAsset = await prisma.service.create({
    data: {
      moduleId:  exploreMod.id,
      name:      "AssetService",
      purpose:   "Recupera activos industriales con métricas de disponibilidad, último estado y datos de línea.",
      endpoints: arr("GET /assets", "GET /assets/availability"),
    },
  });
  const svAvailability = await prisma.service.create({
    data: {
      moduleId:  exploreMod.id,
      name:      "AvailabilityService",
      purpose:   "Calcula disponibilidad y tiempo de paro acumulado por activo y período. Genera datos del Pareto.",
      endpoints: arr("GET /assets/pareto", "GET /assets/availability"),
    },
  });
  const svFailure = await prisma.service.create({
    data: {
      moduleId:  exploreMod.id,
      name:      "FailureService",
      purpose:   "Gestiona eventos de falla: registro, consulta filtrada por activo y período, y cálculo de MTBF.",
      endpoints: arr("GET /assets/{id}/failures"),
    },
  });
  const svExport = await prisma.service.create({
    data: {
      moduleId:  exploreMod.id,
      name:      "ExportService",
      purpose:   "Genera archivos exportables en XLSX o CSV y retorna una URL de descarga con TTL de 24 horas.",
      endpoints: arr("POST /reports/export"),
    },
  });
  const svReport = await prisma.service.create({
    data: {
      moduleId:  exploreMod.id,
      name:      "ReportService",
      purpose:   "Agrega y entrega datos de producción filtrados por fecha, línea y turno. Soporta paginación.",
      endpoints: arr("GET /reports"),
    },
  });

  // Servicio GLOBAL (sin módulo) — compartido por ambos módulos
  const svAuth = await prisma.service.create({
    data: {
      moduleId:  null,
      name:      "AuthService",
      purpose:   "Verifica sesión de usuario y permisos de acceso. Compartido por todos los módulos del sistema.",
      endpoints: arr("GET /auth/me", "POST /auth/refresh"),
    },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ENDPOINTS — Globales
  // ══════════════════════════════════════════════════════════════════════════
  const epGetAssets = await prisma.endpoint.create({
    data: {
      method:          "GET",
      path:            "/assets",
      purpose:         "Lista activos industriales filtrados por fecha, turno y línea de producción.",
      requestEntities: arr("dateFrom", "dateTo", "turno", "lineId"),
      responseEntities: arr("Asset[]"),
    },
  });
  const epGetPareto = await prisma.endpoint.create({
    data: {
      method:          "GET",
      path:            "/assets/pareto",
      purpose:         "Calcula el ranking Pareto de activos por tiempo de paro acumulado en el período.",
      requestEntities: arr("assets[]", "dateRange", "turno"),
      responseEntities: arr("ParetoData[]"),
    },
  });
  const epGetAvailability = await prisma.endpoint.create({
    data: {
      method:          "GET",
      path:            "/assets/availability",
      purpose:         "Devuelve métricas de disponibilidad de activos agrupadas por período.",
      requestEntities: arr("assetId", "dateFrom", "dateTo"),
      responseEntities: arr("AvailabilityRecord[]"),
    },
  });
  const epGetFailures = await prisma.endpoint.create({
    data: {
      method:          "GET",
      path:            "/assets/{id}/failures",
      purpose:         "Lista eventos de falla de un activo con timestamps, duración y tipo de falla.",
      requestEntities: arr("assetId", "dateFrom", "dateTo"),
      responseEntities: arr("FailureEvent[]"),
    },
  });
  const epPostExport = await prisma.endpoint.create({
    data: {
      method:          "POST",
      path:            "/reports/export",
      purpose:         "Genera un reporte exportable en XLSX o CSV y retorna la URL de descarga con TTL 24h.",
      requestEntities: arr("filters", "format", "includePareto"),
      responseEntities: arr("ExportJob { url, expiresAt }"),
    },
  });
  const epGetReports = await prisma.endpoint.create({
    data: {
      method:          "GET",
      path:            "/reports",
      purpose:         "Lista datos de producción filtrados por fecha, línea y turno con paginación.",
      requestEntities: arr("dateFrom", "dateTo", "lineId", "turno", "page"),
      responseEntities: arr("ReportData[]", "PaginationMeta"),
    },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // FEATURE 1 — Orden de uso recomendado (Tutorial)
  // ══════════════════════════════════════════════════════════════════════════
  const f1 = await prisma.feature.create({
    data: {
      moduleId:            tutorialMod.id,
      name:                "Orden de uso recomendado",
      description:         "Secuencia óptima para documentar un módulo en Atlas de principio a fin.",
      businessGoal:        "Que cualquier persona pueda documentar un módulo completo en menos de 30 minutos sin cometer errores de orden.",
      actors:              arr("PM", "Dev", "Tech Lead"),
      screens:             arr("Dashboard", "Módulos", "Entidades", "Feature Detalle", "Dependencias"),
      components:          arr("ModuleForm", "FeatureForm", "FlowSwimlane", "DependencyGraph"),
      services:            arr(),
      endpoints:           arr(),
      entities:            arr("Module", "Feature", "FlowStep", "Relation"),
      businessRules:       arr(
        "Crear el Módulo antes que cualquier Feature — las features requieren módulo padre",
        "Registrar entidades técnicas antes de referenciarlas en los pasos de flujo",
        "Documentar el flujo dentro de cada feature, no como documento separado",
        "Crear relaciones en /dependencies solo después de tener módulos y features creados",
        "El health score se actualiza automáticamente — revisarlo en Dashboard como paso final",
      ),
      dependencies:        arr(),
      technicalComplexity: "low",
      businessComplexity:  "medium",
      riskLevel:           "low",
      busFactor:           3,
      pmOwner:             "Equipo Atlas",
      techOwner:           "Equipo Atlas",
      techDebt:            arr(),
      documentationStatus: "complete",
    },
  });

  const flow1 = await prisma.flow.create({ data: { featureId: f1.id } });
  await prisma.flowStep.createMany({
    data: [
      {
        flowId:             flow1.id,
        order:              1,
        actor:              "PM / Tech Lead",
        screen:             sNuevoModulo.id,
        action:             "Inicia sesión y accede a Atlas con permisos de edición",
        services:           jids(svAuth),
        components:         jids(cModuleForm),
        responseComponents: null,
      },
      {
        flowId:             flow1.id,
        order:              2,
        actor:              "Dev",
        screen:             sNuevaEntidad.id,
        action:             "Registra las pantallas, servicios y endpoints que usa el módulo en el catálogo de entidades",
        components:         null,
        responseComponents: null,
      },
      {
        flowId:             flow1.id,
        order:              3,
        actor:              "PM / Dev",
        screen:             sNuevaFeature.id,
        action:             "Crea cada feature con objetivo de negocio, actores y complejidad estimada",
        components:         jids(cFeatureForm),
        responseComponents: null,
      },
      {
        flowId:             flow1.id,
        order:              4,
        actor:              "Dev",
        screen:             sFeatureDetalle.id,
        action:             "Documenta el flujo funcional: actor, pantalla, componentes, servicio y endpoint por paso",
        components:         jids(cFlowStepForm),
        responseComponents: jids(cFlowSwimlane),
      },
      {
        flowId:             flow1.id,
        order:              5,
        actor:              "Dev / Tech Lead",
        screen:             sDependencias.id,
        action:             "Vincula módulos y features con relaciones tipadas (uses, depends_on, contains…)",
        components:         jids(cRelationForm),
        responseComponents: jids(cDependencyGraph),
      },
      {
        flowId:             flow1.id,
        order:              6,
        actor:              "PM",
        screen:             sDashboard.id,
        action:             "Revisa el health score y las alertas generadas automáticamente",
        components:         jids(cHealthScoreCard),
        responseComponents: null,
      },
    ],
  });

  // ══════════════════════════════════════════════════════════════════════════
  // FEATURE 2 — Documentar proyecto nuevo (Tutorial)
  // ══════════════════════════════════════════════════════════════════════════
  const f2 = await prisma.feature.create({
    data: {
      moduleId:            tutorialMod.id,
      name:                "Documentar proyecto nuevo",
      description:         "Cómo usar Atlas cuando el proyecto está empezando — documentar en paralelo al desarrollo.",
      businessGoal:        "Que la documentación crezca junto al código sin generar overhead, evitando la deuda documental desde el inicio.",
      actors:              arr("Dev", "Tech Lead", "PM"),
      screens:             arr("Módulos", "Features", "Feature Editar", "Feature Detalle"),
      components:          arr("ModuleForm", "FeatureForm", "FlowSwimlane"),
      services:            arr(),
      endpoints:           arr(),
      entities:            arr("Module", "Feature", "FlowStep"),
      businessRules:       arr(
        "Crear el módulo antes de escribir la primera línea de código",
        "Crear la feature al abrir la rama de git — no al terminar",
        "Completar el flujo funcional antes del code review, no después",
        "Actualizar documentationStatus en cada fase: none → partial → complete",
      ),
      dependencies:        arr("Orden de uso recomendado"),
      technicalComplexity: "low",
      businessComplexity:  "low",
      riskLevel:           "low",
      busFactor:           3,
      pmOwner:             "Equipo Atlas",
      techOwner:           "Equipo Atlas",
      techDebt:            arr(),
      documentationStatus: "complete",
    },
  });

  const flow2 = await prisma.flow.create({ data: { featureId: f2.id } });
  await prisma.flowStep.createMany({
    data: [
      {
        flowId:             flow2.id,
        order:              1,
        actor:              "Tech Lead",
        screen:             sNuevoModulo.id,
        action:             "Define la arquitectura del sistema como módulos antes de escribir código",
        components:         jids(cModuleForm),
        responseComponents: null,
      },
      {
        flowId:             flow2.id,
        order:              2,
        actor:              "Dev",
        screen:             sNuevaFeature.id,
        action:             "Crea la feature al abrir la rama — completa al menos nombre, objetivo y complejidad estimada",
        components:         jids(cFeatureForm),
        responseComponents: null,
      },
      {
        flowId:             flow2.id,
        order:              3,
        actor:              "Dev",
        screen:             sFeatureEditar.id,
        action:             "Completa actores, pantallas, servicios y endpoints a medida que los implementa",
        components:         jids(cFeatureForm),
        responseComponents: null,
      },
      {
        flowId:             flow2.id,
        order:              4,
        actor:              "Dev",
        screen:             sFeatureDetalle.id,
        action:             "Agrega el flujo funcional paso a paso antes de abrir el PR",
        components:         jids(cFlowStepForm),
        responseComponents: jids(cFlowSwimlane),
      },
      {
        flowId:             flow2.id,
        order:              5,
        actor:              "Tech Lead",
        screen:             sFeatureDetalle.id,
        action:             "Valida en code review que la documentación coincide con la implementación real",
        components:         jids(cFlowSwimlane),
        responseComponents: null,
      },
    ],
  });

  // ══════════════════════════════════════════════════════════════════════════
  // FEATURE 3 — Documentar proyecto existente (Tutorial)
  // ══════════════════════════════════════════════════════════════════════════
  const f3 = await prisma.feature.create({
    data: {
      moduleId:            tutorialMod.id,
      name:                "Documentar proyecto existente",
      description:         "Arqueología inversa: mapear un sistema que ya existe pero no tiene documentación.",
      businessGoal:        "Reducir el tiempo de análisis de impacto y el riesgo de cambios en sistemas legacy sin documentar.",
      actors:              arr("Dev Senior", "Tech Lead", "PM"),
      screens:             arr("Dashboard", "Conocimiento", "Módulos", "Feature Detalle", "Dependencias"),
      components:          arr("KnowledgeGraph", "DependencyGraph", "HealthScoreCard"),
      services:            arr(),
      endpoints:           arr(),
      entities:            arr("Module", "Feature", "Relation"),
      businessRules:       arr(
        "Empezar por los módulos más críticos o con mayor probabilidad de cambio próximo",
        "Entrevistar a devs senior antes de documentar — ellos son la fuente primaria",
        "Marcar todo como partial al inicio — mejor documentación imprecisa que ninguna",
        "Priorizar features con bus factor 1 — son el mayor riesgo operacional",
        "Usar el Mapa de conocimiento para identificar los cuellos de botella antes de documentar",
      ),
      dependencies:        arr("Orden de uso recomendado"),
      technicalComplexity: "medium",
      businessComplexity:  "high",
      riskLevel:           "medium",
      busFactor:           2,
      pmOwner:             "Equipo Atlas",
      techOwner:           "Equipo Atlas",
      techDebt:            arr("La arqueología es lenta — considerar sesiones de mob documentation con los expertos del sistema"),
      documentationStatus: "complete",
    },
  });

  const flow3 = await prisma.flow.create({ data: { featureId: f3.id } });
  await prisma.flowStep.createMany({
    data: [
      {
        flowId:             flow3.id,
        order:              1,
        actor:              "PM / Tech Lead",
        screen:             sDashboard.id,
        action:             "Identifica módulos con health score bajo o riesgo alto para priorizar la documentación",
        components:         jids(cHealthScoreCard),
        responseComponents: null,
      },
      {
        flowId:             flow3.id,
        order:              2,
        actor:              "Tech Lead",
        screen:             sConocimiento.id,
        action:             "Mapea quién conoce qué módulo para detectar cuellos de botella de bus factor",
        components:         jids(cKnowledgeGraph),
        responseComponents: null,
      },
      {
        flowId:             flow3.id,
        order:              3,
        actor:              "Dev Senior",
        screen:             sNuevoModulo.id,
        action:             "Crea los módulos del sistema con criticality: high y riskLevel estimado desde el código",
        components:         jids(cModuleForm),
        responseComponents: null,
      },
      {
        flowId:             flow3.id,
        order:              4,
        actor:              "Dev Senior",
        screen:             sFeatureDetalle.id,
        action:             "Documenta el flujo de la feature más crítica directamente desde el código fuente",
        components:         jids(cFlowStepForm),
        responseComponents: jids(cFlowSwimlane),
      },
      {
        flowId:             flow3.id,
        order:              5,
        actor:              "PM",
        screen:             sDashboard.id,
        action:             "Revisa el health score actualizado para repriorizar el backlog de documentación",
        components:         jids(cHealthScoreCard),
        responseComponents: null,
      },
      {
        flowId:             flow3.id,
        order:              6,
        actor:              "Tech Lead",
        screen:             sDependencias.id,
        action:             "Mapea relaciones entre módulos para visualizar caminos críticos de cambio",
        components:         jids(cRelationForm, cDependencyGraph),
        responseComponents: jids(cDependencyGraph),
      },
    ],
  });

  // ══════════════════════════════════════════════════════════════════════════
  // FEATURE 4 — Confusiones comunes al usar Atlas (Tutorial)
  // ══════════════════════════════════════════════════════════════════════════
  const f4 = await prisma.feature.create({
    data: {
      moduleId:            tutorialMod.id,
      name:                "Confusiones comunes al usar Atlas",
      description:         "Los 5 errores más frecuentes al usar Atlas por primera vez y cómo evitarlos.",
      businessGoal:        "Reducir la fricción de onboarding y los re-trabajos más comunes en documentación.",
      actors:              arr("Dev nuevo", "PM sin contexto técnico"),
      screens:             arr("Módulos", "Nueva feature", "Dependencias", "Feature Detalle"),
      components:          arr("ModuleForm", "FeatureForm", "RelationForm", "FlowSwimlane"),
      services:            arr(),
      endpoints:           arr(),
      entities:            arr("Module", "Feature", "Relation", "FlowStep"),
      businessRules:       arr(
        "ERROR 1: Crear Feature sin Módulo — ir a /modules/new primero",
        "ERROR 2: Relación apuntando a ID inexistente — verificar que ambos nodos existen",
        "ERROR 3: Flow sin FlowSteps — agregar al menos un paso con Acción",
        "ERROR 4: Confundir campo Acción con nombre de entidad — Acción es texto libre descriptivo",
        "ERROR 5: No vincular Servicio + Endpoint — sin estos el swimlane no muestra la capa backend",
      ),
      dependencies:        arr("Orden de uso recomendado"),
      technicalComplexity: "low",
      businessComplexity:  "high",
      riskLevel:           "low",
      busFactor:           3,
      pmOwner:             "Equipo Atlas",
      techOwner:           "Equipo Atlas",
      techDebt:            arr(
        "Falta validación en formularios — no avisa si faltan campos críticos",
        "No hay feedback visual cuando una relación apunta a un nodo inexistente",
      ),
      documentationStatus: "complete",
    },
  });

  const flow4 = await prisma.flow.create({ data: { featureId: f4.id } });
  await prisma.flowStep.createMany({
    data: [
      {
        flowId:             flow4.id,
        order:              1,
        actor:              "Dev nuevo",
        screen:             sModulos.id,
        action:             "Verifica que existe al menos un módulo antes de intentar crear una feature",
        components:         null,
        responseComponents: null,
      },
      {
        flowId:             flow4.id,
        order:              2,
        actor:              "Dev nuevo",
        screen:             sFeatureDetalle.id,
        action:             "Completa el campo Acción con texto descriptivo ('Aplica filtros de fecha'), no con un nombre de entidad",
        components:         jids(cFlowStepForm),
        responseComponents: null,
      },
      {
        flowId:             flow4.id,
        order:              3,
        actor:              "Dev nuevo",
        screen:             sFeatureDetalle.id,
        action:             "Vincula Servicio + Endpoint en el paso para mostrar la capa backend en el swimlane",
        components:         jids(cFlowStepForm),
        responseComponents: jids(cFlowSwimlane),
      },
      {
        flowId:             flow4.id,
        order:              4,
        actor:              "Dev nuevo",
        screen:             sDependencias.id,
        action:             "Confirma que el módulo y la feature destino existen antes de crear la relación",
        components:         jids(cRelationForm),
        responseComponents: jids(cDependencyGraph),
      },
      {
        flowId:             flow4.id,
        order:              5,
        actor:              "Dev nuevo",
        screen:             sFeatureDetalle.id,
        action:             "Si el swimlane no refleja los datos guardados, refresca la página para resincronizar con la DB",
        components:         jids(cFlowSwimlane),
        responseComponents: null,
      },
    ],
  });

  // ══════════════════════════════════════════════════════════════════════════
  // FEATURE 5 — Análisis de disponibilidad por Pareto (Explore)
  // ══════════════════════════════════════════════════════════════════════════
  const f5 = await prisma.feature.create({
    data: {
      moduleId:            exploreMod.id,
      name:                "Análisis de disponibilidad por Pareto",
      description:         "Visualización de activos industriales ordenados por tiempo de paro acumulado. Identifica el 20% de activos que causan el 80% de las fallas.",
      businessGoal:        "Reducir el tiempo de identificación de activos críticos de 4 horas de análisis manual a menos de 5 minutos.",
      actors:              arr("Supervisor de planta", "Jefe de mantenimiento"),
      screens:             arr("Dashboard Explore", "Panel Pareto", "Panel Fallas", "Panel Detalle Activo"),
      components:          arr("ParetoChart", "AssetGrid", "DateRangePicker", "TurnoFilter", "DrillDownPanel"),
      services:            arr("AssetService", "AvailabilityService", "FailureService", "ExportService"),
      endpoints:           arr("GET /assets", "GET /assets/pareto", "GET /assets/{id}/failures", "POST /reports/export"),
      entities:            arr("Asset", "AvailabilityRecord", "FailureEvent", "Turno", "FilterParams"),
      businessRules:       arr(
        "Solo usuarios con rol Supervisor o Jefe pueden acceder al módulo Explore",
        "Rango máximo de análisis: 90 días — rangos mayores degradan el rendimiento",
        "El Pareto se calcula sobre tiempo de paro total, no número de fallas",
        "El drill-down de fallas requiere que el activo tenga al menos un FailureEvent registrado",
        "Los datos se actualizan cada 15 minutos desde el SCADA",
      ),
      dependencies:        arr("Módulo de autenticación", "Módulo SCADA Integration"),
      technicalComplexity: "high",
      businessComplexity:  "high",
      riskLevel:           "medium",
      busFactor:           2,
      pmOwner:             "Ana López",
      techOwner:           "Carlos Díaz",
      techDebt:            arr(
        "GET /assets/pareto no pagina — timeout en plantas con más de 500 activos",
        "DateRangePicker no valida el rango máximo en cliente — solo en servidor",
        "Falta caché en AvailabilityService — cada filtro recalcula desde cero",
      ),
      documentationStatus: "partial",
    },
  });

  const flow5 = await prisma.flow.create({ data: { featureId: f5.id } });
  await prisma.flowStep.createMany({
    data: [
      {
        flowId:             flow5.id,
        order:              1,
        actor:              "Supervisor de planta",
        screen:             sExploreDash.id,
        action:             "Accede al módulo Explore con credenciales verificadas y selecciona filtros de análisis",
        components:         jids(cDateRangePicker, cTurnoFilter, cLineSelector),
        services:           jids(svAuth, svAsset),
        endpoints:          jids(epGetAssets),
        responseComponents: jids(cAssetGrid),
      },
      {
        flowId:             flow5.id,
        order:              2,
        actor:              "Supervisor de planta",
        screen:             sPanelPareto.id,
        action:             "Genera el gráfico Pareto ordenado por tiempo de paro acumulado",
        components:         null,
        services:           jids(svAvailability),
        endpoints:          jids(epGetPareto),
        responseComponents: jids(cParetoChart, cAssetRankingTable),
      },
      {
        flowId:             flow5.id,
        order:              3,
        actor:              "Supervisor de planta",
        screen:             sPanelPareto.id,
        action:             "Hace click en el activo con mayor tiempo de paro para ver el detalle de fallas",
        components:         jids(cParetoChart),
        services:           jids(svFailure),
        endpoints:          jids(epGetFailures),
        responseComponents: jids(cDrillDownPanel, cFallasTimeline, cMTBFCard),
      },
      {
        flowId:             flow5.id,
        order:              4,
        actor:              "Jefe de mantenimiento",
        screen:             sPanelFallas.id,
        action:             "Exporta el análisis completo para presentar en reunión de mantenimiento",
        components:         jids(cExportButton, cFormatSelector),
        services:           jids(svExport),
        endpoints:          jids(epPostExport),
        responseComponents: jids(cDownloadLink),
      },
    ],
  });

  // ══════════════════════════════════════════════════════════════════════════
  // FEATURE 6 — Exportar reporte de producción (Explore)
  // ══════════════════════════════════════════════════════════════════════════
  const f6 = await prisma.feature.create({
    data: {
      moduleId:            exploreMod.id,
      name:                "Exportar reporte de producción",
      description:         "Genera y descarga un reporte de producción filtrado por fecha y línea, en formato XLSX o CSV.",
      businessGoal:        "Reducir el tiempo de generación de reportes manuales de 2 horas a menos de 5 minutos.",
      actors:              arr("Supervisor", "Jefe de planta"),
      screens:             arr("Dashboard Explore", "Export Dialog"),
      components:          arr("ReportGrid", "ExportButton", "DateRangePicker", "FormatSelector", "ExportDialog"),
      services:            arr("ReportService", "ExportService"),
      endpoints:           arr("GET /reports", "POST /reports/export"),
      entities:            arr("ReportData", "ExportConfig", "FilterParams", "ExportJob"),
      businessRules:       arr(
        "Solo usuarios con rol Supervisor pueden exportar reportes",
        "Rango máximo de exportación: 90 días — evita timeouts en el servidor",
        "Rangos mayores a 30 días generan el archivo en background con notificación",
        "Formatos soportados: XLSX (con estilos) y CSV (sin estilos)",
        "El archivo expira 24 horas después de generado — no se almacena permanentemente",
      ),
      dependencies:        arr("Módulo de autenticación"),
      technicalComplexity: "medium",
      businessComplexity:  "high",
      riskLevel:           "medium",
      busFactor:           2,
      pmOwner:             "Ana López",
      techOwner:           "Carlos Díaz",
      techDebt:            arr(
        "Falta paginación en GET /reports — timeout en rangos mayores a 60 días",
        "ExportButton no muestra progreso para exportaciones asíncronas",
        "No hay validación del rango máximo en el cliente — solo en servidor",
      ),
      documentationStatus: "partial",
    },
  });

  const flow6 = await prisma.flow.create({ data: { featureId: f6.id } });
  await prisma.flowStep.createMany({
    data: [
      {
        flowId:             flow6.id,
        order:              1,
        actor:              "Supervisor",
        screen:             sExploreDash.id,
        action:             "Selecciona filtros de fecha, línea y turno para acotar el reporte",
        components:         jids(cDateRangePicker, cLineSelector, cTurnoFilter),
        services:           null,
        endpoints:          null,
        responseComponents: null,
      },
      {
        flowId:             flow6.id,
        order:              2,
        actor:              "Supervisor",
        screen:             sExploreDash.id,
        action:             "Solicita los datos del reporte con los filtros aplicados",
        components:         null,
        services:           jids(svReport),
        endpoints:          jids(epGetReports),
        responseComponents: jids(cReportGrid, cKpiBar),
      },
      {
        flowId:             flow6.id,
        order:              3,
        actor:              "Supervisor",
        screen:             sExploreDash.id,
        action:             "Revisa la grilla con los datos y selecciona el formato de exportación",
        components:         jids(cReportGrid, cFormatSelector),
        services:           null,
        endpoints:          null,
        responseComponents: jids(cExportButton),
      },
      {
        flowId:             flow6.id,
        order:              4,
        actor:              "Supervisor",
        screen:             sExportDialogScreen.id,
        action:             "Confirma la exportación y descarga el archivo generado",
        components:         jids(cExportDialog),
        services:           jids(svExport),
        endpoints:          jids(epPostExport),
        responseComponents: jids(cDownloadLink, cProgressIndicator),
      },
    ],
  });

  // ══════════════════════════════════════════════════════════════════════════
  // RELACIONES
  // ══════════════════════════════════════════════════════════════════════════
  await prisma.relation.createMany({
    data: [
      // Tutorial contiene sus features
      { fromType: "module",  fromId: tutorialMod.id, relationType: "contains", toType: "feature", toId: f1.id },
      { fromType: "module",  fromId: tutorialMod.id, relationType: "contains", toType: "feature", toId: f2.id },
      { fromType: "module",  fromId: tutorialMod.id, relationType: "contains", toType: "feature", toId: f3.id },
      { fromType: "module",  fromId: tutorialMod.id, relationType: "contains", toType: "feature", toId: f4.id },
      // Explore contiene sus features
      { fromType: "module",  fromId: exploreMod.id,  relationType: "contains", toType: "feature", toId: f5.id },
      { fromType: "module",  fromId: exploreMod.id,  relationType: "contains", toType: "feature", toId: f6.id },
      // Features del tutorial dependen del orden de uso
      { fromType: "feature", fromId: f2.id, relationType: "depends_on", toType: "feature", toId: f1.id },
      { fromType: "feature", fromId: f3.id, relationType: "depends_on", toType: "feature", toId: f1.id },
      { fromType: "feature", fromId: f4.id, relationType: "depends_on", toType: "feature", toId: f1.id },
      // El tutorial usa Explore como módulo de ejemplo
      { fromType: "module",  fromId: tutorialMod.id, relationType: "uses", toType: "module", toId: exploreMod.id },
      // Exportar reportes depende del análisis Pareto
      { fromType: "feature", fromId: f6.id, relationType: "depends_on", toType: "feature", toId: f5.id },
    ],
  });

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log("\n✅ Seed completado:\n");
  console.log("  📦 2 módulos");
  console.log("       Tutorial — Cómo usar Atlas");
  console.log("       Explore — Confiabilidad Operacional");
  console.log("");
  console.log("  🖥  15 pantallas");
  console.log("       Tutorial (10): Dashboard, Módulos, Nuevo Módulo, Módulo Detalle,");
  console.log("                      Nueva Feature, Feature Detalle, Feature Editar,");
  console.log("                      Nueva Entidad, Dependencias, Conocimiento");
  console.log("       Explore  (5): Dashboard Explore, Panel Pareto, Panel Fallas,");
  console.log("                      Panel Detalle Activo, Export Dialog");
  console.log("");
  console.log("  🧩 24 componentes globales");
  console.log("       Atlas UI (8): ModuleForm, FeatureForm, FlowSwimlane, FlowStepForm,");
  console.log("                     DependencyGraph, KnowledgeGraph, HealthScoreCard, RelationForm");
  console.log("       Explore (16): DateRangePicker, TurnoFilter, LineSelector, ParetoChart,");
  console.log("                     AssetGrid, AssetRankingTable, DrillDownPanel, FallasTimeline,");
  console.log("                     MTBFCard, ExportButton, FormatSelector, ExportDialog,");
  console.log("                     DownloadLink, ProgressIndicator, ReportGrid, KpiBar");
  console.log("");
  console.log("  ⚙️  6 servicios (5 Explore + 1 global compartido)");
  console.log("       AssetService, AvailabilityService, FailureService, ExportService, ReportService");
  console.log("       AuthService (global — compartido por Tutorial y Explore)");
  console.log("");
  console.log("  🔌 6 endpoints globales");
  console.log("       GET  /assets                 GET  /assets/pareto");
  console.log("       GET  /assets/availability    GET  /assets/{id}/failures");
  console.log("       POST /reports/export         GET  /reports");
  console.log("");
  console.log("  🧩 6 features con flujos");
  console.log("       Tutorial: Orden de uso (6 pasos) · Proyecto nuevo (5) · Proyecto existente (6) · Confusiones (5)");
  console.log("       Explore:  Análisis Pareto (4 pasos) · Exportar reporte (4 pasos)");
  console.log("");
  console.log("  🔗 11 relaciones entre módulos y features");
  console.log("");
  console.log("  ⚡ Todos los FlowSteps referencian IDs reales del catálogo.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
