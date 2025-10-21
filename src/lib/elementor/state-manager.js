/**
 * StateManager - Manages application state, undo/redo, and localStorage persistence
 */
export class StateManager {
    constructor() {
        this.currentJson = null;
        this.messages = []; // Conversation history
        this.history = []; // Undo/redo history
        this.historyIndex = -1;
        this.maxHistory = 50;
    }

    /**
     * Set current JSON and add to history
     */
    setJson(json, addToHistory = true) {
        if (addToHistory && this.currentJson) {
            // Truncate forward history when making new change
            this.history = this.history.slice(0, this.historyIndex + 1);

            // Add current state to history
            this.history.push(JSON.stringify(this.currentJson));
            this.historyIndex++;

            // Limit history size
            if (this.history.length > this.maxHistory) {
                this.history.shift();
                this.historyIndex--;
            }
        }

        this.currentJson = json;
        this.saveToLocalStorage();
    }

    /**
     * Undo last change
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.currentJson = JSON.parse(this.history[this.historyIndex]);
            this.saveToLocalStorage();
            return this.currentJson;
        }
        return null;
    }

    /**
     * Redo change
     */
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.currentJson = JSON.parse(this.history[this.historyIndex]);
            this.saveToLocalStorage();
            return this.currentJson;
        }
        return null;
    }

    /**
     * Add message to conversation history
     */
    addMessage(role, content) {
        this.messages.push({ role, content, timestamp: Date.now() });
        this.saveToLocalStorage();
    }

    /**
     * Clear conversation history
     */
    clearMessages() {
        this.messages = [];
        this.saveToLocalStorage();
    }

    /**
     * Save state to localStorage
     */
    saveToLocalStorage() {
        try {
            const state = {
                currentJson: this.currentJson,
                messages: this.messages.slice(-20), // Keep last 20 messages only
                history: this.history,
                historyIndex: this.historyIndex,
                timestamp: Date.now()
            };
            localStorage.setItem('chat_editor_state', JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    /**
     * Load state from localStorage
     */
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('chat_editor_state');
            if (saved) {
                const state = JSON.parse(saved);

                // Check if state is recent (within 7 days)
                const age = Date.now() - state.timestamp;
                const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

                if (age < maxAge) {
                    this.currentJson = state.currentJson;
                    this.messages = state.messages || [];
                    this.history = state.history || [];
                    this.historyIndex = state.historyIndex || -1;
                    return state;
                } else {
                    // Clear old state
                    this.clearState();
                }
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
        }
        return null;
    }

    /**
     * Clear all state
     */
    clearState() {
        this.currentJson = null;
        this.messages = [];
        this.history = [];
        this.historyIndex = -1;
        localStorage.removeItem('chat_editor_state');
    }

    /**
     * Export state for download
     */
    exportState() {
        return {
            json: this.currentJson,
            conversation: this.messages,
            timestamp: Date.now()
        };
    }

    /**
     * Get conversation context for OpenAI (last N messages)
     */
    getConversationContext(maxMessages = 10) {
        return this.messages.slice(-maxMessages);
    }
}
