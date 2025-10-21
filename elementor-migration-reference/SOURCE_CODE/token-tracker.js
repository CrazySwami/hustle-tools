/**
 * Token Usage & Cost Tracker
 * Tracks API calls, token usage, and costs for the current session
 */

console.log('💰 Token Tracker loading...');

// Pricing per 1M tokens (as of 2025)
const MODEL_PRICING = {
    'gpt-5-2025-08-07': {
        name: 'GPT-5 Standard',
        input: 1.25,   // per 1M tokens
        output: 10.00  // per 1M tokens
    },
    'gpt-5-mini-2025-08-07': {
        name: 'GPT-5 Mini',
        input: 0.25,
        output: 2.00
    },
    'gpt-5-nano-2025-08-07': {
        name: 'GPT-5 Nano',
        input: 0.05,
        output: 0.40
    }
};

// Session stats
let sessionStats = {
    totalCalls: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    calls: [],
    startTime: Date.now()
};

// Load from localStorage if exists
function loadSessionStats() {
    const saved = localStorage.getItem('tokenTrackerSession');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Only load if session is less than 24 hours old
            if (Date.now() - parsed.startTime < 24 * 60 * 60 * 1000) {
                sessionStats = parsed;
                console.log('📊 Loaded previous session stats:', sessionStats.totalCalls, 'calls');
            }
        } catch (e) {
            console.warn('Failed to load session stats:', e);
        }
    }
}

// Save to localStorage
function saveSessionStats() {
    localStorage.setItem('tokenTrackerSession', JSON.stringify(sessionStats));
}

// Calculate cost
function calculateCost(model, inputTokens, outputTokens) {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-5-2025-08-07'];
    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;
    return inputCost + outputCost;
}

// Track an API call
window.trackTokenUsage = function(callData) {
    const {
        model,
        inputTokens,
        outputTokens,
        type, // 'conversion', 'refinement', 'screenshot', 'image-to-html'
        success = true
    } = callData;

    const cost = calculateCost(model, inputTokens, outputTokens);

    const call = {
        timestamp: Date.now(),
        model,
        type,
        inputTokens,
        outputTokens,
        cost,
        success
    };

    sessionStats.totalCalls++;
    sessionStats.totalInputTokens += inputTokens;
    sessionStats.totalOutputTokens += outputTokens;
    sessionStats.totalCost += cost;
    sessionStats.calls.push(call);

    // Keep only last 100 calls
    if (sessionStats.calls.length > 100) {
        sessionStats.calls.shift();
    }

    saveSessionStats();
    updateCostDisplay();

    console.log('💰 Token usage tracked:', {
        type,
        model: MODEL_PRICING[model]?.name || model,
        inputTokens,
        outputTokens,
        cost: '$' + cost.toFixed(4)
    });
};

// Update the cost display UI
function updateCostDisplay() {
    const costWidget = document.getElementById('costTracker');
    if (!costWidget) return;

    const avgTokensPerCall = sessionStats.totalCalls > 0
        ? Math.round((sessionStats.totalInputTokens + sessionStats.totalOutputTokens) / sessionStats.totalCalls)
        : 0;

    const sessionDuration = Math.round((Date.now() - sessionStats.startTime) / 1000 / 60); // minutes

    costWidget.innerHTML = `
        <div style="font-size: 13px; color: rgba(255,255,255,0.9); font-weight: 600; margin-bottom: 8px;">💰 Session Cost</div>
        <div style="font-size: 24px; font-weight: 700; color: #ffffff; margin-bottom: 4px;">
            $${sessionStats.totalCost.toFixed(4)}
        </div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.8); line-height: 1.4;">
            ${sessionStats.totalCalls} API calls • ${sessionDuration}m<br>
            ${sessionStats.totalInputTokens.toLocaleString()} in / ${sessionStats.totalOutputTokens.toLocaleString()} out<br>
            Avg: ${avgTokensPerCall.toLocaleString()} tokens/call
        </div>
        <button onclick="resetCostTracker()" style="margin-top: 8px; padding: 4px 8px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 4px; font-size: 10px; cursor: pointer; transition: all 0.2s;">
            Reset
        </button>
        <button onclick="showDetailedStats()" style="margin-top: 8px; margin-left: 4px; padding: 4px 8px; background: rgba(255, 255, 255, 0.2); color: white; border: none; border-radius: 4px; font-size: 10px; cursor: pointer; transition: all 0.2s;">
            Details
        </button>
    `;
}

// Reset tracker
window.resetCostTracker = function() {
    if (confirm('Reset cost tracker for this session?')) {
        sessionStats = {
            totalCalls: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalCost: 0,
            calls: [],
            startTime: Date.now()
        };
        saveSessionStats();
        updateCostDisplay();
        console.log('💰 Cost tracker reset');
    }
};

// Show detailed stats modal
window.showDetailedStats = function() {
    const modal = document.getElementById('statsModal');
    if (!modal) {
        createStatsModal();
    }

    const tbody = document.getElementById('statsTableBody');
    tbody.innerHTML = '';

    // Show last 20 calls
    const recentCalls = sessionStats.calls.slice(-20).reverse();

    recentCalls.forEach(call => {
        const row = document.createElement('tr');
        const time = new Date(call.timestamp).toLocaleTimeString();
        const modelName = MODEL_PRICING[call.model]?.name || call.model;

        row.innerHTML = `
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${time}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${call.type}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px;">${modelName}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${call.inputTokens.toLocaleString()}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${call.outputTokens.toLocaleString()}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">$${call.cost.toFixed(4)}</td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('statsModal').style.display = 'flex';
};

// Create stats modal
function createStatsModal() {
    const modal = document.createElement('div');
    modal.id = 'statsModal';
    modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center;';

    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; max-width: 800px; width: 90%; max-height: 80vh; overflow: auto; padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #111827;">📊 Detailed Usage Stats</h2>
                <button onclick="closeStatsModal()" style="background: none; border: none; font-size: 24px; cursor: pointer;">✕</button>
            </div>

            <div style="margin-bottom: 20px; padding: 16px; background: #f9fafb; border-radius: 8px;">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Total Cost</div>
                        <div style="font-size: 20px; font-weight: 700; color: #10b981;">$${sessionStats.totalCost.toFixed(4)}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Input Tokens</div>
                        <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${sessionStats.totalInputTokens.toLocaleString()}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Output Tokens</div>
                        <div style="font-size: 20px; font-weight: 700; color: #8b5cf6;">${sessionStats.totalOutputTokens.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                    <tr style="background: #f9fafb;">
                        <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Time</th>
                        <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Type</th>
                        <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Model</th>
                        <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Input</th>
                        <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Output</th>
                        <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Cost</th>
                    </tr>
                </thead>
                <tbody id="statsTableBody"></tbody>
            </table>

            <div style="margin-top: 16px; text-align: center; font-size: 12px; color: #6b7280;">
                Showing last 20 calls • Session started ${new Date(sessionStats.startTime).toLocaleString()}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeStatsModal();
        }
    });
}

window.closeStatsModal = function() {
    document.getElementById('statsModal').style.display = 'none';
};

// Initialize
loadSessionStats();
updateCostDisplay();

// Update display every 5 seconds
setInterval(updateCostDisplay, 5000);

console.log('✅ Token Tracker loaded');
