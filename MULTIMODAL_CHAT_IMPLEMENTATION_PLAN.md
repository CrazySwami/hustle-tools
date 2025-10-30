# Multimodal Chat Implementation Plan

## Overview
Transform the ElementorChat component from system-prompt-based context to user-message-based file attachments with image upload support.

## Goals
1. Add image upload capability
2. Replace "Context" button with file tagging system (@html, @css, @js, @php, @all)
3. Move code files from system prompt to user message attachments
4. Support multimodal messages (text + images + code files)
5. Display file tags as compact chips instead of verbose code
6. Work with all models: OpenAI, Anthropic, Google via Vercel AI Gateway

---

## Current Architecture

### Current Flow (Context in System Prompt):
```
User types message → Click Send
    ↓
onSendMessage(text, imageData?, settings)
    ↓
settings.includeContext = true/false
    ↓
Backend API: /api/chat-elementor/route.ts
    ↓
includeContext ? Add HTML/CSS/JS/PHP to system prompt : Exclude
    ↓
Send to AI with full system prompt
```

### Current System Prompt Structure:
```typescript
const systemPrompt = `You are an expert HTML/CSS/JS/PHP code writing assistant...

**📁 CURRENT FILES IN EDITOR:**
${includeContext ? `
✅ **YES - You have full access to all code files below:**

**Section Name:** ${currentSection.name}

**📄 HTML FILE (${htmlChars} characters):**
\`\`\`html
${currentSection.html}
\`\`\`

**🎨 CSS FILE (${cssChars} characters):**
\`\`\`css
${currentSection.css}
\`\`\`
...
` : `
❌ **NO - No section currently loaded**
`}
`;
```

---

## New Architecture

### New Flow (Code as User Message Attachments):
```
User types message + selects file tags (@html, @css, etc.)
    ↓
Click Send
    ↓
Create file attachments from selected code files
    ↓
Build multimodal message: {
  role: 'user',
  parts: [
    { type: 'text', text: userMessage },
    { type: 'file', mediaType: 'text/html', url: 'data:...', name: 'index.html', tag: 'html' },
    { type: 'file', mediaType: 'text/css', url: 'data:...', name: 'styles.css', tag: 'css' },
    ...images if any
  ]
}
    ↓
Backend API receives multimodal message
    ↓
convertToModelMessages() formats for provider
    ↓
AI Gateway sends to OpenAI/Anthropic/Google with proper format
```

### New System Prompt Structure (Simplified):
```typescript
const systemPrompt = `You are an expert HTML/CSS/JS/PHP code writing assistant...

**🎯 THE ONLY TOOL YOU NEED - editCodeWithMorph:**
[Tool instructions...]

**Available Tools:**
- editCodeWithMorph: For all code editing
- switchTab: Navigate tabs
- getWeather, calculate, etc.

**Current Section Name:** ${currentSection?.name || 'Untitled'}

**📁 Code files will be attached to user messages when user includes them.**
The user can tag files with @html, @css, @js, @php, or @all to attach specific files.
Check the user's message attachments to see the current code.
`;
```

---

## UI Changes

### 1. Remove Context Button
**Location:** [ElementorChat.tsx:389-396](src/components/elementor/ElementorChat.tsx#L389-L396)

```typescript
// DELETE THIS:
<PromptInputButton
  variant={includeContext ? 'default' : 'ghost'}
  onClick={() => setIncludeContext(!includeContext)}
  title={includeContext ? 'File context included (HTML/CSS/JS/PHP)' : 'File context excluded'}
>
  <FileCodeIcon size={16} />
  <span>Context</span>
</PromptInputButton>
```

### 2. Add File Tag Selector
**New UI Component:** File tag dropdown/buttons to select which files to attach

```typescript
// Add state
const [selectedFileTags, setSelectedFileTags] = useState<Set<'html' | 'css' | 'js' | 'php'>(new Set());

// Add UI (replace Context button)
<PromptInputButton
  variant="ghost"
  onClick={() => {
    // Toggle dropdown for file selection
    setShowFileTagMenu(!showFileTagMenu);
  }}
  title="Select code files to attach to message"
>
  <FileCodeIcon size={16} />
  <span>Files ({selectedFileTags.size})</span>
</PromptInputButton>

{/* File Tag Dropdown */}
{showFileTagMenu && (
  <div className="absolute bottom-full mb-2 p-2 bg-card border rounded-lg shadow-lg">
    <div className="text-xs font-semibold mb-2">Attach Code Files:</div>
    <div className="flex flex-col gap-1">
      <FileTagCheckbox tag="html" selected={selectedFileTags.has('html')} onToggle={() => toggleFileTag('html')} />
      <FileTagCheckbox tag="css" selected={selectedFileTags.has('css')} onToggle={() => toggleFileTag('css')} />
      <FileTagCheckbox tag="js" selected={selectedFileTags.has('js')} onToggle={() => toggleFileTag('js')} />
      <FileTagCheckbox tag="php" selected={selectedFileTags.has('php')} onToggle={() => toggleFileTag('php')} />
      <Button variant="outline" size="sm" onClick={() => {
        setSelectedFileTags(new Set(['html', 'css', 'js', 'php']));
      }}>
        Select All (@all)
      </Button>
    </div>
  </div>
)}
```

### 3. Add Image Upload Button
```typescript
// Add ref
const imageFileInputRef = useRef<HTMLInputElement>(null);

// Add state
const [imageAttachments, setImageAttachments] = useState<Array<{
  type: 'file';
  mediaType: string;
  url: string;
  name: string;
  size: number;
}>>([]);

// Add button
<PromptInputButton
  variant="ghost"
  onClick={() => imageFileInputRef.current?.click()}
  title="Attach images (max 3)"
>
  <ImageIcon size={16} />
  <span>Image</span>
</PromptInputButton>

{/* Hidden file input */}
<input
  ref={imageFileInputRef}
  type="file"
  multiple
  accept="image/*"
  onChange={handleImageUpload}
  className="hidden"
/>
```

### 4. Display Attached Files
Show file tags above the input textarea:

```typescript
{/* File & Image Attachments Preview */}
{(selectedFileTags.size > 0 || imageAttachments.length > 0) && (
  <div className="flex flex-wrap gap-2 p-2 border-t animate-in fade-in slide-in-from-bottom-2 duration-300">
    {/* Code file tags */}
    <FileTagList
      files={Array.from(selectedFileTags).map(tag => ({
        type: 'file',
        mediaType: getMediaType(tag),
        url: '', // Will be filled on send
        name: getFileName(tag),
        tag,
        size: currentSection?.[tag]?.length || 0,
      }))}
      onRemove={(index) => {
        const tags = Array.from(selectedFileTags);
        setSelectedFileTags(new Set(tags.filter((_, i) => i !== index)));
      }}
      compact
    />

    {/* Image attachments */}
    {imageAttachments.map((img, i) => (
      <div key={i} className="relative">
        <img src={img.url} alt={img.name} className="h-12 w-12 object-cover rounded border" />
        <button
          onClick={() => setImageAttachments(prev => prev.filter((_, idx) => idx !== i))}
          className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    ))}
  </div>
)}
```

---

## Backend Changes

### 1. Update onSendMessage Handler
**Location:** [ElementorChat.tsx:120-133](src/components/elementor/ElementorChat.tsx#L120-L133)

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!input.trim() || isLoading) return;

  // Build file attachments from selected tags
  const codeAttachments = Array.from(selectedFileTags).map(tag =>
    createCodeFileAttachment(tag, currentSection?.[tag] || '', undefined)
  );

  // Combine code files + images
  const allAttachments = [...codeAttachments, ...imageAttachments];

  // Send message with attachments
  onSendMessage(
    input,
    undefined, // Remove old imageData param
    {
      webSearchEnabled: webSearch,
      reasoningEffort: 'medium',
      detailedMode: false,
      attachments: allAttachments, // NEW: Pass attachments
    }
  );

  // Clear input and attachments
  setInput('');
  setSelectedFileTags(new Set());
  setImageAttachments([]);
};
```

### 2. Update Page Component
**Location:** [elementor-editor/page.tsx](src/app/elementor-editor/page.tsx)

Update the `handleSendMessage` function to handle multimodal messages:

```typescript
const handleSendMessage = async (
  content: string,
  imageData?: { url: string; filename: string },
  settings?: {
    webSearchEnabled: boolean;
    reasoningEffort: string;
    detailedMode?: boolean;
    attachments?: FileAttachment[];
  }
) => {
  // Build message with parts
  const messageParts: any[] = [
    { type: 'text', text: content }
  ];

  // Add file attachments (code files + images)
  if (settings?.attachments && settings.attachments.length > 0) {
    messageParts.push(...settings.attachments);
  }

  // Legacy image support (will be deprecated)
  if (imageData) {
    messageParts.push({
      type: 'file',
      mediaType: 'image/*',
      url: imageData.url,
      name: imageData.filename,
    });
  }

  const userMessage = {
    id: Date.now().toString(),
    role: 'user' as const,
    parts: messageParts, // Use parts structure
    content, // Keep for display
  };

  setMessages(prev => [...prev, userMessage]);
  setIsLoading(true);

  try {
    const response = await fetch('/api/chat-elementor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, userMessage],
        model: selectedModel,
        webSearch: settings?.webSearchEnabled ?? false,
        includeContext: false, // ALWAYS FALSE NOW - code in attachments
        currentSection,
      }),
    });

    // Handle streaming response...
  } catch (error) {
    console.error('Chat error:', error);
  }
};
```

### 3. Update API Route
**Location:** [/api/chat-elementor/route.ts](src/app/api/chat-elementor/route.ts)

```typescript
export async function POST(req: Request) {
  const { messages, model, webSearch, includeContext = false, currentSection } = await req.json();

  // Log message structure
  console.log('📥 Received messages with parts:', messages.map((m: any) => ({
    role: m.role,
    hasParts: !!m.parts,
    partsTypes: m.parts?.map((p: any) => p.type) || [],
    partsCount: m.parts?.length || 0,
  })));

  // Build system prompt (NO CODE CONTEXT)
  let systemPrompt = `You are an expert HTML/CSS/JS/PHP code writing assistant...

**🎯 THE ONLY TOOL YOU NEED - editCodeWithMorph:**
[... tool instructions ...]

**Current Section Name:** ${currentSection?.name || 'Untitled'}

**📁 Code Files:**
The user can attach code files to their messages using file tags (@html, @css, @js, @php).
Check the user's message attachments to see the current code content.
When attached, files will appear as data URLs in the message parts array.
`;

  // LEGACY: Support old includeContext param (will be removed later)
  if (includeContext && currentSection) {
    systemPrompt += `\n\n**⚠️ LEGACY CONTEXT (will be deprecated):**\n`;
    systemPrompt += `HTML: ${currentSection.html?.length || 0} chars\n`;
    systemPrompt += `CSS: ${currentSection.css?.length || 0} chars\n`;
    systemPrompt += `JS: ${currentSection.js?.length || 0} chars\n`;
    systemPrompt += `PHP: ${currentSection.php?.length || 0} chars\n`;
  }

  // Convert messages to model format (handles parts automatically)
  const convertedMessages = convertToModelMessages(messages);

  // Stream response
  const result = streamText({
    model: createModel(model),
    system: systemPrompt,
    messages: convertedMessages,
    tools: enableTools ? tools : undefined,
    experimental_activeTools: ['editCodeWithMorph'],
  });

  return result.toUIMessageStreamResponse();
}
```

---

## Message Display Changes

### Show File Tags in User Messages
**Location:** [ElementorChat.tsx message rendering](src/components/elementor/ElementorChat.tsx)

```typescript
{message.role === 'user' && (
  <Message type="user">
    <MessageContent>
      {/* Text content */}
      {message.content && <Response>{message.content}</Response>}

      {/* File attachments */}
      {message.parts && message.parts.length > 1 && (
        <div className="mt-2">
          <FileTagList
            files={message.parts.filter(p => p.type === 'file').map(p => ({
              type: 'file',
              mediaType: p.mediaType,
              url: p.url,
              name: p.name,
              tag: extractTagFromMediaType(p.mediaType),
              size: 0,
            }))}
            compact
            showSize={false}
          />
        </div>
      )}

      {/* Image previews */}
      {message.parts?.filter(p => p.type === 'file' && p.mediaType.startsWith('image/')).map((img, i) => (
        <img
          key={i}
          src={img.url}
          alt={img.name}
          className="mt-2 max-w-full rounded-lg"
          style={{ maxHeight: '300px' }}
        />
      ))}
    </MessageContent>
  </Message>
)}
```

---

## Migration Strategy

### Phase 1: Add New Features (Keep Old Working)
1. ✅ Create FileTagChip component
2. Add file tag selector UI (keep Context button for now)
3. Add image upload button
4. Add attachment preview above input
5. Update message format to support parts (keep old format working)
6. Test with file attachments

### Phase 2: Update Backend
7. Update API route to handle parts structure
8. Keep includeContext working (for backward compatibility)
9. Test multimodal messages with all models (OpenAI, Anthropic, Google)

### Phase 3: Remove Old System
10. Remove Context button
11. Set includeContext = false permanently
12. Remove context from system prompt
13. Update documentation
14. Test thoroughly

---

## Testing Checklist

### Frontend
- [ ] File tag selector opens/closes
- [ ] Can select/deselect individual tags
- [ ] "Select All" button selects all 4 files
- [ ] File tags display as chips with correct colors
- [ ] Image upload works (max 3 images)
- [ ] Image previews show correctly
- [ ] Attachments clear after sending message
- [ ] File size displays correctly

### Backend
- [ ] Messages with parts structure are received
- [ ] Code files are sent as data URLs
- [ ] Images are sent as data URLs
- [ ] convertToModelMessages handles parts correctly
- [ ] OpenAI models receive images correctly
- [ ] Anthropic models receive images correctly
- [ ] Google models receive images correctly

### AI Responses
- [ ] AI can read HTML from attachments
- [ ] AI can read CSS from attachments
- [ ] AI can read JS from attachments
- [ ] AI can read PHP from attachments
- [ ] AI can analyze images
- [ ] AI can reference image content in responses
- [ ] Tools still work (editCodeWithMorph)

### Edge Cases
- [ ] Empty message with only attachments (should send)
- [ ] Message with no attachments (should work normally)
- [ ] Very large code files (warn if >1MB total)
- [ ] Multiple images (test up to 3)
- [ ] All file types selected (@all)
- [ ] Switching models mid-conversation

---

## File Changes Summary

### New Files
1. `/src/components/elementor/FileTagChip.tsx` ✅ (Already created)

### Modified Files
2. `/src/components/elementor/ElementorChat.tsx` - Main chat UI
   - Remove Context button
   - Add file tag selector
   - Add image upload
   - Add attachment preview
   - Update handleSubmit to build multimodal messages
   - Update message display to show file tags

3. `/src/app/elementor-editor/page.tsx` - Main editor page
   - Update handleSendMessage signature
   - Build messages with parts structure
   - Pass attachments to API

4. `/src/app/api/chat-elementor/route.ts` - Chat API
   - Remove code from system prompt
   - Handle multimodal messages with parts
   - Use convertToModelMessages for proper formatting

5. `/src/app/api/get-system-prompt/route.ts` - System prompt viewer
   - Update to reflect new structure (no code in prompt)

### Documentation
6. `/MULTIMODAL_CHAT_IMPLEMENTATION_PLAN.md` - This file
7. Update `/docs/how-to-make-tools.md` - Add multimodal patterns

---

## Benefits of New Architecture

### Performance
- **Smaller system prompts** - No repetitive code in every system prompt
- **Better token usage** - Code only sent when needed
- **Prompt caching** - System prompt can be cached (it's now static)

### User Experience
- **Clear visibility** - User sees exactly what files are attached
- **Selective context** - User chooses which files to send
- **Image support** - Can upload mockups/screenshots
- **Cleaner chat** - File tags instead of verbose code dumps

### Developer Experience
- **Standard format** - Uses Vercel AI SDK parts structure
- **Provider agnostic** - Works with all AI Gateway providers
- **Future proof** - Ready for more file types (PDFs, etc.)
- **Easier debugging** - Can see exact attachments in messages

---

## Next Steps

1. ✅ Phase 1 Step 1 Complete: FileTagChip component created
2. → Phase 1 Step 2: Add file tag selector UI to ElementorChat
3. → Phase 1 Step 3: Add image upload button
4. → Phase 1 Step 4: Add attachment preview
5. → Phase 1 Step 5: Update message format
6. → Phase 2: Update backend to handle multimodal
7. → Phase 3: Remove old Context system
8. → Testing and validation

---

## Rollback Plan

If issues arise:
1. Keep includeContext parameter in API
2. Keep Context button in UI (toggle between old/new system)
3. Add feature flag: `USE_MULTIMODAL_ATTACHMENTS`
4. Allow users to switch back to old system if needed

---

## Questions for User

1. Should we keep Context button as fallback? Or full removal?
2. Max number of images? (Suggested: 3)
3. Max total attachment size? (Suggested: 10MB)
4. Should @all be default selection?
5. Should file tags persist across messages? Or reset each time?

## Status: Phase 1 Step 2 - IN PROGRESS

Next action: Update Element or Chat.tsx to add file tag selector UI
