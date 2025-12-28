'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ExecutionEngine } from '@/lib/geometry/execution-engine';
import { IntentCompiler } from '@/lib/geometry/intent-compiler';
import { IntentHistory } from '@/lib/geometry/intent-history';
import { KernelBridge, type KernelResult } from '@/lib/geometry/kernel-bridge';

export interface WorkspaceObject {
  id: string;
  type:
    | 'box'
    | 'cylinder'
    | 'sphere'
    | 'extrusion'
    | 'revolution'
    | 'compound'
    | string;
  geometryId?: string;
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
    parameters: Record<string, unknown>;
  }>;
  material?: string;
  finish?: string;
  visible: boolean;
  selected: boolean;
  meshData?: {
    vertices: Float32Array;
    indices: Uint32Array;
    normals?: Float32Array;
  };
  color?: string;
  params?: Record<string, unknown>;
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
    issues: Array<{
      id: string;
      severity: string;
      message: string;
      fix: string;
    }>;
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
  kernelResult: KernelResult | null;
  selectTool: (id: string) => void;
  selectObject: (id: string, multi?: boolean) => void;
  addObject: (id: string, data: Partial<WorkspaceObject>) => void;
  deleteObject: (id: string) => void;
  updateObject: (id: string, data: Partial<WorkspaceObject>) => void;
  getObjectParameters: (id: string) => Record<string, unknown> | undefined;
  updateObjectParameters: (id: string, params: Record<string, unknown>) => void;
  updateObjectGeometry: (
    id: string,
    geometry: Partial<WorkspaceObject>,
  ) => void;
  getObjectGeometry: (id: string) => WorkspaceObject | undefined;
  performBoolean: (
    operation: 'union' | 'subtract' | 'intersect',
    targetId: string,
    toolId: string,
  ) => Promise<void>;
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

function cloneHistoryEntry(entry: HistoryEntry): HistoryEntry {
  if (typeof structuredClone === 'function') {
    return structuredClone(entry);
  }

  return JSON.parse(JSON.stringify(entry)) as HistoryEntry;
}

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [activeTool, setActiveTool] = useState('select');
  const [objects, setObjects] = useState<Record<string, WorkspaceObject>>({});
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const engineRef = useRef<ExecutionEngine | null>(null);

  // NEW: Intent compilation layer
  const intentCompilerRef = useRef(new IntentCompiler());
  const intentHistoryRef = useRef(new IntentHistory());
  const kernelBridgeRef = useRef(new KernelBridge());
  const [kernelResult, setKernelResult] = useState<KernelResult | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      engineRef.current = new ExecutionEngine();

      // Initialize kernel bridge
      kernelBridgeRef.current.initialize().catch((err) => {
        console.warn('Failed to initialize geometry kernel:', err);
      });
    }

    return () => engineRef.current?.dispose();
  }, []);

  const saveHistory = useCallback(() => {
    const entry = cloneHistoryEntry({
      objects,
      selectedObjectId,
      selectedObjectIds: [...selectedObjectIds],
    });

    setHistory((prevHistory) => {
      const base = prevHistory.slice(0, historyIndex + 1);
      const next = [...base, entry].slice(-50);
      setHistoryIndex(next.length - 1);
      return next;
    });
  }, [objects, selectedObjectId, selectedObjectIds, historyIndex]);

  const selectTool = (id: string) => setActiveTool(id);

  const selectObject = (id: string, multi: boolean = false) => {
    const normalizedId = id?.trim?.() ? id : '';

    setSelectedObjectIds((prevSelected) => {
      let nextSelected: string[];

      if (multi && normalizedId) {
        nextSelected = prevSelected.includes(normalizedId)
          ? prevSelected.filter((objId) => objId !== normalizedId)
          : [...prevSelected, normalizedId];
      } else {
        nextSelected = normalizedId ? [normalizedId] : [];
      }

      setSelectedObjectId(nextSelected[0] ?? null);

      setObjects((prevObjects) => {
        const idsToUpdate = new Set([...prevSelected, ...nextSelected]);
        if (idsToUpdate.size === 0) return prevObjects;

        const nextObjects = { ...prevObjects };
        idsToUpdate.forEach((objId) => {
          const obj = nextObjects[objId];
          if (!obj) return;
          nextObjects[objId] = {
            ...obj,
            selected: nextSelected.includes(objId),
          };
        });

        return nextObjects;
      });

      return nextSelected;
    });
  };

  const addObject = (id: string, data: Partial<WorkspaceObject>) => {
    saveHistory();

    setObjects((prev) => ({
      ...prev,
      [id]: {
        id,
        type: data.type || 'box',
        geometryId: data.geometryId,
        dimensions: data.dimensions || {},
        features: data.features || [],
        material: data.material || 'aluminum',
        visible: data.visible !== false,
        selected: false,
        meshData: data.meshData,
        color: data.color || '#0077ff',
        params: data.params || data.dimensions || {},
        description: data.description || '',
        ...data,
      } as WorkspaceObject,
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

    setSelectedObjectIds((prev) => prev.filter((objId) => objId !== id));
  };

  const updateObject = (id: string, data: Partial<WorkspaceObject>) => {
    saveHistory();

    setObjects((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...data } as WorkspaceObject,
    }));
  };

  const getObjectParameters = (
    id: string,
  ): Record<string, unknown> | undefined => {
    return objects[id]?.params || objects[id]?.dimensions;
  };

  const updateObjectParameters = (
    id: string,
    params: Record<string, unknown>,
  ) => {
    saveHistory();

    setObjects((prev) => {
      if (!prev[id]) return prev;

      return {
        ...prev,
        [id]: {
          ...prev[id],
          params: { ...prev[id].params, ...params },
          dimensions: { ...prev[id].dimensions, ...params },
        },
      };
    });
  };

  const updateObjectGeometry = (
    id: string,
    geometry: Partial<WorkspaceObject>,
  ) => {
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

  const performBoolean = async (
    op: 'union' | 'subtract' | 'intersect',
    targetId: string,
    toolId: string,
  ) => {
    if (!engineRef.current) return;

    const target = objects[targetId];
    const tool = objects[toolId];
    if (!target || !tool) return;

    try {
      await engineRef.current.ensureReady();

      const ops = [
        {
          id: 'base',
          type: 'CREATE' as const,
          operation: target.meshData
            ? 'LOAD_MESH'
            : `CREATE_${target.type.toUpperCase()}`,
          parameters: target.meshData
            ? { mesh: target.meshData }
            : target.dimensions,
          dependsOn: [],
          description: 'Initialize base',
        },
        {
          id: 'tool',
          type: 'CREATE' as const,
          operation: tool.meshData
            ? 'LOAD_MESH'
            : `CREATE_${tool.type.toUpperCase()}`,
          parameters: tool.meshData ? { mesh: tool.meshData } : tool.dimensions,
          dependsOn: [],
          description: 'Initialize tool',
        },
        {
          id: 'result',
          type: 'BOOLEAN' as const,
          operation: `BOOLEAN_${op.toUpperCase()}`,
          parameters: { toolGeometryId: 'tool' },
          dependsOn: ['base', 'tool'],
          description: `${op} operation`,
        },
      ];

      const resultId = await engineRef.current.executeSequence(ops);
      const resultData = engineRef.current.getGeometry(resultId);

      if (resultData?.mesh) {
        saveHistory();

        setObjects((prev) => {
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
    if (historyIndex <= 0) return;

    const prevIndex = historyIndex - 1;
    const prevState = history[prevIndex];
    if (!prevState) return;

    setObjects(prevState.objects);
    setSelectedObjectId(prevState.selectedObjectId);
    setSelectedObjectIds(prevState.selectedObjectIds);
    setHistoryIndex(prevIndex);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    const nextIndex = historyIndex + 1;
    const nextState = history[nextIndex];
    if (!nextState) return;

    setObjects(nextState.objects);
    setSelectedObjectId(nextState.selectedObjectId);
    setSelectedObjectIds(nextState.selectedObjectIds);
    setHistoryIndex(nextIndex);
  }, [history, historyIndex]);

  // NEW: Compile intent whenever objects change
  useEffect(() => {
    // Skip if no objects
    if (Object.keys(objects).length === 0) {
      setKernelResult(null);
      return;
    }

    const compileAsync = async () => {
      try {
        // Compile workspace to intent
        const ir = intentCompilerRef.current.compileWorkspace(objects);

        // Push to intent history (only if it's a new intent hash)
        const currentIntent = intentHistoryRef.current.current();
        if (!currentIntent || currentIntent.hash !== ir.hash) {
          intentHistoryRef.current.push(ir);
        }

        // Send to kernel (if available)
        const result = await kernelBridgeRef.current.compileIntent(ir);
        setKernelResult(result);

        // Log the compilation
        console.log('🔧 Intent compiled:', {
          hash: result.intentHash,
          status: result.status,
          operations: ir.operations.length,
          hasMesh: result.mesh !== null,
        });
      } catch (error) {
        console.error('Intent compilation failed:', error);
      }
    };

    compileAsync();
  }, [objects]); // Recompile whenever objects change

  return (
    <WorkspaceContext.Provider
      value={{
        activeTool,
        objects,
        selectedObjectId,
        selectedObjectIds,
        kernelResult,
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
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
