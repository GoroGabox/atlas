"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ReactFlow, Background, Controls,
  useNodesState, useEdgesState,
  Connection, BackgroundVariant, MarkerType,
  Node, Edge, useReactFlow, ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import FlowNodeActor        from "@/components/flow/FlowNodeActor";
import FlowNodeScreen       from "@/components/flow/FlowNodeScreen";
import FlowNodeComponent    from "@/components/flow/FlowNodeComponent";
import FlowNodeService      from "@/components/flow/FlowNodeService";
import FlowNodeEndpoint     from "@/components/flow/FlowNodeEndpoint";
import FlowEdgeDeletable    from "@/components/flow/FlowEdgeDeletable";
import NodeCreatorDropdown  from "@/components/flow/NodeCreatorDropdown";
import { saveFlowGraph, createEntityForFlow } from "@/lib/actions/flows";
import { useRouter }       from "next/navigation";
import type { EntityCatalog } from "@/lib/types/entities";

// ── nodeTypes / edgeTypes registries ─────────────────────────────────────────
const NODE_TYPES = {
  flowActor:    FlowNodeActor,
  flowScreen:   FlowNodeScreen,
  flowComp:     FlowNodeComponent,
  flowService:  FlowNodeService,
  flowEndpoint: FlowNodeEndpoint,
} as const;

const EDGE_TYPES = {
  flowEdge: FlowEdgeDeletable,
} as const;

// ── DB Step type ──────────────────────────────────────────────────────────────
type DBStep = {
  id:                 string;
  order:              number;
  action:             string;
  actor:              string | null;
  screen:             string | null;
  components:         string | null;
  services:           string | null;
  endpoints:          string | null;
  responseComponents: string | null;
};

type Props = {
  steps:      DBStep[];
  flowId:     string;
  featureId:  string;
  moduleId?:  string;
  graphJson?: string | null;
  catalog?:   EntityCatalog;
  /** Called when user clicks a node on the canvas */
  onNodeClick?:    (nodeId: string) => void;
  /** ID of the currently selected node (for highlight) */
  selectedNodeId?: string | null;
};

type DropdownState = {
  screenX:             number;
  screenY:             number;
  validTypes:          string[];
  pendingSourceId:     string;
  pendingSourceHandle: string | null;
  pendingSourceType:   string;
} | null;

// ── Layout constants ──────────────────────────────────────────────────────────
const COL = { actor: 80, screen: 320, comp: 560, service: 800, endpoint: 1060 };
const Y_CENTER = 320;
const Y_GAP    = 150;

function yFor(i: number, n: number): number {
  return Y_CENTER + (i - (n - 1) / 2) * Y_GAP;
}

// ── DB helpers ────────────────────────────────────────────────────────────────
function parseArr(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

function nid(prefix: string, name: string): string {
  // stable ID from prefix + name (no special chars)
  return `${prefix}::${name.replace(/[^a-zA-Z0-9_\-]/g, "_")}`;
}

// ── Edge color / style ────────────────────────────────────────────────────────
function handleColor(h: string | null | undefined): string {
  if (!h) return "#6b7280";
  if (h === "right")                return "#6366f1"; // actor → screen
  if (h.startsWith("right-"))       return "#3b82f6"; // screen → comp
  if (h.startsWith("to-service-"))  return "#06b6d4"; // comp → service
  if (h.startsWith("to-ep-req-"))   return "#f59e0b"; // service → endpoint req
  if (h === "res-out")              return "#7c3aed"; // endpoint → service res
  if (h.startsWith("data-out-"))    return "#7c3aed"; // service → comp data
  return "#6b7280";
}

function makeEdge(
  source: string, target: string,
  sourceHandle: string | null, targetHandle: string | null,
): Edge {
  const color  = handleColor(sourceHandle);
  const dashed = sourceHandle === "res-out" || (sourceHandle?.startsWith("data-out-") ?? false);
  return {
    id:           `e::${source}::${target}::${sourceHandle ?? "none"}::${targetHandle ?? "none"}`,
    source, target,
    sourceHandle: sourceHandle ?? undefined,
    targetHandle: targetHandle ?? undefined,
    type:         "flowEdge",
    style:     { stroke: color, strokeWidth: 1.5, ...(dashed ? { strokeDasharray: "5 3" } : {}) },
    markerEnd: { type: MarkerType.ArrowClosed, color },
  };
}

// ── Connection validation ─────────────────────────────────────────────────────
function validateConn(
  srcType: string, srcHandle: string | null, tgtType: string,
): string | null {
  if (srcType === "flowActor"    && srcHandle === "right"                && tgtType === "flowScreen")   return null;
  if (srcType === "flowScreen"   && srcHandle?.startsWith("right-")      && tgtType === "flowComp")     return null;
  if (srcType === "flowComp"     && srcHandle?.startsWith("to-service-") && tgtType === "flowService")  return null;
  if (srcType === "flowService"  && srcHandle?.startsWith("to-ep-req-")  && tgtType === "flowEndpoint") return null;
  if (srcType === "flowService"  && srcHandle?.startsWith("data-out-")      && tgtType === "flowComp")   return null;
  if (srcType === "flowEndpoint" && srcHandle === "res-out"              && tgtType === "flowService")  return null;
  return "Conexión no permitida entre estos nodos";
}

function validTargetTypes(srcHandle: string | null, srcType: string): string[] {
  if (srcType === "flowActor"    && srcHandle === "right")                  return ["flowScreen"];
  if (srcType === "flowScreen"   && srcHandle?.startsWith("right-"))        return ["flowComp"];
  if (srcType === "flowComp"     && srcHandle?.startsWith("to-service-"))   return ["flowService"];
  if (srcType === "flowService"  && srcHandle?.startsWith("to-ep-req-"))    return ["flowEndpoint"];
  if (srcType === "flowService"  && srcHandle?.startsWith("data-out-"))      return ["flowComp"];
  // res-out goes back to existing service only — can't create new
  return [];
}

// ── Default data for auto-created nodes ───────────────────────────────────────
function defaultNodeData(type: string): Record<string, unknown> {
  switch (type) {
    case "flowActor":    return { label: "Actor" };
    case "flowScreen":   return { label: "Pantalla" };
    case "flowComp":     return { label: "Componente" };
    case "flowService":  return { label: "Servicio" };
    case "flowEndpoint": return { label: "/endpoint",  method: "GET" };
    default:             return { label: "Nodo" };
  }
}

// Map ReactFlow node type → DB entity type for createEntityForFlow
function entityTypeForNodeType(nt: string): "screen" | "component" | "service" | "endpoint" {
  const map: Record<string, "screen" | "component" | "service" | "endpoint"> = {
    flowScreen: "screen", flowComp: "component",
    flowService: "service", flowEndpoint: "endpoint",
  };
  return map[nt] ?? "component";
}

// Extract the raw entity ID from a nid() string.  e.g. "comp::abc123" → "abc123"
export function extractEntityId(nodeId: string): string {
  const idx = nodeId.indexOf("::");
  return idx >= 0 ? nodeId.slice(idx + 2) : nodeId;
}

// Step-backed prefixes (nodes generated from DB steps)
const STEP_PREFIXES = ["actor::", "screen::", "comp::", "service::", "ep::"];
export function isStepBacked(id: string): boolean {
  return STEP_PREFIXES.some((p) => id.startsWith(p));
}

// Auto-pick the target handle when creating a new edge to a newly created node
function autoTargetHandle(srcHandle: string | null, tgtType: string): string | null {
  if (tgtType === "flowScreen")  return "left";
  if (tgtType === "flowComp")    return srcHandle?.startsWith("data-out-") ? "data-in" : "from-screen";
  if (tgtType === "flowService") return "from-comp-0";
  if (tgtType === "flowEndpoint")return "req-in";
  return null;
}

// ── Handle-count bumps after a new connection ─────────────────────────────────
function bumpSource(node: Node, srcHandle: string | null): Node {
  const d = { ...node.data } as Record<string, unknown>;
  return { ...node, data: d };
}

function bumpTarget(_node: Node, _srcHandle: string | null): Node {
  // Handles are now fixed — no dynamic counts needed
  return _node;
}

// ── stepsToFlowNodes — generate initial layout from DB steps ──────────────────
// Keys in the Maps are entity IDs (as stored in step JSON fields).
// Catalog resolves IDs to display names and sublabels.
function stepsToFlowNodes(steps: DBStep[], catalog: EntityCatalog): { nodes: Node[]; edges: Edge[] } {
  // ── Catalog resolvers ────────────────────────────────────────────────────
  function screenLabel(id: string)    { return catalog.screens.find((s) => s.id === id)?.name ?? id; }
  function screenRoute(id: string)    { return catalog.screens.find((s) => s.id === id)?.route ?? ""; }
  function compLabel(id: string)      { return catalog.components.find((c) => c.id === id)?.name ?? id; }
  function compType(id: string)       { return catalog.components.find((c) => c.id === id)?.type ?? ""; }
  function svcLabel(id: string)       { return catalog.services.find((s) => s.id === id)?.name ?? id; }
  function svcPurpose(id: string)     {
    const p = catalog.services.find((s) => s.id === id)?.purpose ?? "";
    return p.length > 35 ? p.slice(0, 35) + "…" : p;
  }
  function epInfo(id: string) {
    const ep = catalog.endpoints.find((e) => e.id === id);
    return { method: ep?.method ?? "GET", path: ep?.path ?? id };
  }

  if (!steps.length) {
    return {
      nodes: [{
        id: nid("actor", "Usuario"), type: "flowActor",
        position: { x: COL.actor, y: Y_CENTER },
        data: { label: "Usuario" },
      }],
      edges: [],
    };
  }

  // ── Collect entities and their connections across all steps ───────────────
  // All keys are entity IDs (from step JSON fields)
  const actorSet  = new Set<string>();
  const screenMap = new Map<string, Set<string>>();                              // screenId → Set<compId>
  const compMap   = new Map<string, { svcs: Set<string>; isResp: boolean }>();  // compId → services
  const svcMap    = new Map<string, { comps: Set<string>; eps: Set<string>; resp: Set<string> }>();
  const epSet     = new Set<string>();                                           // epId

  for (const step of steps) {
    const actor  = step.actor ?? "Usuario";
    const screen = step.screen;          // ID
    const comps  = parseArr(step.components);        // ID[]
    const svcs   = parseArr(step.services);          // ID[]
    const eps    = parseArr(step.endpoints);         // ID[]
    const resps  = parseArr(step.responseComponents);// ID[]

    actorSet.add(actor);

    if (screen && !screenMap.has(screen)) screenMap.set(screen, new Set());

    for (const c of comps) {
      if (!compMap.has(c)) compMap.set(c, { svcs: new Set(), isResp: false });
      if (screen) screenMap.get(screen)!.add(c);
    }

    for (const svc of svcs) {
      if (!svcMap.has(svc)) svcMap.set(svc, { comps: new Set(), eps: new Set(), resp: new Set() });
      for (const c of comps) {
        compMap.get(c)?.svcs.add(svc);
        svcMap.get(svc)!.comps.add(c);
      }
    }

    for (const ep of eps) {
      epSet.add(ep);
      for (const svc of svcs) svcMap.get(svc)?.eps.add(ep);
    }

    for (const rc of resps) {
      if (!compMap.has(rc)) compMap.set(rc, { svcs: new Set(), isResp: true });
      else compMap.get(rc)!.isResp = true;
      for (const svc of svcs) svcMap.get(svc)?.resp.add(rc);
    }
  }

  // ── Build nodes ───────────────────────────────────────────────────────────
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const actors  = [...actorSet];
  const screens = [...screenMap.keys()];
  const comps   = [...compMap.keys()];
  const svcs    = [...svcMap.keys()];
  const eps     = [...epSet];

  actors.forEach((a, i) => nodes.push({
    id: nid("actor", a), type: "flowActor",
    position: { x: COL.actor, y: yFor(i, actors.length) },
    data: { label: a },
  }));

  screens.forEach((id, i) => nodes.push({
    id: nid("screen", id), type: "flowScreen",
    position: { x: COL.screen, y: yFor(i, screens.length) },
    data: { label: screenLabel(id), sublabel: screenRoute(id) },
  }));

  comps.forEach((id, i) => nodes.push({
    id: nid("comp", id), type: "flowComp",
    position: { x: COL.comp, y: yFor(i, comps.length) },
    data: { label: compLabel(id), sublabel: compType(id) },
  }));

  svcs.forEach((id, i) => {
    nodes.push({
      id: nid("service", id), type: "flowService",
      position: { x: COL.service, y: yFor(i, svcs.length) },
      data: { label: svcLabel(id), sublabel: svcPurpose(id) },
    });
  });

  eps.forEach((id, i) => {
    const { method, path } = epInfo(id);
    nodes.push({
      id: nid("ep", id), type: "flowEndpoint",
      position: { x: COL.endpoint, y: yFor(i, eps.length) },
      data: { label: path, method },
    });
  });

  // ── Build edges (all deduped by ID) ──────────────────────────────────────
  const edgeSet = new Set<string>();
  function pushEdge(e: Edge) {
    if (!edgeSet.has(e.id)) { edgeSet.add(e.id); edges.push(e); }
  }

  // Actor → Screen  (per-step: each step's actor connects to that step's screen)
  steps.forEach((step) => {
    const actorName = step.actor || "Usuario";
    if (step.screen) {
      pushEdge(makeEdge(nid("actor", actorName), nid("screen", step.screen), "right", "left"));
    }
  });

  // Screen → Component (fixed handle right-0)
  screens.forEach((s) => {
    [...screenMap.get(s)!].forEach((c) => {
      pushEdge(makeEdge(nid("screen", s), nid("comp", c), "right-0", "from-screen"));
    });
  });

  // Component → Service (fixed handles on both sides)
  comps.forEach((c) => {
    const ce = compMap.get(c)!;
    if (ce.isResp) return;
    ce.svcs.forEach((svc) => {
      pushEdge(makeEdge(nid("comp", c), nid("service", svc), "to-service-0", "from-comp-0"));
    });
  });

  // Service → Endpoint (req) + Endpoint → Service (res) — fixed handles
  svcs.forEach((s) => {
    svcMap.get(s)!.eps.forEach((ep) => {
      pushEdge(makeEdge(nid("service", s), nid("ep", ep), "to-ep-req-0", "req-in"));
      pushEdge(makeEdge(nid("ep", ep), nid("service", s), "res-out", "from-ep-res-0"));
    });
  });

  // Service → ResponseComponent (data) — fixed handle
  svcs.forEach((s) => {
    svcMap.get(s)!.resp.forEach((rc) => {
      pushEdge(makeEdge(nid("service", s), nid("comp", rc), "data-out-0", "data-in"));
    });
  });

  return { nodes, edges };
}

// ── Restore from graphJson ────────────────────────────────────────────────────
function fromGraphJson(json: string): { nodes: Node[]; edges: Edge[] } | null {
  try {
    const p = JSON.parse(json);
    if (Array.isArray(p.nodes) && Array.isArray(p.edges)) return p;
  } catch { /* invalid json */ }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Outer wrapper — provides ReactFlow context for useReactFlow
// ─────────────────────────────────────────────────────────────────────────────
export default function FlowVisualizerV2(props: Props) {
  return (
    <ReactFlowProvider>
      <FlowInner {...props} />
    </ReactFlowProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner component — lives inside ReactFlow context
// ─────────────────────────────────────────────────────────────────────────────
function FlowInner({ steps, flowId, featureId, moduleId, graphJson, catalog, onNodeClick: onNodeClickProp, selectedNodeId }: Props) {
  const { screenToFlowPosition } = useReactFlow();
  const router = useRouter();

  // ── Initial graph state ─────────────────────────────────────────────────────
  // Always derive the canonical node/edge set from current steps, then overlay
  // saved positions from graphJson. This guarantees that entities added to steps
  // after the last "Guardar mapa" are visible on every mount (including view
  // switches), while preserving manually arranged node positions.
  const initial = (() => {
    const cat = catalog ?? { screens: [], components: [], services: [], endpoints: [] };
    const fromSteps = stepsToFlowNodes(steps, cat);

    if (graphJson) {
      const parsed = fromGraphJson(graphJson);
      if (parsed) {
        // Position lookup from saved layout
        const posMap = new Map<string, { x: number; y: number }>(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (parsed.nodes as any[]).map((n) => [n.id, n.position])
        );
        const stepsIds = new Set(fromSteps.nodes.map((n: Node) => n.id));

        // Step-derived nodes: use saved positions where available
        const mergedNodes: Node[] = fromSteps.nodes.map((n) => ({
          ...n,
          position: posMap.get(n.id) ?? n.position,
        }));

        // Canvas-only nodes (manually placed, not linked to any step) — preserve them.
        // Exclude step-backed nodes (actor::, comp::, etc.) that are no longer in
        // current steps — those were removed and should NOT be resurrected from graphJson.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canvasOnlyNodes: Node[] = (parsed.nodes as any[]).filter(
          (n) => !stepsIds.has(n.id) && !isStepBacked(n.id)
        );

        // Canonical step edges + canvas-only edges whose endpoints still exist
        const stepsEdgeIds = new Set(fromSteps.edges.map((e: Edge) => e.id));
        const allNodeIds   = new Set([...stepsIds, ...canvasOnlyNodes.map((n) => n.id)]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canvasOnlyEdges: Edge[] = (parsed.edges as any[]).filter(
          (e) =>
            !stepsEdgeIds.has(e.id) &&
            allNodeIds.has(e.source) &&
            allNodeIds.has(e.target)
        );

        return {
          nodes: [...mergedNodes, ...canvasOnlyNodes],
          edges: [...fromSteps.edges, ...canvasOnlyEdges],
        };
      }
    }

    return fromSteps;
  })();

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [saving,    setSaving]    = useState(false);
  const [isDirty,   setIsDirty]   = useState(false);
  const [connError, setConnError] = useState<string | null>(null);
  const [dropdown,  setDropdown]  = useState<DropdownState>(null);
  const [, startTransition]      = useTransition();

  // ── Sync: merge steps changes into canvas while preserving positions ─────────
  const stepsKey = useMemo(
    () =>
      steps
        .map((s) =>
          [
            s.id,
            s.actor ?? "",
            s.screen ?? "",
            s.components ?? "",
            s.services ?? "",
            s.endpoints ?? "",
            s.responseComponents ?? "",
          ].join("|")
        )
        .join("§"),
    [steps]
  );

  const prevStepsKey = useRef("");
  const hasMounted   = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      prevStepsKey.current = stepsKey;
      return;
    }
    if (stepsKey === prevStepsKey.current) return;
    prevStepsKey.current = stepsKey;

    const cat = catalog ?? { screens: [], components: [], services: [], endpoints: [] };
    const fresh = stepsToFlowNodes(steps, cat);
    const freshIds = new Set(fresh.nodes.map((n) => n.id));

    // Canvas-only nodes (temp nodes not yet replaced, or manually drawn) — keep
    let canvasOnlyIds: Set<string>;

    setNodes((current) => {
      const existingMap = new Map(current.map((n) => [n.id, n]));
      const canvasOnly = current.filter((n) => !freshIds.has(n.id) && !isStepBacked(n.id));
      canvasOnlyIds = new Set(canvasOnly.map((n) => n.id));

      return [
        ...fresh.nodes.map((fn) =>
          existingMap.has(fn.id)
            ? { ...existingMap.get(fn.id)!, data: fn.data }
            : fn
        ),
        ...canvasOnly,
      ];
    });

    setEdges((current) => {
      const allLiveIds = new Set([...freshIds, ...(canvasOnlyIds ?? [])]);
      const kept  = current.filter(
        (e) => allLiveIds.has(e.source) && allLiveIds.has(e.target)
      );
      const currentIds = new Set(kept.map((e) => e.id));
      const added = fresh.edges.filter((e) => !currentIds.has(e.id));
      return [...kept, ...added];
    });

    markDirty();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepsKey]);

  // Source node info while dragging a connection
  const connectingRef = useRef<{
    nodeId:   string;
    nodeType: string;
    handleId: string | null;
  } | null>(null);

  const markDirty = useCallback(() => setIsDirty(true), []);

  // ── Pulse animation (for Actor node) ────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0%,100%{opacity:0.4;transform:scale(1)}
        50%{opacity:0.1;transform:scale(1.08)}
      }
      /* Handles always visible, regardless of connection state */
      .react-flow__handle { opacity: 1 !important; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveFlowGraph(flowId, featureId, nodes, edges);
      setIsDirty(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }, [flowId, featureId, nodes, edges, router]);

  // Cmd/Ctrl+S
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty) handleSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDirty, handleSave]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    function onBefore(e: BeforeUnloadEvent) {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    }
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [isDirty]);

  // ── onConnectStart — record source info ─────────────────────────────────────
  const onConnectStart = useCallback(
    (
      _: unknown,
      { nodeId, handleId }: { nodeId: string | null; handleId: string | null },
    ) => {
      if (!nodeId) { connectingRef.current = null; return; }
      setNodes((nds) => {
        const node = nds.find((n) => n.id === nodeId);
        connectingRef.current = {
          nodeId,
          nodeType: node?.type ?? "",
          handleId: handleId ?? null,
        };
        return nds; // no mutation
      });
    },
    [setNodes],
  );

  // ── onConnect — validate + add edge to existing node ────────────────────────
  const onConnect = useCallback((connection: Connection) => {
    const { source, target, sourceHandle, targetHandle } = connection;
    if (!source || !target) return;

    // Find node types from current state
    let srcType = "";
    let tgtType = "";
    setNodes((nds) => {
      srcType = nds.find((n) => n.id === source)?.type ?? "";
      tgtType = nds.find((n) => n.id === target)?.type ?? "";
      return nds;
    });

    const error = validateConn(srcType, sourceHandle ?? null, tgtType);
    if (error) {
      setConnError(error);
      setTimeout(() => setConnError(null), 2500);
      connectingRef.current = null;
      return;
    }

    const newEdge = makeEdge(source, target, sourceHandle ?? null, targetHandle ?? null);
    setNodes((nds) => nds.map((n) => {
      if (n.id === source) return bumpSource(n, sourceHandle ?? null);
      if (n.id === target) return bumpTarget(n, sourceHandle ?? null);
      return n;
    }));
    setEdges((eds) => [...eds, newEdge]);
    markDirty();
    connectingRef.current = null;
  }, [setNodes, setEdges, markDirty]);

  // ── onConnectEnd — detect drop on empty canvas → show dropdown ───────────────
  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    const evTarget = event.target as Element | null;

    // If dropped on a node or handle, onConnect already handled it
    if (evTarget?.closest(".react-flow__node") || evTarget?.closest(".react-flow__handle")) {
      connectingRef.current = null;
      return;
    }

    const pending = connectingRef.current;
    connectingRef.current = null;
    if (!pending) return;

    const valid = validTargetTypes(pending.handleId, pending.nodeType);
    if (!valid.length) return;

    const ev = event as MouseEvent;
    setDropdown({
      screenX:             ev.clientX,
      screenY:             ev.clientY,
      validTypes:          valid,
      pendingSourceId:     pending.nodeId,
      pendingSourceHandle: pending.handleId,
      pendingSourceType:   pending.nodeType,
    });
  }, []);

  // ── Dropdown: create node + connect (DB-backed) ────────────────────────────
  const handleDropdownSelect = useCallback((type: string) => {
    if (!dropdown) return;
    const { pendingSourceId, pendingSourceHandle, screenX, screenY } = dropdown;

    // Convert browser screen coords → flow canvas coords
    const pos   = screenToFlowPosition({ x: screenX, y: screenY });
    const tempId = `${type}::new-${Date.now()}`;

    // Determine which source handle to use
    let srcHandle = pendingSourceHandle;
    if (!srcHandle) {
      const srcType = dropdown.pendingSourceType;
      const prefix =
        type === "flowScreen"                              ? null           :
        type === "flowComp"  && srcType === "flowService"  ? "data-out-"    :
        type === "flowComp"                                ? null           :
        type === "flowEndpoint"                            ? "to-ep-req-"   : null;
      if (prefix) {
        const count = edges.filter(
          (e) => e.source === pendingSourceId && e.sourceHandle?.startsWith(prefix),
        ).length;
        srcHandle = `${prefix}${count}`;
      }
    }

    const tgtHandle = autoTargetHandle(srcHandle, type);
    const newNode: Node = { id: tempId, type, position: pos, data: defaultNodeData(type) };
    const newEdge = makeEdge(pendingSourceId, tempId, srcHandle, tgtHandle);

    // Optimistic: show temp node immediately
    setNodes((nds) => [
      ...nds.map((n) => n.id === pendingSourceId ? bumpSource(n, srcHandle) : n),
      newNode,
    ]);
    setEdges((eds) => [...eds, newEdge]);
    markDirty();
    setDropdown(null);

    // Persist: create real entity in DB + wire to matching steps
    if (moduleId && srcHandle) {
      const sourceRawId = extractEntityId(pendingSourceId);
      startTransition(async () => {
        try {
          const result = await createEntityForFlow(
            flowId, featureId, moduleId,
            entityTypeForNodeType(type),
            (defaultNodeData(type) as { label: string }).label,
            srcHandle!,
            sourceRawId,
          );
          // Replace temp node with real-ID node
          const realId = nid(result.nidPrefix, result.id);
          setNodes((ns) => ns.map((n) => n.id === tempId ? { ...n, id: realId } : n));
          setEdges((es) => es.map((e) => ({
            ...e,
            source: e.source === tempId ? realId : e.source,
            target: e.target === tempId ? realId : e.target,
            id:     e.id.replace(tempId, realId),
          })));
          router.refresh();
        } catch (err) {
          console.error("createEntityForFlow failed", err);
        }
      });
    }
  }, [dropdown, edges, screenToFlowPosition, setNodes, setEdges, markDirty, moduleId, flowId, featureId, router, startTransition]);

  // ── Apply external selection highlight ─────────────────────────────────────
  const displayNodes = useMemo(
    () => selectedNodeId
      ? nodes.map((n) => ({ ...n, selected: n.id === selectedNodeId }))
      : nodes,
    [nodes, selectedNodeId],
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>

      {/* ── Save button ─────────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 12, right: 12, zIndex: 10,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        {isDirty && (
          <span style={{ fontSize: 11, color: "#f59e0b", userSelect: "none" }}>
            ● Sin guardar
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          style={{
            padding:      "6px 14px",
            borderRadius: 7,
            fontSize:     12,
            fontWeight:   600,
            background:   isDirty ? "#2563eb" : "#1e293b",
            color:        isDirty ? "#fff"    : "#4b5563",
            border:       `1px solid ${isDirty ? "#3b82f6" : "#334155"}`,
            cursor:       isDirty ? "pointer" : "default",
            transition:   "all 0.2s",
          }}
        >
          {saving ? "Guardando…" : "Guardar mapa"}
        </button>
      </div>

      {/* ── Connection error toast ───────────────────────────────────────────── */}
      {connError && (
        <div style={{
          position:     "absolute",
          bottom:       64,
          left:         "50%",
          transform:    "translateX(-50%)",
          zIndex:       20,
          background:   "#7f1d1d",
          border:       "1px solid #ef4444",
          borderRadius: 8,
          padding:      "8px 18px",
          fontSize:     12,
          color:        "#fca5a5",
          boxShadow:    "0 4px 16px rgba(0,0,0,0.6)",
          whiteSpace:   "nowrap",
        }}>
          {connError}
        </div>
      )}

      {/* ── Node creator dropdown ────────────────────────────────────────────── */}
      {dropdown && (
        <NodeCreatorDropdown
          screenX={dropdown.screenX}
          screenY={dropdown.screenY}
          validTypes={dropdown.validTypes}
          onSelect={handleDropdownSelect}
          onClose={() => setDropdown(null)}
        />
      )}

      {/* ── React Flow canvas ────────────────────────────────────────────────── */}
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd as (e: MouseEvent | TouchEvent) => void}
        onNodeDragStop={markDirty}
        onNodesDelete={markDirty}
        onEdgesDelete={markDirty}
        onNodeClick={(_evt, node) => onNodeClickProp?.(node.id)}
        onPaneClick={() => onNodeClickProp?.("")}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        colorMode="dark"
        deleteKeyCode="Delete"
        minZoom={0.3}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1f2937" />
        <Controls />
      </ReactFlow>

    </div>
  );
}
