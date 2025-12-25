"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from "react";
import { ExecutionEngine } from "@/lib/geometry/execution-engine";

export interface WorkspaceObject {
  id: string;
  type: 'box' | 'cylinder' | 'sphere' | 'extrusion' | 'revolution' | 'compound' | string;
  dimensions: {
    width?: number;
    height?: number;
    depth?: number;
    radius?: number;
    diameter?: number;
    length?: number;
    [key: string]: number | undefined;
  };
  features?: Array<{
    type: string;
    parameters: Record<string, any>;
  }>;
  material?: string;
  visible: boolean;
  selected: boolean;
  meshData?: {
    vertices: Float32Array;
    indices: Uint32Array;
  };
  color?: string;
  params?: Record<string, any>;
  description?: string;
  process?: string;
  toolpath?: {
    id: string;
    name: string;
    strategy: string;
    notes?: string;
  };
  manufacturability?: {
    score: number;
    issues: Array<{ id: string; severity: string; message: string; fix: string }>;
  };
  sourceFile?: {
    bucket: string;
    key: string;
    filename: string;
    contentType?: string;
  };
}

interface WorkspaceState {
  activeTool: string;
  objects: Record<string, WorkspaceObject>;
  selectedObjectId: string | null;
  selectedObjectIds: string[];
  selectTool: (id: string) => void;
  selectObject: (id: string, multi?: boolean) => void;
  addObject: (id: string, data: Partial<WorkspaceObject>) => void;
  deleteObject: (id: string) => void;
  updateObject: (id: string, data: Partial<WorkspaceObject>) => void;
  getObjectParameters: (id: string) => any;
  updateObjectParameters: (id: string, params: any) => void;
  updateObjectGeometry: (id: string, geometry: Partial<WorkspaceObject>) => void;
  getObjectGeometry: (id: string) => WorkspaceObject | undefined;
  performBoolean: (operation: 'union' | 'subtract' | 'intersect', targetId: string, toolId: string) => Promise<void>;
  clearWorkspace: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);

interface HistoryEntry {
  objects: Record<string, WorkspaceObject>;
  selectedObjectId: string | null;
  selectedObjectIds: string[];
}

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [activeTool, setActiveTool] = useState("select");
  const [objects, setObjects] = useState<Record<string, any>>({});
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  
  // Undo/Redo history
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const engineRef = useRef<ExecutionEngine | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      engineRef.current = new ExecutionEngine();
    }
    return () => engineRef.current?.dispose();
  }, []);

  // Save state to history
  const saveHistory = useCallback(() => {
    const newEntry: HistoryEntry = {
      objects: JSON.parse(JSON.stringify(objects)),
      selectedObjectId,
      selectedObjectIds: [...selectedObjectIds],
    };
    
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEntry);
    
    // Limit history to 50 entries
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  }, [objects, selectedObjectId, selectedObjectIds, history, historyIndex]);

  const selectTool = (id: string) => setActiveTool(id);

  const selectObject = (id: string, multi: boolean = false) => {
    const normalizedId = id?.trim?.() ? id : ""

    setSelectedObjectIds((prevSelected) => {
      let nextSelected: string[]

      if (multi && normalizedId) {
        nextSelected = prevSelected.includes(normalizedId)
          ? prevSelected.filter((objId) => objId !== normalizedId)
          : [...prevSelected, normalizedId]
      } else {
        nextSelected = normalizedId ? [normalizedId] : []
      }

      setSelectedObjectId(nextSelected[0] ?? null)

      setObjects((prevObjects) => {
        const next = { ...prevObjects }
        Object.keys(next).forEach((k) => {
          next[k] = { ...next[k], selected: nextSelected.includes(k) }
        })
        return next
      })

      return nextSelected
    })
  };

  const addObject = (id: string, data: Partial<WorkspaceObject>) => {
    saveHistory();
    setObjects((prev) => ({ 
      ...prev, 
      [id]: { 
        id,
        type: data.type || 'box',
        dimensions: data.dimensions || {},
        features: data.features || [],
        material: data.material || 'aluminum',
        visible: data.visible !== false,
        selected: false,
        color: data.color || '#0077ff',
        params: data.params || data.dimensions || {},
        description: data.description || '',
        ...data,
      } as WorkspaceObject
    }));
  };

  const deleteObject = (id: string) => {
    saveHistory();
    setObjects((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    if (selectedObjectId === id) {
      setSelectedObjectId(null);
    }
    setSelectedObjectIds((prev) => prev.filter(objId => objId !== id));
  };

  const updateObject = (id: string, data: Partial<WorkspaceObject>) => {
    saveHistory();
    setObjects((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...data } as WorkspaceObject
    }));
  };

  const getObjectParameters = (id: string) => {
    return objects[id]?.params || objects[id]?.dimensions;
  };

  const updateObjectParameters = (id: string, params: any) => {
    saveHistory();
    setObjects((prev) => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: { 
          ...prev[id], 
          params: { ...prev[id].params, ...params },
          dimensions: { ...prev[id].dimensions, ...params }
        },
      };
    });
  };

  const updateObjectGeometry = (id: string, geometry: Partial<WorkspaceObject>) => {
    saveHistory();
    setObjects((prev) => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: {
          ...prev[id],
          ...geometry,
          dimensions: { ...prev[id].dimensions, ...geometry.dimensions },
          features: geometry.features || prev[id].features,
        } as WorkspaceObject,
      };
    });
  };

  const getObjectGeometry = (id: string): WorkspaceObject | undefined => {
    return objects[id];
  };

  const performBoolean = async (op: 'union' | 'subtract' | 'intersect', targetId: string, toolId: string) => {
    if (!engineRef.current) return;
    
    const target = objects[targetId];
    const tool = objects[toolId];
    if (!target || !tool) return;

    try {
      await engineRef.current.ensureReady();
      
      const ops = [
        {
          id: 'base',
          type: 'CREATE',
          operation: target.meshData ? 'LOAD_MESH' : `CREATE_${target.type.toUpperCase()}`,
          parameters: target.meshData ? { mesh: target.meshData } : target.dimensions,
          dependsOn: [],
          description: `Initialize base`,
        },
        {
          id: 'tool',
          type: 'CREATE',
          operation: tool.meshData ? 'LOAD_MESH' : `CREATE_${tool.type.toUpperCase()}`,
          parameters: tool.meshData ? { mesh: tool.meshData } : tool.dimensions,
          dependsOn: [],
          description: `Initialize tool`,
        },
        {
          id: 'result',
          type: 'BOOLEAN',
          operation: `BOOLEAN_${op.toUpperCase()}`,
          parameters: { toolGeometryId: 'tool' },
          dependsOn: ['base', 'tool'],
          description: `${op} operation`,
        }
      ];

      // Note: This logic assumes executeSequence can handle LOAD_MESH which might need implementation
      // For now, let's use a simpler approach since the sequencer might not have LOAD_MESH
      
      const resultId = await engineRef.current.executeSequence(ops as any);
      const resultData = engineRef.current.getGeometry(resultId);

      if (resultData && resultData.mesh) {
        saveHistory();
        setObjects(prev => {
          const next = { ...prev };
          next[targetId] = {
            ...next[targetId],
            type: 'compound',
            meshData: resultData.mesh,
          };
          delete next[toolId];
          return next;
        });
        setSelectedObjectId(targetId);
        setSelectedObjectIds([targetId]);
      }
    } catch (err) {
      console.error('Boolean operation failed:', err);
      throw err;
    }
  };

  const clearWorkspace = () => {
    saveHistory();
    setObjects({});
    setSelectedObjectId(null);
    setSelectedObjectIds([]);
  };

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevState = history[prevIndex];
      setObjects(prevState.objects);
      setSelectedObjectId(prevState.selectedObjectId);
      setSelectedObjectIds(prevState.selectedObjectIds);
      setHistoryIndex(prevIndex);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];
      setObjects(nextState.objects);
      setSelectedObjectId(nextState.selectedObjectId);
      setSelectedObjectIds(nextState.selectedObjectIds);
      setHistoryIndex(nextIndex);
    }
  }, [history, historyIndex]);

  return (
    <WorkspaceContext.Provider
      value={{
        activeTool,
        objects,
        selectedObjectId,
        selectedObjectIds,
        selectTool,
        selectObject,
        addObject,
        deleteObject,
        updateObject,
        getObjectParameters,
        updateObjectParameters,
        updateObjectGeometry,
        getObjectGeometry,
        performBoolean,
        clearWorkspace,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
