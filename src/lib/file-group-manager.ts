/**
 * File Group Manager
 *
 * Manages multiple file groups (projects) in the Code Editor.
 * Each group can be:
 * - HTML Project: HTML + CSS + JavaScript
 * - PHP Widget: PHP + CSS + JavaScript
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
  type: 'html' | 'php';          // Project type
  createdAt: number;             // Timestamp
  updatedAt: number;             // Timestamp

  // Files
  html: string;                  // Only for type='html'
  css: string;
  js: string;
  php?: string;                  // Only for type='php'

  // Metadata
  description?: string;          // Optional description
  tags?: string[];               // Optional tags for organization
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
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return getDefaultState();
    }

    const state: EditorState = JSON.parse(saved);

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
  type: 'html' | 'php',
  template?: 'empty' | 'hero' | 'contact-form' | 'basic-widget' | 'button-widget'
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
  template: 'hero' | 'contact-form' | 'basic-widget' | 'button-widget'
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
  file: 'html' | 'css' | 'js' | 'php',
  content: string
): void {
  updateGroup(id, { [file]: content });
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

  // Validate ID exists
  if (id !== null && !state.groups.find(g => g.id === id)) {
    console.warn(`Group ${id} not found`);
    return;
  }

  state.activeGroupId = id;
  saveEditorState(state);
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
        type: section.php ? 'php' : 'html',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        html: section.html || '',
        css: section.css || '',
        js: section.js || '',
        php: section.php,
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
  const sections = JSON.parse(localStorage.getItem('html-sections') || '[]');

  const librarySection = {
    id: group.id,
    name: group.name,
    html: group.html,
    css: group.css,
    js: group.js,
    php: group.php,
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
  const sections = JSON.parse(localStorage.getItem('html-sections') || '[]');
  const librarySection = sections.find((s: any) => s.id === libraryId);

  if (!librarySection) {
    return null;
  }

  const group: FileGroup = {
    id: generateId(), // New ID for the group
    name: librarySection.name || 'Untitled',
    type: librarySection.php ? 'php' : 'html',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    html: librarySection.html || '',
    css: librarySection.css || '',
    js: librarySection.js || '',
    php: librarySection.php,
  };

  addGroup(group);
  return group;
}
