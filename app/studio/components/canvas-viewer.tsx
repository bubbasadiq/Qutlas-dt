"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { generateMesh, workspaceObjectToMeshInput } from "@/lib/mesh-generator"
import { setCanvasScene } from "@/lib/canvas-utils"
import { useIsMobile } from "@/hooks/use-media-query"

interface CanvasViewerProps {
  activeTool: string
  workspaceObjects: Record<string, any>
  selectedObjectId: string | null
  onObjectSelect?: (id: string | null) => void
  onViewChange?: (view: string) => void
  onContextMenu?: (position: { x: number; y: number }, actions: any[]) => void
  onFitView?: () => void
  isMobile?: boolean
}

export const CanvasViewer: React.FC<CanvasViewerProps> = ({ 
  activeTool, 
  workspaceObjects,
  selectedObjectId,
  onObjectSelect,
  onViewChange, 
  onContextMenu,
  onFitView,
  isMobile = false,
}) => {
  const isMobileView = isMobile || useIsMobile()
  const [viewType, setViewType] = useState<string>("iso")
  const [showGrid, setShowGrid] = useState(!isMobileView) // Hide grid on mobile by default
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const meshRefs = useRef<Map<string, THREE.Mesh>>(new Map())
  const raycaster = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouse = useRef<THREE.Vector2>(new THREE.Vector2())
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const gridRef = useRef<THREE.GridHelper | null>(null)

  const fitCameraToObjects = () => {
    if (!cameraRef.current || !controlsRef.current || meshRefs.current.size === 0) return

    const camera = cameraRef.current
    const controls = controlsRef.current
    const box = new THREE.Box3()

    // Calculate bounding box of all visible meshes
    meshRefs.current.forEach(mesh => {
      if (mesh.visible) {
        box.expandByObject(mesh)
      }
    })

    if (box.isEmpty()) return

    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = camera.fov * (Math.PI / 180)
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
    
    // Add some padding
    cameraZ *= 1.5

    camera.position.set(center.x + cameraZ * 0.5, center.y + cameraZ * 0.5, center.z + cameraZ * 0.5)
    controls.target.copy(center)
    controls.update()

    if (onFitView) onFitView()
  }

  const handleViewChange = (view: string) => {
    setViewType(view)
    onViewChange?.(view)
    
    // Animate camera to view position
    if (cameraRef.current && controlsRef.current) {
      const camera = cameraRef.current
      const distance = 100
      
      let targetPosition = { x: 0, y: 0, z: 0 }
      
      switch (view) {
        case 'front':
          targetPosition = { x: 0, y: 0, z: distance }
          break
        case 'top':
          targetPosition = { x: 0, y: distance, z: 0 }
          break
        case 'right':
          targetPosition = { x: distance, y: 0, z: 0 }
          break
        case 'iso':
        default:
          targetPosition = { x: distance * 0.7, y: distance * 0.7, z: distance * 0.7 }
          break
      }
      
      camera.position.set(targetPosition.x, targetPosition.y, targetPosition.z)
      controlsRef.current.update()
    }
  }

  const pickObjectAt = (clientX: number, clientY: number): string | null => {
    if (!cameraRef.current || !rendererRef.current || !sceneRef.current) return null

    const rect = rendererRef.current.domElement.getBoundingClientRect()
    mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1
    mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1

    raycaster.current.setFromCamera(mouse.current, cameraRef.current)
    const intersects = raycaster.current.intersectObjects(sceneRef.current.children, true)
    const pickedObject = intersects.find((i) => i.object.userData.id)

    return (pickedObject?.object.userData.id as string | undefined) || null
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const pickedId = pickObjectAt(event.clientX, event.clientY)
    onObjectSelect?.(pickedId)
  }

  const handleCanvasRightClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()

    const objectId = pickObjectAt(event.clientX, event.clientY)

    let actions: any[] = []

    if (objectId) {
      actions = [
        { label: 'Delete', icon: 'trash', objectId },
        { label: 'Duplicate', icon: 'copy', objectId },
        { label: 'Properties', icon: 'settings', objectId },
        { divider: true },
        { label: 'Hide', icon: 'eye-off', objectId },
        { label: 'Lock', icon: 'lock', objectId },
      ]
    } else {
      actions = [
        { label: 'Paste', icon: 'clipboard', disabled: true },
        { label: 'Select All', icon: 'select-all' },
        { divider: true },
        { label: 'Fit View', icon: 'maximize' },
        { label: 'Clear All', icon: 'trash' },
      ]
    }
    
    if (onContextMenu) {
      onContextMenu({ x: event.clientX, y: event.clientY }, actions)
    }
  }

  // Generate THREE.js mesh from geometry metadata using the utility
  const createMeshFromGeometry = (id: string, objectData: any): THREE.Mesh => {
    const input = workspaceObjectToMeshInput(objectData)
    input.selected = Boolean(input.selected || id === selectedObjectId)
    const mesh = generateMesh(input)
    return mesh
  }

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f5f5)

    // Register scene globally so worker-driven geometry updates can render
    setCanvasScene(scene)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      50,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      10000
    )
    camera.position.set(70, 70, 70)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Optimize for mobile
    renderer.shadowMap.enabled = true
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(50, 50, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 1024 // Reduce for mobile performance
    directionalLight.shadow.mapSize.height = 1024
    scene.add(directionalLight)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // Grid - hidden on mobile by default
    const grid = new THREE.GridHelper(100, 20, 0xcccccc, 0xe0e0e0)
    grid.visible = showGrid
    gridRef.current = grid
    scene.add(grid)

    // Axes helper - hidden on mobile by default
    if (!isMobileView) {
      const axesHelper = new THREE.AxesHelper(20)
      scene.add(axesHelper)
    }

    // Orbit controls - optimized for touch on mobile
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enablePan = !isMobileView // Disable pan on mobile for simpler touch interaction
    controls.enableZoom = true
    controls.enableRotate = true
    
    // Touch gestures configuration for mobile
    if (isMobileView) {
      controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }
    }
    
    controlsRef.current = controls

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [isMobileView])

  // Attach selection handler directly to the canvas element (desktop reliability)
  useEffect(() => {
    const canvas = rendererRef.current?.domElement
    if (!canvas) return

    const handlePointerDown = (event: PointerEvent) => {
      // Only primary button; right-click is handled separately
      if (event.button !== 0) return
      const pickedId = pickObjectAt(event.clientX, event.clientY)
      onObjectSelect?.(pickedId)
    }

    canvas.addEventListener("pointerdown", handlePointerDown)
    return () => canvas.removeEventListener("pointerdown", handlePointerDown)
  }, [isMobileView, onObjectSelect])

  // Update grid visibility
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.visible = showGrid
    }
  }, [showGrid])

  // Update meshes when workspace objects change
  useEffect(() => {
    if (!sceneRef.current) return

    const scene = sceneRef.current
    const currentMeshIds = new Set(Object.keys(workspaceObjects))
    const existingMeshIds = new Set(meshRefs.current.keys())

    // Remove deleted objects
    existingMeshIds.forEach(id => {
      if (!currentMeshIds.has(id)) {
        const mesh = meshRefs.current.get(id)
        if (mesh) {
          scene.remove(mesh)
          mesh.geometry.dispose()
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose())
          } else {
            mesh.material.dispose()
          }
          meshRefs.current.delete(id)
        }
      }
    })

    // Add or update objects
    Object.entries(workspaceObjects).forEach(([id, objectData]) => {
      const existingMesh = meshRefs.current.get(id)
      
      // Check if dimensions have changed by comparing stringified dimensions
      const needsRebuild = existingMesh && 
        JSON.stringify(existingMesh.userData.dimensions) !== JSON.stringify(objectData.dimensions)
      
      if (!existingMesh || needsRebuild) {
        // Remove old mesh if rebuilding
        if (existingMesh && needsRebuild) {
          scene.remove(existingMesh)
          existingMesh.geometry.dispose()
          if (Array.isArray(existingMesh.material)) {
            existingMesh.material.forEach(m => m.dispose())
          } else {
            existingMesh.material.dispose()
          }
          meshRefs.current.delete(id)
        }
        
        // Create new mesh
        const mesh = createMeshFromGeometry(id, objectData)
        mesh.userData.id = id
        mesh.userData.dimensions = objectData.dimensions // Store for comparison
        mesh.visible = objectData.visible !== false
        scene.add(mesh)
        meshRefs.current.set(id, mesh)
      } else {
        // Update existing mesh properties without rebuilding
        existingMesh.visible = objectData.visible !== false
        
        // Update selection highlight
        const material = existingMesh.material as THREE.MeshStandardMaterial
        const isSelected = objectData.selected || id === selectedObjectId
        const baseColor = objectData.color ? Number.parseInt(String(objectData.color).replace('#', '0x')) : 0x0077ff

        material.color.setHex(isSelected ? 0xff8800 : baseColor)
        material.emissive.setHex(isSelected ? 0x442200 : 0x000000)
      }
    })
  }, [workspaceObjects, selectedObjectId])

  // Hide viewport controls on mobile
  if (isMobileView) {
    return (
      <div className="flex-1 bg-[var(--bg-100)] relative w-full h-full">
        {/* Three.js Canvas - Full screen on mobile */}
        <div
          ref={mountRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onClick={handleCanvasClick}
          onContextMenu={handleCanvasRightClick}
          style={{
            cursor: activeTool === 'select' ? 'default' :
                   activeTool === 'measure' ? 'crosshair' :
                   activeTool === 'sketch' ? 'crosshair' :
                   'default'
          }}
        />

        {/* Simple Fit View button on mobile - top right */}
        <button
          onClick={fitCameraToObjects}
          className="absolute top-4 right-4 p-3 bg-white rounded-xl shadow-lg touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center transition-transform active:scale-95"
          title="Fit view to all objects (F)"
        >
          <svg className="w-6 h-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </button>

        {/* Active Tool Indicator */}
        {activeTool && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-4 py-2">
            <p className="text-sm">
              <span className="text-[var(--neutral-500)]">Tool:</span>{" "}
              <span className="font-medium text-[var(--primary-700)]">
                {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
              </span>
            </p>
          </div>
        )}

        {/* Measurement Overlay */}
        {activeTool === "measure" && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[var(--accent-500)] text-[var(--neutral-900)] rounded-lg px-4 py-2 shadow-lg">
            <p className="text-sm font-medium">Click two points to measure distance</p>
          </div>
        )}
      </div>
    )
  }

  // Desktop view with full controls
  return (
    <div className="flex-1 bg-[var(--bg-100)] relative flex flex-col">
      {/* Three.js Canvas */}
      <div
        ref={mountRef}
        className="flex-1 w-full h-full cursor-crosshair"
        onClick={handleCanvasClick}
        onContextMenu={handleCanvasRightClick}
        style={{
          cursor: activeTool === 'select' ? 'default' :
                 activeTool === 'measure' ? 'crosshair' :
                 activeTool === 'sketch' ? 'crosshair' :
                 'default'
        }}
      />

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
        <button
          onClick={fitCameraToObjects}
          className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]"
          title="Fit view to all objects (F)"
        >
          Fit View
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
