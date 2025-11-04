#!/usr/bin/env node

/**
 * Test script for multi-stage Style Kit generation
 * Tests all 4 stages and validates the final JSON structure
 */

import fs from 'fs';

const API_URL = 'http://localhost:3002/api/generate-stylekit';

// Test data
const testConfig = {
  model: 'gpt-5',
  brandfetchData: {
    colors: ['#0066CC', '#FF6B35', '#F7F7F7', '#333333'],
    fonts: ['Inter', 'Roboto'],
  },
  stylePreferences: 'Modern, professional, tech-focused design for a SaaS company',
  industry: 'Technology',
};

console.log('🧪 Testing Multi-Stage Style Kit Generation\n');
console.log('Test Configuration:');
console.log(JSON.stringify(testConfig, null, 2));
console.log('\n' + '='.repeat(60) + '\n');

// Expected field structure
const expectedFields = {
  // Top-level
  title: 'string',

  // Colors
  system_colors: 'array',
  custom_colors: 'array',

  // Typography
  system_typography: 'array',
  custom_typography: 'array',

  // Headings (h1-h6)
  h1_typography: 'object',
  h2_typography: 'object',
  h3_typography: 'object',
  h4_typography: 'object',
  h5_typography: 'object',
  h6_typography: 'object',

  // Body & Links
  body_typography: 'object',
  body_color: 'string',
  link_normal_color: 'string',

  // Buttons
  button_typography: 'object',
  button_background_color: 'string',
  button_text_color: 'string',
  button_border_width: 'object',
  button_border_radius: 'object',

  // Forms
  form_field_typography: 'object',
  form_field_text_color: 'string',
  form_field_background_color: 'string',
  form_field_border_color: 'string',
  form_field_border_width: 'object',
  form_field_border_radius: 'object',

  // Layout
  container_width: 'object',
  space_between_widgets: 'object',
  viewport_md: 'number',
  viewport_lg: 'number',
};

async function testGeneration() {
  try {
    console.log('📡 Sending request to API...\n');

    const startTime = Date.now();

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testConfig),
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.error || response.statusText}`);
    }

    console.log(`✅ Response received in ${duration}s\n`);

    const styleKit = await response.json();

    // Validate structure
    console.log('🔍 Validating JSON structure...\n');

    let missingFields = [];
    let wrongTypeFields = [];
    let presentFields = 0;

    for (const [field, expectedType] of Object.entries(expectedFields)) {
      if (!(field in styleKit)) {
        missingFields.push(field);
      } else {
        presentFields++;
        const actualType = Array.isArray(styleKit[field]) ? 'array' : typeof styleKit[field];
        if (actualType !== expectedType) {
          wrongTypeFields.push(`${field} (expected ${expectedType}, got ${actualType})`);
        }
      }
    }

    // Count total fields
    const totalFields = countFields(styleKit);

    console.log(`📊 Field Statistics:`);
    console.log(`   Total fields in response: ${totalFields}`);
    console.log(`   Expected critical fields: ${Object.keys(expectedFields).length}`);
    console.log(`   Critical fields present: ${presentFields}`);
    console.log(`   Missing fields: ${missingFields.length}`);
    console.log(`   Wrong type fields: ${wrongTypeFields.length}\n`);

    if (missingFields.length > 0) {
      console.log('❌ Missing Fields:');
      missingFields.forEach(f => console.log(`   - ${f}`));
      console.log('');
    }

    if (wrongTypeFields.length > 0) {
      console.log('⚠️  Wrong Type Fields:');
      wrongTypeFields.forEach(f => console.log(`   - ${f}`));
      console.log('');
    }

    // Validate specific structures
    console.log('🔍 Validating specific structures...\n');

    // System colors
    if (styleKit.system_colors?.length === 4) {
      const allHaveRequiredProps = styleKit.system_colors.every(c =>
        c._id && c.title && c.color && c.color.startsWith('#')
      );
      console.log(`   ${allHaveRequiredProps ? '✅' : '❌'} System Colors (4 colors with _id, title, color)`);
    } else {
      console.log(`   ❌ System Colors (expected 4, got ${styleKit.system_colors?.length || 0})`);
    }

    // System typography
    if (styleKit.system_typography?.length === 4) {
      console.log(`   ✅ System Typography (4 presets)`);
    } else {
      console.log(`   ❌ System Typography (expected 4, got ${styleKit.system_typography?.length || 0})`);
    }

    // H1 typography structure
    const h1Valid = styleKit.h1_typography?.typography_font_family &&
                    styleKit.h1_typography?.typography_font_size?.size &&
                    styleKit.h1_typography?.typography_font_weight;
    console.log(`   ${h1Valid ? '✅' : '❌'} H1 Typography (font, size, weight)`);

    // Button typography
    const buttonValid = styleKit.button_typography?.typography_font_family &&
                       styleKit.button_background_color?.startsWith('#') &&
                       styleKit.button_text_color?.startsWith('#');
    console.log(`   ${buttonValid ? '✅' : '❌'} Button Styles (typography, colors)`);

    // Form fields
    const formValid = styleKit.form_field_typography?.typography_font_family &&
                     styleKit.form_field_background_color?.startsWith('#') &&
                     styleKit.form_field_border_width?.unit === 'px';
    console.log(`   ${formValid ? '✅' : '❌'} Form Field Styles (typography, colors, borders)`);

    console.log('\n' + '='.repeat(60) + '\n');

    // Overall result
    const allCriticalFieldsPresent = missingFields.length === 0 && wrongTypeFields.length === 0;

    if (allCriticalFieldsPresent && totalFields >= 150) {
      console.log('✅ TEST PASSED: Style Kit generated successfully with all required fields');
      console.log(`   Total fields: ${totalFields} (target: ~180)`);
    } else {
      console.log('⚠️  TEST WARNING: Some fields may be missing');
      console.log(`   Total fields: ${totalFields} (target: ~180)`);
    }

    // Save to file
    const outputPath = './generated-stylekit-test.json';
    fs.writeFileSync(outputPath, JSON.stringify(styleKit, null, 2));
    console.log(`\n💾 Full Style Kit saved to: ${outputPath}`);

    // Show sample
    console.log('\n📋 Sample Output (Colors):');
    console.log(JSON.stringify(styleKit.system_colors, null, 2));

    return styleKit;

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

function countFields(obj, prefix = '') {
  let count = 0;

  for (const key in obj) {
    if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      count += countFields(obj[key], `${prefix}${key}.`);
    } else {
      count++;
    }
  }

  return count;
}

// Run test
testGeneration();
