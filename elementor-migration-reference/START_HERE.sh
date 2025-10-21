#!/bin/bash

# Elementor JSON Editor → Next.js Migration Package
# Single command to access everything you need

PACKAGE_DIR="/Users/alfonso/Documents/GitHub/HT-Elementor-Apps/MIGRATION_PACKAGE"

clear
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   📦 ELEMENTOR JSON EDITOR → NEXT.JS MIGRATION PACKAGE                   ║
║                                                                           ║
║   Complete migration kit with all code, docs, and templates              ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

EOF

echo "📍 Package Location:"
echo "   $PACKAGE_DIR"
echo ""

echo "📚 Available Commands:"
echo ""
echo "   1. Read Migration Guide     → ./START_HERE.sh guide"
echo "   2. List All Files           → ./START_HERE.sh list"
echo "   3. Quick Start              → ./START_HERE.sh quick"
echo "   4. Copy to Next.js Project  → ./START_HERE.sh copy <destination>"
echo "   5. Open in Finder           → ./START_HERE.sh open"
echo "   6. Zip Package              → ./START_HERE.sh zip"
echo ""

# Handle commands
case "$1" in
    guide)
        echo "📖 Opening Master Migration Guide..."
        echo ""
        cat "$PACKAGE_DIR/MASTER_MIGRATION_GUIDE.md" | less
        ;;

    list)
        echo "📂 Package Contents:"
        echo ""
        cd "$PACKAGE_DIR"
        tree -L 2 2>/dev/null || find . -maxdepth 2 -type f -o -type d | sort
        ;;

    quick)
        echo "🚀 Quick Start Guide:"
        echo ""
        cat "$PACKAGE_DIR/QUICK_START.txt"
        ;;

    copy)
        if [ -z "$2" ]; then
            echo "❌ Error: Please specify destination"
            echo "   Usage: ./START_HERE.sh copy /path/to/your-nextjs-project"
            exit 1
        fi

        DEST="$2/elementor-migration-reference"

        echo "📦 Copying migration package to:"
        echo "   $DEST"
        echo ""

        mkdir -p "$DEST"
        cp -r "$PACKAGE_DIR"/* "$DEST/"

        echo "✅ Done! Package copied to:"
        echo "   $DEST"
        echo ""
        echo "📖 Next steps:"
        echo "   cd $DEST"
        echo "   cat QUICK_START.txt"
        ;;

    open)
        echo "📂 Opening package in Finder..."
        open "$PACKAGE_DIR"
        ;;

    zip)
        echo "📦 Creating migration package zip..."
        cd "$PACKAGE_DIR/.."
        ZIP_NAME="elementor-migration-kit-$(date +%Y%m%d).zip"
        zip -r "$ZIP_NAME" MIGRATION_PACKAGE
        echo ""
        echo "✅ Created:"
        echo "   $PACKAGE_DIR/../$ZIP_NAME"
        ;;

    *)
        echo "💡 Quick Access Paths:"
        echo ""
        echo "   📘 Master Guide:"
        echo "      $PACKAGE_DIR/MASTER_MIGRATION_GUIDE.md"
        echo ""
        echo "   📚 All Documentation:"
        echo "      $PACKAGE_DIR/REFERENCE_DOCS/"
        echo ""
        echo "   💻 Source Code:"
        echo "      $PACKAGE_DIR/SOURCE_CODE/"
        echo ""
        echo "   🎨 Next.js Templates:"
        echo "      $PACKAGE_DIR/NEXTJS_TEMPLATES/"
        echo ""
        echo "───────────────────────────────────────────────────────────────────────────"
        echo ""
        echo "🎯 EASIEST PATH TO MIGRATE:"
        echo ""
        echo "   # 1. Go to your Next.js project"
        echo "   cd /path/to/your-nextjs-project"
        echo ""
        echo "   # 2. Copy this package as reference"
        echo "   $PACKAGE_DIR/START_HERE.sh copy ."
        echo ""
        echo "   # 3. Read the guide"
        echo "   cat elementor-migration-reference/MASTER_MIGRATION_GUIDE.md | less"
        echo ""
        echo "   # 4. Copy template files"
        echo "   cp elementor-migration-reference/NEXTJS_TEMPLATES/*.json ."
        echo "   cp elementor-migration-reference/NEXTJS_TEMPLATES/*.js ."
        echo ""
        echo "   # 5. Copy source modules to lib/"
        echo "   mkdir -p lib"
        echo "   cp elementor-migration-reference/SOURCE_CODE/modules/* lib/"
        echo ""
        echo "   # 6. Copy playground script to public/"
        echo "   mkdir -p public"
        echo "   cp elementor-migration-reference/SOURCE_CODE/playground.js public/"
        echo ""
        echo "   # 7. Copy styles to app/"
        echo "   cp elementor-migration-reference/SOURCE_CODE/styles/chat-editor-styles.css app/"
        echo ""
        echo "   # 8. Follow MASTER_MIGRATION_GUIDE.md for React components"
        echo ""
        echo "───────────────────────────────────────────────────────────────────────────"
        echo ""
        echo "💡 Tips:"
        echo "   • Run without arguments to see this help"
        echo "   • Run with 'guide' to read full migration guide"
        echo "   • Run with 'copy <path>' to copy to your Next.js project"
        echo ""
        ;;
esac
