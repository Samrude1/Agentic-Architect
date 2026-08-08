# 🧠 Agentic Architect

**An AI-driven fullstack development platform that translates business requirements and specifications into interactive visual architecture diagrams and production-ready code.**

---

## 🚀 Overview

Agentic Architect is a platform designed for technical founders, software architects, and developers to iterate on system designs interactively. It bridges the gap between high-level business requirements (or uploaded specification documents) and technical implementation by combining human oversight with autonomous AI agents.

Users can input a project description or upload specification files (`.pdf`, `.txt`, `.md`). The system generates an interactive **Visual Architecture Canvas** (using React Flow) representing UI components, APIs, backend services, and database layers. The user and AI Co-Pilot work together in a real-time **Playground** workspace to refine the architecture before moving to implementation.

---

## ✨ Key Features & Current Status

### 1. 🧪 Interactive Playground Workspace & Node Inspector
- **Text & Document Parsing (.pdf, .txt, .md)**: Input a freeform description or upload a specification document. The server automatically extracts plain text via `pdf-parse` integration.
- **Visual Architecture Canvas**: 4-tiered structured React Flow diagram (Client → Gateway → Services → Database) with automatic layout positioning to prevent node overlap and animated signal pulse edge flows.
- **Node Detail Inspector**: Click any node on the canvas to inspect, rename, edit technology tags, or view AI-generated descriptions in real time.
- **Mandatory AI Node Descriptions**: AI automatically generates comprehensive Finnish descriptions for every node, pre-populating the Node Inspector.
- **AI Node & Architecture Audit**: Trigger node-specific or project-wide AI checks ("AI Tarkista tämä node" & "AI Tarkista arkkitehtuuri") directly from the canvas workspace.
- **Real-Time AI Co-Pilot & Smart Fallback Engine**: Conversational interface powered by Vercel AI SDK + OpenRouter API, backed by an intelligent prompt-based fallback engine that ensures customized architecture diagrams are generated even under third-party API rate limits.
- **Vibrant Visual Animations**: Floating high-tech AI status banners on the canvas, bouncing bot indicators, and pulsing progress overlays.

### 2. 🗂️ Project Management & Editing
- **Instant "Tallenna Projekti" (Save Project)**: Save fresh Playground sessions into Prisma DB with a single click, allowing instant persistence and project listing on the dashboard.
- **Project Deletion**: Remove unwanted test or draft projects with a single click from the project details view.
- **Edit in Playground**: Re-open any saved project directly in the Playground workspace to reload its prompt and architecture canvas for further refinement and live database persistence.

### 3. 🔒 Accessibility & Performance
- **Inter Typography Upgrade**: Accessible typography scale with a baseline minimum text size of 14px (`0.875rem`) using Google Inter font.
- Type-safe Next.js App Router architecture, Server Actions, and strict Zod schemas.
- API keys (`OPENROUTER_API_KEY`) are kept strictly server-side, ensuring complete security for production deployment.

---

## 📁 Project Structure

```
├── src/
│   ├── agents/                   # AI Agent engines (architecture-agent.ts)
│   ├── app/                      # Next.js App Router pages & Server Actions
│   │   ├── actions/              # Server Actions (file-parser.ts, project.ts)
│   │   ├── api/chat/             # Vercel AI SDK Co-Pilot API route (tool calling)
│   │   ├── playground/           # Interactive Playground page
│   │   └── projects/[id]/        # Saved project detail view
│   ├── components/               # UI components
│   │   ├── architecture-canvas.tsx   # React Flow visual canvas
│   │   ├── chat-sidebar.tsx          # AI Co-Pilot chat interface
│   │   ├── delete-project-button.tsx # Project deletion button with confirmation
│   │   ├── idea-input-form.tsx       # Homepage input form & file dropzone
│   │   ├── node-inspector.tsx        # Node Detail Inspector & manual editor
│   │   └── playground-workspace.tsx  # Main Playground workspace container
│   └── lib/                      # Prisma database instance
├── prisma/                       # Prisma SQLite/PostgreSQL schema & migrations
├── docs/                         # Project vision documentation
└── .agents/                      # AI Platform Agent Workspace (rules, context, skills)
```

---

## 💡 Future Roadmap

1. **🚀 Code Generation Phase (Data Gate 1)**
   - "Save & Start Building" integration: Transition from architecture design to the first quality gate where AI generates ready-to-use Prisma database schemas and project scaffolding based on inspected nodes.
2. **📤 Architecture Export Capabilities**
   - Export canvas diagrams as image assets (PNG/SVG) or documentation formats (Markdown / Mermaid.js).
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
   npm install
   ```

3. Setup environment variables:
   Create a `.env` file in the root directory and add your OpenRouter API key:
   ```env
   DATABASE_URL="file:./dev.db"
   OPENROUTER_API_KEY="sk-or-v1-your-openrouter-key"
   ```

4. Push database schema:
   ```bash
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to launch Agentic Architect!
