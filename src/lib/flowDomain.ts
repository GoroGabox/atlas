// Tipos de nodo disponibles
export type NodeType = "actor" | "screen" | "action" | "system" | "result" | "condition";

export type FlowNode = {
  id:       string;
  type:     NodeType;
  label:    string;
  position: { x: number; y: number };
  isStart?: boolean; // nodo inicial no eliminable
};

export type FlowEdge = {
  id:     string;
  source: string;
  target: string;
  label?: string;
  sourceHandle?: string;
};

// Visual por tipo
export const NODE_STYLES: Record<NodeType, {
  bg: string; border: string; text: string;
  icon: string; question: string; hint: string;
  shape: "rect" | "diamond";
}> = {
  actor: {
    bg: "#1e1b4b", border: "#6366f1", text: "#a5b4fc",
    icon: "👤", shape: "rect",
    question: "¿Quién?",
    hint: "La persona o sistema externo que inicia la acción. Ej: Supervisor, Sistema de pagos",
  },
  screen: {
    bg: "#0f172a", border: "#3b82f6", text: "#93c5fd",
    icon: "🖥", shape: "rect",
    question: "¿Dónde?",
    hint: "La pantalla o vista donde ocurre la interacción. Ej: Dashboard, FilterPanel",
  },
  action: {
    bg: "#0f2318", border: "#22c55e", text: "#86efac",
    icon: "▶", shape: "rect",
    question: "¿Qué hace?",
    hint: "Lo que el actor hace en esa pantalla. Ej: Aplica filtros de fecha, Hace click en exportar",
  },
  system: {
    bg: "#1c1007", border: "#f59e0b", text: "#fcd34d",
    icon: "⚙", shape: "rect",
    question: "¿Qué procesa?",
    hint: "El servicio o endpoint que procesa la acción. Ej: ReportService → GET /reports",
  },
  result: {
    bg: "#1a1a1a", border: "#6b7280", text: "#d1d5db",
    icon: "→", shape: "rect",
    question: "¿Qué obtiene?",
    hint: "El output visible para el actor. Ej: Archivo descargado, Error de validación",
  },
  condition: {
    bg: "#1c0f07", border: "#f97316", text: "#fdba74",
    icon: "◆", shape: "diamond",
    question: "¿Qué decide?",
    hint: "Una bifurcación en el flujo. Ej: ¿Rango ≤ 90 días?, ¿Usuario autenticado?",
  },
};

// Matriz de conexiones válidas
// true = válida, false = inválida, "warn" = válida pero incompleta
export type ConnectionValidity = true | false | "warn";

export const CONNECTION_RULES: Record<NodeType, Partial<Record<NodeType, ConnectionValidity>>> = {
  actor:     { screen: true,  action: "warn", system: "warn", result: false, condition: false, actor: false },
  screen:    { action: true,  actor: false,   system: "warn", result: false, condition: true,  screen: false },
  action:    { system: true,  result: true,   condition: true, screen: false, actor: false,    action: false },
  system:    { result: true,  action: "warn", screen: false,  actor: false,  condition: true,  system: false },
  result:    { actor: "warn", screen: true,   action: false,  system: false, condition: false, result: false },
  condition: { screen: true,  action: true,   system: true,   result: false, actor: false,     condition: false },
};

// Mensajes de validación
export const CONNECTION_MESSAGES: Record<NodeType, Partial<Record<NodeType, string>>> = {
  actor: {
    action: "Conexión válida pero le falta una Pantalla entre Actor y Acción",
    system: "Conexión válida pero le faltan Pantalla y Acción entre Actor y Sistema",
    result: "Un Actor no puede conectarse directamente a un Resultado",
    condition: "Un Actor no puede conectarse directamente a una Condición",
    actor: "No tiene sentido conectar dos Actores",
  },
  screen: {
    system: "Conexión válida pero le falta una Acción entre Pantalla y Sistema",
    actor: "Una Pantalla no puede apuntar a un Actor",
    result: "Una Pantalla no puede apuntar a un Resultado directamente",
    screen: "No tiene sentido conectar dos Pantallas",
  },
  action: {
    screen: "Una Acción no debería apuntar a una Pantalla — ¿quisiste decir Resultado?",
    actor: "Una Acción no puede apuntar a un Actor",
    action: "No tiene sentido conectar dos Acciones",
  },
  system: {
    action: "Conexión válida pero poco común — ¿el sistema dispara otra acción?",
    screen: "Un Sistema no puede apuntar a una Pantalla",
    actor: "Un Sistema no puede apuntar a un Actor directamente",
    system: "No tiene sentido conectar dos Sistemas",
  },
  result: {
    actor: "Conexión válida si el resultado dispara un nuevo flujo del actor",
    action: "Un Resultado no puede apuntar a una Acción directamente",
    system: "Un Resultado no puede apuntar a un Sistema directamente",
    condition: "Un Resultado no puede apuntar a una Condición",
    result: "No tiene sentido conectar dos Resultados",
  },
  condition: {
    result: "Una Condición no puede apuntar directamente a un Resultado",
    actor: "Una Condición no puede apuntar a un Actor",
    condition: "No tiene sentido conectar dos Condiciones",
  },
};

// Path canónico para sugerencias en conexión amarilla
export const CANONICAL_PATH: NodeType[] = ["actor", "screen", "action", "system", "result"];

export function getConnectionValidity(
  sourceType: NodeType,
  targetType: NodeType
): ConnectionValidity {
  return CONNECTION_RULES[sourceType]?.[targetType] ?? false;
}

export function getConnectionMessage(
  sourceType: NodeType,
  targetType: NodeType
): string {
  return CONNECTION_MESSAGES[sourceType]?.[targetType] ?? "Conexión no válida en este dominio";
}

// Convierte FlowStep de DB al nuevo modelo de nodos
export function stepToNodeType(step: {
  actor:     string | null;
  screen:    string | null;
  services:  string | null;
  endpoints: string | null;
}): { type: NodeType; label: string }[] {
  const nodes: { type: NodeType; label: string }[] = [];
  if (step.actor)  nodes.push({ type: "actor",  label: step.actor });
  if (step.screen) nodes.push({ type: "screen", label: step.screen });
  nodes.push({ type: "action", label: "" });
  try {
    const svcs = step.services  ? JSON.parse(step.services)  as string[]                        : [];
    const eps  = step.endpoints ? JSON.parse(step.endpoints) as {method:string;path:string}[]   : [];
    if (svcs.length || eps.length) {
      const label = [svcs[0], eps[0] ? `${eps[0].method} ${eps[0].path}` : ""].filter(Boolean).join(" → ");
      nodes.push({ type: "system", label });
    }
  } catch {}
  return nodes;
}

// Dado un conjunto de nodos y edges, retorna los IDs
// conectados transitivamente desde un nodo origen
export function getConnectedNodeIds(
  nodeId: string,
  edges:  FlowEdge[]
): Set<string> {
  const visited = new Set<string>();
  const queue   = [nodeId];

  while (queue.length) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    edges
      .filter((e) => e.source === current || e.target === current)
      .forEach((e) => {
        if (!visited.has(e.source)) queue.push(e.source);
        if (!visited.has(e.target)) queue.push(e.target);
      });
  }

  return visited;
}

export function getStepNodeIds(
  stepIndex: number,
  nodes:     FlowNode[],
  edges:     FlowEdge[]
): Set<string> {
  const sorted = [...nodes].sort((a, b) => a.position.y - b.position.y);
  if (!sorted.length) return new Set();

  const stepNode = sorted[stepIndex];
  if (!stepNode) return new Set();

  const connected = new Set<string>([stepNode.id]);
  edges
    .filter((e) => e.source === stepNode.id || e.target === stepNode.id)
    .forEach((e) => {
      connected.add(e.source);
      connected.add(e.target);
    });

  return connected;
}

export type EdgeType = "default" | "loop" | "condition-yes" | "condition-no";

// Determina el tipo de edge según source handle
export function getEdgeType(sourceHandleId?: string | null): EdgeType {
  if (sourceHandleId === "yes") return "condition-yes";
  if (sourceHandleId === "no")  return "condition-no";
  return "default";
}

// Color de edge según tipo
export const EDGE_COLORS: Record<EdgeType, string> = {
  "default":       "#374151",
  "loop":          "#8b5cf6",
  "condition-yes": "#22c55e",
  "condition-no":  "#ef4444",
};