#!/usr/bin/env node

/**
 * Extract complete schemas for ALL Elementor widgets
 * Automatically discovers all widget files and extracts their controls
 */

const fs = require('fs');
const path = require('path');

const WIDGETS_DIR = '/Users/alfonso/Documents/GitHub/HT-Elementor-Apps/elementor-source/elementor-widgets';

/**
 * Extract control names from add_control() calls in PHP
 */
function extractControls(phpContent) {
    const controls = [];

    // Match: $this->add_control( 'control_name', [...] );
    const controlRegex = /\$this->add_control\s*\(\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = controlRegex.exec(phpContent)) !== null) {
        controls.push({
            name: match[1],
            type: 'control',
            responsive: false
        });
    }

    // Match: $this->add_responsive_control( 'control_name', [...] );
    const responsiveRegex = /\$this->add_responsive_control\s*\(\s*['"]([^'"]+)['"]/g;
    while ((match = responsiveRegex.exec(phpContent)) !== null) {
        controls.push({
            name: match[1],
            type: 'control',
            responsive: true
        });
    }

    // Match: $this->add_group_control( Group_Control_Typography::get_type(), [ 'name' => 'typography' ] );
    const groupRegex = /\$this->add_group_control\s*\(\s*Group_Control_(\w+)::get_type\(\)\s*,\s*\[[\s\S]*?['"]name['"]\s*=>\s*['"]([^'"]+)['"]/g;
    while ((match = groupRegex.exec(phpContent)) !== null) {
        controls.push({
            name: match[2],
            type: 'group',
            groupType: match[1].toLowerCase().replace(/_/g, '-'),
            responsive: false
        });
    }

    return controls;
}

/**
 * Expand group controls into individual property names
 */
function expandGroupControl(baseName, groupType) {
    const groupPatterns = {
        'typography': [
            `${baseName}_typography`,
            `${baseName}_font_family`,
            `${baseName}_font_size`,
            `${baseName}_font_weight`,
            `${baseName}_text_transform`,
            `${baseName}_font_style`,
            `${baseName}_text_decoration`,
            `${baseName}_line_height`,
            `${baseName}_letter_spacing`,
            `${baseName}_word_spacing`
        ],
        'background': [
            `${baseName}_background`,
            `${baseName}_color`,
            `${baseName}_gradient_type`,
            `${baseName}_gradient_angle`,
            `${baseName}_gradient_position`,
            `${baseName}_gradient_color`,
            `${baseName}_gradient_color_b`,
            `${baseName}_gradient_color_stop`,
            `${baseName}_gradient_color_b_stop`,
            `${baseName}_image`,
            `${baseName}_position`,
            `${baseName}_size`,
            `${baseName}_repeat`,
            `${baseName}_attachment`
        ],
        'border': [
            `${baseName}_border`,
            `${baseName}_width`,
            `${baseName}_color`,
            `${baseName}_radius`
        ],
        'box-shadow': [
            `${baseName}_box_shadow_type`,
            `${baseName}_box_shadow`
        ],
        'text-shadow': [
            `${baseName}_text_shadow_type`,
            `${baseName}_text_shadow`
        ],
        'text-stroke': [
            `${baseName}_text_stroke_type`,
            `${baseName}_text_stroke`
        ],
        'css-filter': [],
        'image-size': [],
        'flex-container': [],
        'grid-container': [],
        'flex-item': []
    };

    return groupPatterns[groupType] || [];
}

/**
 * Get widget name from PHP class name
 */
function getWidgetName(phpContent) {
    const classMatch = phpContent.match(/class\s+Widget_(\w+)\s+extends/);
    if (classMatch) {
        // Convert Widget_Image_Box to image-box
        return classMatch[1].toLowerCase().replace(/_/g, '-');
    }
    return null;
}

/**
 * Generate complete schema for a widget
 */
function generateWidgetSchema(widgetFile) {
    const fileName = path.basename(widgetFile, '.php');

    if (!fs.existsSync(widgetFile)) {
        console.error(`  ❌ File not found: ${widgetFile}`);
        return null;
    }

    const phpContent = fs.readFileSync(widgetFile, 'utf8');
    const widgetName = getWidgetName(phpContent) || fileName;

    // Skip base/common/trait files
    if (widgetName.includes('base') || widgetName.includes('common') || widgetName.includes('trait')) {
        return null;
    }

    const controls = extractControls(phpContent);

    if (controls.length === 0) {
        console.log(`  ⚠️  ${widgetName}: No controls found (might use traits)`);
        return null;
    }

    console.log(`  ✓ ${widgetName}: ${controls.length} control definitions`);

    // Expand into all property names
    const allProperties = {};

    controls.forEach(control => {
        if (control.type === 'group') {
            const groupProps = expandGroupControl(control.name, control.groupType);
            if (groupProps.length > 0) {
                groupProps.forEach(prop => {
                    allProperties[prop] = {
                        source: `group:${control.groupType}`,
                        responsive: control.responsive
                    };

                    // Add responsive variants
                    if (control.responsive) {
                        allProperties[`${prop}_tablet`] = {
                            source: `group:${control.groupType}`,
                            responsive: true,
                            variant: 'tablet'
                        };
                        allProperties[`${prop}_mobile`] = {
                            source: `group:${control.groupType}`,
                            responsive: true,
                            variant: 'mobile'
                        };
                    }
                });
            }
        } else {
            allProperties[control.name] = {
                source: 'direct',
                responsive: control.responsive
            };

            // Add responsive variants
            if (control.responsive) {
                allProperties[`${control.name}_tablet`] = {
                    source: 'direct',
                    responsive: true,
                    variant: 'tablet'
                };
                allProperties[`${control.name}_mobile`] = {
                    source: 'direct',
                    responsive: true,
                    variant: 'mobile'
                };
            }
        }
    });

    return {
        widgetType: widgetName,
        elType: widgetName === 'container' ? 'container' : 'widget',
        hasWidgetType: widgetName !== 'container',
        totalProperties: Object.keys(allProperties).length,
        properties: allProperties,
        sourceFile: path.basename(widgetFile)
    };
}

/**
 * Main execution
 */
function main() {
    console.log('='.repeat(80));
    console.log('EXTRACTING ALL ELEMENTOR WIDGET SCHEMAS');
    console.log('='.repeat(80));
    console.log(`\nScanning: ${WIDGETS_DIR}\n`);

    const widgetFiles = fs.readdirSync(WIDGETS_DIR)
        .filter(f => f.endsWith('.php'))
        .map(f => path.join(WIDGETS_DIR, f));

    console.log(`Found ${widgetFiles.length} PHP files\n`);

    const schemas = {};
    let processedCount = 0;
    let skippedCount = 0;

    for (const widgetFile of widgetFiles) {
        const schema = generateWidgetSchema(widgetFile);
        if (schema) {
            schemas[schema.widgetType] = schema;
            processedCount++;
        } else {
            skippedCount++;
        }
    }

    // Write to JSON file
    const outputPath = path.join(__dirname, 'elementor-all-widgets-schemas.json');
    fs.writeFileSync(outputPath, JSON.stringify(schemas, null, 2));

    console.log('\n' + '='.repeat(80));
    console.log('✅ SCHEMA EXTRACTION COMPLETE');
    console.log('='.repeat(80));
    console.log(`Output: ${outputPath}`);
    console.log(`\nProcessed: ${processedCount} widgets`);
    console.log(`Skipped: ${skippedCount} files (base/common/trait files or using traits)`);
    console.log('\nWidget Summary:');

    const sortedWidgets = Object.entries(schemas).sort((a, b) => b[1].totalProperties - a[1].totalProperties);
    sortedWidgets.forEach(([name, schema]) => {
        console.log(`  ${name.padEnd(25)} ${schema.totalProperties.toString().padStart(4)} properties`);
    });
}

main();
