'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { FileText, RotateCw } from 'lucide-react'

export interface PageSetupConfig {
  pageSize: 'letter' | 'a4' | 'legal' | 'custom'
  width: number // pixels at 96 DPI
  height: number // pixels
  marginTop: number // pixels
  marginRight: number
  marginBottom: number
  marginLeft: number
  orientation: 'portrait' | 'landscape'
}

interface PageSetupModalProps {
  isOpen: boolean
  onClose: () => void
  config: PageSetupConfig
  onConfigChange: (config: PageSetupConfig) => void
}

// Preset page sizes (in pixels at 96 DPI)
const PAGE_PRESETS = {
  letter: { width: 816, height: 1056 }, // 8.5" × 11"
  a4: { width: 794, height: 1123 },     // 210mm × 297mm
  legal: { width: 816, height: 1344 },   // 8.5" × 14"
}

// Convert pixels to inches (96 DPI)
const pxToInches = (px: number) => (px / 96).toFixed(2)

// Convert inches to pixels (96 DPI)
const inchesToPx = (inches: number) => Math.round(inches * 96)

export function PageSetupModal({ isOpen, onClose, config, onConfigChange }: PageSetupModalProps) {
  const [localConfig, setLocalConfig] = useState<PageSetupConfig>(config)

  // Update local config when prop changes
  useEffect(() => {
    setLocalConfig(config)
  }, [config])

  const handlePageSizeChange = (size: PageSetupConfig['pageSize']) => {
    if (size === 'custom') {
      setLocalConfig({ ...localConfig, pageSize: size })
    } else {
      const preset = PAGE_PRESETS[size]
      const { width, height } = localConfig.orientation === 'landscape'
        ? { width: preset.height, height: preset.width }
        : preset

      setLocalConfig({
        ...localConfig,
        pageSize: size,
        width,
        height,
      })
    }
  }

  const handleOrientationToggle = () => {
    const newOrientation = localConfig.orientation === 'portrait' ? 'landscape' : 'portrait'
    setLocalConfig({
      ...localConfig,
      orientation: newOrientation,
      width: localConfig.height,
      height: localConfig.width,
    })
  }

  const handleMarginChange = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    setLocalConfig({
      ...localConfig,
      [`margin${side.charAt(0).toUpperCase() + side.slice(1)}`]: value,
    })
  }

  const handleSave = () => {
    onConfigChange(localConfig)
    onClose()
  }

  const handleReset = () => {
    const defaultConfig: PageSetupConfig = {
      pageSize: 'letter',
      width: 816,
      height: 1056,
      marginTop: 96,
      marginRight: 96,
      marginBottom: 96,
      marginLeft: 96,
      orientation: 'portrait',
    }
    setLocalConfig(defaultConfig)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Page Setup</DialogTitle>
          <DialogDescription>
            Configure page size and margins for your document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Page Size & Orientation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pageSize">Page Size</Label>
              <Select
                value={localConfig.pageSize}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger id="pageSize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="letter">US Letter (8.5" × 11")</SelectItem>
                  <SelectItem value="a4">A4 (210mm × 297mm)</SelectItem>
                  <SelectItem value="legal">US Legal (8.5" × 14")</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Orientation</Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleOrientationToggle}
              >
                <RotateCw className="h-4 w-4 mr-2" />
                {localConfig.orientation === 'portrait' ? 'Portrait' : 'Landscape'}
              </Button>
            </div>
          </div>

          {/* Custom Dimensions (only for custom size) */}
          {localConfig.pageSize === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">Width (inches)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  min="3"
                  max="17"
                  value={parseFloat(pxToInches(localConfig.width))}
                  onChange={(e) => setLocalConfig({
                    ...localConfig,
                    width: inchesToPx(parseFloat(e.target.value) || 8.5)
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (inches)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  min="3"
                  max="22"
                  value={parseFloat(pxToInches(localConfig.height))}
                  onChange={(e) => setLocalConfig({
                    ...localConfig,
                    height: inchesToPx(parseFloat(e.target.value) || 11)
                  })}
                />
              </div>
            </div>
          )}

          {/* Page Dimensions Display */}
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <FileText className="h-4 w-4 inline mr-2" />
            Current: {pxToInches(localConfig.width)}" × {pxToInches(localConfig.height)}"
            ({localConfig.width}px × {localConfig.height}px)
          </div>

          {/* Margins */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Margins</Label>

            {/* Top Margin */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="marginTop">Top</Label>
                <span className="text-sm text-muted-foreground">
                  {pxToInches(localConfig.marginTop)}" ({localConfig.marginTop}px)
                </span>
              </div>
              <Slider
                id="marginTop"
                min={24} // 0.25 inch minimum
                max={192} // 2 inches maximum
                step={12} // 0.125 inch steps
                value={[localConfig.marginTop]}
                onValueChange={([value]) => handleMarginChange('top', value)}
              />
            </div>

            {/* Right Margin */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="marginRight">Right</Label>
                <span className="text-sm text-muted-foreground">
                  {pxToInches(localConfig.marginRight)}" ({localConfig.marginRight}px)
                </span>
              </div>
              <Slider
                id="marginRight"
                min={24}
                max={192}
                step={12}
                value={[localConfig.marginRight]}
                onValueChange={([value]) => handleMarginChange('right', value)}
              />
            </div>

            {/* Bottom Margin */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="marginBottom">Bottom</Label>
                <span className="text-sm text-muted-foreground">
                  {pxToInches(localConfig.marginBottom)}" ({localConfig.marginBottom}px)
                </span>
              </div>
              <Slider
                id="marginBottom"
                min={24}
                max={192}
                step={12}
                value={[localConfig.marginBottom]}
                onValueChange={([value]) => handleMarginChange('bottom', value)}
              />
            </div>

            {/* Left Margin */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="marginLeft">Left</Label>
                <span className="text-sm text-muted-foreground">
                  {pxToInches(localConfig.marginLeft)}" ({localConfig.marginLeft}px)
                </span>
              </div>
              <Slider
                id="marginLeft"
                min={24}
                max={192}
                step={12}
                value={[localConfig.marginLeft]}
                onValueChange={([value]) => handleMarginChange('left', value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Apply
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
