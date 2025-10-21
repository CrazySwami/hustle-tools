#!/bin/bash

# Start local web server for HTML to Elementor converter
# This allows .env file to be loaded properly

echo "🚀 Starting HTML to Elementor Converter..."
echo "📂 Serving from: $(pwd)"
echo ""
echo "✅ Server will start at: http://localhost:8000"
echo "🌐 Open this URL in your browser: http://localhost:8000"
echo ""
echo "⚠️  Keep this terminal window open while using the app"
echo "🛑 Press Ctrl+C to stop the server"
echo ""
echo "─────────────────────────────────────────────────────"
echo ""

# Start Python HTTP server
python3 -m http.server 8000
