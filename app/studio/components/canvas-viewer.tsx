"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import * as THREE from "three"

interface CanvasViewerProps {
  activeTool: string
  onViewChange?: (view: string) => void
  shapes?: any[]
  meshGetter?: (shape: any) => Promise<{ vertices: Float32Array; indices: Uint32Array }>
  onContextMenu?: (position: { x: number; y: number }, actions: any[]) => void
}

export const CanvasViewer: React.FC<CanvasViewerProps> = ({ activeTool, onViewChange, shapes = [], meshGetter, onContextMenu }) => {
  const [viewType, setViewType] = useState<string>("iso")
  const [showGrid, setShowGrid] = useState(true)
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const meshRefs = useRef<Map<any, THREE.Mesh>>(new Map())
  const raycaster = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouse = useRef<THREE.Vector2>(new THREE.Vector2())
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const rendererRef = useRef<THREE.WebGLRenderer>()

  const handleViewChange = (view: string) => {
    setViewType(view)
    onViewChange?.(view)
  }

  const handleCanvasRightClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    
    if (!cameraRef.current || !rendererRef.current || !sceneRef.current) return
    
    // Calculate mouse position in normalized device coordinates
    const rect = rendererRef.current.domElement.getBoundingClientRect()
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    // Raycast to find object under cursor
    raycaster.current.setFromCamera(mouse.current, cameraRef.current)
    const intersects = raycaster.current.intersectObjects(sceneRef.current.children, true)
    const pickedObject = intersects.length > 0 ? intersects[0].object : null
    
    let actions: any[] = []
    
    if (pickedObject && pickedObject.userData.id) {
      // Right-clicked on object
      const objectId = pickedObject.userData.id
      actions = [
        {
          label: 'Delete',
          icon: 'trash',
          objectId: objectId,
          onClick: () => {
            console.log('Delete object:', objectId)
          },
        },
        {
          label: 'Duplicate',
          icon: 'copy',
          objectId: objectId,
          onClick: () => {
            console.log('Duplicate object:', objectId)
          },
        },
        {
          label: 'Properties',
          icon: 'settings',
          objectId: objectId,
          onClick: () => {
            console.log('Show properties for:', objectId)
          },
        },
        { divider: true },
        {
          label: 'Hide',
          icon: 'eye-off',
          objectId: objectId,
          onClick: () => {
            console.log('Hide object:', objectId)
          },
        },
        {
          label: 'Lock',
          icon: 'lock',
          objectId: objectId,
          onClick: () => {
            console.log('Lock object:', objectId)
          },
        },
      ]
    } else {
      // Right-clicked on empty space
      actions = [
        {
          label: 'Paste',
          icon: 'clipboard',
          onClick: () => {
            console.log('Paste object')
          },
          disabled: true, // No clipboard functionality yet
        },
        {
          label: 'Select All',
          icon: 'select-all',
          onClick: () => {
            console.log('Select all objects')
          },
        },
        { divider: true },
        {
          label: 'Fit View',
          icon: 'maximize',
          onClick: () => {
            console.log('Fit view to all')
          },
        },
        {
          label: 'Clear All',
          icon: 'trash',
          onClick: () => {
            console.log('Clear workspace')
          },
        },
      ]
    }
    
    if (onContextMenu) {
      onContextMenu({ x: event.clientX, y: event.clientY }, actions)
    }
  }

  // Initialize Three.js scene
  useEffect(() => {
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(20, 20, 20)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    mountRef.current?.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(30, 30, 30)
    scene.add(light)

    const ambient = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambient)

    const grid = new THREE.GridHelper(100, 100)
    grid.visible = showGrid
    scene.add(grid)

    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      renderer.dispose()
      mountRef.current?.removeChild(renderer.domElement)
    }
  }, [])

  // Update meshes whenever shapes change
  useEffect(() => {
    if (!sceneRef.current || !meshGetter) return

    shapes.forEach(async (shape) => {
      if (!meshRefs.current.has(shape)) {
        const meshData = await meshGetter(shape)
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute("position", new THREE.BufferAttribute(meshData.vertices, 3))
        geometry.setIndex(new THREE.BufferAttribute(meshData.indices, 1))

        const material = new THREE.MeshStandardMaterial({ color: 0x0077ff, wireframe: true })
        const mesh = new THREE.Mesh(geometry, material)

        sceneRef.current!.add(mesh)
        meshRefs.current.set(shape, mesh)
      }
    })
  }, [shapes, meshGetter])

  return (
    <div className="flex-1 bg-[var(--bg-100)] relative flex flex-col">
      {/* Three.js Canvas */}
      <div 
        ref={mountRef} 
        className="flex-1" 
        onContextMenu={handleCanvasRightClick}
      />

      {/* Rest of the UI remains unchanged */}
      {/* View Controls */}
      <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg p-2 flex flex-col gap-2">
        <div className="flex gap-1">
          {["iso", "top", "front", "right"].map((view) => (
            <button
              key={view}
              onClick={() => handleViewChange(view)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                viewType === view
                  ? "bg-[var(--primary-700)] text-white"
                  : "text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]"
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            showGrid
              ? "bg-[var(--accent-100)] text-[var(--accent-700)]"
              : "text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]"
          }`}
        >
          Grid {showGrid ? "On" : "Off"}
        </button>
      </div>

      {/* Active Tool Indicator */}
      {activeTool && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-4 py-2">
          <p className="text-sm">
            <span className="text-[var(--neutral-500)]">Tool:</span>{" "}
            <span className="font-medium text-[var(--primary-700)]">
              {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
            </span>
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Icon name="simulation" size={18} />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Icon name="cmm" size={18} />
        </Button>
        <div className="w-px h-6 bg-[var(--neutral-200)]" />
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Icon name="camera" size={18} />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Icon name="download" size={18} />
        </Button>
      </div>

      {/* Measurement Overlay */}
      {activeTool === "measure" && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[var(--accent-500)] text-[var(--neutral-900)] rounded-lg px-4 py-2 shadow-lg">
          <p className="text-sm font-medium">Click two points to measure distance</p>
        </div>
      )}
    </div>
  )
}
