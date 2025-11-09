"use client"

import React, { useState } from "react"
import { Upload, Database, FileText, ImageIcon, FileSpreadsheet, FileCode, X, Check } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Logo components
const GoogleDriveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 87.3 78" className="w-full h-full">
    <path fill="#0066da" d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z"/>
    <path fill="#00ac47" d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z"/>
    <path fill="#ea4335" d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5c.8-1.4 1.2-2.95 1.2-4.5H59.798l5.852 11.5z"/>
    <path fill="#00832d" d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z"/>
    <path fill="#2684fc" d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"/>
    <path fill="#ffba00" d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z"/>
  </svg>
)

const NotionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 268" className="w-full h-full">
    <path fill="#000" d="M164.09.608 16.092 11.538C4.155 12.573 0 20.374 0 29.726v162.245c0 7.284 2.585 13.516 8.826 21.843l34.789 45.237c5.715 7.284 10.912 8.844 21.825 8.327l171.864-10.404c14.532-1.035 18.696-7.801 18.696-19.24V55.207c0-5.911-2.336-7.614-9.21-12.66l-1.185-.856L198.37 8.409C186.94.1 182.27-.952 164.09.608ZM69.327 52.22c-14.033.945-17.216 1.159-25.186-5.323L23.876 30.778c-2.06-2.086-1.026-4.69 4.163-5.207l142.274-10.395c11.947-1.043 18.17 3.12 22.842 6.758l24.401 17.68c1.043.525 3.638 3.637.517 3.637L71.146 52.095l-1.819.125Zm-16.36 183.954V81.222c0-6.767 2.077-9.887 8.3-10.413L230.02 60.93c5.724-.517 8.31 3.12 8.31 9.879v153.917c0 6.767-1.044 12.49-10.387 13.008l-161.487 9.361c-9.343.517-13.489-2.594-13.489-10.921ZM212.377 89.53c1.034 4.681 0 9.362-4.681 9.897l-7.783 1.542v114.404c-6.758 3.637-12.981 5.715-18.18 5.715-8.308 0-10.386-2.604-16.609-10.396l-50.898-80.079v77.476l16.1 3.646s0 9.362-12.989 9.362l-35.814 2.077c-1.043-2.086 0-7.284 3.63-8.318l9.351-2.595V109.823l-12.98-1.052c-1.044-4.68 1.55-11.439 8.826-11.965l38.426-2.585 52.958 81.113v-71.76l-13.498-1.552c-1.043-5.733 3.111-9.896 8.3-10.404l35.84-2.087Z"/>
  </svg>
)

const AsanaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 251 232" className="w-full h-full">
    <path fill="#F06A6A" d="M179.383 54.3733c0 30.0166-24.337 54.3737-54.354 54.3737-30.0355 0-54.3733-24.3382-54.3733-54.3737S94.9935 0 125.029 0c30.017 0 54.354 24.3378 54.354 54.3733ZM54.3928 122.33c-30.0166 0-54.373269 24.338-54.373269 54.355 0 30.017 24.337769 54.373 54.373269 54.373 30.0354 0 54.3732-24.338 54.3732-54.373 0-30.017-24.3378-54.355-54.3732-54.355Zm141.2532 0c-30.035 0-54.373 24.338-54.373 54.374 0 30.035 24.338 54.373 54.373 54.373 30.017 0 54.374-24.338 54.374-54.373 0-30.036-24.338-54.374-54.374-54.374Z"/>
  </svg>
)

const DropboxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 128 128" className="w-full h-full">
    <path fill="#0061FE" d="M0 0h128v128H0z"/>
    <path fill="#F7F5F2" d="M43.7 32 23.404 44.75 43.701 57.5 64 44.75 84.3 57.5l20.298-12.75L84.299 32 64.002 44.75 43.7 32Zm0 51L23.404 70.25 43.701 57.5 64 70.25 43.702 83Zm20.302-12.75L84.299 57.5l20.298 12.75L84.299 83 64.002 70.25Zm0 29.75L43.7 87.25 64 74.5l20.3 12.75L64.002 100Z"/>
  </svg>
)

const GitHubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-full h-full">
    <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
)

interface AddContextModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddItems: (items: any[], targetFolder?: string) => void
  onConnect: (platformId: string, platformName: string, platformLogo: string, dataSources: any[]) => void
  availableFolders?: Array<{ id: string; name: string }>
}

type ContextType = "file" | "integration"

const fileTypes = [
  { id: "documents", label: "Documents", icon: FileText, accept: ".pdf,.doc,.docx,.txt" },
  { id: "spreadsheets", label: "Spreadsheets", icon: FileSpreadsheet, accept: ".csv,.xlsx,.xls" },
  { id: "images", label: "Images", icon: ImageIcon, accept: ".jpg,.jpeg,.png,.gif,.svg" },
  { id: "code", label: "Code Files", icon: FileCode, accept: ".js,.ts,.py,.java,.cpp" },
]

// Logo mapping
const logoComponents: Record<string, React.FC> = {
  "google-drive": GoogleDriveIcon,
  "github": GitHubIcon,
  "notion": NotionIcon,
  "asana": AsanaIcon,
  "dropbox": DropboxIcon,
}

const integrations = [
  {
    id: "google-drive",
    name: "Google Drive",
    logoComponent: "google-drive",
    description: "Connect to Google Drive",
    enabled: true,
    dataSources: [
      { id: "documents", name: "Documents", type: "file" as const },
      { id: "spreadsheets", name: "Spreadsheets", type: "file" as const },
      { id: "presentations", name: "Presentations", type: "file" as const },
      { id: "forms", name: "Forms", type: "file" as const },
    ],
  },
  {
    id: "github",
    name: "GitHub",
    logoComponent: "github",
    description: "Connect to GitHub repositories",
    enabled: false,
    dataSources: [],
  },
  {
    id: "microsoft",
    name: "Microsoft 365",
    logoUrl: "https://cdn.simpleicons.org/microsoft/00A4EF",
    description: "Connect to Microsoft 365",
    enabled: false,
    dataSources: [],
  },
  {
    id: "clickup",
    name: "ClickUp",
    logoUrl: "https://cdn.simpleicons.org/clickup/7B68EE",
    description: "Connect to ClickUp workspace",
    enabled: false,
    dataSources: [],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    logoUrl: "https://cdn.simpleicons.org/hubspot/FF7A59",
    description: "Connect to HubSpot CRM",
    enabled: false,
    dataSources: [],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    logoUrl: "https://cdn.simpleicons.org/salesforce/00A1E0",
    description: "Connect to Salesforce CRM",
    enabled: false,
    dataSources: [],
  },
  {
    id: "notion",
    name: "Notion",
    logoComponent: "notion",
    description: "Connect to Notion workspace",
    enabled: false,
    dataSources: [],
  },
  {
    id: "jira",
    name: "Jira",
    logoUrl: "https://cdn.simpleicons.org/jira/0052CC",
    description: "Connect to Jira projects",
    enabled: false,
    dataSources: [],
  },
  {
    id: "asana",
    name: "Asana",
    logoComponent: "asana",
    description: "Connect to Asana projects",
    enabled: false,
    dataSources: [],
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    logoUrl: "https://cdn.simpleicons.org/googleanalytics/E37400",
    description: "Import analytics data",
    enabled: false,
    dataSources: [],
  },
  {
    id: "stripe",
    name: "Stripe",
    logoUrl: "https://cdn.simpleicons.org/stripe/008CDD",
    description: "Access Stripe payment data",
    enabled: false,
    dataSources: [],
  },
  {
    id: "slack",
    name: "Slack",
    logoUrl: "https://cdn.simpleicons.org/slack/4A154B",
    description: "Access Slack messages",
    enabled: false,
    dataSources: [],
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    logoUrl: "https://cdn.simpleicons.org/postgresql/4169E1",
    description: "Connect to PostgreSQL database",
    enabled: false,
    dataSources: [],
  },
  {
    id: "mongodb",
    name: "MongoDB",
    logoUrl: "https://cdn.simpleicons.org/mongodb/47A248",
    description: "Connect to MongoDB database",
    enabled: false,
    dataSources: [],
  },
  {
    id: "mixpanel",
    name: "Mixpanel",
    logoUrl: "https://cdn.simpleicons.org/mixpanel/7856FF",
    description: "Connect to Mixpanel analytics",
    enabled: false,
    dataSources: [],
  },
  {
    id: "zendesk",
    name: "Zendesk",
    logoUrl: "https://cdn.simpleicons.org/zendesk/03363D",
    description: "Connect to Zendesk support",
    enabled: false,
    dataSources: [],
  },
  {
    id: "intercom",
    name: "Intercom",
    logoUrl: "https://cdn.simpleicons.org/intercom/1F8DED",
    description: "Connect to Intercom messaging",
    enabled: false,
    dataSources: [],
  },
  {
    id: "shopify",
    name: "Shopify",
    logoUrl: "https://cdn.simpleicons.org/shopify/7AB55C",
    description: "Connect to Shopify store",
    enabled: false,
    dataSources: [],
  },
  {
    id: "airtable",
    name: "Airtable",
    logoUrl: "https://cdn.simpleicons.org/airtable/18BFFF",
    description: "Connect to Airtable bases",
    enabled: false,
    dataSources: [],
  },
  {
    id: "dropbox",
    name: "Dropbox",
    logoComponent: "dropbox",
    description: "Connect to Dropbox storage",
    enabled: false,
    dataSources: [],
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    logoUrl: "https://cdn.simpleicons.org/mailchimp/FFE01B",
    description: "Connect to Mailchimp campaigns",
    enabled: false,
    dataSources: [],
  },
  {
    id: "trello",
    name: "Trello",
    logoUrl: "https://cdn.simpleicons.org/trello/0052CC",
    description: "Connect to Trello boards",
    enabled: false,
    dataSources: [],
  },
  {
    id: "linear",
    name: "Linear",
    logoUrl: "https://cdn.simpleicons.org/linear/5E6AD2",
    description: "Connect to Linear workspace",
    enabled: false,
    dataSources: [],
  },
  {
    id: "figma",
    name: "Figma",
    logoUrl: "https://cdn.simpleicons.org/figma/F24E1E",
    description: "Connect to Figma files",
    enabled: false,
    dataSources: [],
  },
]

export function AddContextModal({ open, onOpenChange, onAddItems, onConnect, availableFolders = [] }: AddContextModalProps) {
  const [contextType, setContextType] = useState<ContextType>("file")
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>("files")
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set())

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    setUploadedFiles((prev) => [...prev, ...files])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setUploadedFiles((prev) => [...prev, ...files])
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddContext = () => {
    onAddItems(uploadedFiles, selectedFolder)
    setUploadedFiles([])
    setSelectedFolder("files")
    onOpenChange(false)
  }

  const handlePlatformConnect = (integration: (typeof integrations)[0]) => {
    // Only mark as connected for UI purposes, don't actually connect yet
    if (!integration.enabled || connectedPlatforms.has(integration.id)) {
      return
    }
    setConnectedPlatforms((prev) => new Set([...prev, integration.id]))
  }
  
  const handleConfirmIntegrations = () => {
    // Actually connect the selected integrations when user clicks "Add to Library"
    connectedPlatforms.forEach((platformId) => {
      const integration = integrations.find(i => i.id === platformId)
      if (integration) {
        const dataSources = integration.dataSources.map((ds, idx) => ({
          id: `${integration.id}-${ds.id}-${idx}`,
          name: ds.name,
          type: ds.type,
        }))
        const logoValue = integration.logoUrl || integration.logo || ""
        onConnect(integration.id, integration.name, logoValue, dataSources)
      }
    })
    setConnectedPlatforms(new Set())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col bg-white border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground">Add Context Source</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose how you'd like to add context to your library
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 border-b border-border pb-4">
          <Button
            variant={contextType === "file" ? "default" : "outline"}
            onClick={() => setContextType("file")}
            className={cn("flex-1 rounded-full", contextType === "file" && "bg-primary hover:bg-primary/90")}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
          <Button
            variant={contextType === "integration" ? "default" : "outline"}
            onClick={() => setContextType("integration")}
            className={cn("flex-1 rounded-full", contextType === "integration" && "bg-primary hover:bg-primary/90")}
          >
            <Database className="h-4 w-4 mr-2" />
            Connect Platform
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {contextType === "file" ? (
            <div className="space-y-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                )}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
                <p className="text-lg font-medium text-foreground mb-2">Drag & drop files here</p>
                <p className="text-sm text-muted-foreground mb-4">or click to browse from your computer</p>
                <input type="file" multiple onChange={handleFileInput} className="hidden" id="file-upload" />
                <label htmlFor="file-upload">
                  <Button
                    type="button"
                    className="bg-foreground hover:bg-foreground/90 text-background rounded-full"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    Browse Files
                  </Button>
                </label>
              </div>

              {/* Folder Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Add files to:</label>
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="files">Files Folder</option>
                  <option value="bobby-ditto">Bobby's Ditto (Your Personal Ditto)</option>
                  {availableFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-foreground">Uploaded Files</h3>
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h3 className="font-medium text-foreground mb-3">Quick Upload by Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  {fileTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <label
                        key={type.id}
                        className="flex items-center gap-3 p-4 border-2 border-border rounded-lg hover:border-primary hover:bg-muted cursor-pointer transition-colors"
                      >
                        <Icon className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-foreground">{type.label}</span>
                        <input
                          type="file"
                          multiple
                          accept={type.accept}
                          onChange={handleFileInput}
                          className="hidden"
                        />
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-medium text-foreground mb-4">Available Integrations</h3>
              <div className="space-y-1.5">
                {integrations.map((integration) => {
                  const isConnected = connectedPlatforms.has(integration.id)
                  const isDisabled = !integration.enabled
                  return (
                    <button
                      key={integration.id}
                      onClick={() => handlePlatformConnect(integration)}
                      disabled={isConnected || isDisabled}
                      className={cn(
                        "flex items-center gap-3 p-2.5 w-full border rounded-lg transition-colors text-left relative",
                        isConnected && "border-primary bg-primary/5 cursor-default",
                        !isConnected &&
                          !isDisabled &&
                          "border-border hover:border-primary hover:bg-muted cursor-pointer",
                        isDisabled && "border-border bg-muted/50 cursor-not-allowed opacity-50",
                      )}
                    >
                      <div className="h-7 w-7 rounded shrink-0 flex items-center justify-center">
                        {integration.logoComponent && logoComponents[integration.logoComponent] ? (
                          React.createElement(logoComponents[integration.logoComponent])
                        ) : integration.logoUrl ? (
                          <img
                            src={integration.logoUrl}
                            alt={integration.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <img
                            src={integration.logo || "/placeholder.svg"}
                            alt={integration.name}
                            className="h-full w-full object-contain"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{integration.name}</p>
                      </div>
                      {isConnected && (
                        <div className="bg-primary text-primary-foreground rounded-full p-1 shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      {isDisabled && !isConnected && (
                        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full shrink-0">
                          Coming Soon
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full border-border">
            Cancel
          </Button>
          <Button
            onClick={contextType === "file" ? handleAddContext : handleConfirmIntegrations}
            disabled={
              (contextType === "file" && uploadedFiles.length === 0) ||
              (contextType === "integration" && connectedPlatforms.size === 0)
            }
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
          >
            Add to Library
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
