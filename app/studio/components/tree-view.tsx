"use client"

import { useState } from "react"
import { Icon } from "@/components/ui/icon"
import { useWorkspace } from "@/hooks/use-workspace"

interface TreeNodeProps {
  object: any
  selected: boolean
  expanded: boolean
  onSelect: () => void
  onToggleExpand: () => void
  onDelete: () => void
  onToggleVisibility: () => void
}

export function TreeView() {
  const { objects, selectedObjectId, selectObject, deleteObject, updateObject } = useWorkspace()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  
  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }
  
  return (
    <div className="w-64 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4">Objects</h3>
      
      <div className="space-y-1">
        {Object.keys(objects).length === 0 ? (
          <p className="text-sm text-gray-500">No objects</p>
        ) : (
          Object.keys(objects).map(id => {
            const obj = objects[id]
            return (
              <TreeNode
                key={id}
                object={{...obj, id}}
                selected={id === selectedObjectId}
                expanded={expanded[id] || false}
                onSelect={() => selectObject(id)}
                onToggleExpand={() => toggleExpand(id)}
                onDelete={() => deleteObject(id)}
                onToggleVisibility={() => {
                  const updatedObj = { ...obj, visible: !obj.visible }
                  updateObject(id, updatedObj)
                }}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

function TreeNode({
  object,
  selected,
  expanded,
  onSelect,
  onToggleExpand,
  onDelete,
  onToggleVisibility,
}: TreeNodeProps) {
  return (
    <div className={`rounded transition ${selected ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>
      <div className="flex items-center gap-2 px-2 py-1">
        <button onClick={onToggleExpand} className="w-4 h-4 flex items-center justify-center">
          {object.type !== 'sketch' && (expanded ? '▼' : '▶')}
        </button>
        
        <Icon
          name={
            object.type === 'sketch' ? 'pencil' :
            object.type === 'extrude' ? 'cube' :
            object.type === 'fillet' ? 'radius' : 'cube'
          }
          className="w-4 h-4"
        />
        
        <button onClick={onSelect} className="flex-1 text-left text-sm">
          {object.id}
        </button>
        
        <button
          onClick={onToggleVisibility}
          className="w-4 h-4 text-gray-500 hover:text-gray-700"
          title={object.visible ? 'Hide' : 'Show'}
        >
          {object.visible ? '👁' : '👁‍🗨'}
        </button>
        
        <button
          onClick={onDelete}
          className="w-4 h-4 text-gray-500 hover:text-red-500"
          title="Delete"
        >
          ✕
        </button>
      </div>
      
      {expanded && object.params && (
        <div className="ml-6 text-xs text-gray-600 space-y-1 py-1">
          {Object.entries(object.params).map(([key, value]: [string, any]) => (
            <div key={key}>
              <span className="font-medium">{key}:</span> {String(value).substring(0, 30)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}