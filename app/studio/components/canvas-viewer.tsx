"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import {
  generateMesh,
  workspaceObjectToMeshInput,
  type MeshGeneratorInput,
} from "@/lib/mesh-generator"
import { setCanvasScene } from "@/lib/canvas-utils"
import { useIsMobile } from "@/hooks/use-media-query"
import type { WorkspaceObject } from "@/hooks/use-workspace"
import { useWorkspaceKernelResult } from "@/hooks/use-workspace-kernel"

interface CanvasViewerProps {
  activeTool: string
  workspaceObjects: Record<string, WorkspaceObject>
  selectedObjectId: string | null
  onObjectSelect?: (id: string | null) => void
  onViewChange?: (view: string) => void
  onContextMenu?: (position: { x: number; y: number }, actions: any[]) => void
  onFitView?: () => void
  isMobile?: boolean
}

const SELECTION_COLOR = 0x2a2a72

function parseHexColor(color: string | undefined, fallback: number): number {
  if (!color) return fallback
  const normalized = color.startsWith("#") ? color.slice(1) : color
  const parsed = Number.parseInt(normalized, 16)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getDimensionsKey(dimensions: Record<string, number | undefined> | undefined): string {
  if (!dimensions) return ""

  return Object.keys(dimensions)
    .sort()
    .map((k) => `${k}:${dimensions[k] ?? ""}`)
    .join("|")
}

function getGeometryKey(obj: WorkspaceObject): string {
  const meshKey = obj.meshData
    ? `mesh:${obj.meshData.vertices.length}:${obj.meshData.indices.length}`
    : "mesh:none"
  return `${obj.type}|${getDimensionsKey(obj.dimensions)}|${meshKey}`
}

function disposeMesh(mesh: THREE.Mesh): void {
  mesh.traverse((child) => {
    const childMesh = child as THREE.Mesh

    if (childMesh.geometry) {
      childMesh.geometry.dispose()
    }

    const material = childMesh.material
    if (!material) return

    if (Array.isArray(material)) {
      material.forEach((m) => m.dispose())
    } else {
      material.dispose()
    }
  })
}

function getOrCreateEdgesMesh(mesh: THREE.Mesh): THREE.LineSegments {
  const existing = mesh.userData.edgesMesh as THREE.LineSegments | undefined
  if (existing) return existing

  const edges = new THREE.EdgesGeometry(mesh.geometry)
  const wireframe = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({
      color: SELECTION_COLOR,
      transparent: true,
      opacity: 0.8,
      depthTest: true,
    })
  )

  wireframe.name = "selection-edges"
  wireframe.visible = false

  mesh.add(wireframe)
  mesh.userData.edgesMesh = wireframe

  return wireframe
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
  
  // Sketch mode state
  const [isSketchMode, setIsSketchMode] = useState(false)
  const [sketchPoints, setSketchPoints] = useState<Array<{x: number; y: number; z: number}>>([])
  const [sketchLines, setSketchLines] = useState<THREE.Line[]>([])

  // NEW: Get kernel result for optional kernel-based rendering
  const kernelResult = useWorkspaceKernelResult()

  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const meshRefs = useRef<Map<string, THREE.Mesh>>(new Map())
  const pickableMeshesRef = useRef<THREE.Object3D[]>([])

  const raycaster = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouse = useRef<THREE.Vector2>(new THREE.Vector2())

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const gridRef = useRef<THREE.GridHelper | null>(null)

  const hoveredIdRef = useRef<string | null>(null)
  const isOrbitingRef = useRef(false)

  const animationFrameRef = useRef<number | null>(null)
  const isLoopRunningRef = useRef(false)
  const renderRequestedRef = useRef(true)
  const idleFramesRef = useRef(0)
  const lastCameraStateRef = useRef({
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    zoom: 1,
  })

  const pointerDownRef = useRef<{ x: number; y: number } | null>(null)

  const requestRender = useCallback(() => {
    renderRequestedRef.current = true

    if (!isLoopRunningRef.current) {
      isLoopRunningRef.current = true
      idleFramesRef.current = 0

      const tick = () => {
        const renderer = rendererRef.current
        const scene = sceneRef.current
        const camera = cameraRef.current
        if (!renderer || !scene || !camera) {
          isLoopRunningRef.current = false
          return
        }

        const controls = controlsRef.current
        controls?.update()

        const last = lastCameraStateRef.current

        const positionDelta = camera.position.distanceToSquared(last.position)
        const quaternionDelta = 1 - Math.abs(camera.quaternion.dot(last.quaternion))
        const zoomDelta = Math.abs(camera.zoom - last.zoom)

        const cameraChanged = positionDelta > 1e-10 || quaternionDelta > 1e-10 || zoomDelta > 1e-10

        const shouldRender = cameraChanged || renderRequestedRef.current

        if (shouldRender) {
          last.position.copy(camera.position)
          last.quaternion.copy(camera.quaternion)
          last.zoom = camera.zoom

          renderer.render(scene, camera)
          renderRequestedRef.current = false
          idleFramesRef.current = 0
        } else {
          idleFramesRef.current += 1
        }

        if (idleFramesRef.current > 10) {
          isLoopRunningRef.current = false
          animationFrameRef.current = null
          return
        }

        animationFrameRef.current = requestAnimationFrame(tick)
      }

      animationFrameRef.current = requestAnimationFrame(tick)
    }
  }, [])

  const applyMeshVisualState = useCallback(
    (meshId: string) => {
      const mesh = meshRefs.current.get(meshId)
      if (!mesh) return

      const objectData = workspaceObjects[meshId]
      const isSelected = Boolean(objectData?.selected || meshId === selectedObjectId)
      const isHovered = hoveredIdRef.current === meshId

      const material = mesh.material as THREE.MeshStandardMaterial
      const baseColor = parseHexColor(objectData?.color, 0x0077ff)

      material.color.setHex(baseColor)

      if (isSelected) {
        material.emissive.setHex(SELECTION_COLOR)
        material.emissiveIntensity = 0.35
      } else if (isHovered) {
        material.emissive.setHex(SELECTION_COLOR)
        material.emissiveIntensity = 0.18
      } else {
        material.emissive.setHex(0x000000)
        material.emissiveIntensity = 0
      }

      const existingEdgesMesh = mesh.userData.edgesMesh as THREE.LineSegments | undefined

      if (isSelected || isHovered) {
        const edgesMesh = existingEdgesMesh ?? getOrCreateEdgesMesh(mesh)
        edgesMesh.visible = true
        const edgesMaterial = edgesMesh.material as THREE.LineBasicMaterial
        edgesMaterial.opacity = isSelected ? 0.85 : 0.35
      } else if (existingEdgesMesh) {
        existingEdgesMesh.visible = false
      }
    },
    [selectedObjectId, workspaceObjects]
  )

  const fitCameraToObjects = () => {
    if (!cameraRef.current || !controlsRef.current || meshRefs.current.size === 0) return

    const camera = cameraRef.current
    const controls = controlsRef.current
    const box = new THREE.Box3()

    meshRefs.current.forEach((mesh) => {
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

    cameraZ *= 1.5

    camera.position.set(center.x + cameraZ * 0.5, center.y + cameraZ * 0.5, center.z + cameraZ * 0.5)
    controls.target.copy(center)
    controls.update()

    requestRender()
    if (onFitView) onFitView()
  }

  const handleViewChange = (view: string) => {
    setViewType(view)
    onViewChange?.(view)

    if (cameraRef.current && controlsRef.current) {
      const camera = cameraRef.current
      const distance = 100

      let targetPosition = { x: 0, y: 0, z: 0 }

      switch (view) {
        case "front":
          targetPosition = { x: 0, y: 0, z: distance }
          break
        case "top":
          targetPosition = { x: 0, y: distance, z: 0 }
          break
        case "right":
          targetPosition = { x: distance, y: 0, z: 0 }
          break
        case "iso":
        default:
          targetPosition = { x: distance * 0.7, y: distance * 0.7, z: distance * 0.7 }
          break
      }

      camera.position.set(targetPosition.x, targetPosition.y, targetPosition.z)
      controlsRef.current.update()
      requestRender()
    }
  }

  const pickObjectAt = useCallback(
    (clientX: number, clientY: number): string | null => {
      const camera = cameraRef.current
      const renderer = rendererRef.current
      if (!camera || !renderer) return null

      const rect = renderer.domElement.getBoundingClientRect()
      mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1
      mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1

      raycaster.current.setFromCamera(mouse.current, camera)

      const intersects = raycaster.current.intersectObjects(pickableMeshesRef.current, true)

      for (const hit of intersects) {
        let obj: THREE.Object3D | null = hit.object
        while (obj && !obj.userData.id) {
          obj = obj.parent
        }
        if (obj?.userData?.id) {
          return obj.userData.id as string
        }
      }

      return null
    },
    []
  )

  const handleCanvasRightClick = useCallback(
    (event: MouseEvent) => {
      event.preventDefault()

      const objectId = pickObjectAt(event.clientX, event.clientY)

      let actions: any[] = []

      if (objectId) {
        actions = [
          { label: "Delete", icon: "trash", objectId },
          { label: "Duplicate", icon: "copy", objectId },
          { label: "Properties", icon: "settings", objectId },
          { divider: true },
          { label: "Hide", icon: "eye-off", objectId },
          { label: "Lock", icon: "lock", objectId },
        ]
      } else {
        actions = [
          { label: "Paste", icon: "clipboard", disabled: true },
          { label: "Select All", icon: "select-all" },
          { divider: true },
          { label: "Fit View", icon: "maximize" },
          { label: "Clear All", icon: "trash" },
        ]
      }

      onContextMenu?.({ x: event.clientX, y: event.clientY }, actions)
    },
    [onContextMenu, pickObjectAt]
  )

  const createMeshFromGeometry = (id: string, objectData: WorkspaceObject): THREE.Mesh => {
    const input: MeshGeneratorInput = {
      ...workspaceObjectToMeshInput(objectData),
      selected: false,
    }

    const mesh = generateMesh(input)
    mesh.userData.id = id
    mesh.userData.geometryKey = getGeometryKey(objectData)

    return mesh
  }

  useEffect(() => {
    if (!mountRef.current) return

    console.log('📐 Canvas mounting with dimensions:', {
      width: mountRef.current.clientWidth,
      height: mountRef.current.clientHeight,
      isMobile: isMobileView
    })

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f5f5)

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

    console.log('📷 Camera positioned at:', camera.position)

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileView ? 1.5 : 2))
    renderer.shadowMap.enabled = true
    renderer.outputColorSpace = THREE.SRGBColorSpace

    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    console.log('🎨 Renderer created, pixel ratio:', window.devicePixelRatio)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(50, 50, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = isMobileView ? 512 : 1024
    directionalLight.shadow.mapSize.height = isMobileView ? 512 : 1024
    scene.add(directionalLight)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const grid = new THREE.GridHelper(100, 20, 0xcccccc, 0xe0e0e0)
    grid.visible = showGrid
    gridRef.current = grid
    scene.add(grid)

    if (!isMobileView) {
      const axesHelper = new THREE.AxesHelper(20)
      scene.add(axesHelper)
    }

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enablePan = !isMobileView
    controls.enableZoom = true
    controls.enableRotate = true

    if (isMobileView) {
      controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }
    }

    controls.addEventListener("start", () => {
      isOrbitingRef.current = true
      requestRender()
    })
    controls.addEventListener("end", () => {
      isOrbitingRef.current = false
      requestRender()
    })
    controls.addEventListener("change", requestRender)

    controlsRef.current = controls

    const ro = new ResizeObserver(() => {
      const container = mountRef.current
      const camera = cameraRef.current
      const renderer = rendererRef.current
      if (!container || !camera || !renderer) return

      const width = container.clientWidth
      const height = container.clientHeight
      if (width === 0 || height === 0) return

      camera.aspect = width / height
      camera.updateProjectionMatrix()

      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileView ? 1.5 : 2))

      console.log('📏 Canvas resized to:', width, 'x', height)
      requestRender()
    })

    ro.observe(mountRef.current)

    requestRender()

    return () => {
      ro.disconnect()

      controls.dispose()
      controlsRef.current = null

      setCanvasScene(null)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      isLoopRunningRef.current = false

      meshRefs.current.forEach((mesh) => {
        scene.remove(mesh)
        disposeMesh(mesh)
      })
      meshRefs.current.clear()
      pickableMeshesRef.current = []

      renderer.dispose()
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement)
      }

      rendererRef.current = null
      cameraRef.current = null
      sceneRef.current = null
    }
  }, [isMobileView, requestRender])

  useEffect(() => {
    const canvas = rendererRef.current?.domElement
    if (!canvas) return

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      pointerDownRef.current = { x: event.clientX, y: event.clientY }
    }

    const handlePointerUp = (event: PointerEvent) => {
      if (event.button !== 0) return
      const down = pointerDownRef.current
      pointerDownRef.current = null

      if (!down) return

      const dx = event.clientX - down.x
      const dy = event.clientY - down.y
      const distSq = dx * dx + dy * dy

      if (distSq > 9 || isOrbitingRef.current) return

      const pickedId = pickObjectAt(event.clientX, event.clientY)
      onObjectSelect?.(pickedId)
    }

    let hoverRaf: number | null = null
    const handlePointerMove = (event: PointerEvent) => {
      if (activeTool !== "select" || isOrbitingRef.current) return

      if (hoverRaf) return
      hoverRaf = requestAnimationFrame(() => {
        hoverRaf = null

        const nextHoveredId = pickObjectAt(event.clientX, event.clientY)
        const prevHoveredId = hoveredIdRef.current

        if (nextHoveredId === prevHoveredId) return

        hoveredIdRef.current = nextHoveredId
        if (prevHoveredId) applyMeshVisualState(prevHoveredId)
        if (nextHoveredId) applyMeshVisualState(nextHoveredId)

        requestRender()
      })
    }

    const handlePointerLeave = () => {
      const prevHoveredId = hoveredIdRef.current
      hoveredIdRef.current = null
      if (prevHoveredId) {
        applyMeshVisualState(prevHoveredId)
        requestRender()
      }
    }

    canvas.addEventListener("pointerdown", handlePointerDown)
    canvas.addEventListener("pointerup", handlePointerUp)
    canvas.addEventListener("pointermove", handlePointerMove)
    canvas.addEventListener("pointerleave", handlePointerLeave)
    canvas.addEventListener("contextmenu", handleCanvasRightClick)

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown)
      canvas.removeEventListener("pointerup", handlePointerUp)
      canvas.removeEventListener("pointermove", handlePointerMove)
      canvas.removeEventListener("pointerleave", handlePointerLeave)
      canvas.removeEventListener("contextmenu", handleCanvasRightClick)

      if (hoverRaf) cancelAnimationFrame(hoverRaf)
    }
  }, [activeTool, applyMeshVisualState, handleCanvasRightClick, onObjectSelect, pickObjectAt, requestRender])

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.visible = showGrid
      requestRender()
    }
  }, [requestRender, showGrid])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    const currentMeshIds = new Set(Object.keys(workspaceObjects))
    const existingMeshIds = new Set(meshRefs.current.keys())

    existingMeshIds.forEach((id) => {
      if (!currentMeshIds.has(id)) {
        const mesh = meshRefs.current.get(id)
        if (mesh) {
          scene.remove(mesh)
          disposeMesh(mesh)
          meshRefs.current.delete(id)
        }
      }
    })

    Object.entries(workspaceObjects).forEach(([id, objectData]) => {
      const existingMesh = meshRefs.current.get(id)
      const nextGeometryKey = getGeometryKey(objectData)

      if (!existingMesh || existingMesh.userData.geometryKey !== nextGeometryKey) {
        if (existingMesh) {
          scene.remove(existingMesh)
          disposeMesh(existingMesh)
          meshRefs.current.delete(id)
        }

        const mesh = createMeshFromGeometry(id, objectData)
        mesh.visible = objectData.visible !== false

        scene.add(mesh)
        meshRefs.current.set(id, mesh)
      } else {
        existingMesh.visible = objectData.visible !== false
      }

      applyMeshVisualState(id)
    })

    pickableMeshesRef.current = Array.from(meshRefs.current.values())

    requestRender()
  }, [applyMeshVisualState, requestRender, selectedObjectId, workspaceObjects])

  // NEW: Optional kernel mesh rendering
  // This effect runs when kernel produces a mesh, allowing kernel-based geometry
  useEffect(() => {
    if (!kernelResult?.mesh || kernelResult.status === 'fallback' || kernelResult.status === 'error') {
      // No kernel mesh available, use legacy rendering (handled by effect above)
      return
    }

    const scene = sceneRef.current
    if (!scene) return

    console.log('🎨 Kernel mesh available:', {
      status: kernelResult.status,
      hash: kernelResult.intentHash,
      vertices: kernelResult.mesh.vertices.length / 3,
      triangles: kernelResult.mesh.indices.length / 3
    })

    // For now, we keep using the legacy mesh generation
    // In the future, this is where we would:
    // 1. Create a single unified mesh from kernel output
    // 2. Replace all individual object meshes with the kernel mesh
    // 3. Handle selection/highlighting on the unified mesh

    // TODO: Implement kernel mesh rendering when kernel produces valid meshes
    // const geometry = new THREE.BufferGeometry()
    // geometry.setAttribute('position', new THREE.BufferAttribute(kernelResult.mesh.vertices, 3))
    // geometry.setIndex(new THREE.BufferAttribute(kernelResult.mesh.indices, 1))
    // if (kernelResult.mesh.normals.length > 0) {
    //   geometry.setAttribute('normal', new THREE.BufferAttribute(kernelResult.mesh.normals, 3))
    // } else {
    //   geometry.computeVertexNormals()
    // }
    // ... (replace scene meshes with kernel mesh)

  }, [kernelResult])

  // Handle sketch mode activation
  useEffect(() => {
    if (activeTool === 'sketch') {
      setIsSketchMode(true)
      console.log('✏️ Sketch mode activated')
    } else {
      setIsSketchMode(false)
      // Clear sketch points when switching away from sketch tool
      setSketchPoints([])
      sketchLines.forEach(line => {
        line.geometry.dispose()
        line.material.dispose()
      })
      setSketchLines([])
    }
  }, [activeTool, sketchLines])

  // Add sketch click handler
  useEffect(() => {
    const canvas = rendererRef.current?.domElement
    if (!canvas || !isSketchMode) return

    const handleSketchClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Use raycaster to find 3D position on the ground plane
      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2(
        (x / rect.width) * 2 - 1,
        -(y / rect.height) * 2 + 1
      )

      const camera = cameraRef.current
      if (!camera) return

      raycaster.setFromCamera(mouse, camera)

      // Create a ground plane at y=0 for intersection
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const intersectionPoint = new THREE.Vector3()
      
      if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
        console.log('📍 Sketch point added:', intersectionPoint)
        
        // Add point to sketch
        const newPoint = { x: intersectionPoint.x, y: intersectionPoint.y, z: intersectionPoint.z }
        const newPoints = [...sketchPoints, newPoint]
        setSketchPoints(newPoints)
        
        // Draw line from previous point
        if (sketchPoints.length > 0) {
          const scene = sceneRef.current
          if (scene) {
            const prevPoint = sketchPoints[sketchPoints.length - 1]
            const points = [
              new THREE.Vector3(prevPoint.x, prevPoint.y, prevPoint.z),
              new THREE.Vector3(newPoint.x, newPoint.y, newPoint.z)
            ]
            const geometry = new THREE.BufferGeometry().setFromPoints(points)
            const material = new THREE.LineBasicMaterial({ color: 0x2a2a72 })
            const line = new THREE.Line(geometry, material)
            scene.add(line)
            setSketchLines([...sketchLines, line])
          }
        }
      }
    }

    const handleSketchDoubleClick = (event: MouseEvent) => {
      if (sketchPoints.length < 3) {
        console.log('Need at least 3 points for a sketch')
        return
      }

      console.log('✅ Sketch completed with', sketchPoints.length, 'points')
      // TODO: Convert sketch to extrusion
      // For now, just log and clear
      
      // Clear sketch
      setSketchPoints([])
      sketchLines.forEach(line => {
        line.geometry.dispose()
        line.material.dispose()
      })
      setSketchLines([])
    }

    canvas.addEventListener('click', handleSketchClick)
    canvas.addEventListener('dblclick', handleSketchDoubleClick)

    return () => {
      canvas.removeEventListener('click', handleSketchClick)
      canvas.removeEventListener('dblclick', handleSketchDoubleClick)
    }
  }, [isSketchMode, sketchPoints, sketchLines])

  // Hide viewport controls on mobile
  if (isMobileView) {
    return (
      <div className="flex-1 bg-[var(--bg-100)] relative w-full h-full">
        {/* Three.js Canvas - Full screen on mobile */}
        <div
          ref={mountRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          style={{
            cursor:
              activeTool === "select"
                ? "default"
                : activeTool === "measure"
                  ? "crosshair"
                  : activeTool === "sketch"
                    ? "crosshair"
                    : "default",
          }}
        />

        {/* Simple Fit View button on mobile - top right */}
        <button
          onClick={fitCameraToObjects}
          className="absolute top-4 right-4 p-3 bg-white rounded-xl shadow-lg touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center transition-transform active:scale-95"
          title="Fit view to all objects (F)"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
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
    <div className="flex-1 bg-[var(--bg-100)] relative flex flex-col h-full w-full">
      {/* Three.js Canvas */}
      <div
        ref={mountRef}
        className="flex-1 w-full cursor-crosshair"
        style={{
          cursor:
            activeTool === "select"
              ? "default"
              : activeTool === "measure"
                ? "crosshair"
                : activeTool === "sketch"
                  ? "crosshair"
                  : "default",
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
