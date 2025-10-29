# Tool Ecosystem Design & Agentic Workflow Strategy

**Date:** October 26, 2025
**Purpose:** Comprehensive tool inventory and architectural recommendations for multi-step agentic workflows

---

## 🔍 Research Summary: Vercel AI SDK Capabilities

### Key Findings

Based on research into Vercel AI SDK 5.0 (released July 31, 2025), here are the relevant capabilities:

#### 1. **Multi-Step Agentic Loops**
- `maxSteps` parameter enables autonomous tool calling loops
- AI SDK automatically appends tool results to conversation history
- Continues calling tools until reaching `maxSteps` or text response

#### 2. **Agent Class**
```typescript
const agent = new Agent({
  model: 'openai/gpt-4o',
  tools: { /* all tools */ },
  stopWhen: stepCountIs(20), // Max 20 sequential tool calls
});

const result = await agent.generateText({ prompt: "..." });
// Agent autonomously calls tools until task complete
```

#### 3. **Agentic Loop Control**
- `stopWhen(condition)` - Stop based on custom conditions
- `prepareStep(step)` - Modify context/model per step
- `stepCountIs(n)` - Stop after N steps

#### 4. **Workflow Patterns Supported**
- **Chaining**: Sequential steps (A → B → C)
- **Routing**: Conditional branching (A → B or C)
- **Parallel**: Independent subtasks (A + B + C simultaneously)
- **Evaluator-Optimizer**: Iterative improvement loops

#### 5. **Message Parts System**
- Preserves exact sequence of reasoning, tool calls, results
- Supports mixed outputs in single message
- Better tracking of multi-step flows

---

## 📋 Complete Tool Inventory

### **Category 1: Navigation & View Management**

| Tool Name | Purpose | User Intent Examples | Atomic? |
|-----------|---------|---------------------|---------|
| `switchTab` | Navigate between tabs | "Open Section Library", "Go to WordPress" | ✅ Yes |
| `openVisualEditor` | Open Visual Editor for current section | "Show me visual editor", "Open GrapeJS" | ✅ Yes |
| `openCodeEditor` | Switch to Code Editor tab | "Go to code view", "Show HTML editor" | ✅ Yes |
| `viewEditorCode` | Display code with syntax highlighting | "Show me the code", "What's in my CSS?" | ✅ Yes |
| `previewInPlayground` | Load current section in WordPress preview | "Preview this in WordPress", "Show me how it looks" | ✅ Yes |

### **Category 2: Code Generation & Editing**

| Tool Name | Purpose | User Intent Examples | Atomic? |
|-----------|---------|---------------------|---------|
| `generateHTML` | Generate full section (HTML+CSS+JS) | "Create a hero section" | ✅ Yes |
| `generateSingleFile` | Generate ONE file only | "Generate CSS for my HTML" | ✅ Yes |
| `editCode` | Diff-based code editing | "Change button color to red" | ✅ Yes |
| `refactorCode` | Restructure/optimize existing code | "Optimize this CSS", "Clean up HTML" | ✅ Yes |
| `convertToElementorWidget` | Convert HTML section to PHP widget | "Make this an Elementor widget" | ⚠️ Multi-step |
| `addResponsiveBreakpoints` | Add media queries for mobile/tablet | "Make this responsive" | ✅ Yes |

### **Category 3: Section Library Operations**

| Tool Name | Purpose | User Intent Examples | Atomic? |
|-----------|---------|---------------------|---------|
| `saveSectionToLibrary` | Save current section to library | "Save this section", "Add to library" | ✅ Yes |
| `loadSectionFromLibrary` | Load section by name/ID | "Load 'Hero v2' from library" | ✅ Yes |
| `listSections` | Show all saved sections | "What sections do I have?", "Show my library" | ✅ Yes |
| `deleteSectionFromLibrary` | Remove section from library | "Delete 'Old Hero' section" | ✅ Yes |
| `renameSectionInLibrary` | Rename saved section | "Rename section to 'Pricing Table v3'" | ✅ Yes |
| `duplicateSectionInLibrary` | Copy section with new name | "Duplicate this section" | ✅ Yes |
| `exportSectionAsZip` | Export section as downloadable ZIP | "Export this section", "Download as file" | ✅ Yes |
| `importSectionFromFile` | Import section from uploaded file | "Import this section ZIP" | ✅ Yes |

### **Category 4: WordPress Integration**

| Tool Name | Purpose | User Intent Examples | Atomic? |
|-----------|---------|---------------------|---------|
| `renderInWordPress` | Load section in WordPress Playground | "Show this in WordPress", "Render in WP" | ⚠️ Multi-step |
| `installInElementor` | Install as Elementor template | "Add to Elementor templates" | ⚠️ Multi-step |
| `createWordPressPage` | Create WP page with section | "Make a WordPress page with this" | ⚠️ Multi-step |
| `syncToWordPress` | Sync code changes to WP | "Update WordPress preview" | ✅ Yes |
| `getWordPressSettings` | Fetch WP site settings | "Show WordPress settings" | ✅ Yes |
| `updateWordPressSettings` | Update WP site config | "Change site title to X" | ✅ Yes |
| `getElementorStyleKit` | Get Elementor colors/fonts | "Show Elementor colors" | ✅ Yes |
| `updateElementorStyleKit` | Update global styles | "Set primary color to blue" | ✅ Yes |

### **Category 5: Asset Management**

| Tool Name | Purpose | User Intent Examples | Atomic? |
|-----------|---------|---------------------|---------|
| `uploadImage` | Upload image to WordPress media | "Upload this image" | ✅ Yes |
| `listMediaLibrary` | Show WordPress media files | "What images do I have?" | ✅ Yes |
| `optimizeImages` | Compress/optimize images | "Optimize all images" | ✅ Yes |
| `generatePlaceholder` | Create placeholder images | "Add placeholder image" | ✅ Yes |

### **Category 6: Analysis & Validation**

| Tool Name | Purpose | User Intent Examples | Atomic? |
|-----------|---------|---------------------|---------|
| `validateCode` | Check HTML/CSS/JS syntax | "Check for errors" | ✅ Yes |
| `analyzeAccessibility` | WCAG compliance check | "Is this accessible?", "Check a11y" | ✅ Yes |
| `analyzePerformance` | Performance metrics | "How fast is this?", "Check performance" | ✅ Yes |
| `detectColorContrast` | Check color contrast ratios | "Is text readable?" | ✅ Yes |
| `generateStyleGuide` | Extract design tokens | "Create style guide from this" | ✅ Yes |

### **Category 7: Testing & Preview**

| Tool Name | Purpose | User Intent Examples | Atomic? |
|-----------|---------|---------------------|---------|
| `previewResponsive` | Show mobile/tablet/desktop views | "Show mobile preview" | ✅ Yes |
| `testInteractivity` | Test JS interactions | "Test button clicks" | ✅ Yes |
| `generateScreenshot` | Capture visual snapshot | "Screenshot this section" | ✅ Yes |
| `compareVersions` | Visual diff between versions | "Compare with previous version" | ✅ Yes |

### **Category 8: Collaboration & Export**

| Tool Name | Purpose | User Intent Examples | Atomic? |
|-----------|---------|---------------------|---------|
| `exportToCodepen` | Open in CodePen editor | "Open in CodePen" | ✅ Yes |
| `exportToFigma` | Export to Figma design | "Send to Figma" | ✅ Yes |
| `shareSection` | Generate shareable link | "Share this section" | ✅ Yes |
| `generateDocumentation` | Auto-document code | "Document this component" | ✅ Yes |

### **Category 9: AI-Assisted Operations**

| Tool Name | Purpose | User Intent Examples | Atomic? |
|-----------|---------|---------------------|---------|
| `suggestImprovements` | AI-powered recommendations | "How can I improve this?" | ✅ Yes |
| `explainCode` | Natural language code explanation | "Explain what this CSS does" | ✅ Yes |
| `generateVariations` | Create design variations | "Show me 3 variations of this" | ⚠️ Multi-step |
| `extractComponents` | Identify reusable components | "Find reusable parts" | ✅ Yes |

---

## 🏗️ Architectural Recommendations

### **Option 1: Many Atomic Tools + Agent Mode** ⭐ **RECOMMENDED**

**Structure:**
- 40-50 small, focused, atomic tools
- Each tool does ONE thing well
- Agent class orchestrates multi-step workflows

**Implementation:**
```typescript
// Define all atomic tools
const tools = {
  generateHTML: generateHTMLTool,
  saveSectionToLibrary: saveSectionToLibraryTool,
  renderInWordPress: renderInWordPressTool,
  switchTab: switchTabTool,
  // ... 40+ more tools
};

// Use Agent class for autonomous workflows
const elementorAgent = new Agent({
  model: 'anthropic/claude-sonnet-4-5-20250929',
  tools: tools,
  maxSteps: 15, // Allow up to 15 sequential tool calls
  stopWhen: (step) => {
    // Stop if task complete or error
    return step.text?.includes('Task complete') || step.error;
  }
});

// User prompt triggers autonomous workflow
const result = await elementorAgent.generateText({
  prompt: "Generate a hero section, save it to library, and render it in WordPress"
});

// Agent autonomously:
// 1. Calls generateHTML → creates section
// 2. Calls saveSectionToLibrary → saves it
// 3. Calls renderInWordPress → shows in WP
// 4. Calls switchTab('playground') → navigates to WP tab
// 5. Returns "Task complete"
```

**Pros:**
- ✅ Maximum flexibility (agent can combine tools creatively)
- ✅ Easy to add new tools (just add to tools object)
- ✅ Natural language understanding (AI decides tool order)
- ✅ Handles unexpected requests well
- ✅ User can interrupt/modify mid-workflow
- ✅ Clear tool boundaries (easy debugging)

**Cons:**
- ⚠️ More tokens per complex workflow (each tool call + reasoning)
- ⚠️ Need good tool descriptions (AI must choose correctly)
- ⚠️ Potential for inefficient tool sequences

**Best For:**
- Complex, varied user requests
- Exploratory workflows
- When tool order isn't always the same

---

### **Option 2: Grouped "Super Tools" + Manual Orchestration**

**Structure:**
- 10-15 large composite tools
- Each tool handles a complete workflow
- Manual orchestration (no agent loop)

**Implementation:**
```typescript
// Composite "super tool"
const createAndDeployWidgetTool = tool({
  description: 'Generate Elementor widget, save to library, and deploy to WordPress',
  inputSchema: z.object({
    description: z.string(),
    widgetName: z.string(),
  }),
  execute: async ({ description, widgetName }) => {
    // Step 1: Generate
    const code = await generateElementorWidget(description);

    // Step 2: Save
    await saveToLibrary(widgetName, code);

    // Step 3: Deploy
    await installInWordPress(code);

    // Step 4: Navigate
    await switchToWordPressTab();

    return { status: 'complete', widgetName, deployed: true };
  }
});
```

**Pros:**
- ✅ Fewer total tokens (one tool call instead of 4-5)
- ✅ Guaranteed execution order
- ✅ Faster execution (no AI reasoning between steps)
- ✅ Predictable behavior

**Cons:**
- ❌ Inflexible (can't handle variations)
- ❌ Duplicate logic across tools
- ❌ Hard to maintain (complex execute functions)
- ❌ Can't interrupt mid-workflow
- ❌ Doesn't handle edge cases well

**Best For:**
- Fixed, repetitive workflows
- Performance-critical operations
- Simple, well-defined tasks

---

### **Option 3: Hybrid - Atomic Tools + Workflow Orchestrators** ⭐ **ALSO RECOMMENDED**

**Structure:**
- 40-50 atomic tools (for flexibility)
- 5-10 "workflow orchestrator" tools (for common patterns)
- Agent mode can use either

**Implementation:**
```typescript
// ATOMIC TOOLS (flexible, composable)
const tools = {
  generateHTML: ...,
  saveSectionToLibrary: ...,
  renderInWordPress: ...,
  switchTab: ...,
  // ... 40 more
};

// WORKFLOW ORCHESTRATORS (fast, common patterns)
const workflows = {
  // Fast path for common request
  generateAndDeployWidget: tool({
    description: 'Quick workflow: Generate Elementor widget and deploy to WordPress',
    inputSchema: z.object({
      description: z.string(),
      widgetName: z.string(),
    }),
    execute: async ({ description, widgetName }) => {
      // Calls atomic tools internally
      await tools.generateHTML.execute({ description });
      await tools.saveSectionToLibrary.execute({ suggestedName: widgetName });
      await tools.renderInWordPress.execute({});
      await tools.switchTab.execute({ tab: 'playground' });

      return { status: 'complete', steps: 4 };
    }
  }),

  // Another common workflow
  loadAndEditSection: tool({
    description: 'Load section from library and edit it',
    inputSchema: z.object({
      sectionName: z.string(),
      editInstruction: z.string(),
    }),
    execute: async ({ sectionName, editInstruction }) => {
      await tools.loadSectionFromLibrary.execute({ sectionName });
      await tools.editCode.execute({
        instruction: editInstruction,
        fileType: 'html'
      });

      return { status: 'complete' };
    }
  })
};

// COMBINED TOOL SET
const allTools = { ...tools, ...workflows };

// Agent can choose atomic OR workflow tools
const agent = new Agent({
  model: 'anthropic/claude-sonnet-4-5-20250929',
  tools: allTools,
  maxSteps: 15
});

// Common request → uses fast workflow tool (1 call)
await agent.generateText({
  prompt: "Generate a pricing table widget and show it in WordPress"
  // Agent calls: generateAndDeployWidget (1 tool, fast)
});

// Uncommon request → uses atomic tools (flexible)
await agent.generateText({
  prompt: "Generate hero, duplicate it 3 times with variations, save all to library"
  // Agent calls: generateHTML → duplicateSectionInLibrary (3x) → variations
});
```

**Pros:**
- ✅ Best of both worlds (flexibility + performance)
- ✅ Fast path for common workflows (1 tool call)
- ✅ Flexible for unusual requests (atomic tools)
- ✅ AI learns user patterns over time
- ✅ Easy to add new workflows (just compose atomic tools)

**Cons:**
- ⚠️ More upfront work (define both atomic + workflows)
- ⚠️ Need to identify common patterns
- ⚠️ Slight increase in total tool count

**Best For:**
- Production applications (balance of speed + flexibility)
- When you have clear common use cases
- Long-term maintainability

---

## 🎯 Final Recommendation

### **Implement: Option 3 (Hybrid)**

**Reasoning:**
1. **Start with atomic tools** - You already have many implemented
2. **Add workflow orchestrators** - For the 5-10 most common user requests
3. **Use Agent class** - Let AI autonomously chain tools
4. **Monitor usage** - See which tool sequences users request most
5. **Optimize incrementally** - Convert frequent sequences to workflow tools

### **Implementation Phases**

#### **Phase 1: Expand Atomic Tools** (1-2 days)
Add critical missing tools:
- `loadSectionFromLibrary`
- `renderInWordPress`
- `convertToElementorWidget`
- `previewResponsive`
- `validateCode`
- `listSections`

Result: ~25-30 atomic tools total

#### **Phase 2: Enable Agent Mode** (1 day)
```typescript
// chat-elementor/route.ts
import { Agent } from 'ai';

const elementorAgent = new Agent({
  model: gateway(model, { apiKey: process.env.AI_GATEWAY_API_KEY! }),
  tools: tools, // All atomic tools
  maxSteps: 15,
  stopWhen: (step) => {
    // Stop conditions
    if (step.text?.toLowerCase().includes('complete')) return true;
    if (step.error) return true;
    return false;
  }
});

// Use agent instead of streamText for multi-step requests
const result = await elementorAgent.streamText({
  prompt: userMessage,
  system: systemPrompt
});
```

Result: Autonomous multi-step workflows

#### **Phase 3: Identify Common Workflows** (Monitor for 1 week)
Track which tool sequences happen most:
- Generate → Save → Render (probably #1)
- Load → Edit → Save
- Generate → Convert to Widget → Install

Result: Data-driven workflow priorities

#### **Phase 4: Add Workflow Orchestrators** (1-2 days)
Create 5-10 composite tools for common patterns:
```typescript
const quickDeployWorkflow = tool({
  description: 'Generate section, save to library, and preview in WordPress (common workflow)',
  // ... implementation
});
```

Result: Faster execution for common tasks

---

## 📊 Example User Flows

### **Example 1: Simple Request (1 tool call)**
```
User: "Save this section to my library"
Agent: Calls saveSectionToLibrary → Done (1 step)
```

### **Example 2: Common Multi-Step (1 workflow tool OR 3 atomic tools)**

**Option A (workflow tool exists):**
```
User: "Generate a hero section and show it in WordPress"
Agent: Calls generateAndDeployWorkflow → Done (1 step, fast)
```

**Option B (no workflow tool, uses atomic):**
```
User: "Generate a hero section and show it in WordPress"
Agent:
  Step 1: Calls generateHTML → creates section
  Step 2: Calls renderInWordPress → loads in WP
  Step 3: Calls switchTab('playground') → navigates
  Step 4: Returns "Complete" → Done (3 steps, flexible)
```

### **Example 3: Complex Custom Request (atomic tools)**
```
User: "Generate a pricing table, make 3 variations, save the best one, and create a WordPress page"

Agent:
  Step 1: Calls generateHTML → pricing table
  Step 2: Calls generateVariations → 3 versions
  Step 3: (AI reasons about "best")
  Step 4: Calls saveSectionToLibrary → saves chosen version
  Step 5: Calls createWordPressPage → new WP page
  Step 6: Calls renderInWordPress → shows on page
  Step 7: Calls switchTab('playground') → navigates
  Step 8: Returns "Complete" → Done (7 steps, very flexible)
```

### **Example 4: Interrupt & Modify Mid-Workflow**
```
User: "Generate a hero section and deploy it"
Agent:
  Step 1: Calls generateHTML → creates hero
  [Shows preview]

User: "Wait, make the button blue first"
Agent:
  Step 2: Calls editCode → changes button color
  [Shows diff preview]

User: "Looks good, now deploy it"
Agent:
  Step 3: Calls renderInWordPress → deploys
  Step 4: Calls switchTab('playground') → navigates
  Done
```

---

## 🔧 Technical Implementation Details

### **Agent Configuration**

```typescript
// src/lib/elementor-agent.ts
import { Agent, stepCountIs } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { tools } from './tools';

export function createElementorAgent(model: string) {
  return new Agent({
    model: gateway(model, {
      apiKey: process.env.AI_GATEWAY_API_KEY!,
    }),
    tools: tools,
    maxSteps: 15, // Maximum 15 sequential tool calls

    stopWhen: (step) => {
      // Stop if AI says task is complete
      if (step.text?.toLowerCase().includes('task complete')) return true;
      if (step.text?.toLowerCase().includes('finished')) return true;

      // Stop on error
      if (step.error) return true;

      // Stop if user interrupted (custom signal)
      if (step.experimental_providerMetadata?.interrupted) return true;

      return false;
    },

    prepareStep: (step) => {
      // Optionally modify context per step
      // Example: Add step counter to system prompt
      return {
        ...step,
        system: `${step.system}\n\nYou are on step ${step.stepNumber} of ${step.maxSteps}.`
      };
    }
  });
}
```

### **Usage in Chat Endpoint**

```typescript
// src/app/api/chat-elementor/route.ts
import { createElementorAgent } from '@/lib/elementor-agent';

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  const agent = createElementorAgent(model);

  // Check if request requires multi-step workflow
  const lastMessage = messages[messages.length - 1].content;
  const isMultiStep = detectMultiStepIntent(lastMessage);

  if (isMultiStep) {
    // Use agent for autonomous multi-step execution
    const result = await agent.streamText({
      messages: convertedMessages,
      system: systemPrompt,
    });

    return result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
      sendToolResults: true,
    });
  } else {
    // Use regular streamText for single-step requests
    const result = streamText({
      model: gateway(model),
      messages: convertedMessages,
      tools: tools,
      maxSteps: 1, // Only allow 1 tool call
    });

    return result.toUIMessageStreamResponse();
  }
}

// Intent detection helper
function detectMultiStepIntent(message: string): boolean {
  const multiStepKeywords = [
    'and then',
    'after that',
    'also',
    'then deploy',
    'and show',
    'and save',
    'and preview',
  ];

  return multiStepKeywords.some(keyword =>
    message.toLowerCase().includes(keyword)
  );
}
```

---

## 🎨 User Experience Flow

### **Visual Progress Indicator**

For multi-step workflows, show progress:

```tsx
// components/AgentProgressIndicator.tsx
export function AgentProgressIndicator({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          {step.status === 'completed' && <CheckCircle className="text-green-500" />}
          {step.status === 'in_progress' && <Loader2 className="animate-spin" />}
          {step.status === 'pending' && <Circle className="text-gray-300" />}

          <span className={step.status === 'completed' ? 'line-through' : ''}>
            Step {i + 1}: {step.toolName}
          </span>
        </div>
      ))}
    </div>
  );
}
```

Example display:
```
✅ Step 1: generateHTML (completed)
✅ Step 2: saveSectionToLibrary (completed)
🔄 Step 3: renderInWordPress (in progress...)
⭕ Step 4: switchTab (pending)
```

---

## 📈 Success Metrics

**Track these metrics to optimize:**

1. **Tool Usage Frequency**
   - Which tools are called most?
   - Which tool sequences are most common?
   - Identify candidates for workflow orchestrators

2. **Workflow Completion Rate**
   - % of multi-step requests that complete successfully
   - Where do failures happen most?

3. **Token Efficiency**
   - Average tokens per workflow
   - Compare atomic vs workflow tools

4. **User Satisfaction**
   - Time to complete common tasks
   - Number of user interruptions/corrections

---

## 🚀 Quick Start Implementation

### **Week 1: Foundation**
- Add 10 most critical atomic tools
- Enable Agent class in chat endpoint
- Basic progress indicator UI

### **Week 2: Monitoring**
- Track tool usage patterns
- Identify top 5 common workflows
- Gather user feedback

### **Week 3: Optimization**
- Build 5 workflow orchestrator tools
- Add advanced stopping conditions
- Improve error handling

### **Week 4: Polish**
- Better progress visualization
- Interrupt/resume workflows
- Documentation & examples

---

## ✅ Summary

**Best Approach: Hybrid (Option 3)**

- **Start:** 25-30 atomic tools (flexible foundation)
- **Add:** Agent class with maxSteps (autonomous execution)
- **Monitor:** Track common tool sequences (data-driven)
- **Optimize:** Add 5-10 workflow orchestrators (performance)
- **Result:** Fast + Flexible + Maintainable

**Key Insight:**
> The Agent class transforms your tool collection into an autonomous system. Each tool is like a Lego brick - individually simple, but collectively powerful when the AI orchestrates them creatively.

**Your Example Use Case:**
```
User: "Generate an Elementor widget, save it to library, and run it in WordPress"

Agent (autonomously):
├─ Step 1: generateHTML (creates widget code)
├─ Step 2: convertToElementorWidget (PHP wrapper)
├─ Step 3: saveSectionToLibrary (saves to library)
├─ Step 4: renderInWordPress (loads in Playground)
└─ Step 5: switchTab('playground') (navigates to WP view)

Result: User sees widget in WordPress AND finds it in Section Library ✅
```

This is **exactly** what the Agent class was designed for!
