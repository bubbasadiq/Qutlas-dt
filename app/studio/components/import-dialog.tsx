"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, X, Loader2, FileText, Box } from "lucide-react"
import { toast } from "sonner"

interface ImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onImport: (files: File[]) => Promise<void>
}

export function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supportedFormats = [
    { ext: '.step', name: 'STEP', description: 'CAD geometry' },
    { ext: '.stp', name: 'STEP', description: 'CAD geometry' },
    { ext: '.iges', name: 'IGES', description: 'Legacy CAD' },
    { ext: '.igs', name: 'IGES', description: 'Legacy CAD' },
    { ext: '.stl', name: 'STL', description: '3D printing' },
    { ext: '.obj', name: 'OBJ', description: 'Mesh format' },
  ]

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (fileList: FileList) => {
    const validFiles = Array.from(fileList).filter(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      const isValid = supportedFormats.some(f => f.ext === ext)
      if (!isValid) {
        toast.error(`Unsupported file type: ${file.name}`)
      }
      return isValid
    })

    setFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleImport = async () => {
    if (files.length === 0) return

    setImporting(true)
    try {
      await onImport(files)
      toast.success(`Imported ${files.length} file${files.length > 1 ? 's' : ''} successfully`)
      setFiles([])
      onClose()
    } catch (error) {
      toast.error('Failed to import files')
    } finally {
      setImporting(false)
    }
  }

  const getFileIcon = (fileName: string) => {
    const ext = '.' + fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case '.step':
      case '.stp':
        return <FileText className="w-8 h-8" />
      case '.iges':
      case '.igs':
        return <FileText className="w-8 h-8" />
      case '.stl':
        return <Box className="w-8 h-8" />
      case '.obj':
        return <Box className="w-8 h-8" />
      default:
        return <FileText className="w-8 h-8" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Files</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-[var(--primary-500)] bg-[var(--primary-50)]'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <Upload size={40} className="mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-700 mb-1">
              Drag and drop files here
            </p>
            <p className="text-xs text-gray-500 mb-3">
              or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".step,.stp,.iges,.igs,.stl,.obj"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* Supported Formats */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">Supported formats:</p>
            <div className="flex flex-wrap gap-2">
              {supportedFormats.map((fmt) => (
                <span
                  key={fmt.ext}
                  className="text-xs px-2 py-1 rounded bg-white border text-gray-600"
                  title={fmt.description}
                >
                  {fmt.ext}
                </span>
              ))}
            </div>
          </div>

          {/* Files List */}
          {files.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </p>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-white border rounded-lg"
                  >
                    {getFileIcon(file.name)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setFiles([])} disabled={files.length === 0 || importing}>
            Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={importing}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={files.length === 0 || importing}
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
