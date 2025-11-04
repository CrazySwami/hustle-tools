"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, Download, Upload, ExternalLink } from "lucide-react";

interface BrandfetchData {
  id: string;
  name: string;
  domain: string;
  claimed: boolean;
  description: string;
  longDescription: string;
  links: Array<{ name: string; url: string }>;
  logos: Array<{
    type: string;
    theme: string;
    formats: Array<{
      src: string;
      background: string;
      format: string;
      height: number;
      width: number;
      size: number;
    }>;
  }>;
  colors: Array<{
    hex: string;
    type: string;
    brightness: number;
  }>;
  fonts: Array<{
    name: string;
    type: string;
    origin: string;
    originId: string;
    weights: number[];
  }>;
  images: Array<{
    type: string;
    formats: Array<{
      src: string;
      background: string;
      format: string;
      height: number;
      width: number;
      size: number;
    }>;
  }>;
  company: {
    employees: string;
    foundedYear: number;
    kind: string;
  };
}

interface BrandfetchImporterProps {
  onImport: (data: {
    colors: string[];
    fonts: string[];
    logos: string[];
    companyInfo: {
      name: string;
      tagline: string;
      description: string;
    };
  }) => void;
  onClose: () => void;
  playgroundReady: boolean;
}

type TabType = "logos" | "colors" | "fonts" | "images" | "company";

export function BrandfetchImporter({ onImport, onClose, playgroundReady }: BrandfetchImporterProps) {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [brandData, setBrandData] = useState<BrandfetchData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("logos");
  const [importing, setImporting] = useState(false);
  const [tagline, setTagline] = useState("");
  const [generatingTagline, setGeneratingTagline] = useState(false);

  // Fetch brand data
  const fetchBrandData = async () => {
    if (!domain.trim()) {
      setError("Please enter a domain");
      return;
    }

    // Clean domain: remove protocol, www, trailing slashes, and paths
    const cleanDomain = domain
      .trim()
      .replace(/^https?:\/\//i, '') // Remove http:// or https://
      .replace(/^www\./i, '') // Remove www.
      .replace(/\/.*$/, ''); // Remove everything after first /

    setLoading(true);
    setError(null);
    setBrandData(null);

    try {
      const response = await fetch("/api/brandfetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: cleanDomain }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch brand data");
      }

      const data = await response.json();
      setBrandData(data);

      // Auto-generate tagline
      if (data.description || data.longDescription) {
        generateTagline(data.name, data.longDescription || data.description);
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Brandfetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Generate tagline using AI
  const generateTagline = async (companyName: string, description: string) => {
    setGeneratingTagline(true);
    try {
      const response = await fetch("/api/generate-tagline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, description }),
      });

      if (response.ok) {
        const data = await response.json();
        setTagline(data.tagline);
      }
    } catch (err) {
      console.error("Tagline generation error:", err);
    } finally {
      setGeneratingTagline(false);
    }
  };

  // Import to Style Kit
  const handleImport = async () => {
    if (!brandData) return;

    setImporting(true);
    try {
      // Prepare data for import
      const colors = brandData.colors?.map((c) => c.hex) || [];
      const fonts = brandData.fonts?.map((f) => f.name) || [];
      const logos = brandData.logos?.flatMap((logo) =>
        logo.formats.map((f) => f.src)
      ) || [];

      const companyInfo = {
        name: brandData.name,
        tagline: tagline || "",
        description: brandData.description || brandData.longDescription || "",
      };

      // Note: WordPress upload happens via Pull/Push to WordPress buttons
      // Just pass the data to parent component for CSS generation

      onImport({
        colors,
        fonts,
        logos,
        companyInfo,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  // Render tabs content
  const renderTabContent = () => {
    if (!brandData) return null;

    switch (activeTab) {
      case "logos":
        return (
          <div className="space-y-4">
            {brandData.logos?.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {brandData.logos.map((logo, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="text-xs font-medium capitalize">
                      {logo.type} - {logo.theme}
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {logo.formats.slice(0, 2).map((format, fIdx) => (
                        <div
                          key={fIdx}
                          className="border rounded-lg p-4 bg-muted flex items-center justify-center"
                          style={{ background: format.background || "#f3f4f6" }}
                        >
                          <img
                            src={format.src}
                            alt={`${logo.type} logo`}
                            className="max-h-16 max-w-full object-contain"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No logos available
              </div>
            )}
          </div>
        );

      case "colors":
        return (
          <div className="space-y-4">
            {brandData.colors?.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {brandData.colors.map((color, idx) => (
                  <div key={idx} className="space-y-2">
                    <div
                      className="w-full h-20 rounded-lg border shadow-sm"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="text-xs space-y-1">
                      <div className="font-mono font-semibold">{color.hex}</div>
                      <div className="text-muted-foreground capitalize">
                        {color.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No colors available
              </div>
            )}
          </div>
        );

      case "fonts":
        return (
          <div className="space-y-4">
            {brandData.fonts?.length > 0 ? (
              <div className="space-y-3">
                {brandData.fonts.map((font, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div
                      className="text-2xl font-semibold mb-2"
                      style={{ fontFamily: font.name }}
                    >
                      {font.name}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="capitalize">{font.type}</span>
                      <span>•</span>
                      <span>Weights: {font.weights.join(", ")}</span>
                      {font.origin && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{font.origin}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No fonts available
              </div>
            )}
          </div>
        );

      case "images":
        return (
          <div className="space-y-4">
            {brandData.images?.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {brandData.images.map((image, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="text-xs font-medium capitalize">{image.type}</div>
                    {image.formats.slice(0, 1).map((format, fIdx) => (
                      <div key={fIdx} className="border rounded-lg overflow-hidden">
                        <img
                          src={format.src}
                          alt={image.type}
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No images available
              </div>
            )}
          </div>
        );

      case "company":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Company Name</label>
                <input
                  type="text"
                  value={brandData.name}
                  readOnly
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">
                  Tagline {generatingTagline && "(Generating...)"}
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Company tagline..."
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Description</label>
                <textarea
                  value={brandData.longDescription || brandData.description}
                  readOnly
                  rows={4}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm resize-none"
                />
              </div>

              {brandData.company && (
                <div className="grid grid-cols-2 gap-4">
                  {brandData.company.foundedYear && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Founded
                      </label>
                      <div className="text-sm font-semibold">
                        {brandData.company.foundedYear}
                      </div>
                    </div>
                  )}
                  {brandData.company.employees && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Employees
                      </label>
                      <div className="text-sm font-semibold">
                        {brandData.company.employees}
                      </div>
                    </div>
                  )}
                  {brandData.company.kind && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Type
                      </label>
                      <div className="text-sm font-semibold capitalize">
                        {brandData.company.kind}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {brandData.links && brandData.links.length > 0 && (
                <div>
                  <label className="text-sm font-medium block mb-2">Links</label>
                  <div className="space-y-2">
                    {brandData.links.slice(0, 5).map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {link.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Domain Input */}
      {!brandData && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">Company Domain</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com (without http:// or https://)"
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              onKeyDown={(e) => e.key === "Enter" && fetchBrandData()}
            />
          </div>

          <button
            onClick={fetchBrandData}
            disabled={loading || !domain.trim()}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching Brand Data...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Fetch Brand Data
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-destructive">{error}</div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p>
              <strong>Powered by Brandfetch API</strong> - Fetches logos, colors, fonts, images, and company information.
            </p>
          </div>
        </div>
      )}

      {/* Brand Data Display */}
      {brandData && (
        <div className="space-y-4">
          {/* Header with company name */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{brandData.name}</h3>
              <p className="text-xs text-muted-foreground">{brandData.domain}</p>
            </div>
            <button
              onClick={() => {
                setBrandData(null);
                setError(null);
                setDomain("");
                setTagline("");
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Change Domain
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border overflow-x-auto">
            {(["logos", "colors", "fonts", "images", "company"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-h-[400px] overflow-y-auto">
            {renderTabContent()}
          </div>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving to Style Kit...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Save to Style Kit
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
