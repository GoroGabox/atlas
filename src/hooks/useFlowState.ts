"use client";

import { useReducer, useCallback, useEffect } from "react";
import { FlowNode, FlowEdge } from "@/lib/flowDomain";

type FlowState = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};

type Action =
  | { type: "SET";          payload: FlowState }
  | { type: "ADD_NODE";     payload: FlowNode }
  | { type: "UPDATE_NODE";  payload: { id: string; label: string } }
  | { type: "MOVE_NODE";    payload: { id: string; position: { x: number; y: number } } }
  | { type: "REMOVE_NODE";  payload: string }
  | { type: "ADD_EDGE";     payload: FlowEdge }
  | { type: "REMOVE_EDGE";  payload: string }
  | { type: "ADD_EDGE"; payload: FlowEdge };

type HistoryState = {
  past:    FlowState[];
  present: FlowState;
  future:  FlowState[];
};

const MAX_HISTORY = 20;

function reducer(history: HistoryState, action: Action): HistoryState {
  const { past, present, future } = history;

  if (action.type === "SET") {
    return { past: [], present: action.payload, future: [] };
  }

  // Undo/Redo se manejan fuera del reducer
  let next: FlowState = present;

  switch (action.type) {
    case "ADD_NODE":
      next = { ...present, nodes: [...present.nodes, action.payload] };
      break;

    case "UPDATE_NODE":
      next = {
        ...present,
        nodes: present.nodes.map((n) =>
          n.id === action.payload.id ? { ...n, label: action.payload.label } : n
        ),
      };
      break;

    case "MOVE_NODE":
      next = {
        ...present,
        nodes: present.nodes.map((n) =>
          n.id === action.payload.id ? { ...n, position: action.payload.position } : n
        ),
      };
      break;

    case "REMOVE_NODE":
      next = {
        nodes: present.nodes.filter((n) => n.id !== action.payload),
        edges: present.edges.filter(
          (e) => e.source !== action.payload && e.target !== action.payload
        ),
      };
      break;

    case "ADD_EDGE":
      next = { ...present, edges: [...present.edges, action.payload] };
      break;

    case "REMOVE_EDGE":
      next = { ...present, edges: present.edges.filter((e) => e.id !== action.payload) };
      break;
  }

  return {
    past:    [...past.slice(-MAX_HISTORY), present],
    present: next,
    future:  [],
  };
}

export function useFlowState(initial: FlowState) {
  const [history, dispatch] = useReducer(reducer, {
    past:    [],
    present: initial,
    future:  [],
  });

  const isDirty = history.past.length > 0;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const undo = useCallback(() => {
    if (!canUndo) return;
    dispatch({ type: "SET", payload: history.past[history.past.length - 1] });
  }, [canUndo, history.past]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    dispatch({ type: "SET", payload: history.future[0] });
  }, [canRedo, history.future]);

  // Cmd+Z / Cmd+Shift+Z
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return {
    nodes:   history.present.nodes,
    edges:   history.present.edges,
    isDirty,
    canUndo,
    canRedo,
    undo,
    redo,
    dispatch,
  };
}