/**
 * JsonEditor - Syntax highlighting and diff visualization for JSON
 */
export class JsonEditor {
    constructor(containerEl) {
        this.container = containerEl;
        this.currentJson = null;
        this.highlightedPaths = new Set();
    }

    /**
     * Set JSON content and render
     */
    setJson(json) {
        this.currentJson = json;
        this.render();
    }

    /**
     * Render JSON with syntax highlighting
     */
    render() {
        if (!this.currentJson) {
            this.container.textContent = '';
            return;
        }

        const jsonString = JSON.stringify(this.currentJson, null, 2);
        const lines = jsonString.split('\n');

        let html = '';
        lines.forEach((line, index) => {
            const lineClass = this.getLineClass(index);
            const highlighted = this.syntaxHighlight(line);
            html += `<div class="json-line ${lineClass}" data-line="${index}">${highlighted}</div>`;
        });

        this.container.innerHTML = html;
    }

    /**
     * Get CSS class for line based on highlights
     */
    getLineClass(lineIndex) {
        // Check if this line should be highlighted
        // (This will be enhanced when we apply patches)
        return '';
    }

    /**
     * Syntax highlight a single line of JSON
     */
    syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        return json.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            (match) => {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                        match = match.slice(0, -1); // Remove trailing colon
                        return `<span class="${cls}">${match}</span>:`;
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return `<span class="${cls}">${match}</span>`;
            }
        );
    }

    /**
     * Highlight changes after patch applied
     */
    highlightChanges(patches) {
        if (!patches || patches.length === 0) return;

        // Convert patches to line numbers
        const linesToHighlight = this.patchesToLineNumbers(patches);

        // Re-render with highlights
        const jsonString = JSON.stringify(this.currentJson, null, 2);
        const lines = jsonString.split('\n');

        let html = '';
        lines.forEach((line, index) => {
            let lineClass = '';
            if (linesToHighlight.has(index)) {
                lineClass = 'highlighted';
            }
            const highlighted = this.syntaxHighlight(line);
            html += `<div class="json-line ${lineClass}" data-line="${index}">${highlighted}</div>`;
        });

        this.container.innerHTML = html;

        // Scroll to first highlighted line
        if (linesToHighlight.size > 0) {
            const firstLine = Math.min(...linesToHighlight);
            const firstLineEl = this.container.querySelector(`[data-line="${firstLine}"]`);
            if (firstLineEl) {
                firstLineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    /**
     * Convert JSON Patch paths to line numbers
     */
    patchesToLineNumbers(patches) {
        const lineNumbers = new Set();

        patches.forEach(patch => {
            const lineNumber = this.pathToLineNumber(patch.path);
            if (lineNumber !== -1) {
                lineNumbers.add(lineNumber);
            }
        });

        return lineNumbers;
    }

    /**
     * Find line number for a JSON path
     */
    pathToLineNumber(path) {
        if (!this.currentJson) return -1;

        const jsonString = JSON.stringify(this.currentJson, null, 2);
        const lines = jsonString.split('\n');

        // Parse path (e.g., "/content/0/settings/title_color")
        const pathParts = path.split('/').filter(p => p);
        if (pathParts.length === 0) return -1;

        // Find the line containing the final property
        const lastPart = pathParts[pathParts.length - 1];
        const searchPattern = `"${lastPart}"`;

        // Try to find the line
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(searchPattern)) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Get value at JSON path
     */
    getValueAtPath(json, path) {
        const parts = path.split('/').filter(p => p);
        let current = json;

        for (const part of parts) {
            if (current === undefined || current === null) return undefined;
            current = current[part];
        }

        return current;
    }

    /**
     * Validate JSON structure
     */
    validateJson() {
        if (!this.currentJson) {
            return { valid: false, errors: ['No JSON loaded'] };
        }

        const errors = [];
        const warnings = [];

        // Check for required Elementor properties
        if (!this.currentJson.widgetType) {
            errors.push('Missing widgetType property');
        }

        if (!this.currentJson.content || !Array.isArray(this.currentJson.content)) {
            errors.push('Missing or invalid content array');
        }

        // Check each widget
        if (this.currentJson.content) {
            this.currentJson.content.forEach((widget, idx) => {
                if (!widget.elType) {
                    errors.push(`Widget ${idx}: Missing elType`);
                }
                if (!widget.widgetType) {
                    warnings.push(`Widget ${idx}: Missing widgetType`);
                }
                if (!widget.settings) {
                    warnings.push(`Widget ${idx}: Missing settings object`);
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
     * Format and prettify JSON
     */
    formatJson() {
        if (!this.currentJson) return;

        // Re-parse to ensure clean formatting
        const formatted = JSON.parse(JSON.stringify(this.currentJson));
        this.currentJson = formatted;
        this.render();
    }

    /**
     * Search JSON for text
     */
    search(searchText) {
        if (!searchText || !this.currentJson) return [];

        const results = [];
        const jsonString = JSON.stringify(this.currentJson, null, 2);
        const lines = jsonString.split('\n');

        lines.forEach((line, index) => {
            if (line.toLowerCase().includes(searchText.toLowerCase())) {
                results.push({
                    lineNumber: index,
                    content: line.trim()
                });
            }
        });

        return results;
    }

    /**
     * Highlight search results
     */
    highlightSearch(searchText) {
        const results = this.search(searchText);
        const lineNumbers = new Set(results.map(r => r.lineNumber));

        const jsonString = JSON.stringify(this.currentJson, null, 2);
        const lines = jsonString.split('\n');

        let html = '';
        lines.forEach((line, index) => {
            let lineClass = '';
            if (lineNumbers.has(index)) {
                lineClass = 'highlighted';
            }
            const highlighted = this.syntaxHighlight(line);
            html += `<div class="json-line ${lineClass}" data-line="${index}">${highlighted}</div>`;
        });

        this.container.innerHTML = html;
    }

    /**
     * Clear highlights
     */
    clearHighlights() {
        this.render();
    }

    /**
     * Get current JSON
     */
    getJson() {
        return this.currentJson;
    }

    /**
     * Check if JSON is loaded
     */
    hasJson() {
        return this.currentJson !== null;
    }
}

// Add CSS for syntax highlighting
const style = document.createElement('style');
style.textContent = `
    .json-key {
        color: #8be9fd;
    }
    .json-string {
        color: #f1fa8c;
    }
    .json-number {
        color: #bd93f9;
    }
    .json-boolean {
        color: #ff79c6;
    }
    .json-null {
        color: #6272a4;
    }
`;
document.head.appendChild(style);
