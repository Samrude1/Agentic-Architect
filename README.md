# 🧠 Agentic Architect

**An AI-driven fullstack development platform that translates business requirements and specifications into interactive visual architecture diagrams and production-ready code.**

---

## 🚀 Overview

Agentic Architect is a platform designed for technical founders, software architects, and developers to iterate on system designs interactively. It bridges the gap between high-level business requirements (or uploaded specification documents) and technical implementation by combining human oversight with autonomous AI agents.

Users can input a project description or upload specification files (`.pdf`, `.txt`, `.md`). The system generates an interactive **Visual Architecture Canvas** (using React Flow) representing UI components, APIs, backend services, and database layers. The user and AI Co-Pilot work together in a real-time **Playground** workspace with staged quality gates:
1. **Visual Canvas**: Interactive 4-tier system modeling and AI audits.
2. **Data Gate 1**: Automated Prisma database schema generation (`schema.prisma`).
3. **Data Gate 2**: Automated Next.js App Router Route Handlers (`route.ts`) and Server Actions with Zod validation.

---

## ✨ Key Features & Current Status

### 1. 🧪 Interactive Playground Workspace & Node Inspector
- **Text & Document Parsing (.pdf, .txt, .md)**: Input a freeform description or upload a specification document. The server automatically parses content with native `pdf-parse` v2 support.
- **Visual Architecture Canvas**: 4-tiered structured React Flow diagram (Client → Gateway → Services → Database) with automatic layout positioning to prevent node overlap and animated signal pulse edge flows.
- **Node Detail Inspector**: Click any node on the canvas to inspect, rename, edit technology tags, or view AI-generated descriptions in real time.
- **Mandatory AI Node Descriptions**: AI automatically generates comprehensive descriptions for every node, pre-populating the Node Inspector.
- **AI Node & Architecture Audit**: Trigger node-specific or project-wide AI checks ("AI Tarkista tämä node" & "AI Tarkista arkkitehtuuri") directly from the canvas workspace.
- **Real-Time AI Co-Pilot & Smart Fallback Engine**: Conversational interface powered by Vercel AI SDK + OpenRouter API, backed by an intelligent prompt-based fallback engine that ensures customized architecture diagrams are generated even under third-party API rate limits.
- **Vibrant Visual Animations**: Floating high-tech AI status banners on the canvas, bouncing bot indicators, and pulsing progress overlays.

### 2. 🗄️ Data Gate 1: Prisma Database Schema Generation
- **AI Prisma Schema Generator**: Seamlessly transition from visual architecture diagrams to the first quality gate where AI designs production-ready Prisma database schemas (`schema.prisma`) in standard English.
- **Project Homebase Directory (`targetPath`)**: Define the local folder path on disk for your project's codebase (acting like a visual IDE).
- **Direct Filesystem Persistence**: Write generated database schemas directly to `{targetPath}/prisma/schema.prisma` with a single click and strict path traversal bounds validation.
- **Syntax-Highlighted Code Viewer**: Built-in `CodeViewer` component with one-click code copy and live schema updates.

### 3. ⚡ Data Gate 2: Backend API Routes & Server Actions
- **AI Backend Code Generator**: Translates Layer 1 (API / Gateway / Auth) and Layer 2 (Services / Workers) into production-ready Next.js App Router Route Handlers (`GET` and `POST`) and Server Actions.
- **Strict Zod Input Validation**: Every mutation endpoint and action is typed and guarded by Zod validation schemas (`CreateTaskSchema`, `UpdateTaskSchema`, etc.).
- **Uniform Response Envelopes**: Consistent API response contract: `ApiResponse<T>` (`{ success: true, data }` or `{ success: false, error: { code, message, details } }`).
- **One-Click Local Disk Writer**: Safely write generated API code directly to `{targetPath}/src/app/api/endpoints/route.ts`.

### 4. 🧪 Automated Testing & Security (Vitest + jsdom)
- **Comprehensive Test Suite**: 22 automated unit and integration tests passing with 0 failures (`npm test`).
- **Security & Path Bounds Verification**: Intercepts directory traversal attacks (`../../etc/passwd`, `..\..\windows\...`) to protect filesystem writes.
- **Isolated Secrets**: API keys isolated in `.env.local`, with clean `.env.example` templates committed.

### 5. 🗂️ Project Management & Persistence
- **Instant Project Persistence**: Save Playground sessions directly into SQLite via Prisma ORM.
- **Project Listing & Deletion**: Manage multiple projects, view statuses, and remove draft projects with confirmation dialogs.
- **Edit in Playground**: Re-open any saved project directly in the Playground workspace to reload its prompt, architecture canvas, and code gates.

---

## 📁 Project Structure

```
├── src/
│   ├── agents/                   # AI Agent engines (architecture-agent.ts)
│   ├── app/                      # Next.js App Router pages & Server Actions
│   │   ├── actions/              # Server Actions (codegen.ts, file-parser.ts, project.ts)
│   │   ├── api/chat/             # Vercel AI SDK Co-Pilot API route (streaming)
│   │   ├── playground/           # Interactive Playground page (Canvas, Gate 1, Gate 2)
│   │   └── projects/[id]/        # Saved project detail view
│   ├── components/               # UI components
│   │   ├── architecture-canvas.tsx   # React Flow visual canvas
│   │   ├── chat-sidebar.tsx          # AI Co-Pilot chat interface
│   │   ├── code-viewer.tsx           # Syntax-highlighted code viewer & copy tool
│   │   ├── delete-project-button.tsx # Project deletion button with confirmation
│   │   ├── idea-input-form.tsx       # Homepage input form & file dropzone
│   │   ├── node-inspector.tsx        # Node Detail Inspector & manual editor
│   │   └── playground-workspace.tsx  # Main Playground workspace container
│   └── lib/                      # Prisma database client & utilities
├── tests/                        # Vitest automated unit & integration test suite
│   ├── setup.ts                  # Global test setup (Next.js mocks, jsdom)
│   └── unit/                     # Unit test suites (security, parser, agent, codegen)
├── prisma/                       # Prisma SQLite schema & migrations
├── docs/                         # Project vision documentation
├── .agents/                      # Solo Dev Kit blueprint & cognitive memory
│   ├── blueprint/                # PRD, Architecture, Security Audit, Status, Dev Log
│   ├── rules/                    # Engineering standards & guidelines
│   └── skills/                   # Specialized agent workflow skills
└── vitest.config.mts             # Vitest test runner configuration
```

---

## 💡 Roadmap

1. **📤 Architecture Export Capabilities**
   - Export canvas diagrams as image assets (PNG/SVG) or documentation formats (Markdown / Mermaid.js).
2. **🎨 Data Gate 3: UI Component Generator & Design System**
   - Auto-generate React / Tailwind CSS UI components corresponding to Layer 0 Client nodes.
3. **📄 Multi-file Specification Upload**
   - Support uploading multiple specification documents simultaneously to feed complex project requirements into the AI Co-Pilot.

---

## 🛠️ Getting Started

### Prerequisites

Ensure you have Node.js (v18+) and npm installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Samrude1/Agentic-Architect.git
   cd Agentic-Architect
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Setup environment variables:
   Copy `.env.example` to `.env.local` and add your OpenRouter API key:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local`:
   ```env
   DATABASE_URL="file:./dev.db"
   OPENROUTER_API_KEY="sk-or-v1-your-openrouter-key"
   ```

4. Push database schema:
   ```bash
   npx prisma db push
   ```

5. Run automated tests:
   ```bash
   npm test
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to launch Agentic Architect!
