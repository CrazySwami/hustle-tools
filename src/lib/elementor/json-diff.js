/**
 * JsonDiff - JSON Patch operations and validation
 * Uses fast-json-patch library (loaded globally)
 */
export class JsonDiff {
    constructor() {
        // fast-json-patch is loaded via script tag
        this.jsonpatch = window.jsonpatch;

        if (!this.jsonpatch) {
            console.warn('fast-json-patch library not loaded. JSON Patch operations will fail.');
        }
    }

    /**
     * Apply JSON patches to a JSON object
     */
    applyPatches(json, patches) {
        if (!this.jsonpatch) {
            return {
                success: false,
                error: 'JSON Patch library not loaded'
            };
        }

        try {
            // Clone the JSON to avoid mutating the original
            const cloned = JSON.parse(JSON.stringify(json));

            // Validate patches first
            const errors = this.jsonpatch.validate(patches, cloned);
            if (errors) {
                return {
                    success: false,
                    error: `Invalid patches: ${JSON.stringify(errors)}`
                };
            }

            // Apply patches
            const result = this.jsonpatch.applyPatch(cloned, patches, true);

            return {
                success: true,
                newJson: result.newDocument,
                patches: patches
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate patches between two JSON objects
     */
    generatePatches(oldJson, newJson) {
        if (!this.jsonpatch) {
            return [];
        }

        try {
            const patches = this.jsonpatch.compare(oldJson, newJson);
            return patches;
        } catch (error) {
            console.error('Error generating patches:', error);
            return [];
        }
    }

    /**
     * Get value at JSON path
     */
    getValueAtPath(json, path) {
        if (!path || !json) return undefined;

        // Parse JSON Pointer path (RFC 6901)
        const parts = path.split('/').filter(p => p);
        let current = json;

        for (const part of parts) {
            // Handle array indices
            const index = parseInt(part);
            if (!isNaN(index) && Array.isArray(current)) {
                current = current[index];
            } else {
                current = current?.[part];
            }

            if (current === undefined) {
                return undefined;
            }
        }

        return current;
    }

    /**
     * Check if path exists in JSON
     */
    hasPath(json, path) {
        return this.getValueAtPath(json, path) !== undefined;
    }

    /**
     * Set value at JSON path (creates intermediate objects/arrays if needed)
     */
    setValueAtPath(json, path, value) {
        const parts = path.split('/').filter(p => p);
        let current = json;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            const nextPart = parts[i + 1];

            // Determine if next level should be array or object
            const nextIndex = parseInt(nextPart);
            const shouldBeArray = !isNaN(nextIndex);

            if (current[part] === undefined) {
                current[part] = shouldBeArray ? [] : {};
            }

            current = current[part];
        }

        const lastPart = parts[parts.length - 1];
        current[lastPart] = value;

        return json;
    }

    /**
     * Validate JSON structure for Elementor compatibility
     */
    validateElementorJson(json) {
        const errors = [];
        const warnings = [];

        // Required fields
        if (!json.widgetType) {
            errors.push('Missing required field: widgetType');
        }

        if (!json.content || !Array.isArray(json.content)) {
            errors.push('Missing or invalid field: content (must be an array)');
        }

        // Validate widgets
        if (json.content && Array.isArray(json.content)) {
            json.content.forEach((widget, index) => {
                if (!widget.id) {
                    warnings.push(`Widget ${index}: Missing id (recommended)`);
                }

                if (!widget.elType) {
                    errors.push(`Widget ${index}: Missing required field: elType`);
                }

                if (!widget.widgetType && !widget.elType) {
                    errors.push(`Widget ${index}: Must have either widgetType or elType`);
                }

                if (!widget.settings) {
                    warnings.push(`Widget ${index}: Missing settings object`);
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Find all paths in JSON matching a condition
     */
    findPaths(json, condition) {
        const paths = [];

        const traverse = (obj, currentPath) => {
            if (typeof obj !== 'object' || obj === null) {
                return;
            }

            for (const key in obj) {
                const path = `${currentPath}/${key}`;
                const value = obj[key];

                if (condition(key, value, path)) {
                    paths.push(path);
                }

                if (typeof value === 'object' && value !== null) {
                    traverse(value, path);
                }
            }
        };

        traverse(json, '');
        return paths;
    }

    /**
     * Find paths by property name
     */
    findPathsByProperty(json, propertyName) {
        return this.findPaths(json, (key) => key === propertyName);
    }

    /**
     * Find paths by value
     */
    findPathsByValue(json, targetValue) {
        return this.findPaths(json, (key, value) => value === targetValue);
    }

    /**
     * Get widget at index
     */
    getWidget(json, index) {
        if (!json.content || !Array.isArray(json.content)) {
            return null;
        }
        return json.content[index];
    }

    /**
     * Get all widgets
     */
    getAllWidgets(json) {
        if (!json.content || !Array.isArray(json.content)) {
            return [];
        }
        return json.content;
    }

    /**
     * Find widgets by type
     */
    findWidgetsByType(json, widgetType) {
        const widgets = this.getAllWidgets(json);
        return widgets.filter(w => w.widgetType === widgetType);
    }

    /**
     * Create a JSON Patch operation
     */
    createPatch(op, path, value = undefined, from = undefined) {
        const patch = { op, path };

        if (value !== undefined && op !== 'remove') {
            patch.value = value;
        }

        if (from !== undefined && (op === 'move' || op === 'copy')) {
            patch.from = from;
        }

        return patch;
    }

    /**
     * Create replace patch
     */
    createReplacePatch(path, value) {
        return this.createPatch('replace', path, value);
    }

    /**
     * Create add patch
     */
    createAddPatch(path, value) {
        return this.createPatch('add', path, value);
    }

    /**
     * Create remove patch
     */
    createRemovePatch(path) {
        return this.createPatch('remove', path);
    }

    /**
     * Test if a patch would apply successfully
     */
    testPatch(json, patch) {
        try {
            const cloned = JSON.parse(JSON.stringify(json));
            const errors = this.jsonpatch.validate([patch], cloned);
            return errors === undefined;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get summary of patch operations
     */
    summarizePatches(patches) {
        const summary = {
            total: patches.length,
            operations: {},
            paths: []
        };

        patches.forEach(patch => {
            summary.operations[patch.op] = (summary.operations[patch.op] || 0) + 1;
            summary.paths.push(patch.path);
        });

        return summary;
    }

    /**
     * Format patch for display
     */
    formatPatch(patch) {
        let formatted = `Operation: ${patch.op}\nPath: ${patch.path}`;

        if (patch.value !== undefined) {
            formatted += `\nValue: ${JSON.stringify(patch.value, null, 2)}`;
        }

        if (patch.from !== undefined) {
            formatted += `\nFrom: ${patch.from}`;
        }

        return formatted;
    }
}
