'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAIGeometry } from '@/hooks/use-ai-geometry'

export function AIGeometryPanel() {
  const [intent, setIntent] = useState('')
  const { isGenerating, progress, status, error, generateGeometry } = useAIGeometry()

  const examplePrompts = [
    'Create a bearing: 40mm OD, 20mm ID, 15mm height',
    'Mounting bracket 100x50x10mm with two 8mm holes',
    'Drone frame with 450mm wheelbase, 4 arms',
    'Cylindrical shaft 50mm long, 10mm diameter',
  ]

  const handleGenerate = async () => {
    if (!intent.trim()) return

    try {
      await generateGeometry(intent.trim())
      
      // Clear input on success
      setTimeout(() => {
        setIntent('')
      }, 2000)
    } catch (err) {
      console.error('Generation failed:', err)
    }
  }

  const handleExampleClick = (example: string) => {
    setIntent(example)
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold">AI Geometry Generator</h3>
      </div>

      <Textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        placeholder="Describe what you want to create... E.g., 'Create a bearing with 40mm OD, 20mm ID, 15mm height'"
        disabled={isGenerating}
        className="min-h-[80px] text-sm resize-none disabled:opacity-50"
      />

      {/* Example prompts */}
      {!isGenerating && intent === '' && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-gray-500">Try an example:</p>
          <div className="flex flex-col gap-1">
            {examplePrompts.map((example, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(example)}
                className="text-xs text-left text-blue-600 hover:text-blue-700 hover:underline"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !intent.trim()}
        className="w-full"
        size="sm"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Geometry
          </>
        )}
      </Button>

      {/* Progress indicator */}
      {isGenerating && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{status}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success message */}
      {status === 'Complete!' && !isGenerating && (
        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>Geometry created successfully!</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
