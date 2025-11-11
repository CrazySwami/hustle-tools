# MF-Workstation

**AI-Powered Workspace & Development Platform by Mirror Factory**

MF-Workstation is a comprehensive white-label AI workspace that combines document management, AI chat capabilities, WordPress/Elementor development tools, and visual editing—all in one unified platform.

![MF-Workstation](./public/MF-Workstation-Logo.png)

## ✨ Key Features

### 📝 Document Management
- **Rich Text Editor** - TipTap-powered editor with markdown support, comments, and real-time collaboration
- **Supabase Integration** - Cloud-based document storage with folders and organization
- **Auto-save & Manual Save** - Never lose your work with intelligent auto-saving
- **Drag & Drop Sidebar** - Organize documents, folders, and Dittos with intuitive drag-and-drop

### 🤖 AI Chat Interface
- **Multiple AI Models** - Support for OpenAI, Anthropic (Claude), Google, and Perplexity
- **Streaming Responses** - Real-time AI responses with Vercel AI SDK
- **Tool Integration** - Extensible tool system for custom AI capabilities
- **Web Search** - Enable web search with Perplexity for up-to-date information
- **Source Citations** - View and verify sources when using web search

### 🎨 Elementor Development Suite
A complete WordPress/Elementor development environment with browser-based WordPress Playground integration:

#### Visual & Code Editors
- **GrapeJS Visual Editor** - Drag-and-drop visual builder with:
  - 3-column layout: Blocks panel, Canvas, Styles panel
  - Real-time visual editing with live preview
  - Bidirectional sync with code editor
  - Responsive preview (Desktop/Tablet/Mobile)
  - CSS cascade inspector showing inline, class, and global styles

- **Monaco Code Editor** - Professional code editing for HTML/CSS/JS with:
  - Syntax highlighting and IntelliSense
  - Live preview panel
  - Settings configuration
  - Diff-based AI code editing

#### WordPress Integration
- **Live WordPress Playground** - Browser-based WordPress instance with:
  - Elementor, Yoast SEO, Hello Elementor theme pre-installed
  - Real-time preview and testing
  - Import/export functionality

- **Section Library** - Manage and organize multiple sections with drag-to-reorder
- **Style Guide Editor** - Visual style guide with global CSS management
- **Site Content Manager** - Complete WordPress settings and pages CRUD

#### AI-Powered Widget Generation
- **⚡ Generate Widget** - Convert HTML/CSS to Elementor widgets using Claude Sonnet 4.5
- Automatic CSS scoping with `{{WRAPPER}}` prefix
- Comprehensive control generation for all elements
- Real-time streaming PHP generation

### 🔧 Advanced Features
- **Resizable Panels** - 2-panel and 3-panel layouts with draggable dividers
- **Dark/Light Mode** - Full theme support with customizable branding
- **Custom Branding** - White-label with logo, colors, and company information
- **Firecrawl Integration** - Website mapping and content scraping
- **Image Processing** - Image manipulation and generation tools

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or later
- npm, yarn, or pnpm
- Supabase account (for document storage)
- Vercel AI Gateway API key
- Firecrawl API key (optional, for site crawling)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mirror-factory/MF-Workstation.git
   cd MF-Workstation
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create `.env.local` in the root directory:
   ```env
   # AI Gateway
   AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # OpenAI (optional)
   OPENAI_API_KEY=your_openai_key

   # Firecrawl (optional)
   FIRECRAWL_API_KEY=your_firecrawl_key

   # Other APIs (optional)
   PEXELS_API_KEY=your_pexels_key
   UNSPLASH_ACCESS_KEY=your_unsplash_key
   BRANDFETCH_API_KEY=your_brandfetch_key
   ```

4. **Set up Supabase database:**

   Run the migrations in your Supabase SQL Editor:
   ```bash
   # Run files in order:
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_disable_rls_for_development.sql
   supabase/migrations/003_setup_development_mode.sql
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Document Editor (`/chat-doc`)
1. Create new documents with the "+ New" button
2. Write with the rich text editor (supports markdown)
3. Save manually with Cmd/Ctrl+S or let auto-save handle it
4. Organize documents in folders using the sidebar
5. Chat with AI about your document content

### Elementor Editor (`/elementor-editor`)
1. **Code Editor Tab** - Write HTML/CSS/JS with Monaco editor
2. **Visual Editor Tab** - Design visually with drag-and-drop
3. **Section Library** - Save and manage reusable sections
4. **WordPress Playground** - Test in live WordPress environment
5. **Style Guide** - Define global styles and typography
6. **Generate Widget** - Convert your design to Elementor widget

### AI Chat (`/chat`)
1. Select your preferred AI model
2. Enable tools for enhanced capabilities
3. Toggle web search for real-time information
4. View source citations for research

## 🏗️ Architecture

### Tech Stack
- **Framework:** Next.js 15.4.6 with App Router and Turbopack
- **UI Library:** React 19 with Shadcn/UI
- **Editor:** TipTap (rich text), Monaco (code), GrapeJS (visual)
- **AI SDK:** Vercel AI SDK with streaming support
- **Database:** Supabase (PostgreSQL)
- **Drag & Drop:** @dnd-kit
- **Styling:** Tailwind CSS with CSS variables
- **Theme:** next-themes for dark/light mode

### Project Structure
```
MF-Workstation/
├── src/
│   ├── app/                      # Next.js pages
│   │   ├── chat/                 # AI chat interface
│   │   ├── chat-doc/             # Document editor
│   │   ├── elementor-editor/     # Elementor development
│   │   ├── firecrawl/            # Site crawler
│   │   └── api/                  # API routes
│   ├── components/
│   │   ├── ai-elements/          # AI UI components
│   │   ├── editor/               # TipTap editor components
│   │   ├── elementor/            # Elementor components
│   │   ├── layouts/              # Layout components
│   │   └── ui/                   # Shadcn UI components
│   ├── lib/                      # Utilities and helpers
│   ├── hooks/                    # React hooks
│   └── contexts/                 # React contexts
├── public/                       # Static assets
├── supabase/                     # Database migrations
└── docs/                         # Documentation
```

## 🎨 Customization

### Branding
Edit branding settings at `/branding-settings`:
- Company name
- Logo (light & dark mode)
- Primary color
- Background colors
- Footer text

### Adding AI Tools
See [docs/how-to-make-tools.md](./docs/how-to-make-tools.md) for detailed instructions.

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

### Core Documentation
- [UI Stack Guide](./docs/ui-stack.md) - UI libraries and component guidelines
- [GrapeJS Visual Editor](./docs/grapejs-visual-editor.md) - Visual editor integration
- [Diff-Based Code Editing](./docs/diff-based-code-editing.md) - AI code editing
- [WordPress Playground Guide](./docs/WORDPRESS_PLAYGROUND_IMPORT_GUIDE.md) - WP integration
- [Firecrawl Integration](./docs/fire-crawl-docs.md) - Site crawling tools
- [Models Reference](./docs/models.md) - Supported AI models

### Development Guides
- [How to Make Tools](./docs/how-to-make-tools.md) - Creating AI tools
- [Supabase Auth Setup](./docs/Main%20Doc%20%E2%80%93%20Supabase%20Auth%20Setup.md) - Authentication
- [Sidebar Implementation](./docs/Main%20Doc%20%E2%80%93%20Sidebar%20Implementation%20Status.md) - Sidebar features

## 🔐 Security Notes

**⚠️ Development Mode:**
- Authentication is currently disabled for development
- Row Level Security (RLS) is disabled on database tables
- All operations use a placeholder user ID
- **DO NOT deploy to production without re-enabling security!**

To re-enable for production:
1. Enable RLS on all Supabase tables
2. Remove placeholder user ID from API routes
3. Implement proper authentication flow
4. Use environment variables instead of hardcoded credentials

## 🚢 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables
4. Deploy

### Other Platforms
```bash
npm run build
npm run start
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Git Branching Strategy

**Development Workflow:**
- `MF-Workstation` - Active development branch
- `development` - Testing and QA
- `staging` - Pre-production testing
- `main` - Production releases

Workflow: `MF-Workstation` → `development` → `staging` → `main`

## 📝 License

Copyright © 2024 Mirror Factory. All rights reserved.

## 🙋 Support

For issues, questions, or feature requests:
- GitHub Issues: [MF-Workstation/issues](https://github.com/mirror-factory/MF-Workstation/issues)
- Documentation: `/docs` directory
- Email: support@mirrorfactory.com

---

**Made with ❤️ by Mirror Factory**
