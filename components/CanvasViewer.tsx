"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import { CanvasViewerProps } from "@/types/workspace"
import { useWorkspace } from "@/hooks/use-workspace"

export const CanvasViewer: React.FC<CanvasViewerProps> = ({ activeTool, onViewChange }) => {
  const { objects, selectedObjectId, selectObject } = useWorkspace()
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const controlsRef = useRef<any>()

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return

    const width = mountRef.current.clientWidth
    const height = mountRef.current.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(200, 200, 200)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Light
    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(100, 200, 100)
    scene.add(light)
    scene.add(new THREE.AmbientLight(0xcccccc, 0.4))

    // Grid
    const grid = new THREE.GridHelper(500, 50)
    scene.add(grid)

    // Orbit Controls
    import("three/examples/jsm/controls/OrbitControls").then(({ OrbitControls }) => {
      const controls = new OrbitControls(camera, renderer.domElement)
      controlsRef.current = controls
      controls.update()
    })

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate)
      controlsRef.current?.update()
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      renderer.dispose()
      mountRef.current?.removeChild(renderer.domElement)
    }
  }, [])

  // Render objects when workspace changes
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    // Remove previous mesh group
    const oldGroup = scene.getObjectByName("workspace-group")
    if (oldGroup) scene.remove(oldGroup)

    const group = new THREE.Group()
    group.name = "workspace-group"

    Object.values(objects).forEach((obj) => {
      if (!obj.meshData) return
      
      // Create geometry from mesh data
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(obj.meshData.vertices, 3))
      if (obj.meshData.indices) {
        geometry.setIndex(new THREE.BufferAttribute(obj.meshData.indices, 1))
      }
      geometry.computeVertexNormals()
      
      const material = new THREE.MeshStandardMaterial({
        color: obj.id === selectedObjectId ? 0x0070f0 : 0x999999,
        transparent: obj.id !== selectedObjectId,
        opacity: obj.id === selectedObjectId ? 1 : 0.8,
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      mesh.userData.id = obj.id
      mesh.cursor = "pointer"
      mesh.onClick = () => selectObject(obj.id)
      group.add(mesh)
    })

    scene.add(group)
  }, [objects, selectedObjectId, selectObject])

  return <div ref={mountRef} className="flex-1 w-full h-full" />
}
