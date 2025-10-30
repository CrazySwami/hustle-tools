# Session Summary: Multimodal Chat & Feature Implementation

## Date
2025-10-30

## Overview
This session focused on implementing two major feature sets:
1. **Multimodal Chat System** - File attachments and image upload for ElementorChat
2. **HTML Generator Modal + Hot Reload** - Quick generation UI and real-time widget development

---

## Part 1: Multimodal Chat Implementation

### Context
User requested to move code context from system prompt to user message attachments with @ file tagging system and image upload support.

### User's Original Request
> "Can we add image upload to the prompt window as well for this as well, also lets add the code to the prompt and not the system prompt, in our case we can show it as an attachment sent on the front end like having the files tagged if possible from the ui side. that way it is sent to the ai directly and no more confusion. Also the user should have to see it all written out on the chat, instead it should be file icons with file ext like html. Does that make sense. can use @ to tag them and can have a tag all for all 4 files. then can remove the context button and that from the system prompt"

### Requirements
1. Add image upload button to chat input
2. Create file tag system (@html, @css, @js, @php, @all)
3. Move code from system prompt to user message attachments
4. Display file tags as compact chips (not verbose code)
5. Remove Context toggle button
6. Support OpenAI, Anthropic, Google models via Vercel AI Gateway

### Research Completed
- **Vercel AI SDK v5 Multimodal Patterns**
  - Uses `parts` array in messages instead of simple `content` string
  - Files converted to data URLs client-side
  - `convertToModelMessages()` handles provider-specific formatting
  - Works with OpenAI (GPT-4o), Anthropic (Claude), Google (Gemini)

### Implementation Plan Created
**Document**: [MULTIMODAL_CHAT_IMPLEMENTATION_PLAN.md](MULTIMODAL_CHAT_IMPLEMENTATION_PLAN.md)

#### Current Architecture (Before)
```
User message → includeContext toggle
    ↓
Backend adds HTML/CSS/JS/PHP to system prompt
    ↓
Large system prompts (100K+ tokens)
    ↓
No prompt caching, expensive
```

#### New Architecture (After)
```
User message + file tag selection (@html, @css, etc.)
    ↓
Create file attachments from selected code
    ↓
Build multimodal message with parts:
  [
    { type: 'text', text: userMessage },
    { type: 'file', mediaType: 'text/html', url: 'data:...', tag: 'html' },
    { type: 'file', mediaType: 'text/css', url: 'data:...', tag: 'css' },
    ...images
  ]
    ↓
convertToModelMessages() formats for provider
    ↓
AI Gateway sends to OpenAI/Anthropic/Google
```

### Components Created

#### 1. FileTagChip Component
**File**: [src/components/elementor/FileTagChip.tsx](src/components/elementor/FileTagChip.tsx)

**Features**:
- Compact, color-coded chips for file attachments
- Icons: HTML (FileCode), CSS (Palette), JS (Code2), PHP (FileText), All (Package)
- Colors: Orange (HTML), Blue (CSS), Yellow (JS), Purple (PHP), Gradient (All)
- Shows file size in KB/MB
- Remove button with X icon
- Smooth animations (fade-in, zoom-in, hover effects)
- `FileTagList` component for rendering multiple tags
- Helper functions:
  - `createCodeFileAttachment()` - Create attachment from code string
  - `createAllFilesAttachment()` - Bundle all files as JSON

**Usage**:
```typescript
<FileTagChip
  file={{
    type: 'file',
    mediaType: 'text/html',
    url: 'data:text/html;base64,...',
    name: 'index.html',
    tag: 'html',
    size: 2048
  }}
  onRemove={() => handleRemove()}
  showSize={true}
  compact={false}
/>
```

### UI Changes Planned

#### ElementorChat.tsx Updates
1. **Remove Context Button** (lines 389-396)
2. **Add File Tag Selector Button**
   - Dropdown to select which files to attach
   - Checkboxes for @html, @css, @js, @php
   - "Select All" button for @all
3. **Add Image Upload Button**
   - Max 3 images
   - File input with image/* accept
   - Preview thumbnails with remove button
4. **Attachment Preview Area**
   - Shows selected file tags as chips
   - Shows image thumbnails
   - Above the textarea input
5. **Update handleSubmit**
   - Build multimodal message with parts
   - Include selected code files as attachments
   - Include uploaded images
   - Clear attachments after sending

#### Message Display Updates
- Show file tags in user messages (not full code)
- Display images inline in messages
- Compact, clean UI with FileTagChip component

### Backend Changes Planned

#### API Route (/api/chat-elementor/route.ts)
1. **Remove code from system prompt**
2. **Simplify system prompt**:
```typescript
const systemPrompt = `You are an expert HTML/CSS/JS/PHP code writing assistant...

**Current Section Name:** ${currentSection?.name || 'Untitled'}

**📁 Code Files:**
The user can attach code files to their messages using file tags (@html, @css, @js, @php).
Check the user's message attachments to see the current code content.
`;
```
3. **Use convertToModelMessages()**
   - Handles parts structure automatically
   - Formats for OpenAI/Anthropic/Google correctly

#### Page Component (elementor-editor/page.tsx)
1. **Update handleSendMessage signature**:
```typescript
const handleSendMessage = async (
  content: string,
  imageData?: { url: string; filename: string },
  settings?: {
    webSearchEnabled: boolean;
    attachments?: FileAttachment[];
  }
)
```
2. **Build multimodal messages**:
```typescript
const messageParts = [
  { type: 'text', text: content },
  ...settings.attachments || []
];

const userMessage = {
  id: Date.now().toString(),
  role: 'user',
  parts: messageParts,
  content, // Keep for display
};
```

### Migration Strategy
**3-Phase Approach**:

**Phase 1: Add New Features (Keep Old Working)**
- ✅ Create FileTagChip component
- ✅ Create implementation plan
- → Add file tag selector UI
- → Add image upload button
- → Add attachment preview
- → Keep Context button temporarily

**Phase 2: Update Backend**
- → Update API to handle parts structure
- → Keep includeContext working (backward compat)
- → Test with all models

**Phase 3: Remove Old System**
- → Remove Context button
- → Set includeContext = false permanently
- → Update documentation

### Benefits
1. **Performance**: Smaller system prompts, better caching
2. **Clarity**: User sees exactly what files are attached
3. **Flexibility**: User chooses which files to send
4. **Multimodal**: Images + code in same message
5. **Future-proof**: Standard Vercel AI SDK parts structure

### Status
- ✅ Research complete
- ✅ FileTagChip component created
- ✅ Implementation plan documented
- ⏸️ **PAUSED** - User shifted to HTML Generator + Hot Reload features

---

## Part 2: HTML Generator Modal + Hot Reload

### Context
User wants to bring back HTML Generator modal (without AI tool) for quick generation, plus hot reload for real-time widget development.

### User's Request
> "do we still have the generate tool, i would like to use it again but only from the modal view, not the actual tool, that way i can still generate an html or elementor easily then edit from there. Please then check when i edit the php or css of a widget we hot reload the widget in elementor in playgrounds and reload the editor that has it open for viewing please."

### Requirements

#### HTML Generator Modal
1. Add "Generate" button to Code Editor toolbar
2. Open HTMLGeneratorDialog component (already exists!)
3. User can:
   - Enter description
   - Upload images (max 3, auto-analyzed)
   - Choose mode: "HTML Section" or "Elementor Widget"
   - Use extracted CSS classes from Style Guide (optional)
4. Generate HTML/CSS/JS/PHP and stream to editor
5. Auto-switch tabs as different files generate
6. No AI tool calling - just direct API generation

#### Hot Reload
1. Monitor PHP and CSS content changes in Code Editor
2. Debounce 1 second after typing stops
3. Auto-deploy changed files to WordPress Playground
4. Reload Playground iframe
5. If Elementor editor is open, refresh it too
6. Toggle button to enable/disable
7. Console logs for debugging

### Implementation Plan Created
**Document**: [HTML_GENERATOR_AND_HOT_RELOAD_PLAN.md](HTML_GENERATOR_AND_HOT_RELOAD_PLAN.md)

### Components Used

#### HTMLGeneratorDialog (Already Exists)
**File**: [src/components/html-generator/HTMLGeneratorDialog.tsx](src/components/html-generator/HTMLGeneratorDialog.tsx)

**Features**:
- Modal overlay with backdrop
- Description textarea
- Image upload (max 3)
- Auto-analysis with Claude Haiku 4.5 vision
- Mode selection: HTML Section vs Elementor Widget
- "Use extracted classes" checkbox (if Style Guide has classes)
- Generate button
- Loading states

**Props**:
```typescript
interface HTMLGeneratorDialogProps {
  initialDescription?: string;
  initialImages?: Array<{ url: string; filename: string }>;
  designSystemSummary?: DesignSystemSummary | null;
  onGenerate: (
    description: string,
    images: Array<{ url: string; filename: string; description?: string }>,
    mode?: 'section' | 'widget',
    useExtractedClasses?: boolean
  ) => Promise<void>;
  onClose: () => void;
}
```

### Implementation Started

#### HtmlSectionEditor.tsx Updates

**1. Imports Added**:
```typescript
import { HTMLGeneratorDialog } from "@/components/html-generator/HTMLGeneratorDialog";
```

**2. State Variables Added**:
```typescript
// HTML Generator Dialog state
const [showGeneratorDialog, setShowGeneratorDialog] = useState(false);
const { designSystemSummary } = useGlobalStylesheet();

// Hot reload state
const [hotReloadEnabled, setHotReloadEnabled] = useState(true);
const [lastDeployedPhp, setLastDeployedPhp] = useState('');
const [lastDeployedCss, setLastDeployedCss] = useState('');
const lastChangeTimeRef = useRef<number>(0);
```

**3. Next Steps**:
- Add "Generate HTML" option to OptionsButton menu
- Implement `handleGenerateFromDialog()` function
- Add hot reload useEffect
- Add hot reload toggle button
- Render HTMLGeneratorDialog conditionally

### API Route Needed
**New File**: `/src/app/api/generate-html/route.ts`

**Function**:
- Accept prompt, images, mode ('section' | 'widget')
- Use Vercel AI SDK `streamText()`
- Parse code blocks from AI response
- Stream structured data:
  - `{ type: 'file-start', file: 'html' }`
  - `{ type: 'content', file: 'html', content: '...' }`
  - `{ type: 'done' }`
- Frontend consumes stream and updates Monaco editors in real-time

### Playground Helper Functions Needed
**File**: `/public/playground.js`

**Functions to Add**:
```javascript
// Reload playground iframe
window.reloadPlaygroundIframe = async function() { ... }

// Check if Elementor editor is open
window.isElementorEditorOpen = function() { ... }

// Refresh Elementor editor
window.refreshElementorEditor = async function() { ... }

// Update CSS in playground
window.updatePlaygroundCss = async function(css) { ... }

// Deploy widget to Playground
window.deployWidget = async function(widget) { ... }
```

### Hot Reload Flow
```
User edits PHP/CSS in Monaco Editor
    ↓
Content changes detected by useEffect
    ↓
Debounce timer starts (1000ms)
    ↓
User stops typing
    ↓
Timer fires after 1 second
    ↓
Check if PHP or CSS actually changed
    ↓
YES: Call handleDeployToPlayground(true) // silent mode
    ↓
Deploy updated file(s) to Playground
    ↓
Call window.reloadPlaygroundIframe()
    ↓
If Elementor editor open: window.refreshElementorEditor()
    ↓
Console: "✅ Hot reload complete!"
```

### User Workflows

#### HTML Generation Workflow
1. Click "Generate" in OptionsButton menu (Code Editor)
2. HTMLGeneratorDialog opens
3. Enter description: "A hero section with gradient background..."
4. Upload mockup images (optional)
5. Select mode: "HTML Section"
6. Click "Generate HTML/CSS/JS"
7. Code streams to editor in real-time
8. Tabs auto-switch: HTML → CSS → JS
9. Dialog closes
10. Edit generated code as needed

#### Hot Reload Workflow
1. Enable "Hot Reload: ON" toggle (default)
2. Edit PHP widget code in Monaco
3. Stop typing for 1 second
4. Widget auto-deploys to WordPress
5. Playground iframe refreshes
6. Elementor editor refreshes (if open)
7. See changes instantly!
8. Continue editing, repeat

### Benefits

#### HTML Generator
- **Fast prototyping**: Generate sections/widgets instantly
- **Image context**: AI analyzes mockups for better output
- **No tool overhead**: Direct generation, no tool calling
- **Mode flexibility**: Switch between sections and widgets
- **Style Guide integration**: Can use extracted classes

#### Hot Reload
- **Real-time development**: See changes in 1 second
- **Better DX**: No manual deploy/refresh needed
- **Faster iteration**: Edit → Save → See results
- **Elementor-aware**: Refreshes editor when open
- **Debounced**: Smart waiting for typing to stop
- **Toggle control**: Can disable if needed

### Testing Checklist

#### HTML Generator
- [ ] Generate button appears in OptionsButton menu
- [ ] Clicking opens HTMLGeneratorDialog
- [ ] Can enter description
- [ ] Can upload images (max 3)
- [ ] Images analyzed with Claude Haiku 4.5
- [ ] Can select HTML Section mode
- [ ] Can select Elementor Widget mode
- [ ] "Use extracted classes" checkbox works
- [ ] Generate button triggers API call
- [ ] Code streams to editor
- [ ] Tabs auto-switch during generation
- [ ] Dialog closes on completion

#### Hot Reload
- [ ] Hot reload toggle button appears
- [ ] Can enable/disable toggle
- [ ] Edit PHP → Wait 1s → Auto-deploys
- [ ] Edit CSS → Wait 1s → Auto-deploys
- [ ] Playground iframe reloads
- [ ] Elementor editor refreshes (if open)
- [ ] Debounce works (fast typing = 1 deploy)
- [ ] Toggle OFF disables hot reload
- [ ] Console logs show activity
- [ ] No errors in console

### Status
- ✅ Plan created
- ✅ HTMLGeneratorDialog component identified (already exists)
- ✅ State variables added to HtmlSectionEditor
- ✅ Import added
- 🔄 **IN PROGRESS** - Adding handler functions and UI integration
- ⏸️ **INTERRUPTED** - User requested this summary

---

## Files Created/Modified

### Created
1. ✅ [src/components/elementor/FileTagChip.tsx](src/components/elementor/FileTagChip.tsx) - File attachment chips with @ tags
2. ✅ [MULTIMODAL_CHAT_IMPLEMENTATION_PLAN.md](MULTIMODAL_CHAT_IMPLEMENTATION_PLAN.md) - Comprehensive multimodal plan
3. ✅ [HTML_GENERATOR_AND_HOT_RELOAD_PLAN.md](HTML_GENERATOR_AND_HOT_RELOAD_PLAN.md) - Generator + hot reload plan
4. ✅ **THIS FILE** - Session summary

### Modified
1. 🔄 [src/components/elementor/HtmlSectionEditor.tsx](src/components/elementor/HtmlSectionEditor.tsx)
   - Added import for HTMLGeneratorDialog
   - Added state variables for generator and hot reload
   - **NOT YET**: Handler functions, UI buttons, hot reload effect

### To Be Created
1. ⏳ [src/app/api/generate-html/route.ts](src/app/api/generate-html/route.ts) - Streaming generation endpoint

### To Be Modified
1. ⏳ [src/components/elementor/HtmlSectionEditor.tsx](src/components/elementor/HtmlSectionEditor.tsx)
   - Add `handleGenerateFromDialog()` function
   - Add hot reload useEffect
   - Add "Generate HTML" to OptionsButton menu
   - Add hot reload toggle button
   - Render HTMLGeneratorDialog
2. ⏳ [public/playground.js](public/playground.js)
   - Add `reloadPlaygroundIframe()`
   - Add `isElementorEditorOpen()`
   - Add `refreshElementorEditor()`
   - Add `updatePlaygroundCss()`
   - Add `deployWidget()`
3. ⏳ [src/components/elementor/ElementorChat.tsx](src/components/elementor/ElementorChat.tsx) - Multimodal support
4. ⏳ [src/app/elementor-editor/page.tsx](src/app/elementor-editor/page.tsx) - Multimodal message handling
5. ⏳ [src/app/api/chat-elementor/route.ts](src/app/api/chat-elementor/route.ts) - Parts structure support

---

## Technical Decisions

### Multimodal Chat
1. **File Format**: Data URLs (base64) for both code and images
2. **Message Structure**: Vercel AI SDK v5 parts array
3. **UI Pattern**: Compact chips with @ tags (not verbose code)
4. **Provider Compatibility**: `convertToModelMessages()` for OpenAI/Anthropic/Google
5. **Migration**: 3-phase approach to avoid breaking changes

### HTML Generator
1. **Component Reuse**: Use existing HTMLGeneratorDialog (don't recreate)
2. **Integration Point**: OptionsButton menu in HtmlSectionEditor
3. **Streaming**: Server-Sent Events for real-time code generation
4. **Tab Switching**: Auto-switch as different files are generated
5. **No Tool Calling**: Direct API generation, simpler flow

### Hot Reload
1. **Debounce**: 1 second to avoid excessive deployments
2. **Change Detection**: Compare with last deployed content
3. **Silent Deploy**: No alerts during hot reload
4. **Toggle Control**: User can enable/disable
5. **Playground Integration**: Global window functions for reload/refresh

---

## Key Insights

### User Preferences
1. **Prefers modal UI** over AI tool calling for generation tasks
2. **Wants real-time feedback** - hot reload for instant results
3. **Values clean UI** - compact chips over verbose code display
4. **Likes file tagging** - @ pattern for explicit file selection
5. **Wants flexibility** - toggle controls for features

### Architecture Patterns
1. **Multimodal messages** are the future of AI chat (Vercel AI SDK v5)
2. **Prompt caching** benefits from static system prompts (don't include code)
3. **File attachments** provide better token efficiency than system prompts
4. **Debounced watchers** enable real-time features without performance issues
5. **Global window functions** bridge React and WordPress Playground

### DX Improvements
1. **Hot reload** eliminates manual deploy/refresh steps
2. **HTML Generator modal** speeds up prototyping
3. **File tag chips** make context clear and visible
4. **Streaming generation** provides progressive feedback
5. **Toggle controls** give users power over features

---

## Next Steps

### Immediate (To Complete Session Work)
1. Add `handleGenerateFromDialog()` function to HtmlSectionEditor
2. Add "Generate HTML" option to OptionsButton menu
3. Add hot reload useEffect to HtmlSectionEditor
4. Add hot reload toggle button to UI
5. Render HTMLGeneratorDialog conditionally
6. Create `/api/generate-html/route.ts` streaming endpoint
7. Add Playground helper functions to `playground.js`
8. Test HTML Generator end-to-end
9. Test hot reload end-to-end

### Future (Phase 2 - Multimodal Chat)
10. Add file tag selector to ElementorChat
11. Add image upload button to ElementorChat
12. Add attachment preview area
13. Update message rendering for file tags
14. Update API route for multimodal support
15. Test with OpenAI, Anthropic, Google models
16. Remove Context button
17. Update documentation

### Optional Enhancements
- Add file size warnings (>1MB)
- Add image compression
- Add drag-and-drop for images
- Add paste from clipboard
- Add @ autocomplete in chat input
- Add file tag presets (save common selections)
- Add hot reload notifications (toast instead of console)
- Add hot reload history (undo last deploy)

---

## Questions for User

1. **HTML Generator**: Should we add a default model selection, or always use Claude Sonnet 4.5?
2. **Hot Reload**: Should we show toast notifications on successful deploy, or just console logs?
3. **Multimodal Chat**: Should @all be the default selection when chat opens?
4. **File Tags**: Should selected tags persist across messages, or reset each time?
5. **Image Limit**: Is 3 images enough, or should we increase to 5?
6. **Hot Reload Debounce**: Is 1 second good, or prefer faster (500ms) or slower (2s)?

---

## Performance Considerations

### Multimodal Chat
- **Token Savings**: Moving code from system prompt to attachments reduces repetitive context
- **Caching**: Static system prompts can be cached by AI providers (90% discount with Anthropic)
- **Selective Context**: Users only attach files they need, reducing waste
- **Image Tokens**: Each image ~680 tokens (512px tiles), max 3 = ~2040 tokens

### Hot Reload
- **Debounce**: Prevents excessive API calls during typing
- **Change Detection**: Only deploys if content actually changed
- **Silent Mode**: No alert dialogs, faster deployment
- **Iframe Reload**: Full page refresh ensures all changes visible

### HTML Generator
- **Streaming**: Progressive rendering, better perceived performance
- **Tab Switching**: Visual feedback as generation progresses
- **Image Analysis**: Parallel processing, doesn't block generation
- **Direct API**: No tool calling overhead

---

## Related Documentation

### Vercel AI SDK
- [Multimodal Messages](https://sdk.vercel.ai/docs/ai-sdk-ui/multimodal)
- [Image Upload](https://sdk.vercel.ai/docs/ai-sdk-ui/image-upload)
- [Parts Structure](https://sdk.vercel.ai/docs/ai-sdk-core/message-parts)
- [convertToModelMessages](https://sdk.vercel.ai/docs/ai-sdk-core/convert-to-model-messages)

### WordPress Playground
- [Playground API](https://wordpress.github.io/wordpress-playground/)
- [Client API](https://wordpress.github.io/wordpress-playground/client)
- [Blueprint Format](https://wordpress.github.io/wordpress-playground/blueprints)

### Elementor
- [Widget API](https://developers.elementor.com/docs/widgets/)
- [Controls](https://developers.elementor.com/docs/controls/)
- [Dynamic Tags](https://developers.elementor.com/docs/dynamic-tags/)

---

## Code Snippets

### FileTagChip Usage
```typescript
import { FileTagChip, createCodeFileAttachment } from '@/components/elementor/FileTagChip';

// Create attachment from code
const htmlAttachment = createCodeFileAttachment('html', '<div>Hello</div>', 'index.html');

// Render chip
<FileTagChip
  file={htmlAttachment}
  onRemove={() => handleRemove()}
  showSize={true}
  compact={false}
/>
```

### Multimodal Message
```typescript
const messageParts = [
  { type: 'text', text: 'Please review my code' },
  {
    type: 'file',
    mediaType: 'text/html',
    url: 'data:text/html;base64,PGRpdj5IZWxsbzwvZGl2Pg==',
    name: 'index.html',
  },
  {
    type: 'file',
    mediaType: 'image/png',
    url: 'data:image/png;base64,...',
    name: 'mockup.png',
  }
];

const userMessage = {
  id: Date.now().toString(),
  role: 'user',
  parts: messageParts,
};
```

### Hot Reload Effect
```typescript
useEffect(() => {
  if (!hotReloadEnabled || !section.php) return;

  const phpChanged = section.php !== lastDeployedPhp && lastDeployedPhp !== '';
  if (!phpChanged) return;

  lastChangeTimeRef.current = Date.now();
  const changeTime = lastChangeTimeRef.current;

  const timer = setTimeout(async () => {
    if (changeTime !== lastChangeTimeRef.current) return;

    await handleDeployToPlayground(true); // silent
    await window.reloadPlaygroundIframe();
    setLastDeployedPhp(section.php);
  }, 1000);

  return () => clearTimeout(timer);
}, [section.php, hotReloadEnabled, lastDeployedPhp]);
```

---

## Session Metrics

- **Duration**: ~2 hours
- **Messages**: ~75+ exchanges
- **Files Created**: 4
- **Files Modified**: 1
- **Lines of Code**: ~400+ (planned/written)
- **Documentation**: ~2000+ lines
- **Features Planned**: 2 major features
- **Features Completed**: 0 (interrupted before completion)
- **Research Items**: 1 (Vercel AI SDK multimodal)
- **Component Created**: 1 (FileTagChip)

---

## Conclusion

This session laid extensive groundwork for two significant features:

1. **Multimodal Chat System** - Comprehensive planning and component creation for file attachments and image upload in chat
2. **HTML Generator + Hot Reload** - Planning and partial implementation for quick generation UI and real-time widget development

Both features are well-documented and ready for completion. The FileTagChip component is production-ready. The implementation plans provide clear, step-by-step guidance for finishing the work.

**Status**: 📋 Planned, 🔨 Partially Implemented, ⏸️ Paused, 📖 Documented

**Next Action**: Complete HTML Generator + Hot Reload implementation, then resume Multimodal Chat work.
