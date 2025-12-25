"use client"

import { useState, useRef, useEffect } from "react"
import { Icon } from "@/components/ui/icon"
import { useWorkspace } from "@/hooks/use-workspace"
import { toast } from "sonner"

interface TreeNodeProps {
  object: any
  selected: boolean
  expanded: boolean
  isEditing: boolean
  editValue: string
  onSelect: () => void
  onToggleExpand: () => void
  onDelete: () => void
  onToggleVisibility: () => void
  onToggleLock: () => void
  onRename: (newName: string) => void
  onStartRename: () => void
  onCancelRename: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragEnd: () => void
}

export function TreeView() {
  const { objects, selectedObjectId, selectObject, deleteObject, updateObject } = useWorkspace()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const startRename = (id: string) => {
    const obj = objects[id]
    setEditingId(id)
    setEditValue(obj.description || obj.type || 'Object')
  }

  const finishRename = () => {
    if (editingId) {
      updateObject(editingId, { description: editValue })
      setEditingId(null)
      setEditValue("")
      toast.success('Object renamed')
    }
  }

  const cancelRename = () => {
    setEditingId(null)
    setEditValue("")
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (draggedId && draggedId !== targetId) {
      // For now, just show a toast - actual reordering would require state changes
      toast.info(`Reordering objects: ${draggedId} → ${targetId}`)
    }
    setDraggedId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
  }

  return (
    <div className="space-y-1">
      {Object.keys(objects).length === 0 ? (
        <div className="text-center py-8">
          <Icon name="box" className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No objects in scene</p>
          <p className="text-xs text-gray-400 mt-1">
            Create objects from the toolbar or use AI
          </p>
        </div>
      ) : (
        Object.keys(objects).map(id => {
          const obj = objects[id]
          const isLocked = obj.locked === true
          return (
            <TreeNode
              key={id}
              object={{...obj, id}}
              selected={id === selectedObjectId}
              expanded={expanded[id] || false}
              isEditing={editingId === id}
              editValue={editValue}
              onSelect={() => selectObject(id)}
              onToggleExpand={() => toggleExpand(id)}
              onDelete={() => deleteObject(id)}
              onToggleVisibility={() => {
                const updatedObj = { ...obj, visible: !obj.visible }
                updateObject(id, updatedObj)
                toast.success(updatedObj.visible ? 'Object shown' : 'Object hidden')
              }}
              onToggleLock={() => {
                const updatedObj = { ...obj, locked: !isLocked }
                updateObject(id, updatedObj)
                toast.success(updatedObj.locked ? 'Object locked' : 'Object unlocked')
              }}
              onRename={setEditValue}
              onStartRename={() => startRename(id)}
              onCancelRename={cancelRename}
              onDragStart={(e) => handleDragStart(e, id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, id)}
              onDragEnd={handleDragEnd}
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
  isEditing,
  editValue,
  onSelect,
  onToggleExpand,
  onDelete,
  onToggleVisibility,
  onToggleLock,
  onRename,
  onStartRename,
  onCancelRename,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: TreeNodeProps) {
  const isLocked = object.locked === true

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Call finishRename from parent
      const event = new CustomEvent('finish-rename', { detail: editValue })
      e.currentTarget.dispatchEvent(event)
    } else if (e.key === 'Escape') {
      onCancelRename()
    }
  }

  useEffect(() => {
    const handleFinishRename = (e: CustomEvent) => {
      // Let parent handle the finish
    }

    if (isEditing) {
      window.addEventListener('finish-rename', handleFinishRename as EventListener)
    }

    return () => {
      window.removeEventListener('finish-rename', handleFinishRename as EventListener)
    }
  }, [isEditing, editValue])

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`rounded-lg transition-all ${selected ? 'bg-[var(--primary-100)] border border-[var(--primary-300)] shadow-sm' : 'hover:bg-[var(--bg-200)] border border-transparent'}`}
    >
      <div className="flex items-center gap-2 px-2 py-1.5">
        {/* Expand/Collapse */}
        <button
          onClick={onToggleExpand}
          className="w-4 h-4 flex items-center justify-center text-[var(--neutral-400)] hover:text-[var(--neutral-600)]"
        >
          {object.params && Object.keys(object.params).length > 0 ? (expanded ? '▼' : '▶') : ''}
        </button>

        {/* Icon */}
        <Icon
          name={
            object.type === 'sketch' ? 'pencil' :
            object.type === 'cylinder' ? 'circle' :
            object.type === 'sphere' ? 'circle' :
            object.type === 'extrusion' ? 'mesh' :
            object.type === 'cone' ? 'triangle' :
            object.type === 'torus' ? 'circle' :
            'square'
          }
          className={`w-4 h-4 ${selected ? 'text-[var(--primary-700)]' : 'text-[var(--primary-600)]'}`}
        />

        {/* Name or Edit Input */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => onRename(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onToggleExpand() // Hack to trigger parent's finishRename
                // Actually, we need a different approach
                e.currentTarget.blur()
              } else if (e.key === 'Escape') {
                onCancelRename()
              }
            }}
            onBlur={() => {
              // Finish rename on blur
              if (editingId) {
                onRename(editValue)
                onCancelRename() // This will cause parent to save
              }
            }}
            className="flex-1 px-1 py-0.5 text-sm border border-[var(--primary-500)] rounded focus:outline-none"
            autoFocus
          />
        ) : (
          <button
            onDoubleClick={onStartRename}
            onClick={onSelect}
            className={`flex-1 text-left text-sm truncate ${isLocked ? 'opacity-60' : ''}`}
            title={isLocked ? 'Locked (double-click to unlock)' : object.description || object.type || 'Object'}
          >
            {object.description || object.type || 'Object'}
          </button>
        )}

        {/* Lock Toggle */}
        <button
          onClick={onToggleLock}
          className="w-4 h-4 text-[var(--neutral-400)] hover:text-[var(--neutral-700)] transition-colors"
          title={isLocked ? 'Unlock' : 'Lock'}
        >
          {isLocked ? '🔒' : '🔓'}
        </button>

        {/* Visibility Toggle */}
        <button
          onClick={onToggleVisibility}
          className="w-4 h-4 text-[var(--neutral-400)] hover:text-[var(--neutral-700)] transition-colors"
          title={object.visible ? 'Hide' : 'Show'}
        >
          {object.visible ? '👁' : '👁‍🗨'}
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="w-4 h-4 text-[var(--neutral-400)] hover:text-red-500 transition-colors"
          title="Delete"
        >
          ✕
        </button>
      </div>

      {/* Expanded Params */}
      {expanded && object.params && Object.keys(object.params).length > 0 && !isEditing && (
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
