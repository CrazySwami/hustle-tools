"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Copy, Bot } from "lucide-react"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateDittoModal } from "./create-ditto-modal"

interface CreateDittoButtonProps {
  onCreateDitto: (ditto: {
    name: string
    description: string
    type: 'mirror' | 'ditto'
    files?: File[]
  }) => void
}

export function CreateDittoButton({ onCreateDitto }: CreateDittoButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<'mirror' | 'ditto'>('ditto')

  const handleMenuItemClick = (type: 'mirror' | 'ditto') => {
    setSelectedType(type)
    setIsModalOpen(true)
  }

  return (
    <>
      {/* Floating Button */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
        }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="h-14 px-6 rounded-full shadow-lg hover:shadow-xl transition-all"
              style={{
                backgroundColor: '#6ee7b7',
                color: '#065f46',
              }}
            >
              <Plus className="h-5 w-5 mr-2" />
              <span className="font-semibold">Create</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            side="top"
            className="w-64 mb-2"
          >
            <DropdownMenuItem
              onClick={() => handleMenuItemClick('ditto')}
              className="flex items-center gap-3 p-3 cursor-pointer"
            >
              <div className="flex-shrink-0">
                <Image
                  src="/Ditto.png"
                  alt="Ditto"
                  width={24}
                  height={24}
                />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">Create a Ditto</div>
                <div className="text-xs text-muted-foreground">
                  Personal AI assistant with your rules
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleMenuItemClick('mirror')}
              className="flex items-center gap-3 p-3 cursor-pointer"
            >
              <div className="flex-shrink-0">
                <Copy className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">Create a Mirror</div>
                <div className="text-xs text-muted-foreground">
                  Copy another team member's Ditto
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modal */}
      <CreateDittoModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCreateDitto={(ditto) => {
          onCreateDitto({ ...ditto, type: selectedType })
          setIsModalOpen(false)
        }}
      />
    </>
  )
}
