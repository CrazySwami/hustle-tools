# Widget Validation Auto-Fix System - Remaining Work

## ✅ Completed (Parts 1 & 2A)

### Part 1: Validation Infrastructure
- ✅ Validation API endpoint (`/api/validate-widget`) with Haiku 4.5
- ✅ Beautiful validation modal UI with scores and checkboxes
- ✅ Auto-validation after widget deployment
- ✅ "Fix Issues" button in modal (shows when checks fail)

### Part 2A: Fix Issues → Chat Integration
- ✅ `onSendChatMessage` prop added to HtmlSectionEditor
- ✅ `onFixIssues` handler formats validation errors as message
- ✅ Button click sends detailed error message to chat
- ✅ Chat panel opens automatically

---

## 🚧 Remaining Work (Part 2B)

### 1. Handle `validateWidget` Tool in Chat API

**File:** `/src/app/api/chat-elementor/route.ts`

**What to do:**
- Add `validateWidget` to the tools config (already in tools.ts, just need to add to route.ts)
- Detect when the tool is executed
- Call `/api/validate-widget` with current project's PHP code
- Return structured validation results to chat

**Code to add:**
```typescript
// In route.ts tools config
const toolsConfig = {
  // ... existing tools
  validateWidget: tools.validateWidget,  // Add this
};

// Handle tool execution (add to tool result processing)
if (toolName === 'validateWidget') {
  const activeGroup = fileGroups.activeGroup; // Need to pass this via body
  if (activeGroup?.type !== 'php') {
    return { error: 'Can only validate PHP widget projects' };
  }

  const widgetPhp = activeGroup.files.php || '';
  const widgetName = activeGroup.name;

  // Call validation API
  const validationResponse = await fetch('/api/validate-widget', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      widgetPhp,
      widgetName,
      widgetTitle: widgetName
    })
  });

  const validationResult = await validationResponse.json();
  return validationResult;
}
```

### 2. Add Project Context to System Prompt

**File:** `/src/app/api/chat-elementor/route.ts`

**What to do:**
- Include active project name and type in system prompt
- Tell AI which file it's editing (HTML, CSS, JS, or PHP)
- Provide project-specific context for better edits

**Code to add:**
```typescript
// In system prompt (line ~70-190)
const activeGroup = fileGroups.activeGroup;
const projectContext = activeGroup ? `

**Current Project:**
- Name: ${activeGroup.name}
- Type: ${activeGroup.type === 'php' ? 'PHP Widget' : 'HTML Section'}
- Files: ${Object.keys(activeGroup.files).join(', ')}

When using editCodeWithMorph, you are editing files in the "${activeGroup.name}" project.
` : '';

systemPrompt += projectContext;
```

### 3. Pass File Groups to Chat API

**File:** `/src/app/elementor-editor/page.tsx`

**What to do:**
- Pass file groups state to chat via useChat body
- This allows the API to know which project is active

**Code to modify:**
```typescript
// In page.tsx, update useChat body (line ~138)
const { messages, sendMessage, isLoading } = useChat({
  api: '/api/chat-elementor',
  body: {
    currentJson,
    webSearch,
    currentSection,
    includeContext,
    fileGroups: {  // Add this
      activeGroupId: fileGroups.activeGroup?.id,
      activeGroupName: fileGroups.activeGroup?.name,
      activeGroupType: fileGroups.activeGroup?.type,
      activeGroupFiles: fileGroups.activeGroup?.files,
    }
  },
});
```

### 4. Create Validation Result Chat Widget (Optional Enhancement)

**File:** `/src/components/tool-ui/tool-result-renderer.tsx`

**What to do:**
- Add custom widget to display validation results in chat
- Show scores, checks, and allow re-validation

**Code to add:**
```typescript
case 'tool-validateWidget':
  return (
    <Tool key={i} defaultOpen>
      <ToolHeader type="validateWidget" state="result-available" />
      <ToolContent>
        <div className="validation-results">
          <div className="score">Score: {part.output.overallScore}%</div>
          {part.output.checks.map((check, idx) => (
            <div key={idx} className={check.passed ? 'check-passed' : 'check-failed'}>
              {check.passed ? '✅' : '❌'} {check.requirement}
              <p>{check.details}</p>
            </div>
          ))}
        </div>
      </ToolContent>
    </Tool>
  );
```

---

## Testing Checklist

Once implementation is complete, test this flow:

1. ✅ Generate widget with AI (simple widget first)
2. ✅ Validation modal shows automatically
3. ✅ Click "Fix Issues" button
4. ✅ Chat opens with formatted error message
5. ⏸️ User types "validate this widget" (should trigger validateWidget tool)
6. ⏸️ AI receives validation results
7. ⏸️ AI uses editCodeWithMorph to fix PHP file
8. ⏸️ User re-validates or deploys

---

## Current Status

**What works right now:**
- ✅ Widget generation with Sonnet 4.5
- ✅ Auto-validation with Haiku 4.5
- ✅ Validation modal with beautiful UI
- ✅ Fix Issues button sends message to chat

**What needs completion:**
- ⏸️ validateWidget tool execution in chat API
- ⏸️ Project context in system prompt
- ⏸️ File groups passed to chat
- ⏸️ (Optional) Validation widget in chat

**Estimated time:** 30-45 minutes to complete Part 2B

---

## Benefits When Complete

1. **Full Auto-Fix Loop:**
   - User: "validate this widget"
   - AI validates → finds issues → fixes them automatically
   - User: "validate again" → All checks pass

2. **Proactive Validation:**
   - AI can validate before deployment (guided by tool description)
   - AI can suggest fixes based on validation results

3. **Smart Context:**
   - AI knows which project it's editing
   - No confusion between HTML sections and PHP widgets

4. **Better UX:**
   - One-click fix from modal
   - Or natural language "check my code"
   - Or proactive "let me validate first"
