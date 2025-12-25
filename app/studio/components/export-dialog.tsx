"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Info, Loader2 } from "lucide-react"

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  onExport: (options: ExportOptions) => Promise<void>
}

export interface ExportOptions {
  format: 'stl' | 'obj' | 'step' | 'glb'
  quality: 'low' | 'medium' | 'high'
  includeMaterials: boolean
  fileName: string
}

export function ExportDialog({ isOpen, onClose, onExport }: ExportDialogProps) {
  const [format, setFormat] = useState<'stl' | 'obj' | 'step' | 'glb'>('step')
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [includeMaterials, setIncludeMaterials] = useState(true)
  const [fileName, setFileName] = useState(`design-${Date.now()}`)
  const [exporting, setExporting] = useState(false)

  const formats = [
    { id: 'stl', label: 'STL', description: '3D printing format' },
    { id: 'obj', label: 'OBJ', description: 'Mesh format with materials' },
    { id: 'step', label: 'STEP', description: 'CAD exchange format' },
    { id: 'glb', label: 'GLB', description: 'Web 3D format' },
  ] as const

  const qualities = [
    { id: 'low', label: 'Low', polygons: '~10k' },
    { id: 'medium', label: 'Medium', polygons: '~50k' },
    { id: 'high', label: 'High', polygons: '~200k' },
  ] as const

  const handleExport = async () => {
    setExporting(true)
    try {
      await onExport({ format, quality, includeMaterials, fileName })
      onClose()
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Design</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Name */}
          <div>
            <Label htmlFor="file-name" className="text-sm font-medium">
              File Name
            </Label>
            <div className="mt-1 relative">
              <Input
                id="file-name"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name"
                className="pr-20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                .{format}
              </span>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Export Format</Label>
            <div className="grid grid-cols-2 gap-2">
              {formats.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    format === f.id
                      ? 'border-[var(--primary-700)] bg-[var(--primary-50)]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{f.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{f.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Mesh Quality</Label>
            <div className="flex gap-2">
              {qualities.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setQuality(q.id)}
                  className={`flex-1 p-2 rounded-lg border transition-all ${
                    quality === q.id
                      ? 'border-[var(--primary-700)] bg-[var(--primary-50)] text-[var(--primary-700)]'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="font-medium text-xs">{q.label}</div>
                  <div className="text-xs opacity-70">{q.polygons}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Include Materials */}
          {format !== 'stl' && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="include-materials"
                checked={includeMaterials}
                onChange={(e) => setIncludeMaterials(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[var(--primary-700)] focus:ring-[var(--primary-500)]"
              />
              <Label htmlFor="include-materials" className="text-sm">
                Include materials and textures
              </Label>
            </div>
          )}

          {/* Format Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5" />
              <div className="text-xs text-gray-600">
                {format === 'step' && "STEP files preserve exact geometry and are best for manufacturing."}
                {format === 'stl' && "STL files are optimized for 3D printing but don't preserve all features."}
                {format === 'obj' && "OBJ files include mesh data and can reference materials."}
                {format === 'glb' && "GLB files are compact and ideal for web viewing."}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={exporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={!fileName.trim() || exporting}>
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
