"use client"

import { useState } from "react"
import { Icon } from "@/components/ui/icon"
import { useWorkspace } from "@/hooks/use-workspace"
import { useIsMobile } from "@/hooks/use-media-query"

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
  const isMobile = useIsMobile()
  const { objects, selectedObjectId, selectObject, deleteObject, updateObject } = useWorkspace()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  
  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Mobile optimized styles
  const containerClass = isMobile ? "space-y-2" : "space-y-1"
  const nodeClass = isMobile
    ? "rounded-xl transition-colors min-h-[52px]"
    : "rounded-lg transition-colors"
  const nodeSelectedClass = isMobile
    ? "bg-[var(--primary-100)] border-2 border-[var(--primary-400)]"
    : "bg-[var(--primary-100)] border border-[var(--primary-300)]"
  const nodeNormalClass = isMobile
    ? "hover:bg-[var(--bg-200)] border-2 border-transparent"
    : "hover:bg-[var(--bg-200)] border border-transparent"
  const rowClass = isMobile ? "flex items-center gap-3 px-4 py-3" : "flex items-center gap-2 px-2 py-1.5"
  const iconButtonClass = isMobile ? "w-8 h-8" : "w-4 h-4"
  const actionButtonClass = isMobile ? "w-10 h-10" : "w-4 h-4"
  
  return (
    <div className={containerClass}>
      {Object.keys(objects).length === 0 ? (
        <p className="text-base text-[var(--neutral-500)] p-4">No objects in scene</p>
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
              isMobile={isMobile}
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
  isMobile = false,
}: TreeNodeProps & { isMobile?: boolean }) {
  const nodeClass = isMobile
    ? "rounded-xl transition-colors min-h-[52px]"
    : "rounded-lg transition-colors"
  const nodeSelectedClass = isMobile
    ? "bg-[var(--primary-100)] border-2 border-[var(--primary-400)]"
    : "bg-[var(--primary-100)] border border-[var(--primary-300)]"
  const nodeNormalClass = isMobile
    ? "hover:bg-[var(--bg-200)] border-2 border-transparent"
    : "hover:bg-[var(--bg-200)] border border-transparent"
  const rowClass = isMobile ? "flex items-center gap-3 px-4 py-3" : "flex items-center gap-2 px-2 py-1.5"
  const iconButtonClass = isMobile ? "w-8 h-8 flex items-center justify-center" : "w-4 h-4 flex items-center justify-center"
  const actionButtonClass = isMobile ? "w-10 h-10" : "w-4 h-4"
  
  return (
    <div className={`${nodeClass} ${selected ? nodeSelectedClass : nodeNormalClass}`}>
      <div className={rowClass}>
        <button 
          onClick={onToggleExpand} 
          className={iconButtonClass}
        >
          {object.params && Object.keys(object.params).length > 0 && (
            <span className={`text-[var(--neutral-400)] ${isMobile ? 'text-base' : 'text-xs'}`}>
              {expanded ? '▼' : '▶'}
            </span>
          )}
        </button>
        
        <Icon
          name={
            object.type === 'sketch' ? 'pencil' :
            object.type === 'cylinder' ? 'cylinder' :
            object.type === 'sphere' ? 'sphere' :
            object.type === 'extrusion' ? 'extrude' :
            'cube'
          }
          className={`${isMobile ? 'w-6 h-6' : 'w-4 h-4'} text-[var(--primary-600)]`}
        />
        
        <button onClick={onSelect} className={`flex-1 text-left ${isMobile ? 'text-base' : 'text-sm'} text-[var(--neutral-900)]`}>
          {object.type || 'Object'}
        </button>
        
        <button
          onClick={onToggleVisibility}
          className={`${actionButtonClass} text-[var(--neutral-400)] hover:text-[var(--neutral-700)] transition-colors flex items-center justify-center`}
          title={object.visible ? 'Hide' : 'Show'}
        >
          {object.visible ? '👁' : '👁‍🗨'}
        </button>
        
        <button
          onClick={onDelete}
          className={`${actionButtonClass} text-[var(--neutral-400)] hover:text-red-500 transition-colors flex items-center justify-center`}
          title="Delete"
        >
          ✕
        </button>
      </div>
      
      {expanded && object.params && Object.keys(object.params).length > 0 && (
        <div className={`${isMobile ? 'ml-4 py-3 px-4' : 'ml-6 text-xs py-1 px-2'} bg-[var(--bg-100)] rounded-lg space-y-1 mx-2 mb-2`}>
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
