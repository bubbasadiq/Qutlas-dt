"use client"

import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sparkles, Send, Loader2, ArrowRight, Paperclip, X } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface AttachedFile {
  file: File
  preview: string
  type: "image" | "cad"
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
  const [input, setInput] = useState(initialIntent || "")
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { messages, append, status } = useChat({
    api: "/api/ai/geometry",
    onFinish: (message) => {
      if (onGeometryGenerated && message.toolInvocations) {
        const geometryResult = message.toolInvocations.find(
          (t) => t.toolName === "generateGeometry" && t.state === "result",
        )
        if (geometryResult && "result" in geometryResult) {
          onGeometryGenerated(geometryResult.result)
        }
      }
    },
  })

  const isLoading = status === "streaming"

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  // Process initial intent if provided
  useEffect(() => {
    if (initialIntent && variant === "workspace") {
      handleSubmit(initialIntent)
    }
  }, [initialIntent, variant])

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

    // Reset input
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

    // If on landing page (hero variant), redirect to workspace with the intent
    if (variant === "hero") {
      const encodedIntent = encodeURIComponent(userInput)
      // Store attached files in sessionStorage for workspace to pick up
      if (attachedFiles.length > 0) {
        sessionStorage.setItem("qutlas_attachments", JSON.stringify(attachedFiles.map((f) => f.preview)))
      }
      router.push(`/studio?intent=${encodedIntent}`)
      return
    }

    // Build message content with images
    const content: any[] = [{ type: "text", text: userInput || "Analyze this sketch and create geometry based on it." }]

    // Add images to the message
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

        {/* Hint about attachments */}
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
        {/* Messages */}
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
                {typeof message.content === "string" ? (
                  <p>{message.content}</p>
                ) : (
                  Array.isArray(message.content) &&
                  message.content.map((part: any, idx: number) => {
                    if (part.type === "text") return <p key={idx}>{part.text}</p>
                    if (part.type === "image")
                      return (
                        <Image
                          key={idx}
                          src={part.image || "/placeholder.svg"}
                          alt="Attached"
                          width={100}
                          height={100}
                          className="rounded mt-2"
                        />
                      )
                    return null
                  })
                )}
                {message.toolInvocations?.map((tool, idx) => {
                  if (tool.toolName === "generateGeometry") {
                    if (tool.state === "call") {
                      return (
                        <p key={idx} className="text-[var(--accent-600)] mt-2">
                          Generating geometry...
                        </p>
                      )
                    }
                    if (tool.state === "result") {
                      return (
                        <p key={idx} className="text-green-600 mt-2">
                          Geometry created successfully
                        </p>
                      )
                    }
                  }
                  return null
                })}
              </div>
            ))}
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

        {/* Quick actions for workspace */}
        {messages.length === 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs text-[var(--neutral-400)] mb-2">Quick actions</p>
            {["Add a hole", "Fillet edges", "Extrude face"].map((action, idx) => (
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
