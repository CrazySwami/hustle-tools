# File Context System - Implementation Plan

## User Requirements

1. **File Tagging for AI Context** - Tag specific files with `@filename` in chat to load them as context
2. **View File Tool** - AI tool to read the currently selected file
3. **Mobile Full-Width Panels** - File tree and project sidebar should be full-width on mobile
4. **Project-Specific File Filtering** - Show only files from the current active project

## Research: How Other Tools Handle This

### Cursor AI / GitHub Copilot
- `@filename` - References specific files
- `@folder` - References entire folders
- Files are loaded into context window automatically
- Token-efficient: Only sends file content when explicitly referenced

### Vercel v0
- Uses file tree with checkboxes
- User selects which files to include in context
- Shows token count for selected files
- Max context limit warning

### Recommended Approach (Token-Efficient)
1. **Lazy Loading** - Don't load file content until AI explicitly requests it
2. **Tool-Based Access** - Give AI a `viewFile` tool instead of auto-loading
3. **User Tags** - When user types `@filename`, add to context for that message only
4. **Scope to Project** - Only show/allow files from current active project

## Implementation Strategy

### Phase 1: View File Tool (Immediate Need)
**Problem**: AI doesn't have consistent context of current file
**Solution**: Add `viewFile` tool that AI can call anytime

```typescript
// In chat API route
{
  name: 'viewFile',
  description: 'Read the content of the currently active file (HTML, CSS, JS, or PHP)',
  parameters: z.object({
    file: z.enum(['html', 'css', 'js', 'php']).describe('Which file to view')
  }),
  execute: async ({ file }) => {
    // Return current file content from active group
    return {
      filename: `${activeGroup.name}.${file}`,
      content: activeGroup[file],
      size: activeGroup[file].length
    };
  }
}
```

**Benefits**:
- AI can check current file state before making edits
- No automatic context loading (saves tokens)
- Works immediately

### Phase 2: @File Tagging System
**Problem**: User wants to reference specific files as context
**Solution**: Detect `@filename` patterns and load those files into context

```typescript
// In ChatInterface message handler
function detectFileReferences(message: string): string[] {
  const pattern = /@([\w-]+)\.(html|css|js|php)/g;
  const matches = message.matchAll(pattern);
  return Array.from(matches).map(m => m[0]);
}

// Before sending message
const fileRefs = detectFileReferences(userMessage);
const fileContents = fileRefs.map(ref => {
  const group = findGroupByFilename(ref);
  return { ref, content: group.html };  // or css/js/php
});

// Add to message as context
sendMessage(userMessage, { attachedFiles: fileContents });
```

**UI Additions**:
- Autocomplete dropdown when user types `@`
- Shows all files from current project
- Selected files shown as pills/tags
- Token count updated to show impact

### Phase 3: Mobile Full-Width Panels
**Problem**: File panels not visible/usable on mobile
**Solution**: Make panels full-width overlay on mobile

```typescript
// ProjectSidebar.tsx
<div style={{
  width: isMobile ? '100vw' : '220px',
  height: isMobile ? '100vh' : 'auto',
  position: isMobile ? 'fixed' : 'relative',
  top: isMobile ? 0 : 'auto',
  left: isMobile ? 0 : 'auto',
  zIndex: isMobile ? 9999 : 'auto',
}}>
```

### Phase 4: Project-Specific Filtering
**Problem**: File tree shows all files (confusing)
**Solution**: Filter to show only current project's files

```typescript
// In file tree rendering
const currentProjectFiles = [
  { name: `index.html`, type: 'html' },
  { name: `styles.css`, type: 'css' },
  { name: `script.js`, type: 'js' },
];

// For PHP projects
const currentProjectFiles = [
  { name: `widget.php`, type: 'php' },
  { name: `widget.css`, type: 'css' },
  { name: `widget.js`, type: 'js' },
];
```

## Token Budget Considerations

### Context Window Sizes
- Claude Haiku 4.5: 200K input / 8K output
- Claude Sonnet 4.5: 200K input / 8K output
- GPT-5: 272K input / 128K output
- Gemini 2.5 Pro: 1M input / 8K output

### Typical File Sizes
- HTML: 200-2000 chars (50-500 tokens)
- CSS: 100-1000 chars (25-250 tokens)
- JS: 100-1000 chars (25-250 tokens)
- PHP Widget: 2000-5000 chars (500-1250 tokens)

**Per-File Cost**: ~50-1250 tokens
**Safe Context Budget**: Load max 5-10 files explicitly

### Strategy
1. **Never auto-load** - Only load when referenced with `@file` or `viewFile` tool
2. **Show token impact** - Display "+250 tokens" when user adds `@file`
3. **Warn at limits** - "Adding this file will exceed context limit"
4. **Summarize large files** - For files >5000 chars, offer to summarize first

## File Structure Changes

### New Files to Create
1. `/src/lib/file-context-manager.ts` - File reference detection and loading
2. `/src/components/elementor/FileReferenceAutocomplete.tsx` - @file dropdown
3. `/src/components/elementor/FileReferencePill.tsx` - Tag display
4. `/docs/file-tagging-usage.md` - User documentation

### Files to Modify
1. `/src/components/elementor/ChatInterface.tsx` - Add @file detection
2. `/src/app/api/chat-elementor/route.ts` - Add viewFile tool
3. `/src/components/elementor/HtmlSectionEditor.tsx` - Pass file groups to chat
4. `/src/components/elementor/ProjectSidebar.tsx` - Mobile full-width
5. `/src/hooks/useFileGroups.ts` - Add getFileByName method

## Implementation Order

### Week 1: Core Functionality
1. ✅ Add `viewFile` tool to chat API
2. ✅ Update ChatInterface to detect `@file` patterns
3. ✅ Create file reference autocomplete
4. ✅ Test with real workflow

### Week 2: UX Polish
1. ✅ Mobile full-width panels
2. ✅ Project-specific file filtering
3. ✅ Token counter integration
4. ✅ File reference pills
5. ✅ Documentation

## Example User Workflows

### Workflow 1: Reference Existing File
```
User: "Make the hero section match the style of @navbar.css"

System:
1. Detects @navbar.css reference
2. Loads navbar.css content (245 tokens)
3. Shows pill: "📄 navbar.css (+245 tokens)"
4. Sends to AI with context

AI Response: "I'll update the hero section to match the navbar styles..."
```

### Workflow 2: AI Checks Current File
```
User: "Add a new button to the current HTML"

AI: [Calls viewFile tool with file='html']
Tool Response: { filename: 'hero.html', content: '<section class="hero">...</section>' }

AI Response: "I see your current HTML is a hero section. I'll add a button after the subtitle..."
```

### Workflow 3: Compare Two Files
```
User: "Why does @hero.css conflict with @navbar.css?"

System:
1. Loads hero.css (320 tokens)
2. Loads navbar.css (245 tokens)
3. Shows pills for both
4. Total context: +565 tokens

AI: "Both files use .logo class. The conflict is in line 12 of hero.css..."
```

## Security & Validation

### File Access Rules
1. **Only current project** - Users can't reference files from other projects
2. **Validate filename** - Must match pattern: `^[\w-]+\.(html|css|js|php)$`
3. **Size limits** - Warn if file >10KB (large for context)
4. **Sanitize content** - Escape special chars before sending to AI

### Error Handling
```typescript
try {
  const file = loadFileByReference('@navbar.css');
} catch (error) {
  if (error.type === 'FILE_NOT_FOUND') {
    showSuggestions(['Did you mean @navbar-widget.css?']);
  } else if (error.type === 'FILE_TOO_LARGE') {
    showWarning('This file is 25KB. Load anyway? (+6250 tokens)');
  }
}
```

## Widget Conversion Creates New Project

**Requirement**: When converting PHP widget back to HTML, create a new HTML project instead of modifying the original.

**Current Behavior** (WRONG):
```
User has: "Hero Widget" (PHP type)
Clicks: "🔄 Convert Back to HTML"
Result: Same project switched to HTML type (original PHP lost!)
```

**Expected Behavior** (CORRECT):
```
User has: "Hero Widget" (PHP type)
Clicks: "🔄 Convert Back to HTML"
Result:
  - Original "Hero Widget" (PHP) - UNCHANGED
  - New "Hero Widget (HTML)" (HTML type) - CREATED
```

**Implementation**:
```typescript
// In handleConvertBackToHtml()
const handleConvertBackToHtml = () => {
  const { html, css, js } = extractCodeFromPhp(section.php);

  // Create NEW project instead of modifying current
  const newGroup = fileGroups.createNewGroup(
    `${fileGroups.activeGroup.name} (HTML)`,  // Add (HTML) suffix
    'html',
    'empty'
  );

  // Set content
  fileGroups.updateGroupFile(newGroup.id, 'html', html);
  fileGroups.updateGroupFile(newGroup.id, 'css', css);
  fileGroups.updateGroupFile(newGroup.id, 'js', js);

  // Switch to new project
  fileGroups.selectGroup(newGroup.id);

  alert('✅ Created new HTML project. Original widget preserved.');
};
```

**Why This Matters**:
- User doesn't lose their working PHP widget
- Can convert back and forth without fear
- Clear separation between HTML and PHP versions
- Easier to compare/debug

## Future Enhancements

1. **Smart Context** - AI auto-suggests relevant files
2. **Diff View** - Compare two files side-by-side
3. **File Search** - `/find` command to search across all files
4. **Context Cache** - Reuse previously loaded files (Anthropic prompt caching)
5. **Folder References** - `@src/` to load entire folder
6. **Git Integration** - `@main:navbar.css` to reference specific branch

## Testing Plan

### Unit Tests
- File reference pattern detection
- Token estimation accuracy
- File loading from groups
- Error handling

### Integration Tests
- End-to-end @file workflow
- viewFile tool execution
- Mobile responsive behavior
- Project filtering

### User Acceptance Tests
- Can user easily reference files?
- Is token impact clear?
- Does autocomplete help?
- Does it work on mobile?

---

**Status**: Planning Complete ✅
**Next Step**: Implement Phase 1 (viewFile tool)
