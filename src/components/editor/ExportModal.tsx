'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Editor } from '@tiptap/react'
import { FileText, Download } from 'lucide-react'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  editor: Editor | null
  documentTitle?: string
}

type ExportFormat = 'pdf' | 'docx' | 'html' | 'markdown'

export function ExportModal({ isOpen, onClose, editor, documentTitle = 'document' }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!editor) return

    setIsExporting(true)

    try {
      switch (selectedFormat) {
        case 'pdf':
          // Use browser print dialog for PDF
          window.print()
          break

        case 'docx':
          // Dynamic import of docx
          const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')
          const htmlContent = editor.getHTML()

          // Parse HTML and convert to docx elements
          const parser = new DOMParser()
          const doc = parser.parseFromString(htmlContent, 'text/html')
          const paragraphs: any[] = []

          // Convert HTML elements to docx paragraphs
          const processNode = (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent?.trim()
              if (text) {
                paragraphs.push(new Paragraph({
                  children: [new TextRun(text)],
                }))
              }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement
              const tagName = element.tagName.toLowerCase()

              if (tagName === 'h1') {
                paragraphs.push(new Paragraph({
                  text: element.textContent || '',
                  heading: HeadingLevel.HEADING_1,
                }))
              } else if (tagName === 'h2') {
                paragraphs.push(new Paragraph({
                  text: element.textContent || '',
                  heading: HeadingLevel.HEADING_2,
                }))
              } else if (tagName === 'h3') {
                paragraphs.push(new Paragraph({
                  text: element.textContent || '',
                  heading: HeadingLevel.HEADING_3,
                }))
              } else if (tagName === 'p') {
                const text = element.textContent?.trim()
                if (text) {
                  paragraphs.push(new Paragraph({
                    children: [new TextRun(text)],
                  }))
                }
              } else if (tagName === 'ul' || tagName === 'ol') {
                element.querySelectorAll('li').forEach(li => {
                  paragraphs.push(new Paragraph({
                    text: li.textContent || '',
                    bullet: { level: 0 },
                  }))
                })
              } else {
                // Recursively process children
                node.childNodes.forEach(processNode)
              }
            }
          }

          doc.body.childNodes.forEach(processNode)

          // Create document
          const docxDoc = new Document({
            sections: [{
              properties: {},
              children: paragraphs.length > 0 ? paragraphs : [
                new Paragraph({ text: 'Empty document' })
              ],
            }],
          })

          // Generate and download
          const blob = await Packer.toBlob(docxDoc)
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${documentTitle}.docx`
          link.click()
          URL.revokeObjectURL(url)
          break

        case 'html':
          // Export as HTML
          const htmlContent2 = editor.getHTML()
          downloadFile(htmlContent2, `${documentTitle}.html`, 'text/html')
          break

        case 'markdown':
          // Export as Markdown
          const markdownContent = editor.storage.markdown?.getMarkdown?.() || editor.getText()
          downloadFile(markdownContent, `${documentTitle}.md`, 'text/markdown')
          break
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
      if (selectedFormat !== 'pdf') {
        onClose()
      }
    }
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const formats: Array<{ value: ExportFormat; label: string; description: string; icon: typeof FileText }> = [
    {
      value: 'pdf',
      label: 'PDF',
      description: 'Best for sharing and printing',
      icon: FileText,
    },
    {
      value: 'docx',
      label: 'Word Document (.docx)',
      description: 'For editing in Microsoft Word',
      icon: FileText,
    },
    {
      value: 'html',
      label: 'HTML',
      description: 'For web publishing',
      icon: FileText,
    },
    {
      value: 'markdown',
      label: 'Markdown',
      description: 'Plain text with formatting',
      icon: FileText,
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Document
          </DialogTitle>
          <DialogDescription>
            Choose a format to export your document.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <RadioGroup value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as ExportFormat)}>
            <div className="space-y-3">
              {formats.map((format) => (
                <div
                  key={format.value}
                  className={`flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                    selectedFormat === format.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                  onClick={() => setSelectedFormat(format.value)}
                >
                  <RadioGroupItem value={format.value} id={format.value} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={format.value} className="cursor-pointer font-medium">
                      {format.label}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !editor}>
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
