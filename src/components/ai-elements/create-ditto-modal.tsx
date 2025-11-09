"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Bot, Copy, Plus, X, Linkedin, Globe, Youtube, Facebook, Instagram, Twitter, FileText } from "lucide-react"
import Image from "next/image"

interface SocialLink {
  platform: string
  url: string
  icon: 'linkedin' | 'youtube' | 'x' | 'facebook' | 'instagram' | 'threads'
}

interface CreateDittoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateDitto: (ditto: {
    name: string
    description: string
    type: 'mirror' | 'ditto'
    files?: File[]
    linkedinProfile?: string
    personalWebsite?: string
    companyWebsite?: string
    additionalContext?: string
    socialLinks?: SocialLink[]
    websiteLinks?: string[]
  }) => void
}

export function CreateDittoModal({ open, onOpenChange, onCreateDitto }: CreateDittoModalProps) {
  const [type, setType] = useState<'mirror' | 'ditto'>('ditto')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  
  // Ditto-specific fields
  const [linkedinProfile, setLinkedinProfile] = useState('')
  const [personalWebsite, setPersonalWebsite] = useState('')
  const [companyWebsite, setCompanyWebsite] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  
  // Mirror-specific fields
  const [websiteLinks, setWebsiteLinks] = useState<string[]>([''])

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Please enter a name')
      return
    }

    onCreateDitto({
      name: name.trim(),
      description: description.trim(),
      type,
      files: files.length > 0 ? files : undefined,
      ...(type === 'ditto' && {
        linkedinProfile: linkedinProfile.trim() || undefined,
        personalWebsite: personalWebsite.trim() || undefined,
        companyWebsite: companyWebsite.trim() || undefined,
        additionalContext: additionalContext.trim() || undefined,
        socialLinks: socialLinks.length > 0 ? socialLinks : undefined,
      }),
      ...(type === 'mirror' && {
        websiteLinks: websiteLinks.filter(link => link.trim()).length > 0 
          ? websiteLinks.filter(link => link.trim()) 
          : undefined,
      }),
    })

    // Reset form
    setName('')
    setDescription('')
    setFiles([])
    setLinkedinProfile('')
    setPersonalWebsite('')
    setCompanyWebsite('')
    setAdditionalContext('')
    setSocialLinks([])
    setWebsiteLinks([''])
    setType('ditto')
    onOpenChange(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const addSocialLink = (platform: SocialLink['icon']) => {
    setSocialLinks([...socialLinks, { platform, url: '', icon: platform }])
  }

  const updateSocialLink = (index: number, url: string) => {
    const updated = [...socialLinks]
    updated[index].url = url
    setSocialLinks(updated)
  }

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index))
  }

  const addWebsiteLink = () => {
    setWebsiteLinks([...websiteLinks, ''])
  }

  const updateWebsiteLink = (index: number, url: string) => {
    const updated = [...websiteLinks]
    updated[index] = url
    setWebsiteLinks(updated)
  }

  const removeWebsiteLink = (index: number) => {
    setWebsiteLinks(websiteLinks.filter((_, i) => i !== index))
  }

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <Linkedin className="h-4 w-4" />
      case 'youtube': return <Youtube className="h-4 w-4" />
      case 'x': return <Twitter className="h-4 w-4" />
      case 'facebook': return <Facebook className="h-4 w-4" />
      case 'instagram': return <Instagram className="h-4 w-4" />
      case 'threads': return <span className="text-xs font-bold">@</span>
      default: return <Globe className="h-4 w-4" />
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="bg-white dark:bg-[#1a1a1a] border-border dark:border-[rgba(255,255,255,0.15)] overflow-hidden flex flex-col"
        style={{
          maxWidth: '95vw',
          width: '1400px',
          maxHeight: '90vh',
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl text-foreground flex items-center gap-2">
            <Image
              src="/Ditto.png"
              alt="Ditto"
              width={32}
              height={32}
              className="shrink-0"
            />
            Create New {type === 'ditto' ? 'Ditto' : 'Mirror'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {type === 'ditto' 
              ? 'Create a personal AI assistant with your rules, preferences, and context files.'
              : 'Create a knowledge base for a specific subject, project, or topic.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 overflow-y-auto flex-1 px-1">
          {/* Type Selection - Full Width */}
          <div className="space-y-2 mb-6">
            <Label className="text-sm font-medium text-foreground">Type</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={type === 'ditto' ? 'default' : 'outline'}
                onClick={() => setType('ditto')}
                className="flex-1 h-20 flex flex-col items-center justify-center gap-2"
              >
                <Image
                  src="/Ditto.png"
                  alt="Ditto"
                  width={24}
                  height={24}
                />
                <div className="text-center">
                  <div className="font-semibold">Ditto</div>
                  <div className="text-xs opacity-70">Personal AI assistant</div>
                </div>
              </Button>
              <Button
                type="button"
                variant={type === 'mirror' ? 'default' : 'outline'}
                onClick={() => setType('mirror')}
                className="flex-1 h-20 flex flex-col items-center justify-center gap-2"
              >
                <Copy className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold">Mirror</div>
                  <div className="text-xs opacity-70">Knowledge base</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Two Column Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="ditto-name" className="text-sm font-medium text-foreground">
                  Name *
                </Label>
                <Input
                  id="ditto-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={type === 'ditto' ? "e.g., Bob's Ditto" : "e.g., Project Mirror"}
                  className="border-border"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="ditto-description" className="text-sm font-medium text-foreground">
                  Description
                </Label>
                <Textarea
                  id="ditto-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    type === 'ditto'
                      ? 'Describe your preferences, rules, and how this Ditto should assist you...'
                      : 'Describe the subject matter, project scope, and what context is needed...'
                  }
                  rows={4}
                  className="border-border resize-none"
                />
              </div>

          {/* Ditto-specific fields */}
          {type === 'ditto' && (
            <>
              {/* LinkedIn Profile */}
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn Profile
                </Label>
                <Input
                  id="linkedin"
                  value={linkedinProfile}
                  onChange={(e) => setLinkedinProfile(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="border-border"
                />
              </div>

              {/* Personal Website */}
              <div className="space-y-2">
                <Label htmlFor="personal-website" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Personal Website
                </Label>
                <Input
                  id="personal-website"
                  value={personalWebsite}
                  onChange={(e) => setPersonalWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="border-border"
                />
              </div>

              {/* Company Website */}
              <div className="space-y-2">
                <Label htmlFor="company-website" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Company Website
                </Label>
                <Input
                  id="company-website"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://company.com"
                  className="border-border"
                />
              </div>

              {/* Social Media Links */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Social Media</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addSocialLink('linkedin')}
                    className="h-8"
                  >
                    <Linkedin className="h-3 w-3 mr-1" />
                    LinkedIn
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addSocialLink('youtube')}
                    className="h-8"
                  >
                    <Youtube className="h-3 w-3 mr-1" />
                    YouTube
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addSocialLink('x')}
                    className="h-8"
                  >
                    <Twitter className="h-3 w-3 mr-1" />
                    X
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addSocialLink('facebook')}
                    className="h-8"
                  >
                    <Facebook className="h-3 w-3 mr-1" />
                    Facebook
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addSocialLink('instagram')}
                    className="h-8"
                  >
                    <Instagram className="h-3 w-3 mr-1" />
                    Instagram
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addSocialLink('threads')}
                    className="h-8"
                  >
                    <span className="text-xs font-bold mr-1">@</span>
                    Threads
                  </Button>
                </div>
                {socialLinks.length > 0 && (
                  <div className="space-y-2">
                    {socialLinks.map((link, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-shrink-0">
                          {getSocialIcon(link.icon)}
                        </div>
                        <Input
                          value={link.url}
                          onChange={(e) => updateSocialLink(index, e.target.value)}
                          placeholder={`${link.platform} URL`}
                          className="flex-1 border-border"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeSocialLink(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Context */}
              <div className="space-y-2">
                <Label htmlFor="additional-context" className="text-sm font-medium text-foreground">
                  Additional Context
                </Label>
                <Textarea
                  id="additional-context"
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Add any additional context, preferences, or instructions..."
                  rows={3}
                  className="border-border resize-none"
                />
              </div>
            </>
          )}

          {/* Mirror-specific fields */}
          {type === 'mirror' && (
            <>
              {/* Website Links */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">Website Links</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addWebsiteLink}
                    className="h-7"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Link
                  </Button>
                </div>
                <div className="space-y-2">
                  {websiteLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Input
                        value={link}
                        onChange={(e) => updateWebsiteLink(index, e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 border-border"
                      />
                      {websiteLinks.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeWebsiteLink(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
            </div>

            {/* Right Column - File Upload */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ditto-files" className="text-sm font-medium text-foreground">
                  Context Files
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  <input
                    id="ditto-files"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="ditto-files"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Bot className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground text-center">
                      {type === 'ditto' 
                        ? 'Upload rules, preferences, or example files'
                        : 'Upload reference documents, research, or context files'}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      PDF, TXT, DOCX, MD, CSV
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => document.getElementById('ditto-files')?.click()}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Files
                    </Button>
                  </label>
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Uploaded Files ({files.length})
                  </Label>
                  <div className="border border-border rounded-lg max-h-64 overflow-y-auto">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] border-b border-border last:border-b-0"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-foreground truncate">{file.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFile(index)}
                          className="h-8 w-8 p-0 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              {type === 'ditto' ? (
                <>
                  <strong>Your Ditto</strong> will learn from your profile, social media, websites, and uploaded files 
                  to provide deeply personalized assistance. It understands your communication style, preferences, and 
                  professional context. You can update it anytime by adding more information.
                </>
              ) : (
                <>
                  <strong>A Mirror</strong> creates a focused knowledge base for a specific subject, project, or topic. 
                  Ingest websites, documentation, research papers, and reference materials to build comprehensive context 
                  that can be queried and referenced across your work.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full border-border"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
          >
            Create {type === 'ditto' ? 'Ditto' : 'Mirror'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
