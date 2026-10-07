# Agentic Architect

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](https://github.com/Samrude1/Agentic-Architect)
[![Status](https://img.shields.io/badge/Status-Alpha%20%2F%20In%20Active%20Development-orange.svg)](https://github.com/Samrude1/Agentic-Architect)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-46%20Passing-brightgreen.svg)](./tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

> An AI-powered fullstack architecture visualizer and code generation engine for technical founders, software architects, and solo developers — transforming plain-language requirements into interactive 4-tier system diagrams, Prisma schemas, API handlers, and React UI components.

> [!WARNING]
> **Project Status: Active Alpha / Work in Progress (WIP)**
>
> ⚠️ **Notice**: This software is in early **Alpha** and under active daily development. While the visual React Flow canvas, streaming AI Co-Pilot, and Diff-based local disk writer are functional, end-to-end code generation workflows (**Data Gates 1–3**) are currently undergoing live field testing and stabilization.
>
> - **Experimental Code**: APIs, prompts, and templates may change without notice.
> - **Safe Testing Recommended**: Never run direct disk writes against mission-critical production directories. Always use a clean test workspace and review every change via the interactive Diff Preview dialog.
> - **Feedback Welcome**: If you encounter bugs, visual glitches, or unexpected behaviors, please file an issue or pull request!

---

## 📸 Preview

> Open the playground, paste a product requirement, and watch the AI Co-Pilot generate a live visual architecture diagram in real time. Click any node to inspect, edit, and audit it with AI.

---

## ✨ Key Features

- **🧠 AI Architecture Generation**: Paste a prompt or drop a spec document (`.pdf`, `.txt`, `.md`) and the AI agent automatically generates a structured 4-tier architecture diagram with layered nodes and annotated edges.
- **🎨 Interactive Visual Canvas**: Explore your architecture on a React Flow canvas with animated signal edges, auto-layout across Client → API Gateway → Services → Data tiers, and one-click node inspection.
- **🔍 Node Inspector & AI Audit**: Click any canvas node to edit its title, tech tags, and read AI-generated Finnish/English descriptions. Trigger per-node or full-system AI architecture audits.
- **💬 Co-Pilot AI Chat**: An embedded streaming chat assistant (powered by Vercel AI SDK + OpenRouter) lets you iterate on the architecture in natural language — _"Add a Redis cache layer"_ and the canvas updates live.
- **🗄️ Data Gate 1 — Prisma Schema Generator**: Converts the visual architecture graph into a syntactically valid `schema.prisma` file and writes it directly to your local project folder.
- **🔌 Data Gate 2 — API Code Generator**: Generates production-ready Next.js Route Handlers and Server Actions with Zod validation schemas, directly scaffolded to your target path.
- **🖼️ Data Gate 3 — UI Component Generator**: Produces React 19 + Tailwind CSS feature components with live state, search filtering, and modal forms, ready to write to disk.
- **🛡️ Two-Step Safe Disk Writer & Diff Preview**: Zero blind overwrites — every file write triggers an interactive line-by-line Diff modal (`+` additions, `-` deletions, line counts) for full user approval before touching the disk.
- **📦 Automatic Safety Backups (`.agentic-backup/`)**: When overwriting existing code, a timestamped snapshot is automatically created under `.agentic-backup/` before the write proceeds.
- **🔒 Path Sandboxing & Bounds Security**: Enforced server-side path allowlists and canonical containment checks prevent path traversal attacks beyond the user's selected Homebase directory.
- **📤 Multi-Format Diagram Export**: One-click export of the canvas to PNG (2× retina), SVG vector, and Mermaid.js markdown (`.mmd` / `.md`).
- **🔒 Quality Suite**: Built-in one-click OWASP Security Check and Code Optimization audit with an interactive scorecard modal.
- **💾 Project Persistence**: Save, load, and manage architecture sessions in a local SQLite database. Resume any project from the dashboard.

---

## 🛠️ Tech Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | SSR, routing, Server Actions, API routes |
| **UI Library** | React 19 | Component model, Concurrent Mode |
| **Styling** | Tailwind CSS v4 | Utility-first dark-mode design system |
| **Canvas** | `@xyflow/react` v12 | Interactive visual architecture diagram engine |
| **AI / LLM** | Vercel AI SDK v7 + OpenRouter | Streaming chat co-pilot, structured tool calling |
| **Database ORM** | Prisma v7 + libSQL (SQLite) | Local project persistence schema |
| **Validation** | Zod v4 | End-to-end type-safe payload validation |
| **PDF Parsing** | `pdf-parse` v2 | Spec document ingestion from `.pdf` files |
| **Testing** | Vitest v5 + Testing Library | 46 unit & security tests |
| **Language** | TypeScript (strict) | Full type safety across frontend and backend |

---

## 📋 Prerequisites

Ensure the following are installed on your local machine:

- **Node.js**: `v20.x` or higher
- **npm**: `v10+`
- **OpenRouter API Key**: Required for live AI features. Get one free at [openrouter.ai](https://openrouter.ai/) (GPT-4o-mini model used by default).

---

## 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Samrude1/Agentic-Architect.git
   cd Agentic-Architect
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Update the values according to the [Environment Variables](#-environment-variables) section below.

4. **Initialize the database:**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | ✅ Yes | `file:./dev.db` | SQLite database file path via Prisma libSQL adapter |
| `OPENROUTER_API_KEY` | ✅ Yes | — | OpenRouter API key for AI features. Get at [openrouter.ai/keys](https://openrouter.ai/keys). Without this key, the app runs in **Smart Fallback mode** (pre-built diagrams, no live AI). |

> **Security Note**: Never commit `.env.local` to version control. It is listed in `.gitignore` by default.

---

## 📜 Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `dev` | `npm run dev` | Starts Next.js dev server with hot reload on `localhost:3000` |
| `build` | `npm run build` | Produces optimized production build |
| `start` | `npm run start` | Runs the production server locally |
| `lint` | `npm run lint` | Runs ESLint static analysis across the codebase |
| `test` | `npm run test` | Runs Vitest unit & security test suite (46 tests) |
| `test:watch` | `npm run test:watch` | Runs Vitest in interactive watch mode |

---

## 🏛️ System Architecture

The application follows a clean 4-tier architecture:

```
User / Architect
    │
    ├── File Parser Action (pdf-parse)      ← Spec Document Ingestion
    ├── React Flow Architecture Canvas      ← Visual Diagram Engine
    ├── Node Detail Inspector & Editor      ← Live Node State Management
    ├── Chat Sidebar (Vercel AI SDK)        ← Co-Pilot Streaming
    │       └── /api/chat Route
    │               └── Architecture Agent Engine (OpenRouter)
    ├── Codegen Server Actions
    │       ├── AI Prisma Schema Generator  ← Data Gate 1
    │       ├── API Route Handler Generator ← Data Gate 2
    │       ├── UI Component Generator      ← Data Gate 3
    │       └── Local File System Writer
    └── Project Management Actions
            └── SQLite Database (Prisma ORM)
```

For full details, refer to [.agents/blueprint/ARCHITECTURE.md](.agents/blueprint/ARCHITECTURE.md) and the [Architectural Decision Records](docs/adr/).

---

## 🚨 Operations & Troubleshooting

For deployment runbooks, emergency rollback procedures, and secret rotation steps, refer to [RUNBOOK.md](RUNBOOK.md).

---

## 🗺️ Roadmap & Maturity Status

| Component / Feature | Maturity | Current Status & Notes |
| :--- | :---: | :--- |
| **Visual Architecture Canvas** | 🟢 Stable | 4-tier React Flow layout, animated signals, custom node styles |
| **AI Co-Pilot Streaming** | 🟢 Stable | AI SDK 7 SSE streaming, quick-prompt chips, 3-step progress HUD |
| **Safe Diff Preview & Sandboxing** | 🟢 Stable | LCS-diff verification, automatic `.agentic-backup/`, allowlists |
| **Data Gate 1: Prisma DB Schema** | 🟡 Alpha | Schema generation & local disk writer (in active testing) |
| **Data Gate 2: Next.js API Routes** | 🟡 Alpha | Route Handler & Zod validation generation (in active testing) |
| **Data Gate 3: React 19 UI Dashboards** | 🟡 Alpha | Feature dashboard code generator (in active testing) |
| **Pipeline Bridge (Chat-to-Gate Sync)** | ⚪ Planned | Direct code update channel from Co-Pilot to Data Gates |
| **Automated End-to-End Tests** | ⚪ Planned | Full Cypress / Playwright user flow validation |
| **Multi-file Document Dropzone** | ⚪ Planned | Support for ingesting complex, multi-document architecture briefs |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

*Built with ❤️ as a solo developer productivity tool. Designed to save architects hours of boilerplate planning and scaffold work.*
