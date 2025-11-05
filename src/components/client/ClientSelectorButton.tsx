'use client'

import { Button } from '@/components/ui/button'
import { Client } from './ClientTypes'
import { Building2 } from 'lucide-react'

interface ClientSelectorButtonProps {
  selectedClient: Client | null
  clientContextEnabled: boolean
  onToggleContext: () => void
  onSelectClient: () => void
}

export function ClientSelectorButton({
  selectedClient,
  clientContextEnabled,
  onToggleContext,
  onSelectClient,
}: ClientSelectorButtonProps) {
  // Show visual indicator for context enabled/disabled
  const getButtonVariant = () => {
    if (!selectedClient) return 'outline'
    return clientContextEnabled ? 'default' : 'outline'
  }

  return (
    <Button
      variant={getButtonVariant()}
      size="sm"
      className="gap-2"
      onClick={onSelectClient}
      title={selectedClient
        ? `${selectedClient.name} - Context ${clientContextEnabled ? 'ON' : 'OFF'}`
        : 'Select client and manage context'
      }
    >
      <Building2 className="h-4 w-4" />
      {selectedClient && (
        <span className="text-xs hidden sm:inline">{selectedClient.name}</span>
      )}
    </Button>
  )
}
