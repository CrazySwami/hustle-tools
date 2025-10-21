/**
 * ChatUI - Manages chat interface and message rendering
 */
export class ChatUI {
    constructor(containerEl, onSendMessage) {
        this.container = containerEl;
        this.onSendMessage = onSendMessage;
        this.messages = [];
    }

    /**
     * Add message to chat
     */
    addMessage(role, content, metadata = {}) {
        const message = {
            role,
            content,
            metadata,
            timestamp: Date.now(),
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        this.messages.push(message);
        const messageEl = this.renderMessage(message);
        this.container.appendChild(messageEl);
        this.scrollToBottom();
    }

    /**
     * Add streaming message (empty initially, updated in real-time)
     */
    addStreamingMessage(messageId) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message assistant streaming';
        messageEl.id = messageId;
        messageEl.innerHTML = `
            <div class="message-content">
                <span class="streaming-cursor">▊</span>
            </div>
        `;
        
        this.container.appendChild(messageEl);
        this.scrollToBottom();
        
        return messageEl;
    }

    /**
     * Append chunk to streaming message
     */
    appendToStreamingMessage(messageId, chunk) {
        const messageEl = document.getElementById(messageId);
        if (!messageEl) return;
        
        const contentEl = messageEl.querySelector('.message-content');
        if (!contentEl) return;
        
        // Remove cursor, add text, re-add cursor
        const cursor = contentEl.querySelector('.streaming-cursor');
        if (cursor) cursor.remove();
        
        // Add chunk (process markdown if needed)
        const textNode = document.createTextNode(chunk);
        contentEl.appendChild(textNode);
        
        // Re-add cursor
        const newCursor = document.createElement('span');
        newCursor.className = 'streaming-cursor';
        newCursor.textContent = '▊';
        contentEl.appendChild(newCursor);
        
        this.scrollToBottom();
    }

    /**
     * Finalize streaming message (remove cursor, render markdown)
     */
    finalizeStreamingMessage(messageId) {
        const messageEl = document.getElementById(messageId);
        if (!messageEl) return;
        
        messageEl.classList.remove('streaming');
        
        const contentEl = messageEl.querySelector('.message-content');
        if (!contentEl) return;
        
        // Remove cursor
        const cursor = contentEl.querySelector('.streaming-cursor');
        if (cursor) cursor.remove();
        
        // Get final text and render as markdown using built-in parser
        const text = contentEl.textContent;
        contentEl.innerHTML = this.parseMessageContent(text);
        
        this.scrollToBottom();
    }

    /**
     * Add system message
     */
    addSystemMessage(text) {
        this.addMessage('system', text);
    }

    /**
     * Add reasoning display above a message
     */
    addReasoningDisplay(reasoningText, reasoningTokens) {
        const reasoningEl = document.createElement('div');
        reasoningEl.className = 'reasoning-display';
        reasoningEl.innerHTML = `
            <div class="reasoning-header">
                <span class="reasoning-icon">🧠</span>
                <span class="reasoning-title">AI Reasoning</span>
                <span class="reasoning-tokens">${reasoningTokens.toLocaleString()} tokens</span>
            </div>
            <div class="reasoning-content">${this.parseMessageContent(reasoningText)}</div>
        `;

        this.container.appendChild(reasoningEl);
        this.scrollToBottom();
    }

    /**
     * Add tool call indicator message with verbose details
     */
    addToolCallMessage(toolName, toolArgs, modelName = 'gpt-5') {
        const toolNames = {
            'generate_json_patch': '🔧 Generating JSON patch',
            'analyze_json_structure': '🔍 Analyzing JSON structure',
            'search_elementor_docs': '📚 Searching Elementor documentation',
            'open_template_in_playground': '🚀 Opening in Playground',
            'capture_playground_screenshot': '📸 Capturing screenshot',
            'convert_html_to_elementor_json': '🎨 Converting HTML to Elementor JSON',
            'list_available_tools': '📋 Listing tools'
        };

        const displayName = toolNames[toolName] || `🛠️ Using tool: ${toolName}`;

        let argsText = '';
        if (toolArgs) {
            if (toolArgs.query_type) {
                argsText = ` (${toolArgs.query_type})`;
            } else if (toolArgs.patches) {
                argsText = ` (${toolArgs.patches.length} change${toolArgs.patches.length > 1 ? 's' : ''})`;
            } else if (toolArgs.query) {
                argsText = ` ("${toolArgs.query.substring(0, 40)}${toolArgs.query.length > 40 ? '...' : ''}")`;
            } else if (toolArgs.action) {
                argsText = ` (${toolArgs.action})`;
            }
        }

        // Verbose message with model info
        this.addSystemMessage(`🤖 **Model: ${modelName}** → ${displayName}${argsText}`);
    }
    
    /**
     * Add API call status message (smaller, inline style)
     */
    addApiStatus(status, details = '') {
        const statusIcons = {
            'sending': '📤',
            'processing': '⚙️',
            'tool_executing': '🔧',
            'receiving': '📥',
            'complete': '✅',
            'error': '❌'
        };

        const icon = statusIcons[status] || '📌';
        const text = details ? `${icon} ${details}` : `${icon} ${status}`;

        // Create inline status message (smaller, no background)
        const statusMsg = {
            role: 'api-status',
            content: text,
            id: 'msg-' + Date.now()
        };

        this.messages.push(statusMsg);
        this.container.appendChild(this.renderMessage(statusMsg));
        this.scrollToBottom();
    }

    /**
     * Render a single message
     */
    renderMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.role}`;
        messageEl.id = message.id;

        const contentEl = document.createElement('div');
        contentEl.className = 'message-content';

        // Add image if present
        if (message.metadata && message.metadata.image) {
            const imgEl = document.createElement('img');
            imgEl.src = message.metadata.image;
            imgEl.className = 'message-image';
            imgEl.alt = 'Uploaded image';
            contentEl.appendChild(imgEl);
        }

        // Parse markdown-style formatting
        let html = this.parseMessageContent(message.content);
        const textEl = document.createElement('div');
        textEl.innerHTML = html;
        contentEl.appendChild(textEl);

        messageEl.appendChild(contentEl);

        // Add copy button (except for api-status messages)
        if (message.role !== 'api-status') {
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-message-btn';
            copyBtn.innerHTML = '📋';
            copyBtn.title = 'Copy message';
            copyBtn.onclick = () => this.copyMessageToClipboard(message.content, copyBtn);
            messageEl.appendChild(copyBtn);
        }

        // Add timestamp on hover
        messageEl.title = new Date(message.timestamp).toLocaleTimeString();

        return messageEl;
    }

    /**
     * Copy message content to clipboard
     */
    copyMessageToClipboard(content, button) {
        navigator.clipboard.writeText(content).then(() => {
            const originalText = button.innerHTML;
            button.innerHTML = '✅';
            button.style.background = '#10b981';
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = '';
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy:', err);
            button.innerHTML = '❌';
            setTimeout(() => {
                button.innerHTML = '📋';
            }, 1500);
        });
    }

    /**
     * Parse message content (basic markdown support)
     */
    parseMessageContent(content) {
        // Escape HTML
        let html = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Code blocks
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // Line breaks
        html = html.replace(/\n/g, '<br>');

        return html;
    }

    /**
     * Display JSON Patch result with visual diff
     */
    addJsonPatchDisplay(patches, success = true) {
        const patchEl = document.createElement('div');
        patchEl.className = 'tool-result-display json-patch-display';

        const header = `
            <div class="tool-result-header">
                <span class="tool-icon">🔧</span>
                <span class="tool-title">JSON Patch Applied</span>
                <span class="tool-status ${success ? 'success' : 'error'}">${success ? '✓' : '✗'}</span>
            </div>
        `;

        const patchesHtml = Array.isArray(patches) ? patches.map(p => {
            const opColors = {
                'replace': '#3b82f6',
                'add': '#10b981',
                'remove': '#ef4444'
            };
            const color = opColors[p.op] || '#6b7280';

            return `
                <div class="patch-item" style="border-left-color: ${color}">
                    <div class="patch-op" style="color: ${color}">${p.op.toUpperCase()}</div>
                    <div class="patch-path">${p.path}</div>
                    ${p.value !== undefined ? `<div class="patch-value"><code>${JSON.stringify(p.value)}</code></div>` : ''}
                </div>
            `;
        }).join('') : '<div class="patch-item">No patches applied</div>';

        patchEl.innerHTML = header + `<div class="tool-result-content">${patchesHtml}</div>`;
        this.container.appendChild(patchEl);
        this.scrollToBottom();
    }

    /**
     * Display vector store search results
     */
    addVectorSearchDisplay(query, results, fileCount = 0) {
        const searchEl = document.createElement('div');
        searchEl.className = 'tool-result-display vector-search-display';

        const header = `
            <div class="tool-result-header">
                <span class="tool-icon">📚</span>
                <span class="tool-title">Elementor Documentation Search</span>
                <span class="tool-badge">${fileCount} files searched</span>
            </div>
        `;

        const queryHtml = `<div class="search-query">Query: <strong>${query}</strong></div>`;

        const resultsHtml = Array.isArray(results) && results.length > 0 ? results.slice(0, 3).map(r => `
            <div class="search-result-item">
                <div class="result-file">${r.filename || 'Unknown file'}</div>
                <div class="result-snippet">${r.content || r.text || 'No preview available'}</div>
                ${r.score ? `<div class="result-score">Relevance: ${(r.score * 100).toFixed(1)}%</div>` : ''}
            </div>
        `).join('') : '<div class="search-result-item">No results found</div>';

        searchEl.innerHTML = header + `<div class="tool-result-content">${queryHtml}${resultsHtml}</div>`;
        this.container.appendChild(searchEl);
        this.scrollToBottom();
    }

    /**
     * Display JSON structure analysis
     */
    addJsonAnalysisDisplay(analysis) {
        const analysisEl = document.createElement('div');
        analysisEl.className = 'tool-result-display json-analysis-display';

        const header = `
            <div class="tool-result-header">
                <span class="tool-icon">🔍</span>
                <span class="tool-title">JSON Structure Analysis</span>
            </div>
        `;

        const contentHtml = `
            <div class="analysis-summary">
                ${analysis.widgetType ? `<div class="analysis-item"><strong>Widget Type:</strong> ${analysis.widgetType}</div>` : ''}
                ${analysis.widgetCount ? `<div class="analysis-item"><strong>Widgets:</strong> ${analysis.widgetCount}</div>` : ''}
                ${analysis.hasContent !== undefined ? `<div class="analysis-item"><strong>Has Content:</strong> ${analysis.hasContent ? '✓' : '✗'}</div>` : ''}
                ${analysis.structure ? `<div class="analysis-item"><strong>Structure:</strong> <code>${JSON.stringify(analysis.structure)}</code></div>` : ''}
            </div>
        `;

        analysisEl.innerHTML = header + `<div class="tool-result-content">${contentHtml}</div>`;
        this.container.appendChild(analysisEl);
        this.scrollToBottom();
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = 'typingIndicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        this.container.appendChild(indicator);
        this.scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        this.messages = [];
        this.container.innerHTML = '';
    }

    /**
     * Remove last message
     */
    removeLastMessage() {
        if (this.messages.length > 0) {
            const lastMessage = this.messages.pop();
            const messageEl = document.getElementById(lastMessage.id);
            if (messageEl) {
                messageEl.remove();
            }
        }
    }

    /**
     * Update existing message
     */
    updateMessage(messageId, newContent) {
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
            message.content = newContent;
            const messageEl = document.getElementById(messageId);
            if (messageEl) {
                const contentEl = messageEl.querySelector('.message-content');
                contentEl.innerHTML = this.parseMessageContent(newContent);
            }
        }
    }

    /**
     * Scroll to bottom of chat
     */
    scrollToBottom() {
        // Use requestAnimationFrame for smooth scrolling
        requestAnimationFrame(() => {
            this.container.scrollTop = this.container.scrollHeight;
        });
    }

    /**
     * Get all messages
     */
    getMessages() {
        return this.messages;
    }

    /**
     * Add error message
     */
    addError(errorText) {
        this.addMessage('system', `❌ Error: ${errorText}`);
    }

    /**
     * Add success message
     */
    addSuccess(successText) {
        this.addMessage('system', `✅ ${successText}`);
    }

    /**
     * Add info message
     */
    addInfo(infoText) {
        this.addMessage('system', `ℹ️ ${infoText}`);
    }

    /**
     * Show loading message
     */
    showLoading(text = 'Processing...') {
        const loadingId = 'loading_' + Date.now();
        const loadingEl = document.createElement('div');
        loadingEl.className = 'message system';
        loadingEl.id = loadingId;
        loadingEl.innerHTML = `<div class="message-content">⏳ ${text}</div>`;
        this.container.appendChild(loadingEl);
        this.scrollToBottom();
        return loadingId;
    }

    /**
     * Hide loading message
     */
    hideLoading(loadingId) {
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
            loadingEl.remove();
        }
    }

    /**
     * Format JSON for display in message
     */
    formatJson(json) {
        return '```json\n' + JSON.stringify(json, null, 2) + '\n```';
    }

    /**
     * Add approval message with buttons for patch review
     */
    addApprovalMessage(patchData, currentJson, onApply, onReject) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message approval-message';
        messageEl.id = `approval_${Date.now()}`;

        const contentEl = document.createElement('div');
        contentEl.className = 'message-content approval-content';

        // Create approval UI
        let html = `<div class="approval-header">✏️ <strong>Proposed Changes</strong></div>`;
        html += `<div class="approval-summary">${patchData.summary}</div>`;
        html += `<div class="approval-patches">`;

        patchData.patches.forEach((patch, idx) => {
            // Get current value from JSON
            const oldValue = this.getValueAtPath(currentJson, patch.path);
            
            // Determine operation type and display accordingly
            let diffHtml = '';
            if (patch.op === 'add') {
                diffHtml = `
                    <div class="patch-new">+ ${this.formatValue(patch.value)}</div>
                    <div class="patch-info-text">(Adding new property)</div>
                `;
            } else if (patch.op === 'remove') {
                diffHtml = `
                    <div class="patch-old">- ${this.formatValue(oldValue)}</div>
                    <div class="patch-info-text">(Removing property)</div>
                `;
            } else if (patch.op === 'replace') {
                diffHtml = `
                    <div class="patch-old">- ${this.formatValue(oldValue)}</div>
                    <div class="patch-new">+ ${this.formatValue(patch.value)}</div>
                `;
            }
            
            html += `
                <div class="approval-patch-item">
                    <div class="patch-number">${idx + 1}</div>
                    <div class="patch-info">
                        <div class="patch-path">📍 ${patch.path}</div>
                        <div class="patch-operation">${patch.op.toUpperCase()}</div>
                        <div class="patch-diff">
                            ${diffHtml}
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        html += `
            <div class="approval-actions">
                <button class="approval-btn approve-btn" id="approveBtn_${messageEl.id}">✓ Apply Changes</button>
                <button class="approval-btn reject-btn" id="rejectBtn_${messageEl.id}">✗ Reject</button>
            </div>
        `;

        contentEl.innerHTML = html;
        messageEl.appendChild(contentEl);
        this.container.appendChild(messageEl);

        // Add event listeners to buttons
        const approveBtn = document.getElementById(`approveBtn_${messageEl.id}`);
        const rejectBtn = document.getElementById(`rejectBtn_${messageEl.id}`);

        approveBtn.addEventListener('click', () => {
            // Disable buttons
            approveBtn.disabled = true;
            rejectBtn.disabled = true;
            messageEl.classList.add('approved');
            onApply();
        });

        rejectBtn.addEventListener('click', () => {
            // Disable buttons
            approveBtn.disabled = true;
            rejectBtn.disabled = true;
            messageEl.classList.add('rejected');
            onReject();
        });

        this.scrollToBottom();
    }

    /**
     * Helper to get value at JSON path
     */
    getValueAtPath(json, path) {
        const parts = path.split('/').filter(p => p);
        let current = json;
        for (const part of parts) {
            if (current && typeof current === 'object') {
                current = current[part];
            } else {
                return undefined;
            }
        }
        return current;
    }

    /**
     * Format value for display in patch diff
     */
    formatValue(value) {
        if (value === undefined) return 'undefined';
        if (value === null) return 'null';
        if (typeof value === 'string') return `"${value}"`;
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return String(value);
    }
}
