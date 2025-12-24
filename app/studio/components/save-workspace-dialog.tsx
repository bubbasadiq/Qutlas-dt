"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SaveWorkspaceDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => Promise<void>
}

export function SaveWorkspaceDialog({ isOpen, onClose, onSave }: SaveWorkspaceDialogProps) {
  const [name, setName] = useState(`Workspace ${new Date().toLocaleDateString()}`)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return

    setSaving(true)
    try {
      await onSave(name)
      onClose()
      setName(`Workspace ${new Date().toLocaleDateString()}`)
    } catch (error) {
      // Error handled in parent
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save Workspace</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="workspace-name" className="text-sm font-medium">
              Workspace Name
            </Label>
            <Input
              id="workspace-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter workspace name"
              className="mt-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave()
                }
              }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
