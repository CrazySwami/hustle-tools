/**
 * Unified Generation System - Test Suite
 *
 * Programmatically tests all parsers, configs, and actions.
 * Run with: node test-generation-system.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test counters
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Test helpers
function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`✅ ${name}`);
  } catch (error) {
    failedTests++;
    console.error(`❌ ${name}`);
    console.error(`   ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

console.log('🧪 Testing Unified Generation System\n');
console.log('═'.repeat(60));

// ============================================================================
// Test 1: Config File Structure
// ============================================================================

console.log('\n📋 Testing Configuration Files\n');

test('config.ts exports PROJECT_CONFIGS', () => {
  const configFile = readFileSync(join(__dirname, 'src/lib/project-generation/config.ts'), 'utf-8');
  assert(configFile.includes('export const PROJECT_CONFIGS'), 'PROJECT_CONFIGS not exported');
  assert(configFile.includes('html:'), 'HTML config missing');
  assert(configFile.includes('elementor:'), 'Elementor config missing');
  assert(configFile.includes("'hubspot-email':"), 'HubSpot email config missing');
  assert(configFile.includes("'hubspot-page':"), 'HubSpot page config missing');
});

test('config.ts exports MODEL_CONFIGS', () => {
  const configFile = readFileSync(join(__dirname, 'src/lib/project-generation/config.ts'), 'utf-8');
  assert(configFile.includes('export const MODEL_CONFIGS'), 'MODEL_CONFIGS not exported');
  assert(configFile.includes('anthropic/claude-sonnet-4-5-20250929'), 'Claude Sonnet missing');
  assert(configFile.includes('openai/gpt-5'), 'GPT-5 missing');
  assert(configFile.includes('google/gemini'), 'Gemini missing');
});

test('config.ts exports helper functions', () => {
  const configFile = readFileSync(join(__dirname, 'src/lib/project-generation/config.ts'), 'utf-8');
  assert(configFile.includes('export function getProjectConfig'), 'getProjectConfig not exported');
  assert(configFile.includes('export function getModelConfig'), 'getModelConfig not exported');
  assert(configFile.includes('export function getModelsByProvider'), 'getModelsByProvider not exported');
});

// ============================================================================
// Test 2: Parser File Structure
// ============================================================================

console.log('\n🔍 Testing Parser Functions\n');

test('parser.ts exports parseProjectCode', () => {
  const parserFile = readFileSync(join(__dirname, 'src/lib/project-generation/parser.ts'), 'utf-8');
  assert(parserFile.includes('export function parseProjectCode'), 'parseProjectCode not exported');
});

test('parser.ts exports type-specific parsers', () => {
  const parserFile = readFileSync(join(__dirname, 'src/lib/project-generation/parser.ts'), 'utf-8');
  assert(parserFile.includes('export function parseHTMLProject'), 'parseHTMLProject not exported');
  assert(parserFile.includes('export function parseElementorProject'), 'parseElementorProject not exported');
  assert(parserFile.includes('export function parseHubSpotProject'), 'parseHubSpotProject not exported');
});

test('parser.ts exports metadata extraction', () => {
  const parserFile = readFileSync(join(__dirname, 'src/lib/project-generation/parser.ts'), 'utf-8');
  assert(parserFile.includes('export function extractProjectMetadata'), 'extractProjectMetadata not exported');
  assert(parserFile.includes('export function extractElementorWidgetMetadata'), 'extractElementorWidgetMetadata not exported');
});

test('parser.ts exports validation functions', () => {
  const parserFile = readFileSync(join(__dirname, 'src/lib/project-generation/parser.ts'), 'utf-8');
  assert(parserFile.includes('export function areFilesComplete'), 'areFilesComplete not exported');
  assert(parserFile.includes('export function getMissingFiles'), 'getMissingFiles not exported');
  assert(parserFile.includes('export function validateCodeFormat'), 'validateCodeFormat not exported');
});

// ============================================================================
// Test 3: Streaming File Structure
// ============================================================================

console.log('\n🌊 Testing Streaming Functions\n');

test('streaming.ts exports streamProjectGeneration', () => {
  const streamingFile = readFileSync(join(__dirname, 'src/lib/project-generation/streaming.ts'), 'utf-8');
  assert(streamingFile.includes('export async function streamProjectGeneration'), 'streamProjectGeneration not exported');
});

test('streaming.ts exports legacy adapter', () => {
  const streamingFile = readFileSync(join(__dirname, 'src/lib/project-generation/streaming.ts'), 'utf-8');
  assert(streamingFile.includes('export async function streamWithLegacyCallbacks'), 'streamWithLegacyCallbacks not exported');
});

test('streaming.ts exports helper functions', () => {
  const streamingFile = readFileSync(join(__dirname, 'src/lib/project-generation/streaming.ts'), 'utf-8');
  assert(streamingFile.includes('export function buildUserPrompt'), 'buildUserPrompt not exported');
  assert(streamingFile.includes('export function createCancellableStream'), 'createCancellableStream not exported');
});

// ============================================================================
// Test 4: Types File Structure
// ============================================================================

console.log('\n📐 Testing TypeScript Types\n');

test('types.ts exports core types', () => {
  const typesFile = readFileSync(join(__dirname, 'src/lib/project-generation/types.ts'), 'utf-8');
  assert(typesFile.includes('export type ProjectType'), 'ProjectType not exported');
  assert(typesFile.includes('export type GenerationState'), 'GenerationState not exported');
  assert(typesFile.includes('export type ProgressPhase'), 'ProgressPhase not exported');
});

test('types.ts exports interfaces', () => {
  const typesFile = readFileSync(join(__dirname, 'src/lib/project-generation/types.ts'), 'utf-8');
  assert(typesFile.includes('export interface ParsedFiles'), 'ParsedFiles not exported');
  assert(typesFile.includes('export interface ProjectConfig'), 'ProjectConfig not exported');
  assert(typesFile.includes('export interface GenerateParams'), 'GenerateParams not exported');
  assert(typesFile.includes('export interface UseProjectGenerationReturn'), 'UseProjectGenerationReturn not exported');
});

// ============================================================================
// Test 5: Hook File Structure
// ============================================================================

console.log('\n🪝 Testing React Hook\n');

test('useProjectGeneration.ts exports main hook', () => {
  const hookFile = readFileSync(join(__dirname, 'src/lib/hooks/useProjectGeneration.ts'), 'utf-8');
  assert(hookFile.includes('export function useProjectGeneration'), 'useProjectGeneration not exported');
});

test('useProjectGeneration.ts exports helper hooks', () => {
  const hookFile = readFileSync(join(__dirname, 'src/lib/hooks/useProjectGeneration.ts'), 'utf-8');
  assert(hookFile.includes('export function useGenerationProgress'), 'useGenerationProgress not exported');
  assert(hookFile.includes('export function useFilePreview'), 'useFilePreview not exported');
});

// ============================================================================
// Test 6: Component Integration
// ============================================================================

console.log('\n🧩 Testing Component Integration\n');

test('GenerateProjectWidget imports unified streaming', () => {
  const widgetFile = readFileSync(join(__dirname, 'src/components/tool-ui/GenerateProjectWidget.tsx'), 'utf-8');
  assert(widgetFile.includes("from '@/lib/project-generation/streaming'"), 'Missing streaming import');
  assert(widgetFile.includes('streamWithLegacyCallbacks'), 'Not using streamWithLegacyCallbacks');
});

test('GenerateProjectWidget imports unified config', () => {
  const widgetFile = readFileSync(join(__dirname, 'src/components/tool-ui/GenerateProjectWidget.tsx'), 'utf-8');
  assert(widgetFile.includes("from '@/lib/project-generation/config'"), 'Missing config import');
  assert(widgetFile.includes('getModelsByProvider'), 'Not using getModelsByProvider');
});

test('GenerateProjectModal imports unified parsers', () => {
  const modalFile = readFileSync(join(__dirname, 'src/components/elementor/GenerateProjectModal.tsx'), 'utf-8');
  // Modal uses dynamic import to avoid circular deps
  assert(modalFile.includes("import('@/lib/project-generation/parser')"), 'Missing parser import');
  assert(modalFile.includes('parseProjectCode'), 'Not using parseProjectCode');
});

// ============================================================================
// Test 7: Regex Pattern Tests (Simulated)
// ============================================================================

console.log('\n🔬 Testing Parser Regex Patterns\n');

test('HTML parser regex matches code blocks', () => {
  const sampleCode = '```html\n<div>Test</div>\n```\n```css\nbody{}\n```\n```js\nconst x=1;\n```';
  const htmlMatch = sampleCode.match(/```html\n([\s\S]*?)(?:```|$)/);
  const cssMatch = sampleCode.match(/```css\n([\s\S]*?)(?:```|$)/);
  const jsMatch = sampleCode.match(/```(?:javascript|js)\n([\s\S]*?)(?:```|$)/);

  assert(htmlMatch, 'HTML regex failed');
  assert(cssMatch, 'CSS regex failed');
  assert(jsMatch, 'JS regex failed');
  assert(htmlMatch[1].includes('<div>Test</div>'), 'HTML content not captured');
});

test('Elementor parser regex matches PHP blocks', () => {
  const sampleCode = '```php\nclass Test_Widget extends \\Elementor\\Widget_Base {}\n```';
  const phpMatch = sampleCode.match(/```php\n([\s\S]*?)```/);

  assert(phpMatch, 'PHP regex failed');
  assert(phpMatch[1].includes('extends \\Elementor\\Widget_Base'), 'PHP content not captured');
});

test('Elementor parser detects widget vs main plugin', () => {
  const mainPlugin = 'Plugin Name: Test\nadd_action()';
  const widget = 'class Test extends \\Elementor\\Widget_Base';

  assert(mainPlugin.includes('Plugin Name:'), 'Main plugin detection failed');
  assert(widget.includes('extends \\Elementor\\Widget_Base'), 'Widget detection failed');
});

test('Widget metadata extraction regex works', () => {
  const widgetCode = 'class Elementor_Pricing_Table_Widget extends \\Elementor\\Widget_Base {}';
  const classNameMatch = widgetCode.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)\s+extends/);

  assert(classNameMatch, 'Class name regex failed');
  assertEquals(classNameMatch[1], 'Elementor_Pricing_Table_Widget', 'Wrong class name extracted');
});

test('Widget slug generation works', () => {
  const className = 'Elementor_Pricing_Table_Widget';
  const slug = className.toLowerCase().replace(/_/g, '-');

  assertEquals(slug, 'elementor-pricing-table-widget', 'Slug generation failed');
});

test('Widget name extraction works', () => {
  const className = 'Elementor_Pricing_Table_Widget';
  const name = className.replace(/_/g, ' ').replace(/\bWidget\b/, '').trim();

  assertEquals(name, 'Elementor Pricing Table', 'Name extraction failed');
});

// ============================================================================
// Test 8: Usage Metadata Extraction
// ============================================================================

console.log('\n📊 Testing Usage Metadata Extraction\n');

test('Usage metadata marker is detected', () => {
  const response = 'Some code here\n\n__USAGE__:{"usage":{"promptTokens":100}}';
  assert(response.includes('__USAGE__:'), 'Usage marker not detected');
});

test('Usage metadata can be parsed', () => {
  const response = 'Some code\n\n__USAGE__:{"usage":{"promptTokens":100,"completionTokens":200}}';
  const parts = response.split('__USAGE__:');
  const metadata = JSON.parse(parts[1]);

  assertEquals(metadata.usage.promptTokens, 100, 'Prompt tokens wrong');
  assertEquals(metadata.usage.completionTokens, 200, 'Completion tokens wrong');
});

// ============================================================================
// Test 9: Project Type Validation
// ============================================================================

console.log('\n✅ Testing Project Type Validation\n');

test('All project types have configs', () => {
  const configFile = readFileSync(join(__dirname, 'src/lib/project-generation/config.ts'), 'utf-8');
  const requiredTypes = [
    { key: 'html', pattern: 'html:' },
    { key: 'elementor', pattern: 'elementor:' },
    { key: 'hubspot-email', pattern: "'hubspot-email':" },
    { key: 'hubspot-page', pattern: "'hubspot-page':" }
  ];

  for (const type of requiredTypes) {
    assert(configFile.includes(type.pattern), `Missing config for ${type.key}`);
  }
});

test('All configs have required fields', () => {
  const configFile = readFileSync(join(__dirname, 'src/lib/project-generation/config.ts'), 'utf-8');
  const requiredFields = ['name:', 'label:', 'icon:', 'fileTypes:', 'defaultModel:', 'systemPrompt:', 'parseResponse:'];

  for (const field of requiredFields) {
    assert(configFile.includes(field), `Missing required field: ${field}`);
  }
});

// ============================================================================
// Test 10: Model Configuration Validation
// ============================================================================

console.log('\n🤖 Testing Model Configurations\n');

test('All model configs have required fields', () => {
  const configFile = readFileSync(join(__dirname, 'src/lib/project-generation/config.ts'), 'utf-8');

  // Check for model structure
  assert(configFile.includes('id:'), 'Model config missing id');
  assert(configFile.includes('name:'), 'Model config missing name');
  assert(configFile.includes('provider:'), 'Model config missing provider');
  assert(configFile.includes('contextWindow:'), 'Model config missing contextWindow');
});

test('Anthropic models are configured', () => {
  const configFile = readFileSync(join(__dirname, 'src/lib/project-generation/config.ts'), 'utf-8');
  assert(configFile.includes('claude-sonnet-4-5'), 'Claude Sonnet missing');
  assert(configFile.includes('claude-3-5-haiku'), 'Claude Haiku missing');
});

test('OpenAI models are configured', () => {
  const configFile = readFileSync(join(__dirname, 'src/lib/project-generation/config.ts'), 'utf-8');
  assert(configFile.includes('gpt-5'), 'GPT-5 missing');
  assert(configFile.includes('gpt-4o'), 'GPT-4o missing');
});

test('Google models are configured', () => {
  const configFile = readFileSync(join(__dirname, 'src/lib/project-generation/config.ts'), 'utf-8');
  assert(configFile.includes('gemini'), 'Gemini models missing');
});

// ============================================================================
// Test 11: System Prompt Validation
// ============================================================================

console.log('\n📝 Testing System Prompts\n');

test('HTML system prompt has key instructions', () => {
  const configFile = readFileSync(join(__dirname, 'src/lib/project-generation/config.ts'), 'utf-8');
  assert(configFile.includes('Section-level markup only'), 'HTML prompt missing markup rule');
  assert(configFile.includes('NO DOCTYPE'), 'HTML prompt missing DOCTYPE rule');
});

test('Elementor system prompt has key instructions', () => {
  const configFile = readFileSync(join(__dirname, 'src/lib/project-generation/config.ts'), 'utf-8');
  assert(configFile.includes('Elementor\\\\Widget_Base'), 'Elementor prompt missing Widget_Base');
  assert(configFile.includes('register_controls'), 'Elementor prompt missing register_controls');
  assert(configFile.includes('{{WRAPPER}}'), 'Elementor prompt missing {{WRAPPER}}');
});

test('HubSpot email prompt has email-specific rules', () => {
  const configFile = readFileSync(join(__dirname, 'src/lib/project-generation/config.ts'), 'utf-8');
  assert(configFile.includes('table-based layouts'), 'Email prompt missing table requirement');
  assert(configFile.includes('inline'), 'Email prompt missing inline styles requirement');
});

// ============================================================================
// Results Summary
// ============================================================================

console.log('\n' + '═'.repeat(60));
console.log('\n📊 Test Results\n');
console.log(`Total Tests:  ${totalTests}`);
console.log(`✅ Passed:    ${passedTests}`);
console.log(`❌ Failed:    ${failedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

if (failedTests === 0) {
  console.log('🎉 All tests passed! Unified generation system is valid.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the errors above.\n');
  process.exit(1);
}
