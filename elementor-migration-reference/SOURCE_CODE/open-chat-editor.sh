#!/bin/bash
# Quick launcher for Chat Editor

echo "🚀 Opening Chat Editor..."
echo "URL: http://localhost:8080/chat-editor.html"
echo ""

# Check if server is running
if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "⚠️  Server not running. Starting server..."
    cd /Users/alfonso/Documents/GitHub/HT-Elementor-Apps/hustle-elementor-webapp
    python3 -m http.server 8080 &
    sleep 2
    echo "✅ Server started on port 8080"
fi

# Open in default browser
open http://localhost:8080/chat-editor.html

echo ""
echo "📋 Quick Start:"
echo "1. Click 'Set API Key' and enter your OpenAI key"
echo "2. Click 'Load Sample' to load example JSON"
echo "3. Type: 'What widgets do I have?'"
echo ""
echo "📖 Full guide: TEST_GUIDE.md"
