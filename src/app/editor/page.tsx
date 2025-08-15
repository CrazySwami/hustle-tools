'use client'

import { Suspense } from 'react'
import TiptapEditor from '@/components/editor/TiptapEditor'

export default function EditorPage() {
  return (
    <div className="container mx-auto pt-16 pb-8 px-4 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Rich Text Editor</h1>
      <Suspense fallback={<div className="h-96 w-full flex items-center justify-center">Loading editor...</div>}>
        <TiptapEditor />
      </Suspense>
    </div>
  )
}
