# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es Atlas

Atlas es un **sistema de gestión de conocimiento de producto** — un mapa vivo del software. Permite a equipos documentar, visualizar y entender sistemas complejos mapeando módulos, funcionalidades, flujos, dependencias y arquitecturas técnicas. La interfaz está en español.

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) con React 19 |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS 4 |
| Grafos | @xyflow/react (React Flow) |
| ORM | Prisma 6 con SQLite (`prisma/dev.db`) |
| Runtime extras | React Compiler (babel plugin) |

## Comandos esenciales

```bash
npm run dev      # Servidor de desarrollo en localhost:3000
npm run build    # Build de producción
npm run lint     # ESLint
npx prisma migrate dev   # Aplicar migraciones
npx prisma generate      # Regenerar cliente tras cambios en schema.prisma
npx prisma studio        # GUI de la base de datos
npx tsx prisma/seed.ts   # Sembrar datos de prueba
```

## Arquitectura del proyecto

```
src/
├── app/
│   ├── page.tsx                  # Dashboard con awareness scores
│   ├── layout.tsx                # Layout raíz + navegación (#main-nav)
│   ├── api/
│   │   ├── search/route.ts       # Búsqueda global (módulos, features, screens…)
│   │   ├── stats/route.ts        # Estadísticas del dashboard
│   │   ├── export/route.ts       # Exportar como Markdown
│   │   ├── dependencies/route.ts
│   │   ├── features/route.ts
│   │   └── modules/route.ts
│   ├── modules/                  # CRUD de módulos
│   ├── features/                 # CRUD de features
│   ├── entities/                 # CRUD de entidades
│   ├── dependencies/page.tsx     # Grafo de dependencias visual
│   └── knowledge/page.tsx        # Grafo de conocimiento del equipo
├── components/
│   ├── ThreePanelLayout.tsx      # Shell de 3 columnas (lista | grafo | detalle)
│   ├── FlowVisualizer.tsx        # Vista Mapa: canvas React Flow con nodos tipados
│   ├── FlowSwimlane.tsx          # Vista Tabla: grid swimlane por tipo de entidad
│   ├── FlowEditor.tsx            # Editor de pasos en lista (drag-to-reorder)
│   ├── DependencyGraph.tsx       # Grafo de dependencias
│   ├── KnowledgeGraph.tsx        # Mapa de conocimiento del equipo
│   ├── CommandPalette.tsx        # Paleta de comandos (navegación rápida)
│   ├── HealthScoreCard.tsx       # Tarjeta de salud del módulo
│   ├── feature/
│   │   ├── FeatureGraphView.tsx  # Orquestador: toggle Mapa/Tabla + ThreePanelLayout
│   │   ├── FeatureDetailPanel.tsx# Panel derecho: edición de paso + entidades
│   │   ├── FlowStepTree.tsx      # Panel izquierdo: lista de pasos
│   │   └── EntityCard.tsx        # Chip de entidad con edición inline sin navegación
│   ├── dependencies/             # Árbol y panel de detalle de dependencias
│   ├── knowledge/                # Árbol y panel de detalle de conocimiento
│   ├── flow/
│   │   ├── FlowNodeBase.tsx      # Nodo base compartido (handles + labels siempre visibles)
│   │   ├── FlowNodeActor.tsx     # Nodo Actor (1 source derecha)
│   │   ├── FlowNodeScreen.tsx    # Nodo Pantalla (1 target izq, 1 source der)
│   │   ├── FlowNodeComponent.tsx # Nodo Componente UI (1 target izq, 1 source + 1 target der)
│   │   ├── FlowNodeService.tsx   # Nodo Servicio (2 handles izq, 2 handles der)
│   │   ├── FlowNodeEndpoint.tsx  # Nodo Endpoint (2 handles izq)
│   │   ├── FlowEdgeDeletable.tsx # Edge con botón × al seleccionar
│   │   └── NodeCreatorDropdown.tsx # Dropdown al soltar en canvas vacío
│   └── ui/                       # Primitivos: Modal, FormField, SubmitButton, DeleteButton
├── lib/
│   ├── prisma.ts                 # Singleton del cliente Prisma
│   ├── healthScore.ts            # Algoritmo de awareness score (0-100)
│   ├── flowDomain.ts             # Validación y estilos de flujos (legacy)
│   └── actions/
│       ├── flows.ts              # Server Actions: flow, flowStep, saveFlowGraph
│       ├── entities.ts           # Server Actions CRUD + patch* inline (sin redirect)
│       ├── modules.ts
│       └── relations.ts
├── hooks/
│   ├── useFlowState.ts           # Estado del editor (undo/redo) — legacy
│   ├── useEdgeHighlight.ts
│   └── useNodeHighlight.ts
└── types/
    └── types.ts                  # Tipos TypeScript compartidos
```

## Modelos de datos (Prisma)

- **Module** — servicio/módulo de software. Tiene `domain`, `criticality`, `riskLevel`, `documentationStatus`, `pmOwner`, `techOwner`.
- **Feature** — funcionalidad dentro de un módulo. Campos ricos: `businessGoal`, `actors`, `businessRules`, `techDebt`, `busFactor`, complejidades técnica y de negocio.
- **Flow** — flujo visual de usuario. Contiene `graphJson` (layout serializado de React Flow) y `steps[]`.
- **FlowStep** — paso individual: `actor` (texto libre), `screen` (ID), `action`, `components` (JSON ID[]), `services` (JSON ID[]), `endpoints` (JSON ID[]), `responseComponents` (JSON ID[]).
- **Screen** — pantalla de UI asociada a un módulo.
- **Component** — componente de UI con su tipo y propósito.
- **Service** — servicio de backend con sus endpoints.
- **Endpoint** — endpoint de API (`path`, `method`, `requestEntities`, `responseEntities`).
- **Relation** — relación genérica entre cualquier entidad (`fromType`, `fromId`, `relationType`, `toType`, `toId`).

## Awareness Score (0-100)

El algoritmo en `src/lib/healthScore.ts` calcula:

| Componente | Peso | Criterio |
|------------|------|---------|
| Documentación | 40 pts | Estado del módulo (30%) + promedio features (70%) |
| Riesgo | 30 pts | Riesgo del módulo (30%) + promedio features (70%) |
| Bus Factor | 30 pts | Promedio bus factor features (máx 3) |

Genera alertas automáticas si documentación < 20 pts, features de alto riesgo, o bus factor crítico.

## Vistas de flujo (Feature)

Cada feature tiene dos vistas intercambiables con toggle **Mapa / Tabla**:

### Vista Mapa (`FlowVisualizer.tsx`)
Canvas React Flow con nodos tipados estrictamente. Wrap en `ReactFlowProvider`.

**Tipos de nodo** (registrados en `NODE_TYPES`):

| Tipo | Componente | Handles |
|------|-----------|---------|
| `flowActor` | `FlowNodeActor` | 1 source derecha (`right`) |
| `flowScreen` | `FlowNodeScreen` | 1 target izquierda (`left`), 1 source derecha (`right-0`) |
| `flowComp` | `FlowNodeComponent` | 1 target izquierda (`from-screen`), 1 source derecha (`to-service-0`), 1 target derecha (`data-in`) |
| `flowService` | `FlowNodeService` | target izq (`from-comp-0`), source izq (`data-out-0`), source der (`to-ep-req-0`), target der (`from-ep-res-0`) |
| `flowEndpoint` | `FlowNodeEndpoint` | target izq (`req-in`), source izq (`res-out`) |

**Reglas de conexión** (validadas en `validateConn()`):
- Actor → Screen
- Screen → Componente
- Componente → Servicio
- Servicio → Endpoint (req) / Endpoint → Servicio (res, dashed)
- Servicio → Componente (data-out, dashed purple)

**Tipo de arista**: `flowEdge` (`FlowEdgeDeletable`) — muestra botón `×` al seleccionar para desconectar.

**`stepsToFlowNodes(steps, catalog)`**: genera layout automático desde pasos de DB.
- Deduplica entidades entre pasos (Set/Map por ID de entidad)
- Deduplica aristas con `pushEdge()` + `Set<string>` por ID
- Resuelve IDs → nombres/sublabels via `catalog`
- Layout en 5 columnas: Actor(80) | Pantalla(320) | Comp(560) | Servicio(800) | Endpoint(1060)
- Distribución vertical: `Y_CENTER + (i - (n-1)/2) * Y_GAP` (Y_GAP=150)

**`onConnectEnd`**: si se suelta en canvas vacío → abre `NodeCreatorDropdown` con tipos válidos → crea nodo + conecta automáticamente.

**`FlowNodeBase.tsx`**: base compartida por todos los nodos.
- `padLeft`/`padRight`: padding lateral para evitar que el contenido solape los labels de handles (default 68px si hay handles en ese lado)
- `sublabel`: línea secundaria debajo del label principal
- Handles siempre visibles: `opacity: 1 !important` + `boxShadow` de color

**Guardar**: botón "Guardar mapa" (top-right) + `Cmd+S`. Persiste `graphJson` via `saveFlowGraph()`.

### Vista Tabla (`FlowSwimlane.tsx`)
Grid CSS con swimlanes por columna: Actor | Pantalla | Componentes | Servicios | Endpoints.
Edición inline directamente en las celdas. Muestra nombre + sublabel de cada entidad (tipo, ruta, propósito).

## Edición de entidades inline (`EntityCard.tsx`)

Reemplaza los links de navegación a `/entities/[id]/edit`. Permite editar campos de entidades desde el panel derecho de la feature sin salir de la página.

- **Display**: nombre + sublabel con botones `✎` y `×` al hover
- **Edit**: formulario inline con campos específicos por tipo (Screen: nombre+ruta, Component: nombre+tipo+propósito, Service: nombre+propósito, Endpoint: método+path+propósito)
- Usa `patchScreen/patchComponent/patchService/patchEndpoint` en `entities.ts` — actualizan sin `redirect()`

## Server Actions — patrones clave

- Las mutaciones en `src/lib/actions/` siempre incluyen `"use server"` y `revalidatePath()`.
- `updateFlowStepField(stepId, featureId, data)` — actualización granular de un campo de paso.
- `saveFlowGraph(flowId, featureId, nodes, edges)` — persiste layout del Mapa como JSON.
- `patch*(id, data)` en `entities.ts` — actualiza entidad **sin** `redirect()`, para edición inline.
- Los arrays de entidades en FlowStep (components, services, endpoints, responseComponents) se almacenan como **JSON string de IDs** y se resuelven en cliente via `catalog`.

## Tipos de relaciones (Dependency Graph)

`contains`, `uses`, `calls`, `depends_on`, `owned_by`, `known_by`, `has_risk`, `has_debt`

Codificados por color (índigo, azul, naranja, rojo, morado, teal, naranja, rosa).

## Patrones de desarrollo

- Las páginas son **Server Components** por defecto (Next.js App Router).
- Las mutaciones usan **Server Actions** en `src/lib/actions/`.
- El cliente Prisma es un singleton en `src/lib/prisma.ts` con query logging en dev.
- Las páginas de detalle con grafo usan `ThreePanelLayout` (3 columnas colapsables).
- Tema oscuro: fondo `gray-950`, texto `gray-100`.
- No hay gestor de estado global — el estado vive en hooks locales y en el servidor.
- Joins Prisma: máximo 2 niveles de anidación para evitar crashes en SQLite. Usar 2 queries planas + `Map` join en el cliente cuando se necesite más profundidad.

## Variables de entorno

```env
DATABASE_URL="file:./dev.db"
```
