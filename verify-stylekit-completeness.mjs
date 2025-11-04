import fs from 'fs';

console.log('🔍 Verifying Style Kit Completeness\n');

// Read both files
const template = JSON.parse(fs.readFileSync('src/lib/default-stylekit-template.json', 'utf8'));
const generated = JSON.parse(fs.readFileSync('generated-stylekit-test.json', 'utf8'));

// Function to get all scalar paths
function getPaths(obj, prefix = '') {
  const paths = [];
  for (const key in obj) {
    const val = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;

    if (val && typeof val === 'object' && !Array.isArray(val)) {
      paths.push(...getPaths(val, path));
    } else if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (item && typeof item === 'object') {
          paths.push(...getPaths(item, `${path}.${i}`));
        } else {
          paths.push(`${path}.${i}`);
        }
      });
    } else {
      paths.push(path);
    }
  }
  return paths;
}

const templatePaths = new Set(getPaths(template));
const generatedPaths = new Set(getPaths(generated));

const missing = [...templatePaths].filter(p => !generatedPaths.has(p));
const extra = [...generatedPaths].filter(p => !templatePaths.has(p));

console.log('📊 Statistics:');
console.log(`   Template fields: ${templatePaths.size}`);
console.log(`   Generated fields: ${generatedPaths.size}`);
console.log(`   Missing fields: ${missing.length}`);
console.log(`   Extra fields: ${extra.length}`);

if (missing.length > 0) {
  console.log('\n❌ Missing Required Fields:');
  missing.slice(0, 20).forEach(p => console.log(`   - ${p}`));
  if (missing.length > 20) console.log(`   ... and ${missing.length - 20} more`);
} else {
  console.log('\n✅ All required template fields are present!');
}

if (extra.length > 0) {
  console.log('\n✨ Bonus Fields Added by AI:');
  extra.slice(0, 30).forEach(p => console.log(`   + ${p}`));
  if (extra.length > 30) console.log(`   ... and ${extra.length - 30} more`);
}

// Verify critical structures
console.log('\n🔍 Critical Structure Verification:');

const checks = [
  {
    name: 'System Colors',
    test: () => generated.system_colors?.length === 4 &&
      generated.system_colors.every(c => c._id && c.title && c.color)
  },
  {
    name: 'System Typography Complete',
    test: () => generated.system_typography?.length === 4 &&
      generated.system_typography.every(t =>
        t._id && t.title && t.typography_typography && t.typography_font_family &&
        t.typography_font_size && t.typography_font_weight &&
        t.typography_line_height && t.typography_letter_spacing
      )
  },
  {
    name: 'H1-H6 Typography',
    test: () => ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].every(h =>
      generated[`${h}_typography`]?.typography_typography &&
      generated[`${h}_typography`]?.typography_font_family &&
      generated[`${h}_typography`]?.typography_font_size &&
      generated[`${h}_typography`]?.typography_font_weight
    )
  },
  {
    name: 'Button Styles Complete',
    test: () => generated.button_typography &&
      generated.button_background_color &&
      generated.button_text_color &&
      generated.button_border_radius &&
      generated.button_border_width
  },
  {
    name: 'Form Field Styles Complete',
    test: () => generated.form_field_typography &&
      generated.form_field_text_color &&
      generated.form_field_background_color &&
      generated.form_field_border_color &&
      generated.form_field_border_radius
  }
];

checks.forEach(check => {
  const result = check.test();
  console.log(`   ${result ? '✅' : '❌'} ${check.name}`);
});

console.log('\n' + (missing.length === 0 ? '✅ VERIFICATION PASSED' : '❌ VERIFICATION FAILED'));
