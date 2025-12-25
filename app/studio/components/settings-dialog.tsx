"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Icon } from "@/components/ui/icon"
import { toast } from "sonner"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface Settings {
  theme: 'light' | 'dark' | 'system'
  showGrid: boolean
  showAxes: boolean
  autoSaveInterval: number // in seconds
  units: 'mm' | 'inch' | 'cm'
  enableNotifications: boolean
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState<Settings>({
    theme: 'system',
    showGrid: true,
    showAxes: true,
    autoSaveInterval: 30,
    units: 'mm',
    enableNotifications: true,
  })

  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('qutlas-settings')
      if (saved) {
        try {
          setSettings(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to load settings:', e)
        }
      }
    }
  }, [isOpen])

  const handleSettingChange = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      localStorage.setItem('qutlas-settings', JSON.stringify(settings))
      toast.success('Settings saved successfully')
      setHasChanges(false)
      onClose()
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      setSettings({
        theme: 'system',
        showGrid: true,
        showAxes: true,
        autoSaveInterval: 30,
        units: 'mm',
        enableNotifications: true,
      })
      setHasChanges(true)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Appearance */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Icon name="palette" className="w-4 h-4" />
              Appearance
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-gray-700">Theme</Label>
                <div className="mt-1 flex gap-2">
                  {[
                    { id: 'light', label: 'Light', icon: 'sun' },
                    { id: 'dark', label: 'Dark', icon: 'moon' },
                    { id: 'system', label: 'System', icon: 'monitor' },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleSettingChange('theme', theme.id as any)}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        settings.theme === theme.id
                          ? 'border-[var(--primary-700)] bg-[var(--primary-50)]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Icon name={theme.icon} className="w-4 h-4" />
                        <span className="text-sm font-medium">{theme.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Workspace */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Icon name="layout" className="w-4 h-4" />
              Workspace
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm text-gray-900">Show Grid</Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Display grid in the viewport
                  </p>
                </div>
                <button
                  onClick={() => handleSettingChange('showGrid', !settings.showGrid)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.showGrid ? 'bg-[var(--primary-700)]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.showGrid ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm text-gray-900">Show Axes</Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Display X/Y/Z axis indicators
                  </p>
                </div>
                <button
                  onClick={() => handleSettingChange('showAxes', !settings.showAxes)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.showAxes ? 'bg-[var(--primary-700)]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.showAxes ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <Label className="text-sm text-gray-900">Units</Label>
                <div className="mt-1 flex gap-2">
                  {['mm', 'inch', 'cm'].map((unit) => (
                    <button
                      key={unit}
                      onClick={() => handleSettingChange('units', unit as any)}
                      className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                        settings.units === unit
                          ? 'border-[var(--primary-700)] bg-[var(--primary-50)] text-[var(--primary-700)]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {unit.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Performance */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Icon name="zap" className="w-4 h-4" />
              Performance
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-gray-900">Auto-save interval</Label>
                <div className="mt-1 flex items-center gap-3">
                  <Input
                    type="number"
                    min={10}
                    max={300}
                    value={settings.autoSaveInterval}
                    onChange={(e) =>
                      handleSettingChange('autoSaveInterval', parseInt(e.target.value) || 30)
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600">seconds</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 10 seconds, maximum 5 minutes
                </p>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Icon name="bell" className="w-4 h-4" />
              Notifications
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm text-gray-900">Enable notifications</Label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Show toast notifications for actions
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('enableNotifications', !settings.enableNotifications)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.enableNotifications ? 'bg-[var(--primary-700)]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.enableNotifications ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </section>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleReset} disabled={saving}>
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
