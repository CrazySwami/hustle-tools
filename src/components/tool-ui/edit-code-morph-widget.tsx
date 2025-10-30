"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Loader2, CheckCircle2, XCircle, AlertCircle, ChevronDown } from "lucide-react"
import { useEditorContent } from "@/hooks/useEditorContent"
import { useUsageTracking } from "@/hooks/useUsageTracking"

interface EditCodeMorphWidgetProps {
  data: {
    file: "html" | "css" | "js" | "php"
    instruction: string
    lazyEdit: string
    status?: string
    message?: string
  }
  onSwitchCodeTab?: (tab: "html" | "css" | "js" | "php") => void
}

type WidgetState = "idle" | "loading" | "success" | "error"

export function EditCodeMorphWidget({ data, onSwitchCodeTab }: EditCodeMorphWidgetProps) {
  console.log("🌀 EditCodeMorphWidget rendered with data:", data)

  const { getContent, updateContent } = useEditorContent()
  const { recordUsage } = useUsageTracking()

  const [isCollapsed, setIsCollapsed] = useState(false)

  // Create unique key for this tool invocation based on file + instruction
  const storageKey = `morph-widget-${data.file}-${data.instruction.substring(0, 50).replace(/\s+/g, "-")}`

  // Initialize state from localStorage if available
  const [state, setState] = useState<WidgetState>(() => {
    if (typeof window === "undefined") return "idle"
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        console.log("📦 Restored widget state from localStorage:", parsed.state)
        return parsed.state
      } catch {
        return "idle"
      }
    }
    return "idle"
  })

  const [originalCode, setOriginalCode] = useState<string>("")
  const [mergedCode, setMergedCode] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [stats, setStats] = useState<any>(() => {
    if (typeof window === "undefined") return null
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        return JSON.parse(saved).stats || null
      } catch {
        return null
      }
    }
    return null
  })
  const [usage, setUsage] = useState<any>(() => {
    if (typeof window === "undefined") return null
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        return JSON.parse(saved).usage || null
      } catch {
        return null
      }
    }
    return null
  })

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return
    const stateData = {
      state,
      stats,
      usage,
      timestamp: Date.now(),
    }
    localStorage.setItem(storageKey, JSON.stringify(stateData))
    console.log("💾 Saved widget state to localStorage:", state)
  }, [state, stats, usage, storageKey])

  // Load current code on mount
  useEffect(() => {
    const allContent = getContent()
    const currentCode = allContent[data.file] || ""
    setOriginalCode(currentCode)

    console.log(`📄 Loaded ${data.file} content:`, {
      length: currentCode.length,
      lazyEditLength: data.lazyEdit.length,
      efficiency: `${Math.round((data.lazyEdit.length / (currentCode.length || 1)) * 100)}%`,
    })
  }, [data.file, getContent])

  const handleApplyChanges = async () => {
    try {
      setState("loading")
      setErrorMessage("")

      console.log(`🚀 Calling Morph API for ${data.file}...`)

      const response = await fetch("/api/morph-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: data.instruction,
          originalCode,
          lazyEdit: data.lazyEdit,
          fileType: data.file,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Morph API failed: ${response.statusText}`)
      }

      console.log("✅ Morph merge successful:", {
        originalLength: result.stats.originalLength,
        mergedLength: result.stats.mergedLength,
        tokensUsed: result.usage.totalTokens,
        cost: `$${result.usage.cost.toFixed(6)}`,
        durationMs: result.stats.durationMs,
      })

      // Save merged code and stats
      setMergedCode(result.mergedCode)
      setStats(result.stats)
      setUsage(result.usage)

      // Record usage for tracking
      recordUsage("morph/v3-fast", {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
      })

      // ✅ APPLY TO EDITOR IMMEDIATELY (for diff preview)
      updateContent(data.file, result.mergedCode)
      console.log(`📝 Applied merged code to ${data.file} editor for preview`)

      // Switch to the file tab to show diff
      if (onSwitchCodeTab && data.file !== "php") {
        onSwitchCodeTab(data.file as "html" | "css" | "js")
      }

      // Show preview state (waiting for accept/decline)
      setState("success")
    } catch (error: any) {
      console.error("❌ Morph merge failed:", error)
      setErrorMessage(error.message || "Unknown error occurred")
      setState("error")
    }
  }

  const handleAcceptChanges = () => {
    console.log(`✅ Accepting changes to ${data.file} - keeping current code`)
    // Code is already in editor, just collapse widget
    setIsCollapsed(true)
  }

  const handleDeclineChanges = () => {
    console.log(`❌ Declining changes to ${data.file} - reverting to original`)
    // Revert to original code
    updateContent(data.file, originalCode)
    setState("idle")
    setMergedCode("")
    setStats(null)
    setUsage(null)
    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey)
    }
  }

  const getStateIcon = () => {
    switch (state) {
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Zap className="h-4 w-4 text-purple-500" />
    }
  }

  const getStateColor = () => {
    switch (state) {
      case "loading":
        return "border-blue-500"
      case "success":
        return "border-green-500"
      case "error":
        return "border-red-500"
      default:
        return "border-purple-500"
    }
  }

  return (
    <Card
      className={`morph-widget border-2 ${getStateColor()} shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${
        state === "loading" ? "animate-pulse" : ""
      }`}
    >
      <CardContent className="px-6 py-0 space-y-1">
        {/* Header row */}
        <div className="flex items-center gap-1 text-sm font-semibold">
          <div className="animate-in fade-in zoom-in duration-300">{getStateIcon()}</div>
          <span>Code Edit</span>
          <span className="ml-auto px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-mono rounded transition-all duration-200 hover:scale-105">
            {data.file.toUpperCase()}
          </span>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-1 p-1 hover:bg-muted rounded transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            <div className={`transition-transform duration-300 ease-out ${isCollapsed ? "rotate-0" : "rotate-180"}`}>
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </button>
        </div>

        {/* Collapsible content */}
        <div
          className={`grid transition-all duration-300 ease-out ${
            isCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-1">
              <div className={`text-xs ${!isCollapsed ? "animate-in fade-in slide-in-from-top-1 duration-300" : ""}`}>
                <div className="p-1.5 bg-muted rounded text-xs">{data.instruction}</div>
              </div>

              <div
                className={`text-xs ${!isCollapsed ? "animate-in fade-in slide-in-from-top-1 duration-300 delay-75" : ""}`}
              >
                <div className="font-medium text-muted-foreground mb-0.5 text-[10px] uppercase tracking-wide">
                  Changes ({data.lazyEdit.length} chars)
                </div>
                <pre className="p-2 bg-muted rounded text-[11px] font-mono overflow-x-auto max-h-40 overflow-y-auto border">
                  {data.lazyEdit}
                </pre>
              </div>

              {state === "error" && errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700 dark:text-red-300">
                      <div className="font-semibold mb-1">Merge Failed</div>
                      <div className="text-xs">{errorMessage}</div>
                      <div className="text-xs mt-2 text-muted-foreground">
                        Try again or use direct file replacement instead.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {state === "idle" && (
                <Button
                  onClick={handleApplyChanges}
                  className="w-full bg-purple-600 hover:bg-purple-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {originalCode ? "Apply Changes" : "Write New Code"}
                </Button>
              )}

              {state === "loading" && (
                <Button disabled className="w-full animate-in fade-in duration-200">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Merging with Morph...
                </Button>
              )}

              {state === "success" && (
                <div className="animate-in fade-in slide-in-from-bottom-3 duration-400">
                  <div className="border rounded p-2 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 mb-2 animate-in fade-in duration-300 delay-100">
                    <div className="font-medium text-xs mb-1 flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                      <AlertCircle className="h-3 w-3 animate-in zoom-in duration-300" />
                      Review in editor above
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {stats?.mergedLength || mergedCode?.length || 0} chars | {stats?.durationMs || 0}ms |{" "}
                      {usage?.totalTokens || 0} tok | ${usage?.cost?.toFixed(4) || "0.00"}
                    </div>
                  </div>

                  <div className="flex gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
                    <Button
                      onClick={handleDeclineChanges}
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 bg-transparent transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Decline
                    </Button>
                    <Button
                      onClick={handleAcceptChanges}
                      size="sm"
                      className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Accept
                    </Button>
                  </div>
                </div>
              )}

              {state === "error" && (
                <Button
                  onClick={handleApplyChanges}
                  variant="destructive"
                  className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg animate-in fade-in duration-300"
                >
                  Retry
                </Button>
              )}

              <div
                className={`text-xs text-muted-foreground p-2 bg-muted/50 rounded ${!isCollapsed ? "animate-in fade-in duration-300 delay-150" : ""}`}
              >
                <div className="flex items-start gap-1">
                  <Zap className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Morph Fast Apply:</strong> 10,500 tok/sec, 98% accuracy. Changes merge into your code in
                    ~100ms. Tracked in usage stats.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsed state message */}
        {isCollapsed && (
          <div className="text-xs text-muted-foreground animate-in fade-in slide-in-from-top-1 duration-300">
            {state === "success" && mergedCode ? (
              <span className="text-green-600 dark:text-green-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Changes accepted and applied to {data.file.toUpperCase()}
              </span>
            ) : (
              <span>{data.instruction.substring(0, 60)}...</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
