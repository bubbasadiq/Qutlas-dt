"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

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
}

interface WorkspaceState {
  activeTool: string;
  objects: Record<string, WorkspaceObject>;
  selectedObjectId: string | null;
  selectTool: (id: string) => void;
  selectObject: (id: string) => void;
  addObject: (id: string, data: Partial<WorkspaceObject>) => void;
  deleteObject: (id: string) => void;
  updateObject: (id: string, data: Partial<WorkspaceObject>) => void;
  getObjectParameters: (id: string) => any;
  updateObjectParameters: (id: string, params: any) => void;
  updateObjectGeometry: (id: string, geometry: Partial<WorkspaceObject>) => void;
  getObjectGeometry: (id: string) => WorkspaceObject | undefined;
  clearWorkspace: () => void;
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [activeTool, setActiveTool] = useState("select");
  const [objects, setObjects] = useState<Record<string, any>>({});
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  const selectTool = (id: string) => setActiveTool(id);

  const selectObject = (id: string) => {
    setObjects((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        // Create new object to avoid mutation if strict mode
        next[k] = { ...next[k], selected: k === id };
      });
      return next;
    });
    setSelectedObjectId(id);
  };

  const addObject = (id: string, data: Partial<WorkspaceObject>) => {
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
    setObjects((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    if (selectedObjectId === id) {
      setSelectedObjectId(null);
    }
  };

  const updateObject = (id: string, data: Partial<WorkspaceObject>) => {
    setObjects((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...data } as WorkspaceObject
    }));
  };

  const getObjectParameters = (id: string) => {
    return objects[id]?.params || objects[id]?.dimensions;
  };

  const updateObjectParameters = (id: string, params: any) => {
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

  const clearWorkspace = () => {
    setObjects({});
    setSelectedObjectId(null);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        activeTool,
        objects,
        selectedObjectId,
        selectTool,
        selectObject,
        addObject,
        deleteObject,
        updateObject,
        getObjectParameters,
        updateObjectParameters,
        updateObjectGeometry,
        getObjectGeometry,
        clearWorkspace,
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
