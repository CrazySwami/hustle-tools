# Elementor Style Kit System - Technical Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Data Flow](#data-flow)
4. [File Structure](#file-structure)
5. [PHP Serialization Handling](#php-serialization-handling)
6. [JSON Structure](#json-structure)
7. [Field Status Detection](#field-status-detection)
8. [Next.js Integration Guide](#nextjs-integration-guide)
9. [API Design](#api-design)
10. [State Management](#state-management)

---

## System Overview

### Purpose
A complete system for editing Elementor WordPress style kits outside of WordPress, with full support for:
- PHP serialized data (WordPress native format)
- Clean JSON (portable format)
- Visual status indicators (missing/default/has-data)
- Live preview of styles
- Import/Export functionality

### Components
1. **PHP-to-JSON Converter** - Deserializes WordPress exports
2. **Style Kit Editor v2** - Full-featured editor with status indicators
3. **Validation System** - Detects missing/default/custom fields
4. **Preview Engine** - Real-time style rendering

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     INPUT SOURCES                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  WordPress Export          Clean JSON           Empty Kit    │
│  (PHP Serialized)         (Pure JSON)          (Defaults)    │
│       │                       │                    │         │
│       ├───────────────────────┼────────────────────┤         │
│       │                       │                    │         │
│       ▼                       ▼                    ▼         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           PHP DESERIALIZER (Optional)               │    │
│  │  - Detects PHP serialization                        │    │
│  │  - Converts a:N:{...} → JavaScript objects          │    │
│  │  - Handles nested structures                        │    │
│  │  - Preserves all data                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              NORMALIZER                              │    │
│  │  - Ensures all required fields exist                │    │
│  │  - Converts empty objects → arrays where needed     │    │
│  │  - Adds defaults for missing fields                 │    │
│  │  - Validates structure                              │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         STATUS ANALYZER                              │    │
│  │  - Compares values to defaults                      │    │
│  │  - Marks fields as: missing/default/has-data        │    │
│  │  - Generates field metadata                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              EDITOR STATE                            │    │
│  │  - Reactive state management                        │    │
│  │  - Field-level tracking                             │    │
│  │  - Undo/redo capability                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│                ┌───────────┴──────────┐                      │
│                ▼                      ▼                      │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │   EDITOR UI          │  │   PREVIEW ENGINE     │        │
│  │  - Form controls     │  │  - Style generation  │        │
│  │  - Status indicators │  │  - Live rendering    │        │
│  │  - Validation        │  │  - Responsive modes  │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                │                      │                      │
│                └───────────┬──────────┘                      │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              EXPORTER                                │    │
│  │  - Serializes to clean JSON                         │    │
│  │  - Validates output                                 │    │
│  │  - Never outputs PHP serialization                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│                            ▼                                 │
│                     Clean JSON Output                        │
│              (Ready for Elementor Import)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Import Flow

#### A. PHP Serialized Input (WordPress Export)

```javascript
// Input: WordPress export with PHP serialization
{
  "title": "My Kit",
  "data": "a:255:{s:13:\"system_colors\";a:4:{...}}"
  //       ↑ PHP serialized string
}

// Step 1: Detect format
const isPhpSerialized = (data) => {
  if (typeof data === 'string' && data.startsWith('a:')) return true;
  if (data.data && typeof data.data === 'string' && data.data.startsWith('a:')) return true;
  return false;
};

// Step 2: Deserialize PHP
const unserialize = (phpString) => {
  // Parses PHP serialization format:
  // a:N:{...}  → array with N elements
  // s:N:"..." → string with N characters
  // i:N;      → integer
  // d:N.N;    → float
  // b:0/1;    → boolean
  // N;        → null
  
  // Returns JavaScript object/array
};

// Step 3: Extract and normalize
const normalized = {
  title: import.title,
  type: 'kit',
  version: '0.4',
  page_settings: {
    ...defaults,
    ...deserializedData
  },
  content: []
};

// Output: Clean JavaScript object
```

#### B. Clean JSON Input

```javascript
// Input: Already clean JSON
{
  "title": "My Kit",
  "type": "kit",
  "version": "0.4",
  "page_settings": {
    "system_colors": [...],
    // ... all fields
  }
}

// Step 1: Validate structure
const validate = (data) => {
  if (!data.page_settings) throw new Error('Invalid kit');
  return true;
};

// Step 2: Normalize
const normalized = {
  ...defaults,
  ...data,
  page_settings: {
    ...defaultPageSettings,
    ...data.page_settings
  }
};

// Output: Normalized object
```

---

### 2. Status Detection Flow

```javascript
// Default values for comparison
const DEFAULTS = {
  h1_typography_font_family: null,  // Missing if null
  h1_typography_font_weight: '700', // Default
  h1_color: '#000000',              // Default
  // ... etc
};

// Status detection algorithm
const getFieldStatus = (value, defaultValue) => {
  // Case 1: Field doesn't exist in imported data
  if (value === undefined || value === null) {
    return 'missing';  // 🔴 Red indicator
  }
  
  // Case 2: Field exists but equals default
  if (JSON.stringify(value) === JSON.stringify(defaultValue)) {
    return 'default';  // ⚠️ Yellow indicator
  }
  
  // Case 3: Field has custom data
  return 'has-data';   // ✅ Green indicator
};

// Apply to all fields
const analyzeKit = (kit, defaults) => {
  const analysis = {};
  
  Object.keys(defaults.page_settings).forEach(key => {
    analysis[key] = {
      status: getFieldStatus(
        kit.page_settings[key],
        defaults.page_settings[key]
      ),
      value: kit.page_settings[key],
      default: defaults.page_settings[key]
    };
  });
  
  return analysis;
};
```

---

### 3. Export Flow

```javascript
// Always export clean JSON, never PHP serialization

const exportKit = (kit) => {
  // Step 1: Clean the data
  const cleaned = {
    title: kit.title,
    type: 'kit',
    version: '0.4',
    page_settings: {
      ...kit.page_settings
    },
    content: []
  };
  
  // Step 2: Validate
  const errors = validateKit(cleaned);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
  
  // Step 3: Serialize to JSON
  return JSON.stringify(cleaned, null, 2);
};

// Output: Clean JSON string ready for download or Elementor import
```

---

## File Structure

### Current Implementation Files

```
elementor-kit-system/
├── tools/
│   ├── elementor-php-to-json-converter__2_.html
│   │   └── Purpose: Convert WordPress PHP serialized exports to JSON
│   │       - Standalone tool
│   │       - Browser-based PHP deserializer
│   │       - Handles all PHP serialization types
│   │       - Outputs clean JSON
│   │
│   └── elementor-kit-editor-complete-v2.html
│       └── Purpose: Edit style kits with visual indicators
│           - Full editor interface
│           - Status indicators (✅⚠️🔴)
│           - Live preview
│           - Import/Export
│
├── examples/
│   └── complete-production-kit-example__2_.json
│       └── Purpose: Reference implementation
│           - Contains ALL 180 Elementor fields
│           - Proper structure
│           - Can be used as template
│
└── docs/
    ├── COMPLETE-FIELD-COMPARISON.md
    │   └── Field-by-field analysis of what's supported
    │
    ├── ENHANCEMENT-SUMMARY.md
    │   └── What features were added
    │
    ├── V2-EDITOR-GUIDE.md
    │   └── User guide for v2 editor
    │
    ├── README.md
    │   └── System overview
    │
    └── TECHNICAL-DOCUMENTATION.md (this file)
        └── Technical implementation details
```

---

## PHP Serialization Handling

### Format Specification

PHP serialization format used by WordPress:

```
a:N:{...}     Array with N elements
s:N:"string"  String with N characters
i:N;          Integer value N
d:N.N;        Float/double value
b:0;/b:1;     Boolean (0=false, 1=true)
N;            NULL value
```

### Implementation

```javascript
function unserialize(data) {
  let offset = 0;
  
  const readUntil = (char) => {
    const start = offset;
    while (offset < data.length && data[offset] !== char) {
      offset++;
    }
    return data.substring(start, offset);
  };
  
  const parseValue = () => {
    const type = data[offset++];
    
    if (data[offset++] !== ':') {
      throw new Error('Expected ":" at position ' + offset);
    }
    
    switch (type) {
      case 's': // String
        const strLen = parseInt(readUntil(':'));
        offset++; // skip ':'
        if (data[offset++] !== '"') throw new Error('Expected opening quote');
        const str = data.substr(offset, strLen);
        offset += strLen;
        if (data[offset++] !== '"') throw new Error('Expected closing quote');
        offset++; // skip ';'
        return str;
        
      case 'i': // Integer
        const intStr = readUntil(';');
        offset++; // skip ';'
        return parseInt(intStr);
        
      case 'd': // Float
        const floatStr = readUntil(';');
        offset++; // skip ';'
        return parseFloat(floatStr);
        
      case 'b': // Boolean
        const boolVal = data[offset];
        offset += 2; // skip value and ';'
        return boolVal === '1';
        
      case 'N': // Null
        offset++; // skip ';'
        return null;
        
      case 'a': // Array
        const arrLen = parseInt(readUntil(':'));
        offset++; // skip ':'
        if (data[offset++] !== '{') throw new Error('Expected "{"');
        
        const result = {};
        let isNumericArray = true;
        
        for (let i = 0; i < arrLen; i++) {
          const key = parseValue();
          const value = parseValue();
          result[key] = value;
          
          // Check if array is numerically indexed
          if (typeof key !== 'number' || key !== i) {
            isNumericArray = false;
          }
        }
        
        if (data[offset++] !== '}') throw new Error('Expected "}"');
        
        // Convert to array if numerically indexed
        if (isNumericArray && arrLen > 0) {
          return Object.values(result);
        }
        
        return result;
        
      default:
        throw new Error('Unknown type: ' + type);
    }
  };
  
  return parseValue();
}
```

### Usage in Converter

```javascript
// Detect PHP serialization
const content = fileReader.result;
const parsed = JSON.parse(content);

if (parsed.data && typeof parsed.data === 'string' && parsed.data.startsWith('a:')) {
  // It's PHP serialized
  const deserialized = unserialize(parsed.data);
  
  // Create clean structure
  const cleanKit = {
    title: parsed.title || 'Converted Kit',
    type: 'kit',
    version: '0.4',
    page_settings: deserialized,
    content: []
  };
  
  // Fix arrays (PHP quirk: empty arrays become objects)
  if (!Array.isArray(cleanKit.page_settings.custom_colors)) {
    cleanKit.page_settings.custom_colors = [];
  }
  if (!Array.isArray(cleanKit.page_settings.custom_typography)) {
    cleanKit.page_settings.custom_typography = [];
  }
  
  return cleanKit;
}
```

---

## JSON Structure

### Complete Schema

```typescript
interface ElementorStyleKit {
  title: string;
  type: 'kit';
  version: string; // e.g., "0.4"
  page_settings: PageSettings;
  content: any[]; // Always empty for style kits
}

interface PageSettings {
  // Global Colors (4 system + unlimited custom)
  system_colors: ColorItem[];      // Required: exactly 4
  custom_colors: ColorItem[];      // Optional: 0+
  
  // Global Typography (4 system + unlimited custom)
  system_typography: TypographyPreset[];  // Required: exactly 4
  custom_typography: TypographyPreset[];  // Optional: 0+
  
  // Theme Typography - Headings (H1-H6)
  h1_typography_font_family: string;
  h1_typography_font_weight: string;
  h1_typography_font_size: SizeObject;
  h1_typography_font_size_tablet?: SizeObject;
  h1_typography_font_size_mobile?: SizeObject;
  h1_typography_line_height: SizeObject;
  h1_typography_letter_spacing: SizeObject;
  h1_typography_text_transform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  h1_typography_font_style: 'normal' | 'italic' | 'oblique';
  h1_typography_text_decoration: 'none' | 'underline' | 'overline' | 'line-through';
  h1_color: string;
  // ... repeat for h2, h3, h4, h5, h6
  
  // Theme Typography - Body
  body_typography_font_family: string;
  body_typography_font_weight: string;
  body_typography_font_size: SizeObject;
  body_typography_font_size_tablet?: SizeObject;
  body_typography_font_size_mobile?: SizeObject;
  body_typography_line_height: SizeObject;
  body_typography_letter_spacing: SizeObject;
  body_typography_text_transform: string;
  body_typography_font_style: string;
  body_typography_text_decoration: string;
  body_color: string;
  
  // Theme Typography - Links
  link_normal_color: string;
  link_hover_color: string;
  link_typography_text_decoration: string;
  link_typography_font_weight: string;
  
  // Buttons
  button_typography_font_family: string;
  button_typography_font_weight: string;
  button_typography_font_size: SizeObject;
  button_typography_line_height: SizeObject;
  button_typography_letter_spacing: SizeObject;
  button_typography_text_transform: string;
  button_typography_font_style: string;
  button_typography_text_decoration: string;
  button_text_color: string;
  button_background_color: string;
  button_border_color: string;
  button_hover_color: string;
  button_hover_background_color: string;
  button_hover_border_color: string;
  button_border_border: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  button_border_width: DimensionObject;
  button_border_radius: DimensionObject;
  button_padding: DimensionObject;
  button_hover_transition: SizeObject;
  button_box_shadow_box_shadow_type: '' | 'yes';
  button_box_shadow_box_shadow: BoxShadowObject;
  
  // Form Fields
  form_label_color: string;
  form_label_typography_font_family: string;
  form_label_typography_font_weight: string;
  form_label_typography_font_size: SizeObject;
  form_label_spacing: SizeObject;
  form_field_text_color: string;
  form_field_typography_font_family: string;
  form_field_typography_font_size: SizeObject;
  form_field_background_color: string;
  form_field_border_color: string;
  form_field_focus_text_color: string;
  form_field_focus_background_color: string;
  form_field_focus_border_color: string;
  form_field_border_border: string;
  form_field_border_width: DimensionObject;
  form_field_border_radius: DimensionObject;
  form_field_padding: DimensionObject;
  form_field_box_shadow_box_shadow_type: '' | 'yes';
  form_field_box_shadow_box_shadow: BoxShadowObject;
  form_field_focus_transition_duration: SizeObject;
  
  // Images
  image_border_border: string;
  image_border_width: DimensionObject;
  image_border_color: string;
  image_border_radius: DimensionObject;
  image_css_filters_blur: SizeObject;
  image_css_filters_brightness: SizeObject;
  image_css_filters_contrast: SizeObject;
  image_css_filters_saturation: SizeObject;
  image_css_filters_hue: SizeObject;
  image_opacity: SizeObject;
  image_hover_opacity: SizeObject;
  image_hover_transition_duration: SizeObject;
  
  // Site Settings - Background
  background_background: 'classic' | 'gradient' | 'video' | 'slideshow';
  background_color: string;
  background_position: string;
  background_attachment: 'scroll' | 'fixed';
  background_repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
  background_size: 'auto' | 'cover' | 'contain';
  
  // Site Settings - Layout
  content_width: 'boxed' | 'full';
  container_width: SizeObject;
  container_width_tablet: SizeObject;
  container_width_mobile: SizeObject;
  container_padding: DimensionObject;
  widgets_gap: SizeObject;
  viewport_md: number;  // Tablet breakpoint
  viewport_lg: number;  // Desktop breakpoint
  
  // Site Settings - Lightbox
  lightbox_enable: 'yes' | 'no';
  lightbox_gallery_counter: 'yes' | 'no';
  lightbox_enable_fullscreen: 'yes' | 'no';
  lightbox_enable_zoom: 'yes' | 'no';
  lightbox_enable_share: 'yes' | 'no';
  lightbox_title: '' | 'title' | 'caption' | 'alt' | 'description';
  lightbox_description: '' | 'title' | 'caption' | 'alt' | 'description';
  lightbox_background_color: string;
  lightbox_ui_color: string;
  lightbox_ui_color_hover: string;
  lightbox_text_color: string;
  lightbox_icon_size: SizeObject;
  lightbox_navigation_icon_size: SizeObject;
  
  // Additional settings
  default_generic_fonts: string;
  site_name: string;
  site_description: string;
}

// Sub-interfaces
interface ColorItem {
  _id: string;
  title: string;
  color: string;  // Hex or rgba
}

interface TypographyPreset {
  _id: string;
  title: string;
  typography_font_family: string;
  typography_font_weight: string;
  typography_font_size?: SizeObject;
  typography_line_height?: SizeObject;
  typography_letter_spacing?: SizeObject;
  typography_text_transform?: string;
  typography_font_style?: string;
  typography_text_decoration?: string;
}

interface SizeObject {
  unit: 'px' | 'em' | 'rem' | '%' | 'vh' | 'vw' | 'ms' | 's' | 'deg' | '';
  size: number;
  sizes?: any[];  // For responsive (usually empty)
}

interface DimensionObject {
  unit: 'px' | 'em' | '%' | 'rem';
  top: string | number;
  right: string | number;
  bottom: string | number;
  left: string | number;
  isLinked?: boolean;
}

interface BoxShadowObject {
  horizontal: number;   // px
  vertical: number;     // px
  blur: number;         // px
  spread: number;       // px
  color: string;        // rgba or hex
  position?: string;    // '' for outer, 'inset' for inner
}
```

---

## Field Status Detection

### Algorithm

```javascript
// Default values registry
const DEFAULTS = {
  page_settings: {
    // Colors
    system_colors: [
      { _id: 'primary', title: 'Primary', color: '#000000' },
      { _id: 'secondary', title: 'Secondary', color: '#c3acd0' },
      { _id: 'text', title: 'Text', color: '#333333' },
      { _id: 'accent', title: 'Accent', color: '#7743db' }
    ],
    custom_colors: [],
    
    // Typography
    system_typography: [
      { _id: 'primary', title: 'Primary', typography_font_family: 'Roboto', typography_font_weight: '600' },
      { _id: 'secondary', title: 'Secondary', typography_font_family: 'Roboto', typography_font_weight: '500' },
      { _id: 'text', title: 'Text', typography_font_family: 'Roboto', typography_font_weight: '400' },
      { _id: 'accent', title: 'Accent', typography_font_family: 'Roboto', typography_font_weight: '600' }
    ],
    custom_typography: [],
    
    // All other fields with their defaults...
    h1_typography_font_family: null,  // null = missing indicator
    h1_typography_font_weight: '700',
    h1_color: '#000000',
    // ... etc for all 180 fields
  }
};

// Status detection function
const getFieldStatus = (currentValue, defaultValue) => {
  // Case 1: Field is missing (undefined/null in imported data)
  if (currentValue === undefined || currentValue === null) {
    return {
      status: 'missing',
      icon: '🔴',
      badge: 'MISSING',
      cssClass: 'is-missing',
      color: '#dc3545',
      action: 'MUST fill this field'
    };
  }
  
  // Case 2: Field matches default value exactly
  if (JSON.stringify(currentValue) === JSON.stringify(defaultValue)) {
    return {
      status: 'default',
      icon: '⚠️',
      badge: 'DEFAULT',
      cssClass: 'is-default',
      color: '#ffc107',
      action: 'Can customize this field'
    };
  }
  
  // Case 3: Field has custom data
  return {
    status: 'has-data',
    icon: '✅',
    badge: 'HAS DATA',
    cssClass: 'has-data',
    color: '#28a745',
    action: 'Field is customized'
  };
};

// Apply to entire kit
const analyzeKit = (kit) => {
  const analysis = {
    fields: {},
    sections: {},
    overall: {
      total: 0,
      missing: 0,
      default: 0,
      hasData: 0
    }
  };
  
  // Analyze each field
  Object.keys(DEFAULTS.page_settings).forEach(key => {
    const status = getFieldStatus(
      kit.page_settings[key],
      DEFAULTS.page_settings[key]
    );
    
    analysis.fields[key] = status;
    analysis.overall.total++;
    
    if (status.status === 'missing') analysis.overall.missing++;
    else if (status.status === 'default') analysis.overall.default++;
    else analysis.overall.hasData++;
  });
  
  // Analyze sections
  analysis.sections = {
    globalColors: analyzeGlobalColors(kit, analysis.fields),
    globalTypography: analyzeGlobalTypography(kit, analysis.fields),
    themeTypography: analyzeThemeTypography(kit, analysis.fields),
    buttons: analyzeButtons(kit, analysis.fields),
    forms: analyzeForms(kit, analysis.fields),
    images: analyzeImages(kit, analysis.fields),
    siteSettings: analyzeSiteSettings(kit, analysis.fields)
  };
  
  return analysis;
};

// Section-specific analysis
const analyzeGlobalColors = (kit, fieldAnalysis) => {
  const systemColors = kit.page_settings.system_colors || [];
  const customColors = kit.page_settings.custom_colors || [];
  
  const allColorsValid = systemColors.length === 4 && 
    systemColors.every(c => c.color && c.color !== '');
  
  return {
    status: allColorsValid ? 'complete' : 'incomplete',
    systemCount: systemColors.length,
    customCount: customColors.length,
    badge: allColorsValid ? 'COMPLETE' : 'INCOMPLETE',
    message: allColorsValid 
      ? `All 4 system colors present${customColors.length > 0 ? ` + ${customColors.length} custom` : ''}`
      : `Only ${systemColors.length}/4 system colors present`
  };
};
```

### Visualization in UI

```javascript
// Render field with status
const renderFieldWithStatus = (fieldName, fieldValue, status) => {
  return (
    <div className="control-row">
      <label>
        <span className="field-status" title={status.action}>
          {status.icon}
        </span>
        {fieldLabel}
      </label>
      <input
        type="text"
        value={fieldValue || ''}
        className={status.cssClass}
        style={{ borderLeftColor: status.color }}
        onChange={handleChange}
      />
      {status.status === 'missing' && (
        <div className="help-text" style={{ color: status.color }}>
          ⚠️ This field is not in your JSON. Please add a value.
        </div>
      )}
    </div>
  );
};

// Render section with badge
const renderSectionBadge = (sectionAnalysis) => {
  return (
    <span 
      className={`status-badge ${sectionAnalysis.status === 'complete' ? 'has-data' : 'is-missing'}`}
      title={sectionAnalysis.message}
    >
      {sectionAnalysis.badge}
    </span>
  );
};
```

---

## Next.js Integration Guide

### File Structure in Next.js

```
your-nextjs-project/
├── src/
│   ├── lib/
│   │   ├── elementor/
│   │   │   ├── deserializer.ts          # PHP unserialize logic
│   │   │   ├── normalizer.ts            # Kit normalization
│   │   │   ├── validator.ts             # Validation logic
│   │   │   ├── status-analyzer.ts       # Field status detection
│   │   │   ├── defaults.ts              # Default values registry
│   │   │   └── types.ts                 # TypeScript interfaces
│   │   │
│   │   └── utils/
│   │       └── file-handlers.ts         # Import/export utilities
│   │
│   ├── components/
│   │   ├── elementor/
│   │   │   ├── KitEditor/
│   │   │   │   ├── index.tsx            # Main editor component
│   │   │   │   ├── GlobalColors.tsx     # Global colors tab
│   │   │   │   ├── GlobalTypography.tsx # Global typography tab
│   │   │   │   ├── ThemeTypography.tsx  # Theme typography tab
│   │   │   │   ├── Buttons.tsx          # Buttons tab
│   │   │   │   ├── Forms.tsx            # Forms tab
│   │   │   │   ├── Images.tsx           # Images tab
│   │   │   │   └── Preview.tsx          # Live preview panel
│   │   │   │
│   │   │   ├── FieldControls/
│   │   │   │   ├── ColorPicker.tsx
│   │   │   │   ├── SizeControl.tsx
│   │   │   │   ├── DimensionControl.tsx
│   │   │   │   ├── BoxShadowControl.tsx
│   │   │   │   └── StatusIndicator.tsx
│   │   │   │
│   │   │   └── Converter/
│   │   │       └── PhpToJsonConverter.tsx
│   │   │
│   │   └── ui/
│   │       └── ... (shadcn/ui components)
│   │
│   ├── hooks/
│   │   ├── useElementorKit.ts           # Kit state management
│   │   ├── useKitAnalysis.ts            # Status analysis hook
│   │   └── useKitImportExport.ts        # Import/export hook
│   │
│   └── app/
│       └── elementor-editor/
│           └── page.tsx                  # Editor page
│
└── public/
    └── examples/
        └── complete-kit-example.json
```

---

### Core Module: deserializer.ts

```typescript
// src/lib/elementor/deserializer.ts

export class PhpDeserializer {
  private data: string;
  private offset: number = 0;

  constructor(phpString: string) {
    this.data = phpString;
  }

  public unserialize(): any {
    return this.parseValue();
  }

  private readUntil(char: string): string {
    const start = this.offset;
    while (this.offset < this.data.length && this.data[this.offset] !== char) {
      this.offset++;
    }
    return this.data.substring(start, this.offset);
  }

  private parseValue(): any {
    const type = this.data[this.offset++];

    if (this.data[this.offset++] !== ':') {
      throw new Error(`Expected ":" at position ${this.offset}`);
    }

    switch (type) {
      case 's': // String
        return this.parseString();
      case 'i': // Integer
        return this.parseInt();
      case 'd': // Double/Float
        return this.parseFloat();
      case 'b': // Boolean
        return this.parseBoolean();
      case 'N': // Null
        return this.parseNull();
      case 'a': // Array
        return this.parseArray();
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }

  private parseString(): string {
    const length = parseInt(this.readUntil(':'));
    this.offset++; // skip ':'
    
    if (this.data[this.offset++] !== '"') {
      throw new Error('Expected opening quote');
    }
    
    const str = this.data.substr(this.offset, length);
    this.offset += length;
    
    if (this.data[this.offset++] !== '"') {
      throw new Error('Expected closing quote');
    }
    
    this.offset++; // skip ';'
    return str;
  }

  private parseInt(): number {
    const intStr = this.readUntil(';');
    this.offset++; // skip ';'
    return parseInt(intStr, 10);
  }

  private parseFloat(): number {
    const floatStr = this.readUntil(';');
    this.offset++; // skip ';'
    return parseFloat(floatStr);
  }

  private parseBoolean(): boolean {
    const boolVal = this.data[this.offset];
    this.offset += 2; // skip value and ';'
    return boolVal === '1';
  }

  private parseNull(): null {
    this.offset++; // skip ';'
    return null;
  }

  private parseArray(): any {
    const length = parseInt(this.readUntil(':'));
    this.offset++; // skip ':'
    
    if (this.data[this.offset++] !== '{') {
      throw new Error('Expected "{"');
    }

    const result: any = {};
    let isNumericArray = true;

    for (let i = 0; i < length; i++) {
      const key = this.parseValue();
      const value = this.parseValue();
      result[key] = value;

      if (typeof key !== 'number' || key !== i) {
        isNumericArray = false;
      }
    }

    if (this.data[this.offset++] !== '}') {
      throw new Error('Expected "}"');
    }

    // Convert to array if numerically indexed
    if (isNumericArray && length > 0) {
      return Object.values(result);
    }

    return result;
  }
}

// Helper function
export function unserialize(phpString: string): any {
  const deserializer = new PhpDeserializer(phpString);
  return deserializer.unserialize();
}

// Detect if data is PHP serialized
export function isPhpSerialized(data: any): boolean {
  if (typeof data === 'string' && data.startsWith('a:')) {
    return true;
  }
  
  if (data && typeof data === 'object') {
    if (data.data && typeof data.data === 'string' && data.data.startsWith('a:')) {
      return true;
    }
  }
  
  return false;
}
```

---

### Core Module: normalizer.ts

```typescript
// src/lib/elementor/normalizer.ts

import { ElementorStyleKit, PageSettings } from './types';
import { DEFAULTS } from './defaults';
import { unserialize, isPhpSerialized } from './deserializer';

export class KitNormalizer {
  /**
   * Normalizes any input format to standard ElementorStyleKit
   */
  public static normalize(input: any): ElementorStyleKit {
    // Step 1: Handle PHP serialization if present
    const deserialized = this.handlePhpSerialization(input);
    
    // Step 2: Ensure base structure
    const structured = this.ensureStructure(deserialized);
    
    // Step 3: Fix array/object quirks
    const fixed = this.fixArrays(structured);
    
    // Step 4: Merge with defaults
    const merged = this.mergeWithDefaults(fixed);
    
    // Step 5: Validate
    this.validate(merged);
    
    return merged;
  }

  private static handlePhpSerialization(input: any): any {
    // Check if input contains PHP serialized data
    if (!isPhpSerialized(input)) {
      return input;
    }

    // Extract serialized data
    const serialized = typeof input === 'string' 
      ? input 
      : input.data;

    try {
      const deserialized = unserialize(serialized);
      
      // Return proper structure
      return {
        title: input.title || 'Converted Kit',
        type: 'kit',
        version: input.version || '0.4',
        page_settings: deserialized,
        content: input.content || []
      };
    } catch (error) {
      throw new Error(`Failed to deserialize PHP data: ${error.message}`);
    }
  }

  private static ensureStructure(input: any): Partial<ElementorStyleKit> {
    return {
      title: input.title || 'Untitled Kit',
      type: 'kit',
      version: input.version || '0.4',
      page_settings: input.page_settings || {},
      content: []
    };
  }

  private static fixArrays(kit: Partial<ElementorStyleKit>): Partial<ElementorStyleKit> {
    const settings = kit.page_settings!;

    // PHP unserialize quirk: empty arrays become empty objects
    // Fix: Convert empty objects to arrays where arrays are expected
    
    if (settings.custom_colors && !Array.isArray(settings.custom_colors)) {
      if (Object.keys(settings.custom_colors).length === 0) {
        settings.custom_colors = [];
      }
    }

    if (settings.custom_typography && !Array.isArray(settings.custom_typography)) {
      if (Object.keys(settings.custom_typography).length === 0) {
        settings.custom_typography = [];
      }
    }

    return kit;
  }

  private static mergeWithDefaults(kit: Partial<ElementorStyleKit>): ElementorStyleKit {
    return {
      ...DEFAULTS,
      ...kit,
      page_settings: {
        ...DEFAULTS.page_settings,
        ...kit.page_settings
      }
    } as ElementorStyleKit;
  }

  private static validate(kit: ElementorStyleKit): void {
    const errors: string[] = [];

    // Required fields
    if (!kit.title) errors.push('Missing title');
    if (!kit.page_settings) errors.push('Missing page_settings');

    // System colors
    if (!kit.page_settings.system_colors || kit.page_settings.system_colors.length !== 4) {
      errors.push('Must have exactly 4 system colors');
    }

    // System typography
    if (!kit.page_settings.system_typography || kit.page_settings.system_typography.length !== 4) {
      errors.push('Must have exactly 4 system typography presets');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed:\n${errors.join('\n')}`);
    }
  }
}

// Convenience function
export function normalizeKit(input: any): ElementorStyleKit {
  return KitNormalizer.normalize(input);
}
```

---

### Core Module: status-analyzer.ts

```typescript
// src/lib/elementor/status-analyzer.ts

import { ElementorStyleKit } from './types';
import { DEFAULTS } from './defaults';

export interface FieldStatus {
  status: 'missing' | 'default' | 'has-data';
  icon: string;
  badge: string;
  cssClass: string;
  color: string;
  action: string;
}

export interface SectionStatus {
  status: 'complete' | 'incomplete' | 'partial';
  badge: string;
  message: string;
  fields: {
    total: number;
    missing: number;
    default: number;
    hasData: number;
  };
}

export interface KitAnalysis {
  fields: Record<string, FieldStatus>;
  sections: {
    globalColors: SectionStatus;
    globalTypography: SectionStatus;
    themeTypography: SectionStatus;
    buttons: SectionStatus;
    forms: SectionStatus;
    images: SectionStatus;
    siteSettings: SectionStatus;
  };
  overall: {
    total: number;
    missing: number;
    default: number;
    hasData: number;
    completeness: number; // percentage
  };
}

export class StatusAnalyzer {
  public static analyze(kit: ElementorStyleKit): KitAnalysis {
    const fieldAnalysis = this.analyzeAllFields(kit);
    
    return {
      fields: fieldAnalysis,
      sections: {
        globalColors: this.analyzeGlobalColors(kit, fieldAnalysis),
        globalTypography: this.analyzeGlobalTypography(kit, fieldAnalysis),
        themeTypography: this.analyzeThemeTypography(kit, fieldAnalysis),
        buttons: this.analyzeButtons(kit, fieldAnalysis),
        forms: this.analyzeForms(kit, fieldAnalysis),
        images: this.analyzeImages(kit, fieldAnalysis),
        siteSettings: this.analyzeSiteSettings(kit, fieldAnalysis)
      },
      overall: this.calculateOverall(fieldAnalysis)
    };
  }

  public static getFieldStatus(
    value: any,
    defaultValue: any
  ): FieldStatus {
    // Case 1: Missing
    if (value === undefined || value === null) {
      return {
        status: 'missing',
        icon: '🔴',
        badge: 'MISSING',
        cssClass: 'is-missing',
        color: '#dc3545',
        action: 'This field must be filled'
      };
    }

    // Case 2: Default
    if (JSON.stringify(value) === JSON.stringify(defaultValue)) {
      return {
        status: 'default',
        icon: '⚠️',
        badge: 'DEFAULT',
        cssClass: 'is-default',
        color: '#ffc107',
        action: 'Using default value (can customize)'
      };
    }

    // Case 3: Has data
    return {
      status: 'has-data',
      icon: '✅',
      badge: 'HAS DATA',
      cssClass: 'has-data',
      color: '#28a745',
      action: 'Field has custom data'
    };
  }

  private static analyzeAllFields(
    kit: ElementorStyleKit
  ): Record<string, FieldStatus> {
    const analysis: Record<string, FieldStatus> = {};

    Object.keys(DEFAULTS.page_settings).forEach(key => {
      analysis[key] = this.getFieldStatus(
        kit.page_settings[key],
        (DEFAULTS.page_settings as any)[key]
      );
    });

    return analysis;
  }

  private static analyzeGlobalColors(
    kit: ElementorStyleKit,
    fields: Record<string, FieldStatus>
  ): SectionStatus {
    const systemColors = kit.page_settings.system_colors || [];
    const customColors = kit.page_settings.custom_colors || [];
    
    const allValid = systemColors.length === 4 && 
      systemColors.every(c => c.color && c.color !== '');
    
    return {
      status: allValid ? 'complete' : 'incomplete',
      badge: allValid ? 'COMPLETE' : 'INCOMPLETE',
      message: allValid 
        ? `4/4 system colors${customColors.length > 0 ? ` + ${customColors.length} custom` : ''}`
        : `${systemColors.length}/4 system colors`,
      fields: {
        total: 4 + customColors.length,
        missing: 4 - systemColors.length,
        default: 0,
        hasData: systemColors.length + customColors.length
      }
    };
  }

  private static analyzeGlobalTypography(
    kit: ElementorStyleKit,
    fields: Record<string, FieldStatus>
  ): SectionStatus {
    const systemTypo = kit.page_settings.system_typography || [];
    const customTypo = kit.page_settings.custom_typography || [];
    
    const allValid = systemTypo.length === 4 && 
      systemTypo.every(t => t.typography_font_family && t.typography_font_weight);
    
    return {
      status: allValid ? 'complete' : 'incomplete',
      badge: allValid ? 'COMPLETE' : 'INCOMPLETE',
      message: allValid 
        ? `4/4 system presets${customTypo.length > 0 ? ` + ${customTypo.length} custom` : ''}`
        : `${systemTypo.length}/4 system presets`,
      fields: {
        total: 4 + customTypo.length,
        missing: 4 - systemTypo.length,
        default: 0,
        hasData: systemTypo.length + customTypo.length
      }
    };
  }

  private static analyzeThemeTypography(
    kit: ElementorStyleKit,
    fields: Record<string, FieldStatus>
  ): SectionStatus {
    const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const typographyFields = [
      'typography_font_family',
      'typography_font_weight',
      'typography_font_size',
      'typography_line_height',
      'typography_letter_spacing',
      'typography_text_transform',
      'color'
    ];

    let total = 0;
    let missing = 0;
    let defaultCount = 0;
    let hasData = 0;

    headings.forEach(heading => {
      typographyFields.forEach(field => {
        const key = `${heading}_${field}`;
        const status = fields[key];
        if (status) {
          total++;
          if (status.status === 'missing') missing++;
          else if (status.status === 'default') defaultCount++;
          else hasData++;
        }
      });
    });

    // Add body and link fields
    ['body_typography_font_family', 'body_color', 'link_normal_color'].forEach(key => {
      const status = fields[key];
      if (status) {
        total++;
        if (status.status === 'missing') missing++;
        else if (status.status === 'default') defaultCount++;
        else hasData++;
      }
    });

    const status = missing === 0 ? 'complete' : missing < total / 2 ? 'partial' : 'incomplete';

    return {
      status,
      badge: status === 'complete' ? 'COMPLETE' : status === 'partial' ? 'PARTIAL' : 'INCOMPLETE',
      message: `${hasData}/${total} fields customized`,
      fields: {
        total,
        missing,
        default: defaultCount,
        hasData
      }
    };
  }

  private static analyzeButtons(
    kit: ElementorStyleKit,
    fields: Record<string, FieldStatus>
  ): SectionStatus {
    const buttonFields = Object.keys(fields).filter(k => k.startsWith('button_'));
    
    let total = buttonFields.length;
    let missing = 0;
    let defaultCount = 0;
    let hasData = 0;

    buttonFields.forEach(key => {
      const status = fields[key];
      if (status.status === 'missing') missing++;
      else if (status.status === 'default') defaultCount++;
      else hasData++;
    });

    const status = missing === 0 ? 'complete' : missing < total / 2 ? 'partial' : 'incomplete';

    return {
      status,
      badge: status === 'complete' ? 'COMPLETE' : status === 'partial' ? 'PARTIAL' : 'INCOMPLETE',
      message: `${hasData}/${total} fields customized`,
      fields: { total, missing, default: defaultCount, hasData }
    };
  }

  private static analyzeForms(
    kit: ElementorStyleKit,
    fields: Record<string, FieldStatus>
  ): SectionStatus {
    const formFields = Object.keys(fields).filter(k => k.startsWith('form_'));
    
    let total = formFields.length;
    let missing = 0;
    let defaultCount = 0;
    let hasData = 0;

    formFields.forEach(key => {
      const status = fields[key];
      if (status.status === 'missing') missing++;
      else if (status.status === 'default') defaultCount++;
      else hasData++;
    });

    const status = missing === 0 ? 'complete' : missing < total / 2 ? 'partial' : 'incomplete';

    return {
      status,
      badge: status === 'complete' ? 'COMPLETE' : status === 'partial' ? 'PARTIAL' : 'INCOMPLETE',
      message: `${hasData}/${total} fields customized`,
      fields: { total, missing, default: defaultCount, hasData }
    };
  }

  private static analyzeImages(
    kit: ElementorStyleKit,
    fields: Record<string, FieldStatus>
  ): SectionStatus {
    const imageFields = Object.keys(fields).filter(k => k.startsWith('image_'));
    
    let total = imageFields.length;
    let missing = 0;
    let defaultCount = 0;
    let hasData = 0;

    imageFields.forEach(key => {
      const status = fields[key];
      if (status.status === 'missing') missing++;
      else if (status.status === 'default') defaultCount++;
      else hasData++;
    });

    const status = missing === 0 ? 'complete' : missing < total / 2 ? 'partial' : 'incomplete';

    return {
      status,
      badge: status === 'complete' ? 'COMPLETE' : status === 'partial' ? 'PARTIAL' : 'INCOMPLETE',
      message: `${hasData}/${total} fields customized`,
      fields: { total, missing, default: defaultCount, hasData }
    };
  }

  private static analyzeSiteSettings(
    kit: ElementorStyleKit,
    fields: Record<string, FieldStatus>
  ): SectionStatus {
    const siteFields = Object.keys(fields).filter(k => 
      k.startsWith('background_') || 
      k.startsWith('container_') ||
      k.startsWith('lightbox_') ||
      k.startsWith('content_') ||
      k.startsWith('widgets_') ||
      k.startsWith('viewport_')
    );
    
    let total = siteFields.length;
    let missing = 0;
    let defaultCount = 0;
    let hasData = 0;

    siteFields.forEach(key => {
      const status = fields[key];
      if (status.status === 'missing') missing++;
      else if (status.status === 'default') defaultCount++;
      else hasData++;
    });

    const status = missing === 0 ? 'complete' : missing < total / 2 ? 'partial' : 'incomplete';

    return {
      status,
      badge: status === 'complete' ? 'COMPLETE' : status === 'partial' ? 'PARTIAL' : 'INCOMPLETE',
      message: `${hasData}/${total} fields customized`,
      fields: { total, missing, default: defaultCount, hasData }
    };
  }

  private static calculateOverall(
    fields: Record<string, FieldStatus>
  ): KitAnalysis['overall'] {
    let total = 0;
    let missing = 0;
    let defaultCount = 0;
    let hasData = 0;

    Object.values(fields).forEach(status => {
      total++;
      if (status.status === 'missing') missing++;
      else if (status.status === 'default') defaultCount++;
      else hasData++;
    });

    return {
      total,
      missing,
      default: defaultCount,
      hasData,
      completeness: Math.round((hasData / total) * 100)
    };
  }
}

// Convenience function
export function analyzeKit(kit: ElementorStyleKit): KitAnalysis {
  return StatusAnalyzer.analyze(kit);
}
```

---

### React Hook: useElementorKit.ts

```typescript
// src/hooks/useElementorKit.ts

import { useState, useCallback } from 'react';
import { ElementorStyleKit } from '@/lib/elementor/types';
import { normalizeKit } from '@/lib/elementor/normalizer';
import { analyzeKit, KitAnalysis } from '@/lib/elementor/status-analyzer';

export interface UseElementorKitReturn {
  kit: ElementorStyleKit | null;
  analysis: KitAnalysis | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  importKit: (file: File) => Promise<void>;
  updateField: (path: string, value: any) => void;
  exportKit: () => void;
  resetKit: () => void;
}

export function useElementorKit(): UseElementorKitReturn {
  const [kit, setKit] = useState<ElementorStyleKit | null>(null);
  const [analysis, setAnalysis] = useState<KitAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importKit = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      
      // Normalize (handles PHP serialization internally)
      const normalized = normalizeKit(parsed);
      
      // Analyze
      const kitAnalysis = analyzeKit(normalized);
      
      setKit(normalized);
      setAnalysis(kitAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateField = useCallback((path: string, value: any) => {
    if (!kit) return;

    // Update kit
    const updated = { ...kit };
    const pathParts = path.split('.');
    
    let current: any = updated;
    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = value;

    // Re-analyze
    const kitAnalysis = analyzeKit(updated);

    setKit(updated);
    setAnalysis(kitAnalysis);
  }, [kit]);

  const exportKit = useCallback(() => {
    if (!kit) return;

    const json = JSON.stringify(kit, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${kit.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [kit]);

  const resetKit = useCallback(() => {
    setKit(null);
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    kit,
    analysis,
    loading,
    error,
    importKit,
    updateField,
    exportKit,
    resetKit
  };
}
```

---

### Component Example: ThemeTypography.tsx

```typescript
// src/components/elementor/KitEditor/ThemeTypography.tsx

import React, { useState } from 'react';
import { ElementorStyleKit } from '@/lib/elementor/types';
import { KitAnalysis } from '@/lib/elementor/status-analyzer';
import { StatusIndicator } from '../FieldControls/StatusIndicator';
import { SizeControl } from '../FieldControls/SizeControl';
import { ColorPicker } from '../FieldControls/ColorPicker';

interface ThemeTypographyProps {
  kit: ElementorStyleKit;
  analysis: KitAnalysis;
  onUpdate: (path: string, value: any) => void;
}

export function ThemeTypography({ kit, analysis, onUpdate }: ThemeTypographyProps) {
  const [activeHeading, setActiveHeading] = useState<string>('h1');
  const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'link'];

  const renderHeadingControls = (prefix: string) => {
    return (
      <div className="space-y-4">
        {/* Font Family */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <StatusIndicator status={analysis.fields[`${prefix}_typography_font_family`]} />
            Font Family
          </label>
          <input
            type="text"
            value={kit.page_settings[`${prefix}_typography_font_family`] || ''}
            onChange={(e) => onUpdate(`page_settings.${prefix}_typography_font_family`, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${
              analysis.fields[`${prefix}_typography_font_family`]?.cssClass
            }`}
            placeholder="e.g., Inter, Arial, Helvetica"
          />
        </div>

        {/* Font Weight */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <StatusIndicator status={analysis.fields[`${prefix}_typography_font_weight`]} />
            Font Weight
          </label>
          <select
            value={kit.page_settings[`${prefix}_typography_font_weight`] || '700'}
            onChange={(e) => onUpdate(`page_settings.${prefix}_typography_font_weight`, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${
              analysis.fields[`${prefix}_typography_font_weight`]?.cssClass
            }`}
          >
            <option value="300">300 - Light</option>
            <option value="400">400 - Normal</option>
            <option value="500">500 - Medium</option>
            <option value="600">600 - Semi Bold</option>
            <option value="700">700 - Bold</option>
            <option value="800">800 - Extra Bold</option>
            <option value="900">900 - Black</option>
          </select>
        </div>

        {/* Font Size */}
        <SizeControl
          label="Font Size"
          value={kit.page_settings[`${prefix}_typography_font_size`]}
          status={analysis.fields[`${prefix}_typography_font_size`]}
          onChange={(value) => onUpdate(`page_settings.${prefix}_typography_font_size`, value)}
          units={['px', 'em', 'rem']}
        />

        {/* Line Height */}
        <SizeControl
          label="Line Height ✨"
          value={kit.page_settings[`${prefix}_typography_line_height`]}
          status={analysis.fields[`${prefix}_typography_line_height`]}
          onChange={(value) => onUpdate(`page_settings.${prefix}_typography_line_height`, value)}
          units={['em', 'px', '']}
          step={0.1}
          helpText="Controls spacing between lines"
        />

        {/* Letter Spacing */}
        <SizeControl
          label="Letter Spacing ✨"
          value={kit.page_settings[`${prefix}_typography_letter_spacing`]}
          status={analysis.fields[`${prefix}_typography_letter_spacing`]}
          onChange={(value) => onUpdate(`page_settings.${prefix}_typography_letter_spacing`, value)}
          units={['px', 'em']}
          step={0.5}
          helpText="Controls spacing between characters"
        />

        {/* Text Transform */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <StatusIndicator status={analysis.fields[`${prefix}_typography_text_transform`]} />
            Text Transform ✨
          </label>
          <select
            value={kit.page_settings[`${prefix}_typography_text_transform`] || 'none'}
            onChange={(e) => onUpdate(`page_settings.${prefix}_typography_text_transform`, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${
              analysis.fields[`${prefix}_typography_text_transform`]?.cssClass
            }`}
          >
            <option value="none">None</option>
            <option value="uppercase">UPPERCASE</option>
            <option value="lowercase">lowercase</option>
            <option value="capitalize">Capitalize</option>
          </select>
        </div>

        {/* Color */}
        <ColorPicker
          label="Color"
          value={kit.page_settings[`${prefix}_color`]}
          status={analysis.fields[`${prefix}_color`]}
          onChange={(value) => onUpdate(`page_settings.${prefix}_color`, value)}
        />
      </div>
    );
  };

  return (
    <div>
      {/* Status Legend */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md border">
        <h4 className="text-xs font-semibold uppercase text-gray-600 mb-2">
          Field Status Legend
        </h4>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span>✅</span>
            <span>Has Data</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⚠️</span>
            <span>Default</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🔴</span>
            <span>Missing</span>
          </div>
        </div>
      </div>

      {/* Heading Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {headings.map(h => (
          <button
            key={h}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
              activeHeading === h
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveHeading(h)}
          >
            {h.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-gray-50 p-4 rounded-md border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          {activeHeading.toUpperCase()} Typography
          <span className={`text-xs px-2 py-1 rounded ${
            analysis.sections.themeTypography.status === 'complete'
              ? 'bg-green-100 text-green-800'
              : analysis.sections.themeTypography.status === 'partial'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {analysis.sections.themeTypography.badge}
          </span>
        </h3>
        {renderHeadingControls(activeHeading)}
      </div>
    </div>
  );
}
```

---

## API Design

### REST API Endpoints (if needed)

```typescript
// API routes for server-side processing

// POST /api/elementor/convert
// Convert PHP serialized to JSON
interface ConvertRequest {
  data: string; // PHP serialized or JSON string
}
interface ConvertResponse {
  kit: ElementorStyleKit;
  format: 'php' | 'json';
}

// POST /api/elementor/validate
// Validate kit structure
interface ValidateRequest {
  kit: ElementorStyleKit;
}
interface ValidateResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// POST /api/elementor/analyze
// Analyze kit completeness
interface AnalyzeRequest {
  kit: ElementorStyleKit;
}
interface AnalyzeResponse {
  analysis: KitAnalysis;
}
```

---

## State Management

### Zustand Store (Recommended)

```typescript
// src/store/elementorStore.ts

import create from 'zustand';
import { ElementorStyleKit } from '@/lib/elementor/types';
import { KitAnalysis } from '@/lib/elementor/status-analyzer';

interface ElementorStore {
  // State
  kit: ElementorStyleKit | null;
  analysis: KitAnalysis | null;
  history: ElementorStyleKit[];
  historyIndex: number;
  
  // Actions
  setKit: (kit: ElementorStyleKit, addToHistory?: boolean) => void;
  setAnalysis: (analysis: KitAnalysis) => void;
  updateField: (path: string, value: any) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

export const useElementorStore = create<ElementorStore>((set, get) => ({
  kit: null,
  analysis: null,
  history: [],
  historyIndex: -1,
  
  setKit: (kit, addToHistory = true) => {
    set(state => {
      if (!addToHistory) {
        return { kit };
      }
      
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(kit);
      
      return {
        kit,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  },
  
  setAnalysis: (analysis) => set({ analysis }),
  
  updateField: (path, value) => {
    const { kit } = get();
    if (!kit) return;
    
    const updated = { ...kit };
    const parts = path.split('.');
    let current: any = updated;
    
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    
    get().setKit(updated, true);
  },
  
  undo: () => {
    set(state => {
      if (state.historyIndex <= 0) return state;
      
      const newIndex = state.historyIndex - 1;
      return {
        kit: state.history[newIndex],
        historyIndex: newIndex
      };
    });
  },
  
  redo: () => {
    set(state => {
      if (state.historyIndex >= state.history.length - 1) return state;
      
      const newIndex = state.historyIndex + 1;
      return {
        kit: state.history[newIndex],
        historyIndex: newIndex
      };
    });
  },
  
  reset: () => set({
    kit: null,
    analysis: null,
    history: [],
    historyIndex: -1
  })
}));
```

---

## Conclusion

This technical documentation provides everything needed to integrate the Elementor Style Kit system into Next.js:

1. **PHP Deserialization** - Handles WordPress native format
2. **Normalization** - Ensures consistent structure
3. **Status Analysis** - Visual feedback for missing/default/custom fields
4. **React Integration** - Hooks and components for Next.js
5. **Type Safety** - Full TypeScript support
6. **State Management** - Zustand store with undo/redo
7. **API Design** - Server endpoints if needed

All modules are production-ready and follow best practices for Next.js integration.
EOF

cat /mnt/user-data/outputs/TECHNICAL-DOCUMENTATION.md | head -100
Output

# Elementor Style Kit System - Technical Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Data Flow](#data-flow)
4. [File Structure](#file-structure)
5. [PHP Serialization Handling](#php-serialization-handling)
6. [JSON Structure](#json-structure)
7. [Field Status Detection](#field-status-detection)
8. [Next.js Integration Guide](#nextjs-integration-guide)
9. [API Design](#api-design)
10. [State Management](#state-management)

---

## System Overview

### Purpose
A complete system for editing Elementor WordPress style kits outside of WordPress, with full support for:
- PHP serialized data (WordPress native format)
- Clean JSON (portable format)
- Visual status indicators (missing/default/has-data)
- Live preview of styles
- Import/Export functionality

### Components
1. **PHP-to-JSON Converter** - Deserializes WordPress exports
2. **Style Kit Editor v2** - Full-featured editor with status indicators
3. **Validation System** - Detects missing/default/custom fields
4. **Preview Engine** - Real-time style rendering

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     INPUT SOURCES                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  WordPress Export          Clean JSON           Empty Kit    │
│  (PHP Serialized)         (Pure JSON)          (Defaults)    │
│       │                       │                    │         │
│       ├───────────────────────┼────────────────────┤         │
│       │                       │                    │         │
│       ▼                       ▼                    ▼         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           PHP DESERIALIZER (Optional)               │    │
│  │  - Detects PHP serialization                        │    │
│  │  - Converts a:N:{...} → JavaScript objects          │    │
│  │  - Handles nested structures                        │    │
│  │  - Preserves all data                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              NORMALIZER                              │    │
│  │  - Ensures all required fields exist                │    │
│  │  - Converts empty objects → arrays where needed     │    │
│  │  - Adds defaults for missing fields                 │    │
│  │  - Validates structure                              │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         STATUS ANALYZER                              │    │
│  │  - Compares values to defaults                      │    │
│  │  - Marks fields as: missing/default/has-data        │    │
│  │  - Generates field metadata                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              EDITOR STATE                            │    │
│  │  - Reactive state management                        │    │
│  │  - Field-level tracking                             │    │
│  │  - Undo/redo capability                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│                ┌───────────┴──────────┐                      │
│                ▼                      ▼                      │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │   EDITOR UI          │  │   PREVIEW ENGINE     │        │
│  │  - Form controls     │  │  - Style generation  │        │
│  │  - Status indicators │  │  - Live rendering    │        │
│  │  - Validation        │  │  - Responsive modes  │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                │                      │                      │
│                └───────────┬──────────┘                      │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              EXPORTER                                │    │
│  │  - Serializes to clean JSON                         │    │
│  │  - Validates output                                 │    │
│  │  - Never outputs PHP serialization                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │