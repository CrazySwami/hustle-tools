"use client"

import { useState, useEffect } from "react"
import { FileCode } from "lucide-react"
import { FaWordpress } from "react-icons/fa"
import { AiFillHtml5 } from "react-icons/ai"
import { SiHubspot } from "react-icons/si"

// Helper function for tag colors
function getExtensionColor(ext: string, isDark: boolean) {
  const lightColors: Record<string, string> = {
    PHP: "bg-purple-500/30 text-purple-800",
    HTML: "bg-green-500/30 text-green-800",
    CSS: "bg-blue-500/30 text-blue-800",
    JS: "bg-yellow-500/30 text-yellow-800",
    HubL: "bg-orange-500/30 text-orange-800",
  }
  const darkColors: Record<string, string> = {
    PHP: "bg-purple-500/20 text-purple-300",
    HTML: "bg-green-500/20 text-green-300",
    CSS: "bg-blue-500/20 text-blue-300",
    JS: "bg-yellow-500/20 text-yellow-300",
    HubL: "bg-orange-500/20 text-orange-300",
  }
  return isDark ? darkColors[ext] || "bg-gray-500/20 text-gray-300" : lightColors[ext] || "bg-gray-500/30 text-gray-800"
}

// Project Context Badge Component
export function ProjectContextBadge({
  currentSection,
  includeContext = true,
  isDark = false,
}: {
  currentSection: any
  includeContext?: boolean
  isDark?: boolean
}) {
  const [animationStage, setAnimationStage] = useState(0)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const stages = [
      { delay: 0, stage: 1 },
      { delay: 300, stage: 2 },
      { delay: 600, stage: 3 },
      { delay: 900, stage: 4 },
      { delay: 1500, stage: 5 },
    ]

    stages.forEach(({ delay, stage }) => {
      setTimeout(() => setAnimationStage(stage), delay)
    })
  }, [])

  // Get project tags based on what files actually exist
  const tags: string[] = []
  const projectType = currentSection?.type

  // Debug: Log what files exist
  useEffect(() => {
    if (currentSection) {
      console.log('🏷️ ProjectContextBadge received section:', {
        name: currentSection.name,
        type: currentSection.type,
        hasHtml: !!currentSection.html,
        hasCss: !!currentSection.css,
        hasJs: !!currentSection.js,
        hasPhp: !!currentSection.php,
        hasHubl: !!currentSection.hubl,
        hublLength: currentSection.hubl?.length || 0
      });
    }
  }, [currentSection]);

  if (projectType === 'php') {
    // PHP widgets show: HTML, CSS, JS, PHP
    if (currentSection.html) tags.push("HTML")
    if (currentSection.css) tags.push("CSS")
    if (currentSection.js) tags.push("JS")
    if (currentSection.php) tags.push("PHP")
  } else if (projectType === 'hubspot') {
    // HubSpot modules show: HTML, CSS, JS, HubL
    if (currentSection.html) tags.push("HTML")
    if (currentSection.css) tags.push("CSS")
    if (currentSection.js) tags.push("JS")
    if (currentSection.hubl) tags.push("HubL")
  } else if (projectType === 'document') {
    // Documents don't show file tags - just the document name
    // Leave tags array empty
  } else {
    // Default HTML projects show: HTML, CSS, JS
    if (currentSection.html) tags.push("HTML")
    if (currentSection.css) tags.push("CSS")
    if (currentSection.js) tags.push("JS")
  }

  const projectTitle = currentSection?.name || "Untitled Project"

  useEffect(() => {
    setIsOverflowing(projectTitle.length > 25)
  }, [projectTitle])

  // Determine icon based on project type
  const ProjectIcon = projectType === 'hubspot' ? SiHubspot
    : projectType === 'php' ? FaWordpress
    : projectType === 'document' ? FileCode
    : AiFillHtml5

  const iconColor = projectType === 'hubspot'
    ? "text-[#FF7A59]" // HubSpot orange
    : projectType === 'php'
      ? "text-[#21759B]" // WordPress blue
      : projectType === 'document'
        ? "text-[#3B82F6]" // Blue for documents
        : "text-[#E34F26]" // HTML5 orange

  return (
    <div className="flex justify-center items-center gap-2 sm:gap-3 px-2" style={{ background: "transparent" }}>
      <div
        className={`group relative inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium tracking-tight transition-all duration-500 overflow-hidden cursor-default w-[95%] mx-auto bg-white
          ${isDark ? "text-slate-900 border-slate-200" : "text-gray-900 border-gray-200"}
          ${animationStage === 0 ? "opacity-0 translate-y-4" : ""}
          ${animationStage === 1 ? "opacity-100 translate-y-4" : ""}
          ${animationStage >= 2 ? "opacity-100 translate-y-0" : ""}
        `}
        style={{
          borderRadius: "10px 10px 0 0",
          borderLeft: "2px solid var(--border)",
          borderRight: "2px solid var(--border)",
          borderTop: "2px solid var(--border)"
        }}
      >
        <div
          className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${includeContext ? "bg-green-500" : "bg-red-500"} transition-all duration-300 flex-shrink-0 relative z-10
            ${animationStage >= 5 ? "animate-pulse" : "opacity-0"}
            ${animationStage >= 3 ? "opacity-100" : ""}
          `}
          style={{
            boxShadow: includeContext
              ? "0 0 8px 2px rgba(34, 197, 94, 0.6), 0 0 16px 4px rgba(34, 197, 94, 0.4)"
              : "0 0 8px 2px rgba(239, 68, 68, 0.6), 0 0 16px 4px rgba(239, 68, 68, 0.4)",
          }}
        />

        {animationStage >= 3 && (
          <>
            <span
              className={`hidden sm:inline text-xs animate-in fade-in slide-in-from-left-2 duration-300 relative z-10 ${isDark ? "opacity-60" : "opacity-70"}`}
            >
              Current Project
            </span>
            <span
              className={`hidden sm:inline text-xs animate-in fade-in duration-300 relative z-10 ${isDark ? "opacity-40" : "opacity-50"}`}
              style={{ animationDelay: "100ms" }}
            >
              •
            </span>
            <ProjectIcon
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${iconColor} transition-transform duration-500 group-hover:rotate-12 animate-in fade-in slide-in-from-left-2 duration-300 flex-shrink-0 relative z-10`}
              style={{ animationDelay: "200ms" }}
            />
            <div
              className="relative overflow-hidden max-w-[120px] sm:max-w-[200px] animate-in fade-in slide-in-from-left-2 duration-300"
              style={{ animationDelay: "300ms" }}
            >
              <span className={`inline-block whitespace-nowrap relative z-10 ${isOverflowing ? "animate-scroll" : ""}`}>
                {projectTitle}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 ml-0.5 sm:ml-1 relative z-10">
              {tags.map((tag, i) => (
                <span
                  key={tag}
                  className={`text-[10px] sm:text-xs font-semibold px-1 sm:px-1.5 py-0.5 rounded ${getExtensionColor(tag, isDark)} animate-in fade-in slide-in-from-right-2 duration-300 flex-shrink-0`}
                  style={{ animationDelay: `${400 + i * 100}ms` }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes scroll {
          0%, 20% {
            transform: translateX(0);
          }
          80%, 100% {
            transform: translateX(calc(-100% + 120px));
          }
        }
        
        @media (min-width: 640px) {
          @keyframes scroll {
            0%, 20% {
              transform: translateX(0);
            }
            80%, 100% {
              transform: translateX(calc(-100% + 200px));
            }
          }
        }
        
        .animate-scroll {
          animation: scroll 8s linear infinite;
        }
      `}</style>
    </div>
  )
}
