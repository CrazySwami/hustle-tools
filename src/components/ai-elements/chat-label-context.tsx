"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { FileCode } from "lucide-react"

interface AttachedFile {
  id: string
  name: string
  type: "image" | "file"
  size: string
  url?: string
}

interface ProjectContext {
  title: string
  tags: string[]
  prompt: string
  fileCount: number
}

const getExtensionColor = (extension: string): string => {
  const colors: Record<string, string> = {
    HTML: "text-orange-400",
    CSS: "text-blue-400",
    JS: "text-amber-400",
    PHP: "text-purple-400",
    DOC: "text-cyan-400",
  }
  return colors[extension] || "text-gray-400"
}

export function ChatInputUI() {
  const [message, setMessage] = useState("Ask me to modify the Elementor JSON...")
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [showPricingBadge, setShowPricingBadge] = useState(true)
  const [isDocumentMode, setIsDocumentMode] = useState(false)
  const [animationStage, setAnimationStage] = useState(0)
  const [projectContext] = useState<ProjectContext>({
    title: "Create A Pricing",
    tags: ["HTML", "CSS", "JS", "PHP"],
    prompt:
      "Create a modern pricing page with three tiers (Basic, Pro, Enterprise). Include feature comparisons, toggle for monthly/yearly pricing, and highlight the Pro tier as most popular.",
    fileCount: 12,
  })

  useEffect(() => {
    const stages = [
      { delay: 0, stage: 1 }, // Badge appears
      { delay: 300, stage: 2 }, // Slides up
      { delay: 600, stage: 3 }, // Content loads
      { delay: 900, stage: 4 }, // Tags appear one by one
      { delay: 1500, stage: 5 }, // Green light flashes
    ]

    stages.forEach(({ delay, stage }) => {
      setTimeout(() => setAnimationStage(stage), delay)
    })
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: AttachedFile[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type.startsWith("image/") ? "image" : "file",
      size: formatFileSize(file.size),
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }))

    setAttachedFiles([...attachedFiles, ...newFiles])
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const removeFile = (id: string) => {
    setAttachedFiles(attachedFiles.filter((f) => f.id !== id))
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3">
      {/* Badge with animation sequence */}
      <div className="flex justify-center items-center gap-3">
        <button
          onClick={() => setShowPricingBadge(!showPricingBadge)}
          className={`group relative inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium tracking-tight shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] overflow-hidden rounded-full
            ${animationStage === 0 ? "opacity-0 translate-y-4" : ""}
            ${animationStage === 1 ? "opacity-100 translate-y-4" : ""}
            ${animationStage >= 2 ? "opacity-100 translate-y-0" : ""}
          `}
        >
          {/* Green dot with flash animation */}
          <div
            className={`h-2 w-2 rounded-full bg-green-500 transition-all duration-300
              ${animationStage >= 5 ? "animate-pulse" : "opacity-0"}
              ${animationStage >= 3 ? "opacity-100" : ""}
            `}
          />

          {/* Content that appears after slide up */}
          {animationStage >= 3 && (
            <>
              <span className="text-xs opacity-70 animate-in fade-in slide-in-from-left-2 duration-300">
                Currently Project
              </span>
              <span className="text-xs opacity-50 animate-in fade-in duration-300" style={{ animationDelay: "100ms" }}>
                •
              </span>
              <FileCode
                className="h-4 w-4 text-orange-400 transition-transform duration-500 group-hover:rotate-12 animate-in fade-in slide-in-from-left-2 duration-300"
                style={{ animationDelay: "200ms" }}
              />
              <span
                className="animate-in fade-in slide-in-from-left-2 duration-300"
                style={{ animationDelay: "300ms" }}
              >
                {projectContext.title}
              </span>

              {/* File types mode or document count mode */}
              {!isDocumentMode ? (
                <div className="flex items-center gap-1.5 ml-1">
                  {projectContext.tags.map((tag, i) => (
                    <span
                      key={tag}
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded ${getExtensionColor(tag)} animate-in fade-in slide-in-from-right-2 duration-300`}
                      style={{ animationDelay: `${400 + i * 100}ms` }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 ml-1 animate-in fade-in slide-in-from-right-2 duration-300"
                  style={{ animationDelay: "400ms" }}
                >
                  <div className="h-4 w-px bg-white/30" />
                  <span className="text-xs opacity-70">{projectContext.fileCount} files</span>
                </div>
              )}
            </>
          )}

          <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </button>

        {/* Toggle button for switching modes */}
        {animationStage >= 3 && (
          <button
            onClick={() => setIsDocumentMode(!isDocumentMode)}
            className="px-3 py-1.5 bg-black/50 hover:bg-black text-white text-xs rounded-full transition-all duration-300 animate-in fade-in slide-in-from-right-2"
            style={{ animationDelay: "800ms" }}
          >
            {isDocumentMode ? "Show Types" : "Show Count"}
          </button>
        )}
      </div>
    </div>
  )
}
