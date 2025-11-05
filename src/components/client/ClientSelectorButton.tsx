'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Client } from './ClientTypes'
import { Building2, ChevronDown, Check, User } from 'lucide-react'

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
  const [open, setOpen] = useState(false)

  // Show icon with visual indicator for context enabled/disabled
  const getButtonVariant = () => {
    if (!selectedClient) return 'outline'
    return clientContextEnabled ? 'default' : 'outline'
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={getButtonVariant()}
          size="sm"
          className="gap-2"
          title={selectedClient ? `${selectedClient.name} - Context ${clientContextEnabled ? 'Enabled' : 'Disabled'}` : 'No client selected'}
        >
          <Building2 className="h-4 w-4" />
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Active Client
        </DropdownMenuLabel>
        <DropdownMenuItem disabled className="text-sm font-medium">
          {selectedClient ? (
            <span className="flex items-center gap-2">
              <span>{selectedClient.logo}</span>
              <span>{selectedClient.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">None</span>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {selectedClient && (
          <DropdownMenuItem onClick={onToggleContext}>
            <div className={`mr-2 h-4 w-4 border rounded flex items-center justify-center ${clientContextEnabled ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
              <Check className={`h-3 w-3 text-primary-foreground ${clientContextEnabled ? 'opacity-100' : 'opacity-0'}`} />
            </div>
            <span>Include Client Context</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={() => {
          setOpen(false)
          onSelectClient()
        }}>
          <User className="mr-2 h-4 w-4" />
          <span>Select Client</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
