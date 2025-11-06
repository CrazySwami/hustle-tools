'use client';

import { useState, useEffect } from 'react';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { MODEL_PRICING } from '@/hooks/useUsageTracking';
import { AiFillHtml5 } from 'react-icons/ai';
import { FaWordpress } from 'react-icons/fa';
import { SiHubspot, SiCss3, SiJavascript } from 'react-icons/si';
import { MdTransform } from 'react-icons/md';

import { convertHtmlToHubL } from '@/lib/hubspot-converter';
import { SystemPromptViewer } from '@/components/ui/SystemPromptViewer';
import { getModelContextLimit, estimateTokenCount } from '@/lib/token-validator';
import { loadEditorState, type FileGroup } from '@/lib/file-group-manager';
import { streamWithLegacyCallbacks } from '@/lib/project-generation/streaming';
import { getModelsByProvider } from '@/lib/project-generation/config';
import type { ProjectType } from '@/lib/project-generation/types';

// Model configurations (same as ChatInterface)
const MODEL_CONFIGS = {
  'anthropic/claude-haiku-4-5-20251001': { name: 'Claude Haiku 4.5', inputLimit: 200000, outputLimit: 8192 },
  'anthropic/claude-sonnet-4-5-20250929': { name: 'Claude Sonnet 4.5', inputLimit: 200000, outputLimit: 8192 },
  'anthropic/claude-opus-4-20250514': { name: 'Claude Opus 4', inputLimit: 200000, outputLimit: 8192 },
  'openai/gpt-5': { name: 'GPT-5', inputLimit: 272000, outputLimit: 128000 },
  'openai/gpt-5-mini': { name: 'GPT-5 Mini', inputLimit: 272000, outputLimit: 128000 },
  'google/gemini-2.5-pro': { name: 'Gemini 2.5 Pro', inputLimit: 1000000, outputLimit: 8192 },
};

interface GenerateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (code: { html: string; css: string; js: string; php?: string; hubl?: string; projectName?: string }) => void;
  onProjectCreate?: (projectName: string, projectType: 'html' | 'php' | 'hubspot') => string; // Returns new project ID
  onProjectUpdate?: (projectId: string, file: 'html' | 'css' | 'js' | 'php' | 'hubl', content: string) => void;
  onProjectMetadataUpdate?: (projectId: string, metadata: any) => void; // Update plugin metadata (widgetFiles, pluginMainFile, etc.)
  onSwitchCodeTab?: (tab: 'html' | 'css' | 'js' | 'php' | 'hubl') => void;
  onSwitchTab?: (tab: string) => void; // Switch main tab (e.g., to 'json')
  onGenerationStart?: () => void; // NEW: Notify when generation starts
  onGenerationEnd?: () => void; // NEW: Notify when generation ends
  isEditorReady?: (fileType: string) => boolean; // Check if editor is mounted and ready
  defaultModel?: string;
  // Optional existing code for conversion mode or context
  existingCode?: {
    html?: string;
    css?: string;
    js?: string;
  };
  // Optional global CSS to include in generation
  globalCSS?: string;
}

export function GenerateProjectModal({ isOpen, onClose, onGenerate, onProjectCreate, onProjectUpdate, onProjectMetadataUpdate, onSwitchCodeTab, onSwitchTab, onGenerationStart, onGenerationEnd, isEditorReady, defaultModel, existingCode, globalCSS }: GenerateProjectModalProps) {
  // If existingCode is provided, we're in conversion mode - skip type selection and go straight to elementor
  const isConversionMode = !!existingCode;
  const [step, setStep] = useState<'type' | 'description' | 'generating'>(isConversionMode ? 'description' : 'type');
  const [projectType, setProjectType] = useState<'html' | 'elementor' | 'hubspot' | 'convert-to-elementor'>(isConversionMode ? 'elementor' : 'html');
  const [selectedHtmlProjectId, setSelectedHtmlProjectId] = useState<string>(''); // For convert-to-elementor option
  const [hubspotModuleType, setHubspotModuleType] = useState<'email' | 'page'>('email'); // Email by default for safety
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [selectedModel, setSelectedModel] = useState(defaultModel || 'anthropic/claude-sonnet-4-5-20250929');
  const [includeGlobalCSS, setIncludeGlobalCSS] = useState(true); // Default to including global CSS
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [currentPhase, setCurrentPhase] = useState<'html' | 'css' | 'js' | 'php' | 'hubl' | null>(null);
  const [usageMetadata, setUsageMetadata] = useState<any>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; filename: string }>>([]);
  const [includeImages, setIncludeImages] = useState(false);
  const [htmlProjects, setHtmlProjects] = useState<FileGroup[]>([]);

  const { recordUsage} = useUsageTracking();

  // Load HTML projects when modal opens
  useEffect(() => {
    if (isOpen) {
      const state = loadEditorState();
      const htmlOnly = state.groups.filter(g => g.type === 'html');
      setHtmlProjects(htmlOnly);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 'type') {
      setStep('description');
    } else if (step === 'description') {
      // For convert-to-elementor, require HTML project selection
      if (projectType === 'convert-to-elementor') {
        if (!selectedHtmlProjectId) {
          alert('Please select an HTML project to convert');
          return;
        }
      }
      // In conversion mode, description is optional
      // In new project mode, description is required
      if (isConversionMode || description.trim() || projectType === 'convert-to-elementor') {
        startGeneration();
      }
    }
  };

  const handleBack = () => {
    if (step === 'description' && !isConversionMode) {
      setStep('type');
    }
  };

  const resetModal = () => {
    setStep(isConversionMode ? 'description' : 'type');
    setProjectType(isConversionMode ? 'elementor' : 'html');
    setSelectedHtmlProjectId(''); // Reset selected HTML project
    setDescription('');
    setProjectName('');
    setSelectedModel(defaultModel || 'anthropic/claude-sonnet-4-5-20250929');
    setIncludeGlobalCSS(true); // Reset to default (include global CSS)
    setGenerating(false);
    setProgress('');
    setCurrentPhase(null);
    setUsageMetadata(null);
    setCreatedProjectId(null);
    setUploadedImages([]);
    setIncludeImages(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate file types
    const validFiles = Array.from(files).filter(file =>
      ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)
    );

    if (validFiles.length !== files.length) {
      alert('Only PNG and JPEG images are supported');
    }

    // Limit to 3 images total
    const remainingSlots = 3 - uploadedImages.length;
    const filesToProcess = validFiles.slice(0, remainingSlots);

    if (filesToProcess.length === 0) {
      if (uploadedImages.length >= 3) {
        alert('Maximum 3 images allowed');
      }
      return;
    }

    // Convert to data URLs
    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setUploadedImages(prev => [...prev, { url: dataUrl, filename: file.name }]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const generateProjectName = (desc: string): string => {
    return desc
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join('_');
  };

  // Build the full system prompt (including Global CSS if enabled)
  const buildSystemPrompt = (): string => {
    const isElementor = projectType === 'elementor';
    const isHubSpot = projectType === 'hubspot';
    const isConvertToElementor = projectType === 'convert-to-elementor';

    let prompt = '';

    // Get the selected HTML project data for conversion
    let selectedProject: FileGroup | null = null;
    if (isConvertToElementor && selectedHtmlProjectId) {
      selectedProject = htmlProjects.find(p => p.id === selectedHtmlProjectId) || null;
    }

    if (isElementor || isConvertToElementor) {
      prompt = `You are an expert Elementor widget developer. Generate a COMPLETE, PRODUCTION-READY PHP widget class.

**🎯 HIGHEST PRIORITY - USER INSTRUCTIONS:**
The user's instructions in their prompt are the FINAL SAY and HIGHEST PRIORITY. These instructions come from the project owner and decision-maker. If the user's instructions conflict with any guidelines below, ALWAYS follow the user's instructions. Their requirements override everything else.

**CRITICAL REQUIREMENTS:**

1. **Complete PHP Class Structure**:
   - Extend \\Elementor\\Widget_Base
   - Include proper PHP opening tags and namespace
   - Add ABSPATH security check
   - Implement ALL required methods

2. **Required Methods**:
   - get_name() - Return widget identifier (snake_case)
   - get_title() - Return human-readable title
   - get_icon() - Return Elementor icon (eicon-*)
   - get_categories() - Return ['general'] or specific category
   - get_keywords() - Return relevant search keywords array
   - register_controls() - Define all Elementor controls
   - render() - Output the widget HTML

3. **register_controls() Guidelines**:
   - Use start_controls_section() and end_controls_section()
   - Add controls for CONTENT tab (text, images, URLs, etc.)
   - Add controls for STYLE tab (colors, typography, spacing)
   - Use proper control types: TEXT, TEXTAREA, COLOR, TYPOGRAPHY, DIMENSIONS, etc.
   - Include 'selector' and 'description' for each control
   - Group related controls logically

4. **render() Method Rules**:
   - Use $settings = $this->get_settings_for_display()
   - Output semantic HTML5 markup
   - Use esc_html(), esc_attr(), esc_url() for all dynamic content
   - Add CSS classes for styling hooks
   - Include data attributes if needed for JS

5. **CSS Scoping**:
   - All styles use {{WRAPPER}} prefix for widget-specific selectors
   - Do NOT use {{WRAPPER}} for: body, html, *, :root, @font-face, @keyframes, @media
   - Use 'selectors' parameter in controls for dynamic styling

6. **Best Practices**:
   - Add helpful descriptions to controls
   - Use default values for all controls
   - Follow WordPress coding standards
   - Include proper escaping and sanitization
   - Make widget fully responsive
   - Add ARIA labels for accessibility

**IMPORTANT**: Generate ONLY the complete PHP class. Do NOT include plugin registration code or file includes.`;

      // Add context for convert-to-elementor mode
      if (isConvertToElementor && selectedProject) {
        prompt += `

**🔄 CONVERSION MODE - Existing HTML Project Context:**

You are converting an existing HTML project to an Elementor widget. Your goal is to maintain the EXACT look, structure, and styling of the original HTML/CSS/JS code while adapting it to the Elementor widget format.

**Original Project:** ${selectedProject.name}

**Existing HTML:**
\`\`\`html
${selectedProject.html}
\`\`\`

**Existing CSS:**
\`\`\`css
${selectedProject.css}
\`\`\`

${selectedProject.js ? `**Existing JavaScript:**
\`\`\`javascript
${selectedProject.js}
\`\`\`
` : ''}

**CONVERSION REQUIREMENTS:**

1. **Preserve Visual Design**: The converted widget MUST look identical to the original HTML/CSS
2. **Maintain Structure**: Keep the same HTML structure, element hierarchy, and semantic markup
3. **Convert Styles**: Transform CSS to use {{WRAPPER}} scoping and Elementor selectors
4. **Create Controls**: Add Elementor controls for:
   - All text content (make editable)
   - All colors used in the design
   - All images and media
   - Spacing and sizing where appropriate
   - Typography settings
5. **JavaScript**: If JavaScript is present, include it in the render() method with proper escaping
6. **Responsiveness**: Maintain or improve responsive behavior from original CSS

**CRITICAL**: The final widget should be a pixel-perfect conversion of the original design, just in Elementor format.`;
      }

    } else if (isHubSpot) {
      if (hubspotModuleType === 'email') {
        prompt = `You are an expert HubSpot email module developer. Generate production-ready HTML with inline CSS optimized for email clients.

**MODULE TYPE: EMAIL (Strict Compatibility Mode)**

**🎯 HIGHEST PRIORITY - USER INSTRUCTIONS:**
The user's instructions in their prompt are the FINAL SAY and HIGHEST PRIORITY. These instructions come from the project owner and decision-maker. If the user's instructions conflict with any guidelines below, ALWAYS follow the user's instructions. Their requirements override everything else.

**CRITICAL EMAIL CONSTRAINTS:**

1. **HTML Structure**:
   - Section-level markup only (NO DOCTYPE, html, head, body tags)
   - **MUST use table-based layouts** - NO flexbox, NO grid
   - Use <table>, <tr>, <td> for all layout structure
   - Keep nesting shallow (max 3-4 table levels)
   - Use semantic class names for HubL tokenization

2. **CSS Requirements (EMAIL-SPECIFIC)**:
   - **ALL styles MUST be inline** using style="..." attributes
   - ❌ NEVER use <style> tags or external CSS
   - ❌ NEVER use @media queries (unreliable across email clients)
   - ❌ NEVER use display: grid or display: flex
   - ❌ NEVER use background-image (use <img> instead)
   - ❌ NEVER use position: absolute or position: fixed
   - ❌ NEVER use @font-face or custom web fonts
   - ✅ USE: Basic properties (color, font-size, padding, margin, text-align)
   - ✅ USE: Table properties (width, cellpadding, cellspacing, align, valign, bgcolor)
   - ✅ USE: Web-safe fonts only (Arial, Verdana, Georgia, Times New Roman, Courier)

3. **Email-Safe Design Patterns**:
   - Use <table width="100%"> for full-width sections
   - Use <td style="padding: X"> for spacing (NOT margin on tables)
   - Use bgcolor attribute for background colors when possible
   - Set explicit widths in pixels for fixed layouts
   - Use <img> with width/height attributes for all images
   - Center content with align="center" on td elements

4. **JavaScript**:
   - ⚠️ CRITICAL: NO JavaScript allowed in email modules
   - Scripts are completely blocked in email clients

5. **Accessibility**:
   - Add alt text to ALL images
   - Use role="presentation" on layout tables
   - Ensure good color contrast for readability

**OUTPUT FORMAT:**
\`\`\`html
<!-- Table-based layout with inline styles -->
\`\`\`

\`\`\`hubl
<!-- HubL tokenization generated programmatically -->
\`\`\`

**IMPORTANT**: Email compatibility is CRITICAL. Always use tables with inline styles. Test across Gmail, Outlook, Apple Mail.`;
      } else {
        prompt = `You are an expert HubSpot page module developer. Generate production-ready HTML with modern CSS for HubSpot CMS pages.

**MODULE TYPE: PAGE (Modern Web Standards)**

**🎯 HIGHEST PRIORITY - USER INSTRUCTIONS:**
The user's instructions in their prompt are the FINAL SAY and HIGHEST PRIORITY. These instructions come from the project owner and decision-maker. If the user's instructions conflict with any guidelines below, ALWAYS follow the user's instructions. Their requirements override everything else.

**PAGE MODULE CAPABILITIES:**

1. **HTML Structure**:
   - Section-level markup only (NO DOCTYPE, html, head, body tags)
   - Use modern semantic HTML5 elements
   - **Flexbox and Grid are allowed** for page modules
   - Div-based layouts are perfectly acceptable
   - Use semantic class names for HubL tokenization

2. **CSS Requirements (PAGE-SPECIFIC)**:
   - Inline styles are acceptable
   - External CSS classes are also fine (HubSpot will handle them)
   - ✅ USE: Modern layout (flexbox, grid)
   - ✅ USE: CSS variables for theming
   - ✅ USE: Media queries for responsive design
   - ✅ USE: Background images and gradients
   - ✅ USE: Transitions and animations
   - ✅ USE: Modern web fonts (Google Fonts, etc.)
   - Keep structure modular for easy HubL field extraction

3. **Modern Design Patterns**:
   - Use flexbox for flexible layouts
   - Use CSS Grid for complex grid systems
   - Apply responsive breakpoints with @media queries
   - Use modern typography and spacing
   - Include hover states and interactions
   - Add smooth transitions for better UX

4. **JavaScript**:
   - ✅ JavaScript IS supported in page modules
   - Use vanilla JS or jQuery (HubSpot includes jQuery)
   - Add interactive features as needed
   - Keep scripts modular and maintainable

5. **HubSpot-Specific**:
   - Output clean HTML for HubL tokenization
   - Use semantic class names
   - Structure content for easy field mapping
   - Consider HubDB integration points

6. **Accessibility**:
   - Use semantic HTML5 elements (header, nav, main, footer, etc.)
   - Add ARIA labels where appropriate
   - Ensure keyboard navigation
   - Maintain good color contrast

**OUTPUT FORMAT:**
\`\`\`html
<!-- Modern HTML5 with semantic elements -->
\`\`\`

\`\`\`hubl
<!-- HubL tokenization generated programmatically -->
\`\`\`

**IMPORTANT**: Page modules support modern web standards. Use flexbox, grid, and interactive features freely.`;
      }
    } else {
      prompt = `You are an expert frontend developer. Generate complete, production-ready HTML/CSS/JS code for a web section based on the user's description.

**🎯 HIGHEST PRIORITY - USER INSTRUCTIONS:**
The user's instructions in their prompt are the FINAL SAY and HIGHEST PRIORITY. These instructions come from the project owner and decision-maker. If the user's instructions conflict with any guidelines below, ALWAYS follow the user's instructions. Their requirements override everything else.

**CRITICAL RULES:**
1. **HTML**: Section-level markup only (NO DOCTYPE, html, head, body tags). Use semantic HTML5.
2. **CSS**: Complete styles including responsive design, modern layout (flexbox/grid), transitions/animations.
3. **JavaScript**: Vanilla JS only if needed. Modern ES6+. No framework dependencies.
4. **Design**: Modern, clean, professional design with good spacing, typography, and color harmony.
5. **Accessibility**: Semantic HTML, ARIA labels where needed, keyboard navigation.
6. **Responsive**: Mobile-first approach, breakpoints at 768px (tablet) and 1024px (desktop).

**IMPORTANT**: Create standalone, copy-paste ready code that works immediately in any modern browser.`;
    }

    // Append Global CSS if enabled
    if (includeGlobalCSS && globalCSS) {
      prompt += `\n\n**🎨 GLOBAL CSS (Style Guide):**

The following global CSS is available from the Style Guide. Use these styles as reference when styling components:

\`\`\`css
${globalCSS}
\`\`\`

Use these global styles to ensure consistency with the overall design system.`;
    }

    return prompt;
  };

  // Build the user prompt
  const buildUserPrompt = (): string => {
    let prompt = `Project: ${projectName || generateProjectName(description)}
Description: ${description || '(not provided yet)'}
Type: ${projectType}`;

    if (projectType === 'hubspot') {
      prompt += `\nModule Type: ${hubspotModuleType}`;
    }

    prompt += `\nModel: ${MODEL_CONFIGS[selectedModel]?.name}`;

    if (includeGlobalCSS && globalCSS) {
      prompt += `\n\nGlobal CSS:\n${globalCSS}`;
    }

    return prompt;
  };

  // Calculate token counts
  const contextLimit = getModelContextLimit(selectedModel);
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt();
  const systemTokens = estimateTokenCount(systemPrompt);
  let inputTokens = estimateTokenCount(userPrompt);

  // Add vision tokens for images (if included)
  // Approximate: 765 tokens per image for high-res vision (based on AI SDK estimates)
  if (includeImages && uploadedImages.length > 0) {
    const visionTokens = uploadedImages.length * 765;
    inputTokens += visionTokens;
  }

  const conversationTokens = 0; // No conversation history in modal
  const totalTokens = systemTokens + inputTokens + conversationTokens;

  const parseStreamedCode = (text: string): { html: string; css: string; js: string; hubl: string } => {
    // Try to extract code from markdown code blocks
    const htmlMatch = text.match(/```html\n([\s\S]*?)```/);
    const cssMatch = text.match(/```css\n([\s\S]*?)```/);
    const jsMatch = text.match(/```(?:javascript|js)\n([\s\S]*?)```/);
    const hublMatch = text.match(/```hubl\n([\s\S]*?)```/);

    return {
      html: htmlMatch ? htmlMatch[1].trim() : '',
      css: cssMatch ? cssMatch[1].trim() : '',
      js: jsMatch ? jsMatch[1].trim() : '',
      hubl: hublMatch ? hublMatch[1].trim() : '',
    };
  };

  const startGeneration = async () => {
    const generatedName = projectName || generateProjectName(description);

    // Create project FIRST
    const displayName = generatedName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const projectId = onProjectCreate?.(
      displayName,
      (projectType === 'elementor' || projectType === 'convert-to-elementor') ? 'php' : projectType === 'hubspot' ? 'hubspot' : 'html'
    );

    if (projectId) {
      setCreatedProjectId(projectId);
      console.log('📦 Created project via modal:', displayName, 'ID:', projectId);
    }

    // Switch to Code Editor tab to show the streaming
    if (onSwitchTab) {
      onSwitchTab('json');
      console.log('📑 Switched to Code Editor tab via modal');
    }

    // Switch to appropriate file tab based on project type
    if (onSwitchCodeTab) {
      if (projectType === 'elementor' || projectType === 'convert-to-elementor') {
        onSwitchCodeTab('php');
        console.log('📄 Switched to PHP tab via modal');
      } else if (projectType === 'hubspot') {
        onSwitchCodeTab('html');
        console.log('📄 Switched to HTML tab via modal');
      } else {
        onSwitchCodeTab('html');
        console.log('📄 Switched to HTML tab via modal');
      }
    }

    // Wait for Monaco editor to mount before closing modal and starting generation
    // This ensures editor refs are ready for streaming
    console.log('⏳ Waiting 300ms for Monaco editor to mount...');
    await new Promise(resolve => setTimeout(resolve, 300));

    // Close modal so user sees the code editor
    console.log('👋 Closing modal, Monaco editor should be visible now');
    onClose();

    // Notify parent that generation is starting
    if (onGenerationStart) {
      onGenerationStart();
      console.log('📢 Notified parent: generation started');
    }

    setGenerating(true);
    setProgress('Initializing generation...');

    try {
      // For convert-to-elementor mode, get the selected HTML project data
      let conversionCode = existingCode;
      if (projectType === 'convert-to-elementor' && selectedHtmlProjectId) {
        const selectedProject = htmlProjects.find(p => p.id === selectedHtmlProjectId);
        if (selectedProject) {
          conversionCode = {
            html: selectedProject.html,
            css: selectedProject.css,
            js: selectedProject.js,
          };
        }
      }

      // Set initial phase based on project type
      if (projectType === 'elementor' || projectType === 'convert-to-elementor') {
        setCurrentPhase('php');
        setProgress(projectType === 'convert-to-elementor' ? 'Converting to PHP Widget...' : 'Generating PHP Widget...');
      } else if (projectType === 'hubspot') {
        setCurrentPhase('html');
        setProgress('Generating HTML...');
      } else {
        setCurrentPhase('html');
        setProgress('Generating HTML...');
      }

      // Use unified streaming with legacy callbacks
      // Note: We manually handle the fetch here because modal has unique features (existingCode, usage tracking)
      const response = await fetch('/api/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          projectType,
          projectName: generatedName,
          model: selectedModel,
          existingCode: conversionCode,
          globalCSS: includeGlobalCSS ? globalCSS : undefined,
          hubspotModuleType: projectType === 'hubspot' ? hubspotModuleType : undefined,
          images: includeImages && uploadedImages.length > 0 ? uploadedImages : [],
        }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullCode = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullCode += chunk;

          // Use centralized streaming with legacy callbacks
          // This handles all the parsing and file updates automatically
          if (projectId) {
            // Import parsers at runtime to avoid circular deps
            const { parseProjectCode } = await import('@/lib/project-generation/parser');
            const parsedFiles = parseProjectCode(
              fullCode,
              (projectType === 'elementor' || projectType === 'convert-to-elementor') ? 'elementor' : projectType === 'hubspot' ? 'hubspot' : 'html',
              projectType === 'hubspot' ? hubspotModuleType : undefined
            );

            // Update files via callbacks
            if (onProjectUpdate) {
              if (parsedFiles.html) onProjectUpdate(projectId, 'html', parsedFiles.html);
              if (parsedFiles.css) onProjectUpdate(projectId, 'css', parsedFiles.css);
              if (parsedFiles.js) onProjectUpdate(projectId, 'js', parsedFiles.js);
              if (parsedFiles.hubl) {
                // Convert HTML to HubL if needed
                if (!parsedFiles.hubl && parsedFiles.html) {
                  try {
                    const result = convertHtmlToHubL(parsedFiles.html, { kind: 'page' });
                    onProjectUpdate(projectId, 'hubl', result.moduleHtml);
                  } catch (error) {
                    onProjectUpdate(projectId, 'hubl', parsedFiles.html);
                  }
                } else {
                  onProjectUpdate(projectId, 'hubl', parsedFiles.hubl);
                }
              }
            }

            // Update plugin metadata for Elementor
            if (onProjectMetadataUpdate && (projectType === 'elementor' || projectType === 'convert-to-elementor')) {
              if (parsedFiles.pluginMainFile) {
                onProjectMetadataUpdate(projectId, {
                  isPlugin: true,
                  pluginMainFile: parsedFiles.pluginMainFile
                });
              }

              if (parsedFiles.php) {
                // Extract widget metadata
                const classNameMatch = parsedFiles.php.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)\s+extends/);
                const className = classNameMatch ? classNameMatch[1] : 'Generated_Widget';
                const widgetSlug = className.toLowerCase().replace(/_/g, '-');
                const widgetName = className.replace(/_/g, ' ').replace(/\bWidget\b/, '').trim()
                  || projectName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                const widgetId = `widget_${Date.now()}`;

                onProjectMetadataUpdate(projectId, {
                  widgetFiles: {
                    [widgetId]: {
                      name: widgetName,
                      slug: widgetSlug,
                      content: parsedFiles.php,
                      className: className,
                    }
                  }
                });
              }
            }

            // Auto-switch tabs during generation
            if (projectType === 'html') {
              if (fullCode.length > 500 && currentPhase === 'html') {
                setCurrentPhase('css');
                setProgress('Generating CSS...');
                onSwitchCodeTab?.('css');
              } else if (fullCode.length > 1500 && currentPhase === 'css') {
                setCurrentPhase('js');
                setProgress('Generating JavaScript...');
                onSwitchCodeTab?.('js');
              }
            } else if (projectType === 'hubspot') {
              if (fullCode.length > 500 && currentPhase === 'html') {
                setCurrentPhase('hubl');
                setProgress('Generating HubL...');
                onSwitchCodeTab?.('html');
              }
            }
          }
        }

        // Extract usage metadata if present
        let codeOnly = fullCode;
        let usageData = null;

        if (fullCode.includes('__USAGE__:')) {
          const parts = fullCode.split('__USAGE__:');
          codeOnly = parts[0];
          try {
            usageData = JSON.parse(parts[1]);
            console.log('📊 Usage metadata received:', usageData);

            // Track usage
            if (usageData.usage) {
              recordUsage(usageData.model, {
                inputTokens: usageData.usage.promptTokens || 0,
                outputTokens: usageData.usage.completionTokens || 0,
                cacheCreationTokens: usageData.usage.cacheCreationInputTokens || 0,
                cacheReadTokens: usageData.usage.cacheReadInputTokens || 0,
              });

              setUsageMetadata(usageData);
            }
          } catch (e) {
            console.error('Failed to parse usage metadata:', e);
          }
        }

        // Parse final code and call onGenerate ONCE with complete code
        if (projectType === 'elementor') {
          const phpMatch = codeOnly.match(/```php\n([\s\S]*?)```/);
          const cssMatch = codeOnly.match(/```css\n([\s\S]*?)```/);
          const jsMatch = codeOnly.match(/```(?:javascript|js)\n([\s\S]*?)```/);

          onGenerate({
            html: '',
            css: cssMatch ? cssMatch[1].trim() : '',
            js: jsMatch ? jsMatch[1].trim() : '',
            php: phpMatch ? phpMatch[1].trim() : codeOnly.trim(),
            projectName: generatedName,
          });
        } else if (projectType === 'hubspot') {
          const htmlMatch = codeOnly.match(/```html\n([\s\S]*?)```/);
          const hublMatch = codeOnly.match(/```hubl\n([\s\S]*?)```/);

          const generatedHtml = htmlMatch ? htmlMatch[1].trim() : '';
          let generatedHubl = hublMatch ? hublMatch[1].trim() : '';

          // If HTML was generated but HubL is empty, convert HTML to HubL programmatically
          if (generatedHtml && !generatedHubl) {
            try {
              const result = convertHtmlToHubL(generatedHtml, { kind: 'page' });
              console.log('✅ HTML to HubL conversion successful:', result.fields.length, 'fields detected');
              generatedHubl = result.moduleHtml;
            } catch (error) {
              console.error('❌ HTML to HubL conversion failed:', error);
              generatedHubl = generatedHtml; // Use HTML as fallback
            }
          }

          onGenerate({
            html: generatedHtml,
            css: '',
            js: '',
            hubl: generatedHubl,
            projectName: generatedName,
          });
        } else {
          const htmlMatch = codeOnly.match(/```html\n([\s\S]*?)```/);
          const cssMatch = codeOnly.match(/```css\n([\s\S]*?)```/);
          const jsMatch = codeOnly.match(/```(?:javascript|js)\n([\s\S]*?)```/);

          onGenerate({
            html: htmlMatch ? htmlMatch[1].trim() : '',
            css: cssMatch ? cssMatch[1].trim() : '',
            js: jsMatch ? jsMatch[1].trim() : '',
            projectName: generatedName,
          });
        }

        setProgress('✅ Generation complete!');
        setGenerating(false);

        // Notify parent that generation ended
        if (onGenerationEnd) {
          onGenerationEnd();
          console.log('📢 Notified parent: generation ended');
        }
        // Don't auto-close - let user view stats and close manually

      }
    } catch (error: any) {
      setProgress(`❌ Error: ${error.message}`);
      setGenerating(false);

      // Notify parent that generation ended (even on error)
      if (onGenerationEnd) {
        onGenerationEnd();
        console.log('📢 Notified parent: generation ended (error)');
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: 'var(--background)',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
            {isConversionMode ? '⚡ Convert to Elementor Widget' : '🚀 Generate New Project'}
          </h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--muted-foreground)' }}>
            {step === 'type' && 'Choose your project type'}
            {step === 'description' && (isConversionMode ? 'Converting your existing HTML/CSS/JS to an Elementor widget' : 'Describe what you want to create')}
            {step === 'generating' && (isConversionMode ? 'Converting to widget...' : 'Generating your project...')}
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Step 1: Project Type Selection */}
          {step === 'type' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label>
                <div
                  onClick={() => setProjectType('html')}
                  style={{
                    padding: '20px',
                    border: `2px solid ${projectType === 'html' ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: projectType === 'html' ? 'var(--primary)/10' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <input
                      type="radio"
                      checked={projectType === 'html'}
                      onChange={() => setProjectType('html')}
                      style={{ margin: 0 }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AiFillHtml5 size={20} color="#E34F26" />
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                        HTML Section
                      </h3>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 0 28px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                    Standalone responsive web section with HTML, CSS, and JavaScript
                  </p>
                </div>
              </label>

              <label>
                <div
                  onClick={() => setProjectType('elementor')}
                  style={{
                    padding: '20px',
                    border: `2px solid ${projectType === 'elementor' ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: projectType === 'elementor' ? 'var(--primary)/10' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <input
                      type="radio"
                      checked={projectType === 'elementor'}
                      onChange={() => setProjectType('elementor')}
                      style={{ margin: 0 }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaWordpress size={20} color="#21759B" />
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                        Elementor Widget
                      </h3>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 0 28px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                    Complete PHP widget class ready for Elementor (no conversion needed)
                  </p>
                </div>
              </label>

              <label>
                <div
                  onClick={() => setProjectType('hubspot')}
                  style={{
                    padding: '20px',
                    border: `2px solid ${projectType === 'hubspot' ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: projectType === 'hubspot' ? 'var(--primary)/10' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <input
                      type="radio"
                      checked={projectType === 'hubspot'}
                      onChange={() => setProjectType('hubspot')}
                      style={{ margin: 0 }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SiHubspot size={20} color="#FF7A59" />
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                        HubSpot Template
                      </h3>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 0 28px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                    HubSpot CMS template with HTML and HubL (inline CSS)
                  </p>
                </div>
              </label>

              <label>
                <div
                  onClick={() => setProjectType('convert-to-elementor')}
                  style={{
                    padding: '20px',
                    border: `2px solid ${projectType === 'convert-to-elementor' ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: projectType === 'convert-to-elementor' ? 'var(--primary)/10' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <input
                      type="radio"
                      checked={projectType === 'convert-to-elementor'}
                      onChange={() => setProjectType('convert-to-elementor')}
                      style={{ margin: 0 }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MdTransform size={20} color="#9333EA" />
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                        Convert HTML to Elementor
                      </h3>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 0 28px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                    Convert existing HTML project to Elementor widget (maintains look & structure)
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Step 2: Description Input */}
          {step === 'description' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* HTML Project Selection for convert-to-elementor */}
              {projectType === 'convert-to-elementor' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                    Select HTML Project to Convert *
                  </label>
                  <select
                    value={selectedHtmlProjectId}
                    onChange={(e) => setSelectedHtmlProjectId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      background: 'var(--background)',
                      color: 'var(--foreground)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">-- Select a project --</option>
                    {htmlProjects.length === 0 && (
                      <option value="" disabled>No HTML projects found</option>
                    )}
                    {htmlProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {htmlProjects.length === 0 && (
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--destructive)' }}>
                      No HTML projects found. Please create an HTML project first in the Section Library.
                    </p>
                  )}
                  {selectedHtmlProjectId && (() => {
                    const selected = htmlProjects.find(p => p.id === selectedHtmlProjectId);
                    if (!selected) return null;

                    const htmlChars = selected.html?.length || 0;
                    const cssChars = selected.css?.length || 0;
                    const jsChars = selected.js?.length || 0;
                    const htmlLines = selected.html ? selected.html.split('\n').length : 0;
                    const cssLines = selected.css ? selected.css.split('\n').length : 0;
                    const jsLines = selected.js ? selected.js.split('\n').length : 0;
                    const htmlTokens = estimateTokenCount(selected.html || '');
                    const cssTokens = estimateTokenCount(selected.css || '');
                    const jsTokens = estimateTokenCount(selected.js || '');

                    return (
                      <>
                        <p style={{ margin: '8px 0 8px 0', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                          Selected project will be converted to an Elementor widget while maintaining its exact look and structure.
                        </p>
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          padding: '12px',
                          background: 'var(--muted)',
                          borderRadius: '6px',
                        }}>
                          {/* HTML Card */}
                          <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '12px',
                            background: 'var(--background)',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                          }}>
                            <AiFillHtml5 size={24} color="#E34F26" />
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>HTML</span>
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', color: 'var(--muted-foreground)', textAlign: 'center' }}>
                              <span>{htmlTokens.toLocaleString()} tokens</span>
                              <span>{htmlChars.toLocaleString()} characters</span>
                              <span>{htmlLines.toLocaleString()} lines</span>
                            </div>
                          </div>

                          {/* CSS Card */}
                          <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '12px',
                            background: 'var(--background)',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                          }}>
                            <SiCss3 size={24} color="#1572B6" />
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>CSS</span>
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', color: 'var(--muted-foreground)', textAlign: 'center' }}>
                              <span>{cssTokens.toLocaleString()} tokens</span>
                              <span>{cssChars.toLocaleString()} characters</span>
                              <span>{cssLines.toLocaleString()} lines</span>
                            </div>
                          </div>

                          {/* JS Card - Always show, but indicate if empty */}
                          <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '12px',
                            background: 'var(--background)',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            opacity: jsChars > 0 ? 1 : 0.5,
                          }}>
                            <SiJavascript size={24} color="#F7DF1E" />
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>JavaScript</span>
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', color: 'var(--muted-foreground)', textAlign: 'center' }}>
                              {jsChars > 0 ? (
                                <>
                                  <span>{jsTokens.toLocaleString()} tokens</span>
                                  <span>{jsChars.toLocaleString()} characters</span>
                                  <span>{jsLines.toLocaleString()} lines</span>
                                </>
                              ) : (
                                <span style={{ fontStyle: 'italic' }}>No JavaScript</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {isConversionMode && (
                <div style={{
                  padding: '12px',
                  background: 'var(--muted)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                }}>
                  <strong>📋 Existing code detected:</strong> Your HTML ({existingCode?.html?.length || 0} chars), CSS ({existingCode?.css?.length || 0} chars), and JS ({existingCode?.js?.length || 0} chars) will be converted to an Elementor widget. You can add optional instructions below to customize the conversion.
                </div>
              )}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  {isConversionMode || projectType === 'convert-to-elementor' ? 'Conversion Instructions (Optional)' : 'Project Description *'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={(isConversionMode || projectType === 'convert-to-elementor')
                    ? "E.g., Make all text editable, add color controls, include hover effects, add animations"
                    : "E.g., A modern hero section with gradient background, call-to-action button, and image"}
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Project Name (Optional)
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Auto-generated from description"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                  }}
                />
                {description && !projectName && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                    Auto-generated: <strong>{generateProjectName(description)}</strong>
                  </p>
                )}
              </div>

              {/* Include Images Toggle */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  background: includeImages ? 'var(--primary)/10' : 'transparent',
                  transition: 'all 0.2s',
                }}>
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    style={{ margin: 0, cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                      Include Reference Images
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                      Upload design mockups, screenshots, or inspiration images (max 3)
                    </div>
                  </div>
                </label>

                {/* Image Upload Section */}
                {includeImages && (
                  <div style={{ marginTop: '12px' }}>
                    {uploadedImages.length > 0 && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                        gap: '8px',
                        marginBottom: '12px',
                      }}>
                        {uploadedImages.map((img, idx) => (
                          <div
                            key={idx}
                            style={{
                              position: 'relative',
                              paddingBottom: '100%',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <img
                              src={img.url}
                              alt={img.filename}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                            <button
                              onClick={() => removeImage(idx)}
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {uploadedImages.length < 3 && (
                      <label style={{
                        display: 'block',
                        padding: '12px',
                        border: '2px dashed var(--border)',
                        borderRadius: '6px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: 'var(--muted-foreground)',
                        transition: 'all 0.2s',
                      }}>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          multiple
                          onChange={handleImageSelect}
                          style={{ display: 'none' }}
                        />
                        📷 Click to upload images ({3 - uploadedImages.length} remaining)
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* Include Global CSS Toggle */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: globalCSS ? 'pointer' : 'not-allowed',
                  padding: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  background: includeGlobalCSS && globalCSS ? 'var(--primary)/10' : 'transparent',
                  opacity: globalCSS ? 1 : 0.5,
                  transition: 'all 0.2s',
                }}>
                  <input
                    type="checkbox"
                    checked={includeGlobalCSS}
                    onChange={(e) => setIncludeGlobalCSS(e.target.checked)}
                    disabled={!globalCSS}
                    style={{ margin: 0, cursor: globalCSS ? 'pointer' : 'not-allowed' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                      Include Global CSS
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                      {globalCSS
                        ? `Add global styles to AI context for consistent design (${globalCSS.length.toLocaleString()} chars)`
                        : 'No Global CSS configured. Go to Style Guide tab to add global CSS.'}
                    </div>
                  </div>
                </label>
              </div>

              {/* HubSpot Module Type Selector */}
              {projectType === 'hubspot' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                    Module Type *
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{ flex: 1, cursor: 'pointer' }}>
                      <div
                        onClick={() => setHubspotModuleType('email')}
                        style={{
                          padding: '16px',
                          border: `2px solid ${hubspotModuleType === 'email' ? 'var(--primary)' : 'var(--border)'}`,
                          borderRadius: '6px',
                          background: hubspotModuleType === 'email' ? 'var(--primary)/10' : 'transparent',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <input
                            type="radio"
                            checked={hubspotModuleType === 'email'}
                            onChange={() => setHubspotModuleType('email')}
                            style={{ margin: 0 }}
                          />
                          <strong style={{ fontSize: '14px' }}>Email Module</strong>
                        </div>
                        <p style={{ margin: '0 0 0 22px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                          Table-based layout, inline styles only
                        </p>
                      </div>
                    </label>
                    <label style={{ flex: 1, cursor: 'pointer' }}>
                      <div
                        onClick={() => setHubspotModuleType('page')}
                        style={{
                          padding: '16px',
                          border: `2px solid ${hubspotModuleType === 'page' ? 'var(--primary)' : 'var(--border)'}`,
                          borderRadius: '6px',
                          background: hubspotModuleType === 'page' ? 'var(--primary)/10' : 'transparent',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <input
                            type="radio"
                            checked={hubspotModuleType === 'page'}
                            onChange={() => setHubspotModuleType('page')}
                            style={{ margin: 0 }}
                          />
                          <strong style={{ fontSize: '14px' }}>Page Module</strong>
                        </div>
                        <p style={{ margin: '0 0 0 22px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                          Modern layout, external CSS allowed
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500 }}>
                    AI Model
                  </label>
                  <SystemPromptViewer
                    input={description}
                    systemPrompt={systemPrompt}
                    selectedModel={MODEL_CONFIGS[selectedModel]?.name || selectedModel}
                    contextLimit={contextLimit}
                    systemTokens={systemTokens}
                    inputTokens={inputTokens}
                    conversationTokens={conversationTokens}
                    totalTokens={totalTokens}
                    trigger={
                      <button
                        type="button"
                        style={{
                          padding: '4px 12px',
                          fontSize: '12px',
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        📋 View Prompt
                      </button>
                    }
                    metadata={{
                      projectName: projectName || generateProjectName(description),
                      fileStats: {
                        ...(globalCSS && includeGlobalCSS ? { globalCss: globalCSS.length } : {}),
                        ...(includeImages && uploadedImages.length > 0 ? {
                          images: uploadedImages.length // Show image count
                        } as any : {})
                      }
                    }}
                    fileContents={
                      globalCSS && includeGlobalCSS ? {
                        // Show Global CSS in a custom section
                      } : undefined
                    }
                    attachedImages={includeImages && uploadedImages.length > 0 ? uploadedImages : undefined}
                    modelPricing={MODEL_PRICING[selectedModel as keyof typeof MODEL_PRICING]}
                  />
                </div>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                  }}
                >
                  {Object.entries(MODEL_CONFIGS).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.name}
                    </option>
                  ))}
                </select>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                  Recommended: <strong>Claude Sonnet 4.5</strong> for best quality
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Generating */}
          {step === 'generating' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                {currentPhase === 'html' && '📝'}
                {currentPhase === 'css' && '🎨'}
                {currentPhase === 'js' && '⚡'}
                {currentPhase === 'php' && '🐘'}
                {!currentPhase && '🚀'}
              </div>
              <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
                {progress}
              </p>
              {generating && (
                <div style={{
                  width: '100%',
                  height: '4px',
                  background: 'var(--primary)',
                  borderRadius: '2px',
                  margin: '20px 0',
                  opacity: 0.6,
                }} />
              )}

              {/* Token Usage Display */}
              {usageMetadata && usageMetadata.usage && (
                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  background: 'var(--muted)',
                  borderRadius: '8px',
                  textAlign: 'left',
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px', color: 'var(--muted-foreground)' }}>
                    📊 Token Usage
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)' }}>Input:</span>
                      <span style={{ fontWeight: 500, marginLeft: '8px' }}>
                        {(usageMetadata.usage.promptTokens || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)' }}>Output:</span>
                      <span style={{ fontWeight: 500, marginLeft: '8px' }}>
                        {(usageMetadata.usage.completionTokens || 0).toLocaleString()}
                      </span>
                    </div>
                    {(usageMetadata.usage.cacheCreationInputTokens || 0) > 0 && (
                      <div>
                        <span style={{ color: 'var(--muted-foreground)' }}>Cache Write:</span>
                        <span style={{ fontWeight: 500, marginLeft: '8px' }}>
                          {usageMetadata.usage.cacheCreationInputTokens.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {(usageMetadata.usage.cacheReadInputTokens || 0) > 0 && (
                      <div>
                        <span style={{ color: 'var(--muted-foreground)' }}>Cache Read:</span>
                        <span style={{ fontWeight: 500, marginLeft: '8px', color: 'var(--primary)' }}>
                          {usageMetadata.usage.cacheReadInputTokens.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div style={{ gridColumn: '1 / -1', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--muted-foreground)' }}>Total:</span>
                      <span style={{ fontWeight: 600, marginLeft: '8px' }}>
                        {(
                          (usageMetadata.usage.promptTokens || 0) +
                          (usageMetadata.usage.completionTokens || 0) +
                          (usageMetadata.usage.cacheCreationInputTokens || 0) +
                          (usageMetadata.usage.cacheReadInputTokens || 0)
                        ).toLocaleString()}
                      </span>
                      <span style={{ color: 'var(--muted-foreground)', marginLeft: '8px', fontSize: '11px' }}>
                        tokens
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'generating' && (
          <div
            style={{
              padding: '24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <button
              onClick={(step === 'description' && !isConversionMode) ? handleBack : handleClose}
              style={{
                padding: '10px 20px',
                background: 'var(--muted)',
                color: 'var(--foreground)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {(step === 'description' && !isConversionMode) ? '← Back' : 'Cancel'}
            </button>
            <button
              onClick={handleNext}
              disabled={step === 'description' && !isConversionMode && !description.trim()}
              style={{
                padding: '10px 20px',
                background: (step === 'description' && !isConversionMode && !description.trim()) ? 'var(--muted)' : 'var(--primary)',
                color: (step === 'description' && !isConversionMode && !description.trim()) ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: step === 'description' && !description.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {step === 'type' ? 'Next →' : '🚀 Generate'}
            </button>
          </div>
        )}

        {/* Footer for completed generation */}
        {step === 'generating' && !generating && (
          <div
            style={{
              padding: '24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <button
              onClick={handleClose}
              style={{
                padding: '12px 32px',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✓ Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
