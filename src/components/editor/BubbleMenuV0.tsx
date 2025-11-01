"use client"

import { useState } from "react"
import { Bold, Italic, Strikethrough, Underline, Link2, MessageSquare, Sparkles, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface BubbleMenuV0Props {
  onFormat?: (action: string) => void
  onAIAction?: (action: AIAction, selectedText: string, additionalContext?: string, enableWebSearch?: boolean) => void
  selectedText?: string
}

export type AIAction =
  | "improve"
  | "research"
  | "expand"
  | "simplify"
  | "continue"
  | "ask-ai-edit"
  | "ask-ai-question"
  | "rewrite"
  | "change-tone-formal"
  | "change-tone-casual"
  | "change-tone-professional"
  | "change-tone-friendly"

export function BubbleMenuV0({
  onFormat,
  onAIAction,
  selectedText = "",
}: BubbleMenuV0Props) {
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())
  const [showAIMenu, setShowAIMenu] = useState(false)
  const [showToneMenu, setShowToneMenu] = useState(false)
  const [showAskAIMenu, setShowAskAIMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState<'top' | 'bottom'>('top')
  const [showContextDialog, setShowContextDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<AIAction | null>(null)
  const [contextInput, setContextInput] = useState("")

  const handleFormat = (format: string) => {
    const newFormats = new Set(activeFormats)
    if (newFormats.has(format)) {
      newFormats.delete(format)
    } else {
      newFormats.add(format)
    }
    setActiveFormats(newFormats)
    onFormat?.(format)
  }

  const handleAIAction = (action: AIAction) => {
    // Actions that need additional context
    if (action === "research" || action === "ask-ai-edit" || action === "ask-ai-question") {
      setPendingAction(action)
      setShowContextDialog(true)
      setShowAIMenu(false)
      setShowAskAIMenu(false)
      setShowToneMenu(false)
      return
    }

    // Immediate actions (inline edits)
    onAIAction?.(action, selectedText, undefined, false)
    setShowAIMenu(false)
    setShowToneMenu(false)
    setShowAskAIMenu(false)
  }

  const handleContextSubmit = () => {
    if (pendingAction) {
      const enableWebSearch = pendingAction === "research"
      onAIAction?.(pendingAction, selectedText, contextInput, enableWebSearch)
      setShowContextDialog(false)
      setPendingAction(null)
      setContextInput("")
    }
  }

  const handleToggleAIMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const spaceAbove = rect.top
    const menuHeight = 400 // Approximate height of AI menu

    // If not enough space above, position menu below
    setMenuPosition(spaceAbove < menuHeight ? 'bottom' : 'top')
    setShowAIMenu(!showAIMenu)
  }

  const formatButtons = [
    { id: "bold", icon: Bold, label: "Bold" },
    { id: "italic", icon: Italic, label: "Italic" },
    { id: "strikethrough", icon: Strikethrough, label: "Strikethrough" },
    { id: "underline", icon: Underline, label: "Underline" },
    { id: "link", icon: Link2, label: "Add Link" },
    { id: "comment", icon: MessageSquare, label: "Add Comment" },
  ]

  const aiActions = [
    { id: "improve" as AIAction, label: "Improve", description: "Polish & enhance", type: "inline" },
    { id: "expand" as AIAction, label: "Expand", description: "Add more detail", type: "inline" },
    { id: "simplify" as AIAction, label: "Simplify", description: "Make it clearer", type: "inline" },
    { id: "rewrite" as AIAction, label: "Rewrite", description: "Generate alternatives", type: "inline" },
    { id: "continue" as AIAction, label: "Continue", description: "Keep writing", type: "inline" },
    { id: "research" as AIAction, label: "Research", description: "Web search & verify", type: "chat" },
  ]

  const askAIOptions = [
    { id: "ask-ai-edit" as AIAction, label: "Edit Selected Text", description: "Modify with AI" },
    { id: "ask-ai-question" as AIAction, label: "Ask General Question", description: "Chat about text" },
  ]

  const toneOptions = [
    { id: "change-tone-formal" as AIAction, label: "More Formal", description: "Professional tone" },
    { id: "change-tone-casual" as AIAction, label: "More Casual", description: "Relaxed tone" },
    { id: "change-tone-professional" as AIAction, label: "Professional", description: "Business tone" },
    { id: "change-tone-friendly" as AIAction, label: "Friendly", description: "Warm tone" },
  ]

  const getDialogTitle = () => {
    if (pendingAction === "research") return "Research with Web Search"
    if (pendingAction === "ask-ai-edit") return "Edit Selected Text"
    if (pendingAction === "ask-ai-question") return "Ask AI a Question"
    return "Add Context"
  }

  const getDialogDescription = () => {
    if (pendingAction === "research") return "Provide additional context for researching the selected text. Web search will be enabled."
    if (pendingAction === "ask-ai-edit") return "Describe how you want to edit the selected text."
    if (pendingAction === "ask-ai-question") return "Ask a question about the selected text."
    return "Add any additional context or instructions."
  }

  return (
    <>
      <div className="bg-white border border-neutral-200 rounded-lg shadow-lg backdrop-blur-sm relative z-[9999]">
        <div className="flex items-center gap-0.5 p-1">
          {formatButtons.map((button, index) => {
            const Icon = button.icon
            const isActive = activeFormats.has(button.id)

            return (
              <Button
                key={button.id}
                variant="ghost"
                size="sm"
                onClick={() => handleFormat(button.id)}
                className={`
                  h-8 w-8 p-0
                  transition-all duration-200 ease-out
                  hover:bg-neutral-100 hover:scale-110
                  active:scale-95
                  ${isActive ? "bg-neutral-100 text-neutral-900" : "text-neutral-600"}
                  animate-in fade-in slide-in-from-bottom-1 duration-200
                `}
                style={{
                  animationDelay: `${index * 30}ms`,
                }}
                title={button.label}
              >
                <Icon className="h-4 w-4 transition-transform duration-200" />
              </Button>
            )
          })}

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleAIMenu}
              className={`
                h-8 w-8 p-0
                transition-all duration-200 ease-out
                hover:bg-purple-50 hover:scale-110
                active:scale-95
                ${showAIMenu ? "bg-purple-50 text-purple-600" : "text-neutral-600"}
                animate-in fade-in slide-in-from-bottom-1 duration-200
              `}
              style={{
                animationDelay: `${formatButtons.length * 30}ms`,
              }}
              title="AI Actions"
            >
              <Sparkles
                className="h-4 w-4 transition-all duration-200"
                style={{ transform: showAIMenu ? "rotate(12deg)" : "rotate(0deg)" }}
              />
            </Button>

            {showAIMenu && (
              <div className={`absolute right-0 w-56 bg-white border border-neutral-200 rounded-lg shadow-xl backdrop-blur-sm animate-in fade-in duration-200 overflow-hidden z-[10000] ${
                menuPosition === 'top'
                  ? 'bottom-full mb-2 slide-in-from-bottom-2'
                  : 'top-full mt-2 slide-in-from-top-2'
              }`}>
                <div className="p-1.5 space-y-0.5">
                  {aiActions.slice(0, 5).map((action, index) => (
                    <button
                      key={action.id}
                      onClick={() => handleAIAction(action.id)}
                      className={`
                        w-full text-left px-3 py-2 rounded-md
                        transition-all duration-200 ease-out
                        hover:bg-neutral-50 hover:translate-x-0.5
                        active:scale-[0.98]
                        group
                        animate-in fade-in slide-in-from-left-1 duration-200
                      `}
                      style={{
                        animationDelay: `${index * 30}ms`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-neutral-900 tracking-tight">{action.label}</div>
                          <div className="text-[10px] text-neutral-500 tracking-tight truncate">
                            {action.description}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                            inline
                          </span>
                          <ChevronRight className="h-3 w-3 text-neutral-400 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </button>
                  ))}

                  <div className="relative">
                    <button
                      onClick={() => setShowToneMenu(!showToneMenu)}
                      className={`
                        w-full text-left px-3 py-2 rounded-md
                        transition-all duration-200 ease-out
                        hover:bg-neutral-50 hover:translate-x-0.5
                        active:scale-[0.98]
                        group
                        animate-in fade-in slide-in-from-left-1 duration-200
                        ${showToneMenu ? "bg-neutral-50" : ""}
                      `}
                      style={{
                        animationDelay: `${5 * 30}ms`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-neutral-900 tracking-tight">Change Tone</div>
                          <div className="text-[10px] text-neutral-500 tracking-tight truncate">
                            Adjust writing style
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                            inline
                          </span>
                          <ChevronRight
                            className={`h-3 w-3 text-neutral-400 transition-transform duration-200 ${showToneMenu ? "rotate-90" : ""}`}
                          />
                        </div>
                      </div>
                    </button>

                    {showToneMenu && (
                      <div className="ml-2 mt-0.5 space-y-0.5 animate-in fade-in slide-in-from-left-1 duration-200">
                        {toneOptions.map((tone, index) => (
                          <button
                            key={tone.id}
                            onClick={() => handleAIAction(tone.id)}
                            className={`
                              w-full text-left px-3 py-1.5 rounded-md
                              transition-all duration-200 ease-out
                              hover:bg-neutral-50 hover:translate-x-0.5
                              active:scale-[0.98]
                              group
                              animate-in fade-in slide-in-from-left-1 duration-200
                            `}
                            style={{
                              animationDelay: `${index * 20}ms`,
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-neutral-700 tracking-tight">{tone.label}</div>
                                <div className="text-[10px] text-neutral-400 tracking-tight truncate">
                                  {tone.description}
                                </div>
                              </div>
                              <ChevronRight className="h-3 w-3 text-neutral-300 transition-transform duration-200 group-hover:translate-x-0.5" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-neutral-200 my-1" />

                  {/* Research Action */}
                  <button
                    onClick={() => handleAIAction("research")}
                    className={`
                      w-full text-left px-3 py-2 rounded-md
                      transition-all duration-200 ease-out
                      hover:bg-neutral-50 hover:translate-x-0.5
                      active:scale-[0.98]
                      group
                      animate-in fade-in slide-in-from-left-1 duration-200
                    `}
                    style={{
                      animationDelay: `${6 * 30}ms`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-neutral-900 tracking-tight">Research</div>
                        <div className="text-[10px] text-neutral-500 tracking-tight truncate">
                          Web search & verify
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">
                          chat
                        </span>
                        <ChevronRight className="h-3 w-3 text-neutral-400 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </button>

                  {/* Ask AI with Submenu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowAskAIMenu(!showAskAIMenu)}
                      className={`
                        w-full text-left px-3 py-2 rounded-md
                        transition-all duration-200 ease-out
                        hover:bg-neutral-50 hover:translate-x-0.5
                        active:scale-[0.98]
                        group
                        animate-in fade-in slide-in-from-left-1 duration-200
                        ${showAskAIMenu ? "bg-neutral-50" : ""}
                      `}
                      style={{
                        animationDelay: `${7 * 30}ms`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-neutral-900 tracking-tight">Ask AI</div>
                          <div className="text-[10px] text-neutral-500 tracking-tight truncate">
                            Edit or ask question
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">
                            chat
                          </span>
                          <ChevronRight
                            className={`h-3 w-3 text-neutral-400 transition-transform duration-200 ${showAskAIMenu ? "rotate-90" : ""}`}
                          />
                        </div>
                      </div>
                    </button>

                    {showAskAIMenu && (
                      <div className="ml-2 mt-0.5 space-y-0.5 animate-in fade-in slide-in-from-left-1 duration-200">
                        {askAIOptions.map((option, index) => (
                          <button
                            key={option.id}
                            onClick={() => handleAIAction(option.id)}
                            className={`
                              w-full text-left px-3 py-1.5 rounded-md
                              transition-all duration-200 ease-out
                              hover:bg-neutral-50 hover:translate-x-0.5
                              active:scale-[0.98]
                              group
                              animate-in fade-in slide-in-from-left-1 duration-200
                            `}
                            style={{
                              animationDelay: `${index * 20}ms`,
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-neutral-700 tracking-tight">{option.label}</div>
                                <div className="text-[10px] text-neutral-400 tracking-tight truncate">
                                  {option.description}
                                </div>
                              </div>
                              <ChevronRight className="h-3 w-3 text-neutral-300 transition-transform duration-200 group-hover:translate-x-0.5" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Input Dialog */}
      <Dialog open={showContextDialog} onOpenChange={setShowContextDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>{getDialogDescription()}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="context-input">
                Additional Context {pendingAction === "research" && "(Optional)"}
              </Label>
              <Input
                id="context-input"
                placeholder={
                  pendingAction === "research"
                    ? "e.g., Focus on recent studies..."
                    : pendingAction === "ask-ai-edit"
                    ? "e.g., Make it more professional..."
                    : "e.g., What are the main themes?"
                }
                value={contextInput}
                onChange={(e) => setContextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleContextSubmit()
                  }
                }}
              />
              {selectedText && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Selected text:</p>
                  <p className="text-sm line-clamp-3">{selectedText}</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowContextDialog(false)
                setPendingAction(null)
                setContextInput("")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleContextSubmit}>
              {pendingAction === "research" ? "Search" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
