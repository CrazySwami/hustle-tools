"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X } from "lucide-react";

interface GoogleFontPickerProps {
  value: string;
  onChange: (fontFamily: string) => void;
  placeholder?: string;
  className?: string;
}

interface GoogleFont {
  family: string;
  category: string;
  variants: string[];
}

// Cache for loaded fonts
const loadedFonts = new Set<string>();

export function GoogleFontPicker({
  value,
  onChange,
  placeholder = "Select font...",
  className = "",
}: GoogleFontPickerProps) {
  const [fonts, setFonts] = useState<GoogleFont[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load Google Fonts list
  useEffect(() => {
    const fetchFonts = async () => {
      try {
        // Use Google Fonts API with environment variable
        const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY || "";
        console.log('🔑 Google Fonts API Key available:', !!API_KEY);
        if (!API_KEY) {
          console.error('❌ Google Fonts API key not configured in environment variables');
          throw new Error("Google Fonts API key not configured");
        }
        const response = await fetch(
          `https://www.googleapis.com/webfonts/v1/webfonts?key=${API_KEY}&sort=popularity`
        );
        const data = await response.json();
        console.log('📡 Google Fonts API response:', { hasItems: !!data?.items, itemCount: data?.items?.length });

        // Check if data.items exists
        if (data && data.items && Array.isArray(data.items)) {
          // Get ALL fonts (1000+) - sorted by popularity
          const allFonts = data.items.map((font: any) => ({
            family: font.family,
            category: font.category,
            variants: font.variants,
          }));

          setFonts(allFonts);
          console.log(`✅ Loaded ${allFonts.length} Google Fonts`);
        } else {
          throw new Error("Invalid API response");
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to load Google Fonts:", error);
        // Fallback to common fonts
        setFonts([
          { family: "Roboto", category: "sans-serif", variants: ["regular"] },
          { family: "Open Sans", category: "sans-serif", variants: ["regular"] },
          { family: "Lato", category: "sans-serif", variants: ["regular"] },
          { family: "Montserrat", category: "sans-serif", variants: ["regular"] },
          { family: "Poppins", category: "sans-serif", variants: ["regular"] },
          { family: "Playfair Display", category: "serif", variants: ["regular"] },
          { family: "Merriweather", category: "serif", variants: ["regular"] },
          { family: "Inter", category: "sans-serif", variants: ["regular"] },
        ]);
        setLoading(false);
      }
    };

    fetchFonts();
  }, []);

  // Filter fonts based on search
  const filteredFonts = useMemo(() => {
    if (!searchQuery) return fonts;
    const query = searchQuery.toLowerCase();
    return fonts.filter((font) =>
      font.family.toLowerCase().includes(query)
    );
  }, [fonts, searchQuery]);

  // Load font dynamically
  const loadFont = (fontFamily: string) => {
    if (loadedFonts.has(fontFamily)) return;

    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(
      / /g,
      "+"
    )}:wght@400;700&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    loadedFonts.add(fontFamily);
  };

  // Handle font selection
  const handleSelectFont = (fontFamily: string) => {
    loadFont(fontFamily);
    onChange(fontFamily);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Focus search input when opened
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Load the currently selected font
  useEffect(() => {
    if (value && value !== "inherit" && value !== "system-ui") {
      loadFont(value);
    }
  }, [value]);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left bg-muted border border-border rounded-lg hover:bg-muted/80 transition-colors flex items-center justify-between text-sm"
        style={{
          fontFamily: value && value !== "inherit" ? value : "inherit",
        }}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg
          className="w-4 h-4 ml-2 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-[9999] w-full mt-1 bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Search Input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fonts..."
                className="w-full pl-9 pr-8 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted-foreground/10 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Font List */}
          <div className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading fonts...
              </div>
            ) : filteredFonts.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No fonts found
              </div>
            ) : (
              <div className="py-1">
                {/* System fonts first */}
                <button
                  onClick={() => handleSelectFont("system-ui")}
                  className={`w-full px-3 py-2 text-left hover:bg-muted transition-colors text-sm ${
                    value === "system-ui" ? "bg-muted" : ""
                  }`}
                  style={{ fontFamily: "system-ui" }}
                >
                  System UI (Default)
                </button>

                {/* Google Fonts */}
                {filteredFonts.map((font) => {
                  // Load font on demand when it becomes visible
                  loadFont(font.family);

                  return (
                    <button
                      key={font.family}
                      onClick={() => handleSelectFont(font.family)}
                      className={`w-full px-3 py-2.5 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-0 ${
                        value === font.family ? "bg-muted" : ""
                      }`}
                      style={{
                        fontFamily: font.family,
                      }}
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm">{font.family}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {font.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Info */}
          {!loading && filteredFonts.length > 0 && (
            <div className="p-2 border-t border-border bg-muted/50 text-xs text-muted-foreground text-center">
              {filteredFonts.length} fonts available • Powered by Google Fonts
            </div>
          )}
        </div>
      )}
    </div>
  );
}
