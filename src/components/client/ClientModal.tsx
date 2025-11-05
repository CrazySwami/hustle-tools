'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Client } from './ClientTypes'
import { useClients } from './ClientStorage'
import { Check, ChevronRight, X, Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  selectedClientId: string | null
  onSelectClient: (clientId: string) => void
  clientContextEnabled?: boolean
  onToggleContext?: () => void
}

export function ClientModal({ isOpen, onClose, selectedClientId, onSelectClient, clientContextEnabled = false, onToggleContext }: ClientModalProps) {
  const { clients } = useClients()
  const [viewingClientId, setViewingClientId] = useState<string | null>(null) // Always start at list view
  const [editedClient, setEditedClient] = useState<Client | null>(null)

  const viewingClient = viewingClientId ? clients.find((c) => c.id === viewingClientId) : null

  // Reset to list view when modal opens
  const handleModalChange = (open: boolean) => {
    if (!open) {
      onClose()
    } else {
      // Reset to list view when opening
      setViewingClientId(null)
      setEditedClient(null)
    }
  }

  // Initialize edit mode with current client data
  const handleStartEdit = (client: Client) => {
    setEditedClient({ ...client })
  }

  // Update field in edited client
  const updateField = (field: keyof Client, value: any) => {
    if (!editedClient) return
    setEditedClient({ ...editedClient, [field]: value })
  }

  // Update nested defaultFormValues field
  const updateFormValue = (field: string, value: any) => {
    if (!editedClient) return
    setEditedClient({
      ...editedClient,
      defaultFormValues: {
        ...editedClient.defaultFormValues,
        [field]: value,
      },
    })
  }

  // Add array item (competitors, locations, etc.)
  const addArrayItem = (field: 'competitors' | 'ownUrls' | 'locations' | 'socialLinks', item: any) => {
    if (!editedClient) return
    setEditedClient({
      ...editedClient,
      [field]: [...editedClient[field], item],
    })
  }

  // Remove array item
  const removeArrayItem = (field: 'competitors' | 'ownUrls' | 'locations' | 'socialLinks', index: number) => {
    if (!editedClient) return
    setEditedClient({
      ...editedClient,
      [field]: editedClient[field].filter((_, i) => i !== index),
    })
  }

  // Update array item
  const updateArrayItem = (
    field: 'competitors' | 'ownUrls' | 'locations' | 'socialLinks',
    index: number,
    key: string,
    value: string
  ) => {
    if (!editedClient) return
    const updated = [...editedClient[field]]
    updated[index] = { ...updated[index], [key]: value }
    setEditedClient({
      ...editedClient,
      [field]: updated,
    })
  }

  // Save changes (in future, this would sync to backend/localStorage)
  const handleSave = () => {
    if (!editedClient) return
    // TODO: Implement save to storage
    console.log('Saving client:', editedClient)
    setEditedClient(null)
  }

  const handleSelectClient = (clientId: string) => {
    onSelectClient(clientId)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleModalChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {!viewingClient ? 'Select Client' : editedClient ? 'Edit Client' : viewingClient.name}
          </DialogTitle>
          <DialogDescription>
            {!viewingClient
              ? 'Choose a client to provide context for document writing.'
              : editedClient
              ? 'Make changes to client information.'
              : 'View and edit client details.'}
          </DialogDescription>
        </DialogHeader>

        {/* Client Context Toggle - Only show in list view */}
        {!viewingClient && selectedClientId && onToggleContext && (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-3">
              {clientContextEnabled ? (
                <ToggleRight className="h-5 w-5 text-primary" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <div className="font-semibold text-sm">Client Context</div>
                <div className="text-xs text-muted-foreground">
                  {clientContextEnabled ? 'Context is enabled' : 'Context is disabled'}
                </div>
              </div>
            </div>
            <Switch
              checked={clientContextEnabled}
              onCheckedChange={onToggleContext}
            />
          </div>
        )}

        <ScrollArea className="flex-1 pr-4">
          {!viewingClient ? (
            // Client List View
            <div className="space-y-2">
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    handleSelectClient(client.id)
                    setViewingClientId(client.id)
                  }}
                  className={`w-full p-4 border rounded-lg text-left hover:bg-muted/50 transition-all flex items-center gap-3 ${
                    client.id === selectedClientId ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <span className="text-2xl">{client.logo}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base">{client.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{client.url}</div>
                  </div>
                  {client.id === selectedClientId && <Check className="h-5 w-5 text-primary shrink-0" />}
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          ) : editedClient ? (
            // Edit Mode
            <div className="space-y-6 pb-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Client Name</label>
                  <Input
                    value={editedClient.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Client name"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Logo Emoji</label>
                  <Input
                    value={editedClient.logo}
                    onChange={(e) => updateField('logo', e.target.value)}
                    placeholder="🏢"
                    className="text-2xl"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Website URL</label>
                  <Input
                    value={editedClient.url}
                    onChange={(e) => updateField('url', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Bio</label>
                  <Textarea
                    value={editedClient.bio}
                    onChange={(e) => updateField('bio', e.target.value)}
                    rows={4}
                    placeholder="Client bio and description"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Things to Avoid</label>
                  <Textarea
                    value={editedClient.thingsToAvoid}
                    onChange={(e) => updateField('thingsToAvoid', e.target.value)}
                    rows={3}
                    placeholder="Topics and phrases to avoid"
                  />
                </div>
              </div>

              {/* Competitors */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Competitors</label>
                <div className="space-y-2">
                  {editedClient.competitors.map((comp, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={comp.name}
                        onChange={(e) => updateArrayItem('competitors', index, 'name', e.target.value)}
                        placeholder="Competitor name"
                        className="flex-1"
                      />
                      <Input
                        value={comp.url}
                        onChange={(e) => updateArrayItem('competitors', index, 'url', e.target.value)}
                        placeholder="URL"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeArrayItem('competitors', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('competitors', { name: '', url: '' })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Competitor
                  </Button>
                </div>
              </div>

              {/* Locations */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Locations</label>
                <div className="space-y-2">
                  {editedClient.locations.map((loc, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={loc.title}
                        onChange={(e) => updateArrayItem('locations', index, 'title', e.target.value)}
                        placeholder="Location name"
                        className="flex-1"
                      />
                      <Input
                        value={loc.address}
                        onChange={(e) => updateArrayItem('locations', index, 'address', e.target.value)}
                        placeholder="Address"
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeArrayItem('locations', index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('locations', { title: '', address: '' })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Keywords</label>
                <Input
                  value={editedClient.defaultFormValues.keywords.join(', ')}
                  onChange={(e) =>
                    updateFormValue(
                      'keywords',
                      e.target.value.split(',').map((k) => k.trim())
                    )
                  }
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>

              {/* Target Audience, Niche, Geo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Target Audience</label>
                  <Input
                    value={editedClient.defaultFormValues.targetAudience}
                    onChange={(e) => updateFormValue('targetAudience', e.target.value)}
                    placeholder="Target audience"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Niche</label>
                  <Input
                    value={editedClient.defaultFormValues.niche}
                    onChange={(e) => updateFormValue('niche', e.target.value)}
                    placeholder="Business niche"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Geo Locations</label>
                <Input
                  value={editedClient.defaultFormValues.geoLocations}
                  onChange={(e) => updateFormValue('geoLocations', e.target.value)}
                  placeholder="Geographic locations"
                />
              </div>
            </div>
          ) : (
            // View Mode with Tabs
            <div className="space-y-4 pb-4">
              <div className="flex items-start gap-3 pb-4 border-b">
                <span className="text-4xl">{viewingClient.logo}</span>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{viewingClient.name}</h2>
                  <a
                    href={viewingClient.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {viewingClient.url}
                  </a>
                </div>
              </div>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Client Information</TabsTrigger>
                  <TabsTrigger value="defaults">Default Form Values</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">Bio</label>
                    <p className="text-sm leading-relaxed">{viewingClient.bio}</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">Things to Avoid</label>
                    <p className="text-sm leading-relaxed text-destructive">{viewingClient.thingsToAvoid}</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">
                      Competitors ({viewingClient.competitors.length})
                    </label>
                    <div className="space-y-1">
                      {viewingClient.competitors.map((c, i) => (
                        <div key={i} className="text-sm">
                          {c.name} - {c.url}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">
                      Locations ({viewingClient.locations.length})
                    </label>
                    <div className="space-y-1">
                      {viewingClient.locations.map((l, i) => (
                        <div key={i} className="text-sm">
                          {l.title} - {l.address}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">
                      Social Links ({viewingClient.socialLinks.length})
                    </label>
                    <div className="space-y-1">
                      {viewingClient.socialLinks.map((link, i) => (
                        <div key={i} className="text-sm">
                          {link.label} - {link.url}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">
                      Client URLs ({viewingClient.ownUrls.length})
                    </label>
                    <div className="space-y-1">
                      {viewingClient.ownUrls.map((url, i) => (
                        <div key={i} className="text-sm">
                          {url.name} - {url.url}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="defaults" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Business Name</label>
                      <div className="text-sm">{viewingClient.defaultFormValues.businessName}</div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Niche</label>
                      <div className="text-sm">{viewingClient.defaultFormValues.niche}</div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Target Audience</label>
                    <div className="text-sm">{viewingClient.defaultFormValues.targetAudience}</div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Geo Locations</label>
                    <div className="text-sm">{viewingClient.defaultFormValues.geoLocations}</div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">Keywords</label>
                    <div className="flex flex-wrap gap-2">
                      {viewingClient.defaultFormValues.keywords.map((k, i) => (
                        <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Intended Result</label>
                    <div className="text-sm">{viewingClient.defaultFormValues.intendedResult}</div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Additional Instructions</label>
                    <div className="text-sm">{viewingClient.defaultFormValues.additionalInstructions}</div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-between pt-4 border-t">
          {!viewingClient ? (
            <Button onClick={onClose}>Close</Button>
          ) : editedClient ? (
            <>
              <Button variant="outline" onClick={() => setEditedClient(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setViewingClientId(null)}>
                Back to List
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleStartEdit(viewingClient)}>
                  Edit
                </Button>
                <Button
                  onClick={() => {
                    handleSelectClient(viewingClient.id)
                    onClose()
                  }}
                >
                  {viewingClient.id === selectedClientId ? 'Close' : 'Select & Close'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
