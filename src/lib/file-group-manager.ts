/**
 * File Group Manager
 *
 * Manages multiple file groups (projects) in the Code Editor.
 * Each group can be:
 * - HTML Project: HTML + CSS + JavaScript
 * - PHP Widget: PHP + CSS + JavaScript
 * - HubSpot Template: HTML + HubL template
 *
 * Features:
 * - Create, read, update, delete groups
 * - Switch active group
 * - Persist to localStorage
 * - Export/import groups
 */

export interface FileGroup {
  id: string;                    // Unique ID
  name: string;                  // User-defined name (e.g., "Hero Section", "Contact Form")
  type: 'html' | 'php' | 'hubspot';  // Project type
  createdAt: number;             // Timestamp
  updatedAt: number;             // Timestamp

  // Files
  html: string;                  // For type='html' or type='hubspot'
  css: string;
  js: string;
  php?: string;                  // Only for type='php'
  hubl?: string;                 // Only for type='hubspot' - HubL template

  // Metadata
  description?: string;          // Optional description
  tags?: string[];               // Optional tags for organization

  // WordPress Plugin Support (NEW)
  isPlugin?: boolean;            // Flag to indicate this is a plugin project (not just a single widget)
  pluginMainFile?: string;       // Main plugin PHP file content with auto-registration
  pluginName?: string;           // Plugin display name (e.g., "My Custom Widgets")
  pluginSlug?: string;           // Plugin slug (e.g., "my-custom-widgets")
  widgetFiles?: {                // Map of widget PHP files by widget ID
    [widgetId: string]: {
      name: string;              // Display name (e.g., "Hero Widget")
      slug: string;              // File slug (e.g., "hero-widget")
      content: string;           // PHP widget class code
      className: string;         // PHP class name (e.g., "Hero_Widget")
    }
  };

  // WordPress deployment tracking
  wordpressDeployment?: {
    isDeployed: boolean;           // Quick check if deployed
    livePageId?: number;           // WordPress page ID (live preview)
    livePageSlug?: string;         // Page slug for live preview
    elementorPageId?: number;      // Elementor editor page ID
    elementorPageSlug?: string;    // Page slug for Elementor editor
    pluginSlug: string;            // Plugin folder name
    deployedAt: number;            // Last deployment timestamp
    lastDeploymentType?: 'live-page' | 'elementor-editor'; // Track which deployment method was last used
  };
}

export interface EditorState {
  groups: FileGroup[];           // All file groups
  activeGroupId: string | null;  // Currently active group
  version: number;               // Schema version for migrations
}

const STORAGE_KEY = 'elementor-editor-groups';
const CURRENT_VERSION = 1;

/**
 * Generate unique ID
 */
function generateId(): string {
  return `fg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get default empty state
 */
function getDefaultState(): EditorState {
  return {
    groups: [],
    activeGroupId: null,
    version: CURRENT_VERSION
  };
}

/**
 * Load state from localStorage
 */
export function loadEditorState(): EditorState {
  // Check if running in browser (not SSR)
  if (typeof window === 'undefined') {
    return getDefaultState();
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return getDefaultState();
    }

    const state: EditorState = JSON.parse(saved);

    // Debug: Log what we loaded from localStorage
    console.log('📂 loadEditorState: Loaded from localStorage:', {
      groupCount: state.groups?.length || 0,
      groups: state.groups?.map(g => ({
        id: g.id,
        name: g.name,
        type: g.type,
        isPlugin: g.isPlugin,
        hasPluginMainFile: !!g.pluginMainFile,
        pluginMainFileLength: g.pluginMainFile?.length || 0
      }))
    });

    // Validate state
    if (!state.groups || !Array.isArray(state.groups)) {
      console.warn('Invalid editor state, resetting');
      return getDefaultState();
    }

    return state;
  } catch (error) {
    console.error('Failed to load editor state:', error);
    return getDefaultState();
  }
}

/**
 * Save state to localStorage
 */
export function saveEditorState(state: EditorState): void {
  // Check if running in browser (not SSR)
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save editor state:', error);

    // Check if quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      alert('⚠️ Storage quota exceeded! Please delete some old projects to free up space.');
    }
  }
}

/**
 * Create a new file group
 */
export function createGroup(
  name: string,
  type: 'html' | 'php' | 'hubspot',
  template?: 'empty' | 'hero' | 'contact-form' | 'basic-widget' | 'button-widget' | 'hubspot-hero' | 'hubspot-email'
): FileGroup {
  const now = Date.now();
  const group: FileGroup = {
    id: generateId(),
    name,
    type,
    createdAt: now,
    updatedAt: now,
    html: '',
    css: '',
    js: '',
    php: type === 'php' ? '' : undefined,
    hubl: type === 'hubspot' ? '' : undefined,
  };

  // Apply template
  if (template && template !== 'empty') {
    applyTemplate(group, template);
  }

  return group;
}

/**
 * Apply template to a group
 */
function applyTemplate(
  group: FileGroup,
  template: 'hero' | 'contact-form' | 'basic-widget' | 'button-widget' | 'hubspot-hero' | 'hubspot-email'
): void {
  if (group.type === 'html') {
    if (template === 'hero') {
      group.html = `<section class="hero">
  <div class="hero-content">
    <h1 class="hero-title">Welcome to Our Website</h1>
    <p class="hero-subtitle">Build amazing things with our platform</p>
    <button class="cta-button">Get Started</button>
  </div>
</section>`;
      group.css = `.hero {
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 40px 20px;
}

.hero-content {
  max-width: 800px;
}

.hero-title {
  font-size: 48px;
  font-weight: bold;
  margin: 0 0 20px 0;
}

.hero-subtitle {
  font-size: 20px;
  margin: 0 0 30px 0;
  opacity: 0.9;
}

.cta-button {
  padding: 16px 32px;
  font-size: 18px;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s;
}

.cta-button:hover {
  transform: scale(1.05);
}`;
      group.js = `// Hero section JavaScript
document.querySelector('.cta-button')?.addEventListener('click', () => {
  console.log('CTA clicked!');
});`;
    } else if (template === 'contact-form') {
      group.html = `<section class="contact-form">
  <h2>Contact Us</h2>
  <form id="contactForm">
    <div class="form-group">
      <label for="name">Name</label>
      <input type="text" id="name" name="name" required>
    </div>
    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required>
    </div>
    <div class="form-group">
      <label for="message">Message</label>
      <textarea id="message" name="message" rows="5" required></textarea>
    </div>
    <button type="submit" class="submit-button">Send Message</button>
  </form>
</section>`;
      group.css = `.contact-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
}

.contact-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.submit-button {
  width: 100%;
  padding: 14px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-button:hover {
  background: #5568d3;
}`;
      group.js = `// Contact form JavaScript
document.getElementById('contactForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  console.log('Form submitted:', data);
  alert('Thank you for your message!');
});`;
    }
  } else if (group.type === 'php') {
    if (template === 'basic-widget') {
      group.php = `<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Basic_Widget extends \\Elementor\\Widget_Base {

    public function get_name() {
        return 'basic_widget';
    }

    public function get_title() {
        return esc_html__( 'Basic Widget', 'text-domain' );
    }

    public function get_icon() {
        return 'eicon-code';
    }

    public function get_categories() {
        return [ 'hustle-tools' ];
    }

    protected function register_controls() {
        $this->start_controls_section(
            'content_section',
            [
                'label' => esc_html__( 'Content', 'text-domain' ),
                'tab' => \\Elementor\\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'text',
            [
                'label' => esc_html__( 'Text', 'text-domain' ),
                'type' => \\Elementor\\Controls_Manager::TEXT,
                'default' => esc_html__( 'Hello World', 'text-domain' ),
            ]
        );

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();
        ?>
        <div class="basic-widget">
            <p><?php echo esc_html( $settings['text'] ); ?></p>
        </div>
        <?php
    }
}`;
      group.css = `.basic-widget {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.basic-widget p {
  margin: 0;
  font-size: 16px;
  color: #333;
}`;
    }
  } else if (group.type === 'hubspot') {
    if (template === 'hubspot-hero') {
      // HubSpot Hero Section (Page Module)
      group.html = `<section class="hero-module" style="background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 80px 20px; text-align: center; color: white; border-radius: 12px;">
  <div class="hero-container" style="max-width: 1200px; margin: 0 auto;">
    <span class="hero-badge" style="display: inline-block; padding: 8px 16px; background-color: rgba(255,255,255,0.2); border-radius: 20px; font-size: 14px; margin-bottom: 20px;">
      New Feature
    </span>

    <h1 class="hero-heading" style="font-size: 48px; font-weight: 700; margin: 0 0 20px 0; line-height: 1.2;">
      Welcome to Our Platform
    </h1>

    <p class="hero-description" style="font-size: 20px; max-width: 700px; margin: 0 auto 30px auto; opacity: 0.95;">
      Build amazing experiences with our powerful tools and intuitive interface.
    </p>

    <a href="#" class="hero-cta" style="display: inline-block; padding: 16px 32px; background-color: white; color: #667eea; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.2);">
      Get Started
    </a>
  </div>
</section>`;
      group.hubl = `{# HubSpot Hero Section - Page Module #}
<section class="hero-module" style="background-image: linear-gradient(135deg, {{ module.gradient_start.color }}, {{ module.gradient_end.color }}); padding: {{ module.padding_y }}px {{ module.padding_x }}px; text-align: {{ module.text_alignment|default('center') }}; color: {{ module.text_color.color }}; border-radius: {{ module.border_radius }}px;">
  <div class="hero-container" style="max-width: {{ module.container_width }}px; margin: 0 auto;">
    {% if module.show_badge %}
    <span class="hero-badge" style="display: inline-block; padding: 8px 16px; background-color: {{ module.badge_background.color }}; border-radius: 20px; font-size: 14px; margin-bottom: 20px;">
      {{ module.badge_text }}
    </span>
    {% endif %}

    <h1 class="hero-heading" style="font-size: {{ module.heading_size }}px; font-weight: 700; margin: 0 0 20px 0; line-height: 1.2;">
      {{ module.heading }}
    </h1>

    <p class="hero-description" style="font-size: {{ module.description_size }}px; max-width: 700px; margin: 0 auto 30px auto; opacity: 0.95;">
      {{ module.description }}
    </p>

    {% if module.show_button %}
    <a href="{{ module.button_url }}" class="hero-cta" style="display: inline-block; padding: {{ module.button_padding_y }}px {{ module.button_padding_x }}px; background-color: {{ module.button_background.color }}; color: {{ module.button_text_color.color }}; text-decoration: none; border-radius: {{ module.button_radius }}px; font-weight: 600; font-size: {{ module.button_text_size }}px; box-shadow: 0 4px 14px rgba(0,0,0,0.2);">
      {{ module.button_text }}
    </a>
    {% endif %}
  </div>
</section>`;
      group.css = `.hero-module {
  position: relative;
  min-height: 500px;
}

.hero-cta:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  transition: all 0.3s ease;
}

@media (max-width: 768px) {
  .hero-heading {
    font-size: 32px !important;
  }

  .hero-description {
    font-size: 16px !important;
  }
}`;
    } else if (template === 'hubspot-email') {
      // HubSpot Email CTA Section (Email Module)
      group.html = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
  <tr>
    <td align="center" style="padding: 40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding: 30px; background-color: #f7f7f7; border-radius: 8px;">
            <!-- Heading -->
            <h2 style="margin: 0 0 16px 0; font-family: Arial, Helvetica, sans-serif; font-size: 28px; font-weight: 700; color: #333333;">
              Special Offer Just for You
            </h2>

            <!-- Description -->
            <p style="margin: 0 0 24px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; color: #666666;">
              Don't miss out on this exclusive opportunity to upgrade your experience with our premium features.
            </p>

            <!-- Button -->
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="border-radius: 6px; background-color: #007bff;">
                  <a href="#" style="display: inline-block; padding: 14px 28px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">
                    Claim Your Offer
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
      group.hubl = `{# HubSpot Email CTA Section - Email Module #}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: {{ module.background_color|default('#ffffff') }};">
  <tr>
    <td align="center" style="padding: 40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="{{ module.text_alignment|default('center') }}" style="padding: {{ module.padding }}px; background-color: {{ module.section_background|default('#f7f7f7') }}; border-radius: {{ module.border_radius|default('8') }}px;">
            <!-- Heading -->
            <h2 style="margin: 0 0 16px 0; font-family: Arial, Helvetica, sans-serif; font-size: {{ module.heading_size|default('28') }}px; font-weight: 700; color: {{ module.heading_color|default('#333333') }};">
              {{ module.heading }}
            </h2>

            <!-- Description -->
            <p style="margin: 0 0 24px 0; font-family: Arial, Helvetica, sans-serif; font-size: {{ module.text_size|default('16') }}px; line-height: {{ module.line_height|default('24') }}px; color: {{ module.text_color|default('#666666') }};">
              {{ module.description }}
            </p>

            <!-- Button -->
            {% if module.show_button %}
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="border-radius: {{ module.button_radius|default('6') }}px; background-color: {{ module.button_background|default('#007bff') }};">
                  <a href="{{ module.button_url }}" style="display: inline-block; padding: {{ module.button_padding|default('14px 28px') }}; font-family: Arial, Helvetica, sans-serif; font-size: {{ module.button_text_size|default('16') }}px; font-weight: 600; color: {{ module.button_text_color|default('#ffffff') }}; text-decoration: none;">
                    {{ module.button_text }}
                  </a>
                </td>
              </tr>
            </table>
            {% endif %}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
    }
  }
}

/**
 * Get all file groups
 */
export function getGroups(): FileGroup[] {
  const state = loadEditorState();
  return state.groups;
}

/**
 * Get active file group
 */
export function getActiveGroup(): FileGroup | null {
  const state = loadEditorState();
  if (!state.activeGroupId) {
    return null;
  }
  return state.groups.find(g => g.id === state.activeGroupId) || null;
}

/**
 * Get file group by ID
 */
export function getGroup(id: string): FileGroup | null {
  const state = loadEditorState();
  return state.groups.find(g => g.id === id) || null;
}

/**
 * Add a new file group
 */
export function addGroup(group: FileGroup): void {
  const state = loadEditorState();
  state.groups.push(group);

  // Set as active if it's the first group
  if (state.groups.length === 1) {
    state.activeGroupId = group.id;
  }

  saveEditorState(state);
}

/**
 * Update a file group
 */
export function updateGroup(id: string, updates: Partial<FileGroup>): void {
  const state = loadEditorState();
  const group = state.groups.find(g => g.id === id);

  if (!group) {
    console.warn(`Group ${id} not found`);
    return;
  }

  Object.assign(group, updates, { updatedAt: Date.now() });
  saveEditorState(state);
}

/**
 * Update file content in a group
 */
export function updateGroupContent(
  id: string,
  file: 'html' | 'css' | 'js' | 'php' | 'hubl',
  content: string
): void {
  const state = loadEditorState();
  const group = state.groups.find(g => g.id === id);

  if (!group) {
    console.warn(`Group ${id} not found`);
    return;
  }

  // For plugins, update pluginMainFile when PHP is being edited
  if (group.isPlugin && file === 'php') {
    updateGroup(id, { pluginMainFile: content });
  } else {
    updateGroup(id, { [file]: content });
  }
}

/**
 * Rename a file group
 */
export function renameGroup(id: string, name: string): void {
  updateGroup(id, { name });
}

/**
 * Delete a file group
 */
export function deleteGroup(id: string): void {
  const state = loadEditorState();
  const index = state.groups.findIndex(g => g.id === id);

  if (index === -1) {
    console.warn(`Group ${id} not found`);
    return;
  }

  // Remove from array
  state.groups.splice(index, 1);

  // If deleting active group, switch to first group or null
  if (state.activeGroupId === id) {
    state.activeGroupId = state.groups.length > 0 ? state.groups[0].id : null;
  }

  saveEditorState(state);
}

/**
 * Set active file group
 */
export function setActiveGroup(id: string | null): void {
  const state = loadEditorState();

  console.log('🔧 setActiveGroup() called:', {
    requestedId: id,
    requestedIdType: typeof id,
    currentActiveId: state.activeGroupId,
    currentActiveIdType: typeof state.activeGroupId,
    groupExists: id !== null ? !!state.groups.find(g => g.id === id) : 'null',
    allGroupIds: state.groups.map(g => ({ id: g.id, name: g.name, type: g.type })),
    timestamp: new Date().toISOString(),
  });

  // Validate ID exists
  const matchingGroup = id !== null ? state.groups.find(g => g.id === id) : null;
  if (id !== null && !matchingGroup) {
    console.warn(`❌ Group ${id} not found in state. Available groups:`, state.groups.map(g => g.id));
    return;
  }

  const oldActiveId = state.activeGroupId;
  state.activeGroupId = id;
  saveEditorState(state);

  // Verify it was saved correctly
  const verifyState = loadEditorState();
  console.log('✅ setActiveGroup() completed:', {
    requestedId: id,
    oldActiveId: oldActiveId,
    newActiveId: state.activeGroupId,
    verifiedActiveId: verifyState.activeGroupId,
    wasSuccessful: state.activeGroupId === id,
    wasPersistedCorrectly: verifyState.activeGroupId === id,
  });
}

/**
 * Duplicate a file group
 */
export function duplicateGroup(id: string): FileGroup | null {
  const original = getGroup(id);
  if (!original) {
    return null;
  }

  const duplicate: FileGroup = {
    ...original,
    id: generateId(),
    name: `${original.name} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  addGroup(duplicate);
  return duplicate;
}

/**
 * Export a file group as JSON
 */
export function exportGroup(id: string): string | null {
  const group = getGroup(id);
  if (!group) {
    return null;
  }

  return JSON.stringify(group, null, 2);
}

/**
 * Import a file group from JSON
 */
export function importGroup(json: string): FileGroup | null {
  try {
    const group: FileGroup = JSON.parse(json);

    // Validate structure
    if (!group.name || !group.type) {
      throw new Error('Invalid group structure');
    }

    // Generate new ID to avoid conflicts
    group.id = generateId();
    group.createdAt = Date.now();
    group.updatedAt = Date.now();

    addGroup(group);
    return group;
  } catch (error) {
    console.error('Failed to import group:', error);
    return null;
  }
}

/**
 * Get storage usage info
 */
export function getStorageInfo(): { used: number; limit: number; percentage: number } {
  try {
    const state = loadEditorState();
    const stateJson = JSON.stringify(state);
    const used = new Blob([stateJson]).size;
    const limit = 5 * 1024 * 1024; // 5MB approximate localStorage limit
    const percentage = (used / limit) * 100;

    return { used, limit, percentage };
  } catch (error) {
    return { used: 0, limit: 0, percentage: 0 };
  }
}

/**
 * Migrate from old single-section format
 */
export function migrateFromOldFormat(): boolean {
  // Check if running in browser (not SSR)
  if (typeof window === 'undefined') {
    return false;
  }

  // Check if new format already exists
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return false; // Already migrated
  }

  // Check for old format (from Section Library)
  const oldSections = localStorage.getItem('html-sections');
  if (!oldSections) {
    return false; // Nothing to migrate
  }

  try {
    const sections = JSON.parse(oldSections);
    if (!Array.isArray(sections) || sections.length === 0) {
      return false;
    }

    // Create new state with migrated groups
    const state: EditorState = {
      groups: sections.map((section: any) => ({
        id: generateId(),
        name: section.name || 'Untitled Section',
        type: section.hubl ? 'hubspot' : section.php ? 'php' : 'html',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        html: section.html || '',
        css: section.css || '',
        js: section.js || '',
        php: section.php,
        hubl: section.hubl,
        description: section.description,
      })),
      activeGroupId: null,
      version: CURRENT_VERSION
    };

    // Set first group as active
    if (state.groups.length > 0) {
      state.activeGroupId = state.groups[0].id;
    }

    saveEditorState(state);
    console.log(`✅ Migrated ${state.groups.length} sections to new format`);
    return true;
  } catch (error) {
    console.error('Failed to migrate from old format:', error);
    return false;
  }
}

/**
 * Save group to Section Library (for backward compatibility)
 */
export function saveGroupToLibrary(group: FileGroup): void {
  // Check if running in browser (not SSR)
  if (typeof window === 'undefined') {
    return;
  }

  const sections = JSON.parse(localStorage.getItem('html-sections') || '[]');

  const librarySection = {
    id: group.id,
    name: group.name,
    html: group.html,
    css: group.css,
    js: group.js,
    php: group.php,
    hubl: group.hubl,
    settings: {},
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };

  sections.push(librarySection);
  localStorage.setItem('html-sections', JSON.stringify(sections));
}

/**
 * Load group from Section Library
 */
export function loadGroupFromLibrary(libraryId: string): FileGroup | null {
  // Check if running in browser (not SSR)
  if (typeof window === 'undefined') {
    return null;
  }

  const sections = JSON.parse(localStorage.getItem('html-sections') || '[]');
  const librarySection = sections.find((s: any) => s.id === libraryId);

  if (!librarySection) {
    return null;
  }

  const group: FileGroup = {
    id: generateId(), // New ID for the group
    name: librarySection.name || 'Untitled',
    type: librarySection.hubl ? 'hubspot' : librarySection.php ? 'php' : 'html',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    html: librarySection.html || '',
    css: librarySection.css || '',
    js: librarySection.js || '',
    php: librarySection.php,
    hubl: librarySection.hubl,
  };

  addGroup(group);
  return group;
}

/**
 * ============================================================
 * WORDPRESS PLUGIN MANAGEMENT FUNCTIONS (NEW)
 * ============================================================
 */

/**
 * Generate main plugin PHP file with auto-registration
 */
function generateMainPluginFile(name: string, slug: string, description?: string): string {
  return `<?php
/**
 * Plugin Name: ${name}
 * Description: ${description || 'Custom Elementor widgets collection'}
 * Version: 1.0.0
 * Author: Your Name
 * Text Domain: ${slug}
 * Elementor tested up to: 3.20.0
 * Elementor Pro tested up to: 3.20.0
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Register custom Elementor widget category
 */
function ${slug.replace(/-/g, '_')}_add_elementor_category($elements_manager) {
    $elements_manager->add_category(
        '${slug}',
        [
            'title' => esc_html__('${name}', '${slug}'),
            'icon' => 'fa fa-plug',
        ]
    );
}
add_action('elementor/elements/categories_registered', '${slug.replace(/-/g, '_')}_add_elementor_category');

/**
 * Register all widgets in the widgets/ folder
 */
function ${slug.replace(/-/g, '_')}_register_widgets($widgets_manager) {
    // Include all widget files from widgets/ directory
    $widget_files = glob(plugin_dir_path(__FILE__) . 'widgets/*.php');

    foreach ($widget_files as $widget_file) {
        require_once $widget_file;
    }

    // AUTO-REGISTRATION: Add widget classes here
    // Format: $widgets_manager->register(new Widget_Class_Name());

    // [WIDGETS_PLACEHOLDER]
}
add_action('elementor/widgets/register', '${slug.replace(/-/g, '_')}_register_widgets');
`;
}

/**
 * Extract PHP class name from widget code
 */
function extractClassNameFromPhp(phpCode: string): string {
  // Match: class ClassName extends
  const match = phpCode.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)\s+extends/);
  return match ? match[1] : 'Unknown_Widget';
}

/**
 * Generate slug from class name
 */
function generateSlugFromClassName(className: string): string {
  // Convert "Hero_Widget" -> "hero-widget"
  return className.toLowerCase().replace(/_/g, '-');
}

/**
 * Register widget class in main plugin file
 */
function registerWidgetInMainFile(mainFile: string, className: string, widgetSlug: string): string {
  // Find the placeholder and add registration line
  const registrationLine = `    $widgets_manager->register(new ${className}()); // ${widgetSlug}`;

  if (mainFile.includes('[WIDGETS_PLACEHOLDER]')) {
    return mainFile.replace('[WIDGETS_PLACEHOLDER]', `${registrationLine}\n    \n    // [WIDGETS_PLACEHOLDER]`);
  }

  // Fallback: add before the closing comment
  const fallbackPattern = /(\s*\/\/ AUTO-REGISTRATION:.*?\n)/;
  if (fallbackPattern.test(mainFile)) {
    return mainFile.replace(fallbackPattern, `$1${registrationLine}\n`);
  }

  return mainFile; // Return unchanged if no insertion point found
}

/**
 * Generate demo "Hello World" widget
 */
function generateHelloWorldWidget(): string {
  return `<?php
/**
 * Hello World Widget
 *
 * A simple demo widget that displays "Hello World" text.
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Hello_World_Widget extends \\Elementor\\Widget_Base {

    public function get_name() {
        return 'hello-world';
    }

    public function get_title() {
        return esc_html__('Hello World', 'text-domain');
    }

    public function get_icon() {
        return 'eicon-text';
    }

    public function get_categories() {
        return ['basic'];
    }

    protected function register_controls() {
        // Content Section
        $this->start_controls_section(
            'content_section',
            [
                'label' => esc_html__('Content', 'text-domain'),
                'tab' => \\Elementor\\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'message',
            [
                'label' => esc_html__('Message', 'text-domain'),
                'type' => \\Elementor\\Controls_Manager::TEXT,
                'default' => esc_html__('Hello World!', 'text-domain'),
                'placeholder' => esc_html__('Enter your message', 'text-domain'),
            ]
        );

        $this->end_controls_section();

        // Style Section
        $this->start_controls_section(
            'style_section',
            [
                'label' => esc_html__('Style', 'text-domain'),
                'tab' => \\Elementor\\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'text_color',
            [
                'label' => esc_html__('Text Color', 'text-domain'),
                'type' => \\Elementor\\Controls_Manager::COLOR,
                'default' => '#000000',
                'selectors' => [
                    '{{WRAPPER}} .hello-world-message' => 'color: {{VALUE}}',
                ],
            ]
        );

        $this->add_group_control(
            \\Elementor\\Group_Control_Typography::get_type(),
            [
                'name' => 'text_typography',
                'selector' => '{{WRAPPER}} .hello-world-message',
            ]
        );

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();
        ?>
        <div class="hello-world-widget">
            <h2 class="hello-world-message">
                <?php echo esc_html($settings['message']); ?>
            </h2>
        </div>
        <?php
    }

    protected function content_template() {
        ?>
        <#
        view.addRenderAttribute('message', 'class', 'hello-world-message');
        #>
        <div class="hello-world-widget">
            <h2 {{{ view.getRenderAttributeString('message') }}}>
                {{{ settings.message }}}
            </h2>
        </div>
        <?php
    }
}`;
}

/**
 * Create a new WordPress plugin project
 */
export function createPlugin(name: string, description?: string): FileGroup {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const now = Date.now();

  const mainFileContent = generateMainPluginFile(name, slug, description);
  console.log('🔌 Creating plugin:', {
    name,
    slug,
    description,
    mainFileLength: mainFileContent.length,
    mainFilePreview: mainFileContent.substring(0, 100)
  });

  // Generate demo "Hello World" widget
  const helloWorldCode = generateHelloWorldWidget();
  const helloWorldId = generateId();
  const helloWorldClassName = 'Hello_World_Widget';
  const helloWorldSlug = 'hello-world';

  // Register the demo widget in the main file
  const mainFileWithWidget = registerWidgetInMainFile(
    mainFileContent,
    helloWorldClassName,
    helloWorldSlug
  );

  const plugin: FileGroup = {
    id: generateId(),
    name,
    type: 'php',
    isPlugin: true,
    pluginName: name,
    pluginSlug: slug,
    pluginMainFile: mainFileWithWidget,
    widgetFiles: {
      [helloWorldId]: {
        name: 'Hello World',
        slug: helloWorldSlug,
        content: helloWorldCode,
        className: helloWorldClassName,
      }
    },
    createdAt: now,
    updatedAt: now,
    // For plugins, we DON'T create HTML/CSS/JS files - only PHP
    // These should be undefined, not empty strings
    html: '',
    css: '',
    js: '',
    description,
  };

  console.log('✅ Plugin created with demo widget:', {
    id: plugin.id,
    pluginMainFileLength: plugin.pluginMainFile?.length || 0,
    hasPluginMainFile: !!plugin.pluginMainFile,
    widgetCount: Object.keys(plugin.widgetFiles || {}).length
  });

  return plugin;
}

/**
 * Add a widget to an existing plugin
 */
export function addWidgetToPlugin(
  pluginId: string,
  widgetName: string,
  widgetCode: string
): void {
  const state = loadEditorState();
  const plugin = state.groups.find(g => g.id === pluginId);

  if (!plugin) {
    throw new Error(`Plugin with ID ${pluginId} not found`);
  }

  if (!plugin.isPlugin) {
    throw new Error('Target project is not a plugin');
  }

  // Extract class name from widget code
  const className = extractClassNameFromPhp(widgetCode);
  const widgetSlug = widgetName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const widgetId = generateId();

  // Initialize widgetFiles if not exists
  if (!plugin.widgetFiles) {
    plugin.widgetFiles = {};
  }

  // Add widget to map
  plugin.widgetFiles[widgetId] = {
    name: widgetName,
    slug: widgetSlug,
    content: widgetCode,
    className,
  };

  // Auto-register widget in main plugin file
  if (plugin.pluginMainFile) {
    plugin.pluginMainFile = registerWidgetInMainFile(
      plugin.pluginMainFile,
      className,
      widgetSlug
    );
  }

  plugin.updatedAt = Date.now();
  saveEditorState(state);

  console.log(`✅ Added widget "${widgetName}" (${className}) to plugin "${plugin.pluginName}"`);
}

/**
 * Remove a widget from a plugin
 */
export function removeWidgetFromPlugin(pluginId: string, widgetId: string): void {
  const state = loadEditorState();
  const plugin = state.groups.find(g => g.id === pluginId);

  if (!plugin || !plugin.isPlugin || !plugin.widgetFiles) {
    return;
  }

  const widget = plugin.widgetFiles[widgetId];
  if (!widget) {
    return;
  }

  // Remove from widgetFiles map
  delete plugin.widgetFiles[widgetId];

  // Remove registration from main file
  if (plugin.pluginMainFile) {
    const registrationPattern = new RegExp(
      `\\s*\\$widgets_manager->register\\(new ${widget.className}\\(\\)\\);.*?\\n`,
      'g'
    );
    plugin.pluginMainFile = plugin.pluginMainFile.replace(registrationPattern, '');
  }

  plugin.updatedAt = Date.now();
  saveEditorState(state);

  console.log(`✅ Removed widget "${widget.name}" from plugin "${plugin.pluginName}"`);
}

/**
 * Update a widget's code in a plugin
 */
export function updateWidgetInPlugin(
  pluginId: string,
  widgetId: string,
  newCode: string
): void {
  const state = loadEditorState();
  const plugin = state.groups.find(g => g.id === pluginId);

  if (!plugin || !plugin.isPlugin || !plugin.widgetFiles) {
    return;
  }

  const widget = plugin.widgetFiles[widgetId];
  if (!widget) {
    return;
  }

  // Update widget code
  const newClassName = extractClassNameFromPhp(newCode);
  const oldClassName = widget.className;

  widget.content = newCode;
  widget.className = newClassName;

  // If class name changed, update registration in main file
  if (oldClassName !== newClassName && plugin.pluginMainFile) {
    plugin.pluginMainFile = plugin.pluginMainFile.replace(
      new RegExp(`\\$widgets_manager->register\\(new ${oldClassName}\\(\\)\\);`),
      `$widgets_manager->register(new ${newClassName}());`
    );
  }

  plugin.updatedAt = Date.now();
  saveEditorState(state);

  console.log(`✅ Updated widget "${widget.name}" in plugin "${plugin.pluginName}"`);
}

/**
 * Get all plugins from state
 */
export function getAllPlugins(): FileGroup[] {
  const state = loadEditorState();
  return state.groups.filter(g => g.isPlugin === true);
}
