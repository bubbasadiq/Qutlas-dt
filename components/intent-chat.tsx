"use client"

import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sparkles, Send, Loader2, ArrowRight, Paperclip, X } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useWorkspace } from "@/hooks/use-workspace"
import { toast } from "sonner"

interface AttachedFile {
  file: File
  preview: string
  type: "image" | "cad"
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  geometry?: {
    id: string
    type: string
    dimensions: Record<string, number>
    material: string
  }
}

interface IntentChatProps {
  variant?: "hero" | "workspace" | "minimal"
  placeholder?: string
  onGeometryGenerated?: (geometry: any) => void
  className?: string
  initialIntent?: string
}

export function IntentChat({
  variant = "hero",
  placeholder = "Describe what you want to create...",
  onGeometryGenerated,
  className,
  initialIntent,
}: IntentChatProps) {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const [input, setInput] = useState(initialIntent || "")
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Workspace context for workspace variant
  let workspace: ReturnType<typeof useWorkspace> | null = null
  try {
    if (variant === "workspace") {
      workspace = useWorkspace()
    }
  } catch (error) {
    console.warn("Workspace context not available in IntentChat")
  }

  const { append, status, isLoading } = useChat({
    api: "/api/ai/generate",
    onFinish: async (message) => {
      // Parse the response
      try {
        const content = message.content
        let result: any = null
        
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0])
        }

        // Add assistant message to history
        setMessages(prev => [...prev, {
          id: message.id,
          role: 'assistant',
          content: content,
          timestamp: new Date(),
          geometry: result?.geometry,
        }])

        if (result?.geometry) {
          const geoData = result.geometry
          
          // Add to workspace if context available
          if (workspace && result.geometry) {
            const id = geoData.id || `geo_${Date.now()}`
            
            workspace.addObject(id, {
              type: geoData.type || 'box',
              dimensions: geoData.dimensions || {},
              features: geoData.features || [],
              material: geoData.material || 'aluminum',
              description: result.intent?.description || input,
              color: '#0077ff',
              visible: true,
              selected: false,
            })
            
            workspace.selectObject(id)
            
            toast.success('Geometry created successfully!')
          }
          
          if (onGeometryGenerated) {
            onGeometryGenerated(result)
          }
        }
      } catch (error) {
        console.error('Failed to parse AI response:', error)
        toast.error('Failed to generate geometry')
      }
    },
  })

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  // Process initial intent if provided
  useEffect(() => {
    if (initialIntent && variant === "workspace" && user) {
      handleSubmit(initialIntent)
    }
  }, [initialIntent, variant, user])

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/")
      const isCAD = /\.(step|stp|iges|igs|stl|obj|3mf)$/i.test(file.name)

      if (isImage || isCAD) {
        const reader = new FileReader()
        reader.onload = () => {
          setAttachedFiles((prev) => [
            ...prev,
            {
              file,
              preview: isImage ? (reader.result as string) : "",
              type: isImage ? "image" : "cad",
            },
          ])
        }
        reader.readAsDataURL(file)
      }
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (overrideInput?: string) => {
    const userInput = (overrideInput || input).trim()
    if (!userInput && attachedFiles.length === 0) return
    if (isLoading) return

    // If on landing page (hero variant), check authentication first
    if (variant === "hero") {
      if (!user) {
        const encodedIntent = encodeURIComponent(userInput)
        if (attachedFiles.length > 0) {
          sessionStorage.setItem("qutlas_attachments", JSON.stringify(attachedFiles.map((f) => f.preview)))
        }
        sessionStorage.setItem("qutlas_pending_intent", encodedIntent)
        router.push("/auth/login")
        return
      }
      
      const encodedIntent = encodeURIComponent(userInput)
      if (attachedFiles.length > 0) {
        sessionStorage.setItem("qutlas_attachments", JSON.stringify(attachedFiles.map((f) => f.preview)))
      }
      router.push(`/studio?intent=${encodedIntent}`)
      return
    }

    // Add user message to history
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])

    // Build message content with images
    const content: any[] = [{ type: "text", text: userInput || "Analyze this sketch and create geometry based on it." }]

    for (const attached of attachedFiles) {
      if (attached.type === "image" && attached.preview) {
        content.push({
          type: "image",
          image: attached.preview,
        })
      }
    }

    setInput("")
    setAttachedFiles([])

    // Send to AI
    await append({
      role: "user",
      content: content.length === 1 ? userInput : content,
    })
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const suggestions = [
    "Create a bracket with mounting holes",
    "Make a gear with 24 teeth",
    "Design a cylindrical shaft",
  ]

  // Hero variant - Landing page
  if (variant === "hero") {
    return (
      <div className={cn("w-full max-w-2xl mx-auto", className)}>
        {/* Main Input */}
        <div className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Attached Files Preview */}
          {attachedFiles.length > 0 && (
            <div className="flex gap-2 p-3 pb-0 flex-wrap">
              {attachedFiles.map((attached, idx) => (
                <div key={idx} className="relative group">
                  {attached.type === "image" ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/20">
                      <Image
                        src={attached.preview || "/placeholder.svg"}
                        alt="Attached sketch"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                      <span className="text-xs text-white/70 uppercase">{attached.file.name.split(".").pop()}</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--accent-500)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[var(--neutral-900)]" />
            </div>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-white/50 text-lg resize-none outline-none min-h-[44px] py-2"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.step,.stp,.iges,.igs,.stl,.obj,.3mf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="ghost"
              size="icon"
              className="flex-shrink-0 w-10 h-10 rounded-xl text-white/70 hover:text-white hover:bg-white/10"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => handleSubmit()}
              disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
              size="icon"
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-[var(--neutral-900)]"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Auth required message */}
        {!user && !isAuthLoading && (
          <div className="mt-3 text-center">
            <p className="text-sm text-white/70">
              <span className="text-white font-medium">Sign in</span> to create your design
            </p>
          </div>
        )}

        {/* Suggestions */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => setInput(suggestion)}
              className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm hover:bg-white/20 transition-colors border border-white/10"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <p className="mt-4 text-center text-sm text-white/50">
          <Paperclip className="w-4 h-4 inline-block mr-1" />
          Attach sketches or CAD files (STEP, STL, OBJ) for AI analysis
        </p>
      </div>
    )
  }

  // Workspace variant
  if (variant === "workspace") {
    return (
      <div className={cn("w-full", className)}>
        {/* Conversation History */}
        {messages.length > 0 && (
          <div className="mb-4 space-y-3 max-h-60 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "p-3 rounded-lg text-sm",
                  message.role === "user"
                    ? "bg-[var(--primary-700)] text-white ml-4"
                    : "bg-[var(--bg-200)] text-[var(--neutral-700)] mr-4",
                )}
              >
                <p>{message.content}</p>
                {message.geometry && (
                  <div className="mt-2 text-xs opacity-75">
                    Generated: {message.geometry.type} • {JSON.stringify(message.geometry.dimensions)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="mb-3 flex items-center gap-2 text-sm text-[var(--neutral-500)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AI is analyzing your request...</span>
          </div>
        )}

        {/* Attached Files Preview */}
        {attachedFiles.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {attachedFiles.map((attached, idx) => (
              <div key={idx} className="relative group">
                {attached.type === "image" ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-[var(--neutral-200)]">
                    <Image
                      src={attached.preview || "/placeholder.svg"}
                      alt="Attached sketch"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-[var(--bg-200)] border border-[var(--neutral-200)] flex items-center justify-center">
                    <span className="text-xs text-[var(--neutral-500)] uppercase">
                      {attached.file.name.split(".").pop()}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="relative bg-white rounded-xl border border-[var(--neutral-200)] shadow-sm overflow-hidden">
          <div className="flex items-end gap-2 p-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.step,.stp,.iges,.igs,.stl,.obj,.3mf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="ghost"
              size="icon"
              className="flex-shrink-0 w-8 h-8 rounded-lg text-[var(--neutral-400)] hover:text-[var(--neutral-600)] hover:bg-[var(--bg-200)]"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="flex-1 bg-transparent text-[var(--neutral-900)] placeholder-[var(--neutral-400)] text-sm resize-none outline-none min-h-[36px] py-1"
            />
            <Button
              onClick={() => handleSubmit()}
              disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
              size="icon"
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Quick actions */}
        {messages.length === 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs text-[var(--neutral-400)] mb-2">Try saying...</p>
            {[
              "Create a 100mm aluminum box",
              "Make a cylinder 50mm diameter",
              "Design a sphere 25mm radius",
            ].map((action, idx) => (
              <button
                key={idx}
                onClick={() => setInput(action)}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm text-[var(--neutral-600)] hover:bg-[var(--bg-200)] transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Minimal variant
  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-2 bg-white rounded-lg border border-[var(--neutral-200)] px-3 py-2">
        <Sparkles className="w-4 h-4 text-[var(--accent-500)]" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none"
        />
        <Button
          onClick={() => handleSubmit()}
          disabled={!input.trim() || isLoading}
          size="sm"
          variant="ghost"
          className="h-7 px-2"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  )
}
