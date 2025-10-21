#!/usr/bin/env node

/**
 * Extract complete widget schemas from Elementor PHP source files
 *
 * This script parses the actual Elementor widget PHP files and extracts
 * EVERY control defined in add_control(), add_group_control(), and add_responsive_control()
 * to create a complete, authoritative schema for each widget type.
 */

const fs = require('fs');
const path = require('path');

const WIDGET_FILES = {
    heading: '/Users/alfonso/Documents/GitHub/HT-Elementor-Apps/elementor-source/elementor-widgets/heading.php',
    'text-editor': '/Users/alfonso/Documents/GitHub/HT-Elementor-Apps/elementor-source/elementor-widgets/text-editor.php',
    button: '/Users/alfonso/Documents/GitHub/HT-Elementor-Apps/elementor-source/elementor-widgets/button.php',
    container: '/Users/alfonso/Documents/GitHub/HT-Elementor-Apps/elementor-source/elementor-widgets/container.php'
};

const GROUP_CONTROL_FILES = {
    typography: '/Users/alfonso/Documents/GitHub/HT-Elementor-Apps/elementor-source/elementor-widgets/groups/typography.php',
    background: '/Users/alfonso/Documents/GitHub/HT-Elementor-Apps/elementor-source/elementor-widgets/groups/background.php',
    border: '/Users/alfonso/Documents/GitHub/HT-Elementor-Apps/elementor-source/elementor-widgets/groups/border.php',
    'box-shadow': '/Users/alfonso/Documents/GitHub/HT-Elementor-Apps/elementor-source/elementor-widgets/groups/box-shadow.php',
    'text-shadow': '/Users/alfonso/Documents/GitHub/HT-Elementor-Apps/elementor-source/elementor-widgets/groups/text-shadow.php',
    'text-stroke': '/Users/alfonso/Documents/GitHub/HT-Elementor-Apps/elementor-source/elementor-widgets/groups/text-stroke.php'
};

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
            groupType: match[1].toLowerCase().replace('_', '-'),
            responsive: false
        });
    }

    return controls;
}

/**
 * Expand group controls into individual property names
 */
function expandGroupControl(baseName, groupType) {
    const properties = [];

    // Common group control patterns
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
        ]
    };

    if (groupPatterns[groupType]) {
        return groupPatterns[groupType];
    }

    return [];
}

/**
 * Generate complete schema for a widget
 */
function generateWidgetSchema(widgetType, widgetFile) {
    console.log(`\nProcessing: ${widgetType}`);
    console.log(`File: ${widgetFile}`);

    if (!fs.existsSync(widgetFile)) {
        console.error(`  ❌ File not found: ${widgetFile}`);
        return null;
    }

    const phpContent = fs.readFileSync(widgetFile, 'utf8');
    const controls = extractControls(phpContent);

    console.log(`  Found ${controls.length} control definitions`);

    // Expand into all property names
    const allProperties = {};

    controls.forEach(control => {
        if (control.type === 'group') {
            const groupProps = expandGroupControl(control.name, control.groupType);
            console.log(`  Expanding group '${control.name}' (${control.groupType}) → ${groupProps.length} properties`);
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

    console.log(`  Total properties: ${Object.keys(allProperties).length}`);

    return {
        widgetType,
        elType: widgetType === 'container' ? 'container' : 'widget',
        hasWidgetType: widgetType !== 'container',
        totalProperties: Object.keys(allProperties).length,
        properties: allProperties
    };
}

/**
 * Main execution
 */
function main() {
    console.log('='.repeat(80));
    console.log('EXTRACTING COMPLETE WIDGET SCHEMAS FROM ELEMENTOR SOURCE');
    console.log('='.repeat(80));

    const schemas = {};

    for (const [widgetType, widgetFile] of Object.entries(WIDGET_FILES)) {
        const schema = generateWidgetSchema(widgetType, widgetFile);
        if (schema) {
            schemas[widgetType] = schema;
        }
    }

    // Write to JSON file
    const outputPath = path.join(__dirname, 'elementor-extracted-schemas.json');
    fs.writeFileSync(outputPath, JSON.stringify(schemas, null, 2));

    console.log('\n' + '='.repeat(80));
    console.log('✅ SCHEMA EXTRACTION COMPLETE');
    console.log('='.repeat(80));
    console.log(`Output: ${outputPath}`);
    console.log('\nSummary:');
    for (const [type, schema] of Object.entries(schemas)) {
        console.log(`  ${type}: ${schema.totalProperties} properties`);
    }
}

main();
