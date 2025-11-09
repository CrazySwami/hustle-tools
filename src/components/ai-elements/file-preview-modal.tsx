"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface FilePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileName: string
  fileUrl?: string
  fileContent?: string
  fileType?: string
}

export function FilePreviewModal({
  open,
  onOpenChange,
  fileName,
  fileUrl,
  fileContent,
  fileType,
}: FilePreviewModalProps) {
  const extension = fileName.split('.').pop()?.toLowerCase() || ''

  const renderPreview = () => {
    // Images
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) {
      return (
        <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          {fileUrl ? (
            <Image
              src={fileUrl}
              alt={fileName}
              width={800}
              height={600}
              className="max-w-full h-auto rounded-lg"
              style={{ maxHeight: '70vh', objectFit: 'contain' }}
            />
          ) : (
            <p className="text-muted-foreground">No preview available</p>
          )}
        </div>
      )
    }

    // Text files
    if (['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(extension)) {
      return (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-[70vh] overflow-auto">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {fileContent || 'Loading content...'}
          </pre>
        </div>
      )
    }

    // Code files
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'go', 'rs'].includes(extension)) {
      return (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-[70vh] overflow-auto">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            <code>{fileContent || 'Loading content...'}</code>
          </pre>
        </div>
      )
    }

    // PDFs
    if (extension === 'pdf') {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
          {fileUrl ? (
            <iframe
              src={fileUrl}
              className="w-full rounded-lg border border-border"
              style={{ height: '70vh' }}
              title={fileName}
            />
          ) : (
            <>
              <p className="text-muted-foreground mb-4">PDF preview not available</p>
              {fileUrl && (
                <Button asChild>
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </a>
                </Button>
              )}
            </>
          )}
        </div>
      )
    }

    // Office documents (Word, Excel, PowerPoint)
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-4">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">{fileName}</p>
            <p className="text-muted-foreground mb-4">
              Office document preview not available in browser
            </p>
          </div>
          {fileUrl && (
            <div className="flex gap-2">
              <Button asChild>
                <a href={fileUrl} download={fileName}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View in Office Online
                </a>
              </Button>
            </div>
          )}
        </div>
      )
    }

    // Video
    if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
      return (
        <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          {fileUrl ? (
            <video controls className="max-w-full rounded-lg" style={{ maxHeight: '70vh' }}>
              <source src={fileUrl} type={`video/${extension === 'mov' ? 'quicktime' : extension}`} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <p className="text-muted-foreground">No preview available</p>
          )}
        </div>
      )
    }

    // Audio
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-lg font-medium mb-4">{fileName}</p>
          {fileUrl ? (
            <audio controls className="w-full max-w-md">
              <source src={fileUrl} type={`audio/${extension}`} />
              Your browser does not support the audio tag.
            </audio>
          ) : (
            <p className="text-muted-foreground">No preview available</p>
          )}
        </div>
      )
    }

    // Default fallback
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-4">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">{fileName}</p>
          <p className="text-muted-foreground mb-4">
            Preview not available for this file type
          </p>
        </div>
        {fileUrl && (
          <Button asChild>
            <a href={fileUrl} download={fileName}>
              <Download className="h-4 w-4 mr-2" />
              Download File
            </a>
          </Button>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold truncate pr-8">
              {fileName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {fileUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a href={fileUrl} download={fileName}>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
