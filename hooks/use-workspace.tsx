"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface WorkspaceState {
  activeTool: string;
  objects: Record<string, any>;
  selectedObjectId: string | null;
  selectTool: (id: string) => void;
  selectObject: (id: string) => void;
  addObject: (id: string, data: any) => void;
  deleteObject: (id: string) => void;
  updateObject: (id: string, data: any) => void;
  getObjectParameters: (id: string) => any;
  updateObjectParameters: (id: string, params: any) => void;
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

  const addObject = (id: string, data: any) => {
    setObjects((prev) => ({ 
      ...prev, 
      [id]: { 
        ...data, 
        id,
        selected: false, 
        visible: true,
        geometry: data.geometry || null,
        params: data.params || data.dimensions || {},
      } 
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

  const updateObject = (id: string, data: any) => {
    setObjects((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...data }
    }));
  };

  const getObjectParameters = (id: string) => {
    return objects[id]?.params;
  };

  const updateObjectParameters = (id: string, params: any) => {
    setObjects((prev) => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: { ...prev[id], params: { ...prev[id].params, ...params } },
      };
    });
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
