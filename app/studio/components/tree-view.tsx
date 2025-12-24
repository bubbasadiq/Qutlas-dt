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
    <div className="space-y-1">
      {Object.keys(objects).length === 0 ? (
        <p className="text-sm text-[var(--neutral-500)]">No objects in scene</p>
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
    <div className={`rounded-lg transition-colors ${selected ? 'bg-[var(--primary-100)] border border-[var(--primary-300)]' : 'hover:bg-[var(--bg-200)] border border-transparent'}`}>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <button 
          onClick={onToggleExpand} 
          className="w-4 h-4 flex items-center justify-center text-[var(--neutral-400)] hover:text-[var(--neutral-600)]"
        >
          {object.params && Object.keys(object.params).length > 0 && (expanded ? '▼' : '▶')}
        </button>
        
        <Icon
          name={
            object.type === 'sketch' ? 'pencil' :
            object.type === 'cylinder' ? 'cylinder' :
            object.type === 'sphere' ? 'sphere' :
            object.type === 'extrusion' ? 'extrude' :
            'cube'
          }
          className="w-4 h-4 text-[var(--primary-600)]"
        />
        
        <button onClick={onSelect} className="flex-1 text-left text-sm text-[var(--neutral-900)]">
          {object.type || 'Object'}
        </button>
        
        <button
          onClick={onToggleVisibility}
          className="w-4 h-4 text-[var(--neutral-400)] hover:text-[var(--neutral-700)] transition-colors"
          title={object.visible ? 'Hide' : 'Show'}
        >
          {object.visible ? '👁' : '👁‍🗨'}
        </button>
        
        <button
          onClick={onDelete}
          className="w-4 h-4 text-[var(--neutral-400)] hover:text-red-500 transition-colors"
          title="Delete"
        >
          ✕
        </button>
      </div>
      
      {expanded && object.params && Object.keys(object.params).length > 0 && (
        <div className="ml-6 text-xs text-[var(--neutral-600)] space-y-1 py-1 px-2 bg-[var(--bg-100)] rounded">
          {Object.entries(object.params).map(([key, value]: [string, any]) => (
            <div key={key}>
              <span className="font-medium text-[var(--neutral-700)]">{key}:</span>{' '}
              <span className="text-[var(--neutral-500)]">{String(value).substring(0, 30)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}