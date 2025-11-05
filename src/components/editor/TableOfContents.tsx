"use client";

import { useState, useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import { ChevronRight, ChevronDown, Menu, X } from "lucide-react";

interface HeadingNode {
  id: string;
  level: number;
  text: string;
  position: number;
  children: HeadingNode[];
}

interface TableOfContentsProps {
  editor: Editor | null;
  isOpen: boolean;
  onToggle: () => void;
}

export function TableOfContents({ editor, isOpen, onToggle }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<HeadingNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  // Extract headings from editor and build hierarchical structure
  useEffect(() => {
    if (!editor) return;

    const extractHeadings = () => {
      const headingsList: Array<{ level: number; text: string; position: number; id: string }> = [];

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          const level = node.attrs.level;

          // Skip H1 headings
          if (level === 1) return;

          const text = node.textContent;
          // Generate stable ID from position and text
          const id = `heading-${pos}-${text.slice(0, 20).replace(/\s+/g, "-")}`;

          headingsList.push({ level, text, position: pos, id });

          // Add ID to the node if it doesn't have one (for scroll target)
          if (!node.attrs.id) {
            editor.commands.setNodeSelection(pos);
            editor.commands.updateAttributes("heading", { id });
          }
        }
      });

      // Build hierarchical structure
      const buildHierarchy = (items: typeof headingsList): HeadingNode[] => {
        const root: HeadingNode[] = [];
        const stack: HeadingNode[] = [];

        items.forEach((item) => {
          const node: HeadingNode = { ...item, children: [] };

          // Find parent in stack
          while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
            stack.pop();
          }

          if (stack.length === 0) {
            root.push(node);
          } else {
            stack[stack.length - 1].children.push(node);
          }

          stack.push(node);
        });

        return root;
      };

      setHeadings(buildHierarchy(headingsList));

      // Auto-expand all nodes initially
      const allIds = new Set(headingsList.map(h => h.id));
      setExpandedIds(allIds);
    };

    extractHeadings();

    // Update on every transaction
    const updateListener = () => extractHeadings();
    editor.on("update", updateListener);

    return () => {
      editor.off("update", updateListener);
    };
  }, [editor]);

  // Scroll to heading when clicked
  const scrollToHeading = (position: number, id: string) => {
    if (!editor) return;

    // Focus editor and set cursor position
    editor.commands.focus();
    editor.commands.setTextSelection(position);

    // Scroll the heading into view
    const element = document.querySelector(`[id="${id}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setActiveHeadingId(id);
    }
  };

  // Toggle expand/collapse
  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // Render heading tree recursively
  const renderHeadingNode = (node: HeadingNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isActive = activeHeadingId === node.id;

    return (
      <div key={node.id} style={{ marginLeft: `${depth * 16}px` }}>
        <div
          className={`group flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer hover:bg-muted transition-colors ${
            isActive ? "bg-primary/10 text-primary font-semibold" : ""
          }`}
          onClick={() => scrollToHeading(node.position, node.id)}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              className="p-1 hover:bg-muted-foreground/10 rounded flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Heading Text */}
          <span
            className="flex-1 truncate"
            style={{
              fontSize: node.level === 1 ? "16px" : node.level === 2 ? "15px" : "14px",
              fontWeight: node.level === 1 ? 700 : node.level === 2 ? 600 : 500,
              paddingLeft: hasChildren ? 0 : "24px",
            }}
          >
            {node.text || "(Empty heading)"}
          </span>
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children.map((child) => renderHeadingNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Slide-in Panel */}
      <div
        className={`fixed right-0 bg-background z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: "320px", top: "60px", bottom: "0", height: "calc(100vh - 60px)" }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Table of Contents</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {headings.length === 0 ? "No headings yet" : `${countTotalHeadings(headings)} headings`}
            </p>
          </div>

          {/* Headings List */}
          <div className="flex-1 overflow-y-auto p-4">
            {headings.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-12 px-6">
                Add headings to your document to see the outline here.
              </div>
            ) : (
              <div className="space-y-1">
                {headings.map((heading) => renderHeadingNode(heading))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border text-sm text-muted-foreground text-center">
            Click any heading to jump to it
          </div>
        </div>
      </div>

      {/* Overlay (when open on mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}

// Helper to count all headings including nested ones
function countTotalHeadings(headings: HeadingNode[]): number {
  let count = 0;
  const countRecursive = (nodes: HeadingNode[]) => {
    nodes.forEach((node) => {
      count++;
      if (node.children.length > 0) {
        countRecursive(node.children);
      }
    });
  };
  countRecursive(headings);
  return count;
}
