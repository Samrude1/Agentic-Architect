# Agentic Architect 🏛️

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](https://github.com/Samrude1/Agentic-Architect)
[![Status](https://img.shields.io/badge/Status-Production--Ready%20Architecture-emerald.svg)](https://github.com/Samrude1/Agentic-Architect)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-54%20Passing%20(100%25)-brightgreen.svg)](./tests/)
[![Security](https://img.shields.io/badge/Security-OWASP%20Grade%20A-brightgreen.svg)](./.agents/blueprint/SECURITY_AUDIT.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

> **The Deterministic AI Architecture & Code Generation Platform** for software architects, technical founders, and solo developers. Transforms plain-language requirements and PRDs into interactive 4-tier system diagrams, Prisma schemas, Next.js API routes, and React 19 UI components through strict human-in-the-loop quality gates.

---

### 📑 Executive & Strategic Documentation
> Katso koko dokumentaation lukujärjestys ja roolikohtaiset oppaat: **[📚 docs/README.md](docs/README.md)**

- 🏛️ **[01 — Master Executive Brief (FI)](docs/01-master-brief-agentic-suite.md)** — Kokoava strateginen pääteos: Agentic Engineering Suite (Part 1 + Part 2), arvolupaus, ROI ja tiekartta.
- 📘 **[02 — Part 1: Development System Report (FI)](docs/02-part1-agentic-development-system.md)** — Tekninen raportti: Kognitiivinen kehitysmoottori, 18 agenttityökalua, muistiprotokolla ja OWASP Shift-Left.
- 📗 **[03 — Part 2: Agentic Architect Platform Report (FI)](docs/03-part2-agentic-architect-platform.md)** — Tekninen raportti: Visuaalinen 4-tasoinen kangas, 3 Data Gatea ja turvallinen levykirjoitus.
- 🛡️ **[Security Audit Report](.agents/blueprint/SECURITY_AUDIT.md)** — OWASP Top 10 compliance (Grade A: 95/100), sandbox path containment ja nolla CVE-haavoittuvuutta.

---

> [!NOTE]
> **Deterministic AI vs. "Vibe Coding"**: Unlike unconstrained LLM generators that cause architectural drift and security vulnerabilities, Agentic Architect strictly enforces **3 Quality Gates (Data Gates)**, typed Zod validation, line-by-line Diff inspection, and sandboxed path containment before any code touches the filesystem.

---

## 📸 Preview

> Open the playground, paste a product requirement, and watch the AI Co-Pilot generate a live visual architecture diagram in real time. Click any node to inspect, edit, and audit it with AI.

---

## ✨ Key Features

- **🧠 AI Architecture Generation**: Paste a prompt or drop a spec document (`.pdf`, `.txt`, `.md`) and the AI agent automatically generates a structured 4-tier architecture diagram with layered nodes and annotated edges.
- **🎨 Interactive Visual Canvas**: Explore your architecture on a React Flow canvas with animated signal edges, auto-layout across Client → API Gateway → Services → Data tiers, and one-click node inspection.
- **🔍 Node Inspector & AI Audit**: Click any canvas node to edit its title, tech tags, and read AI-generated Finnish/English descriptions. Trigger per-node or full-system AI architecture audits.
- **💬 Co-Pilot AI Chat**: An embedded streaming chat assistant (powered by Vercel AI SDK + OpenRouter) lets you iterate on the architecture in natural language — _"Add a Redis cache layer"_ and the canvas updates live.
- **🌉 Live Workspace Bridge (Ihminen ⟷ Agentti)**: Bi-directional state awareness between the workspace (Canvas & Gates) and Co-Pilot. The AI reads active tabs, staged code, audit scores, and directly stages updates into Data Gates.
- **🧭 Real-Time Topology Awareness & Resilience**: Co-Pilot receives live source-to-target connection graphs (`[Source] --[edge]--> [Target]`), eliminating passive guessing. Partial node edits intelligently merge into existing canvas nodes with position guards.
- **📢 Staged Gate Callout Banners**: When AI stages code updates for Data Gates (Prisma, API, UI), prominent callout banners guide the developer to inspect and write changes to disk with 1-click Diff preview.
- **🗄️ Data Gate 1 — Prisma Schema Generator**: Converts the visual architecture graph into a syntactically valid `schema.prisma` file and writes it directly to your local project folder.
- **🔌 Data Gate 2 — API Code Generator**: Generates production-ready Next.js Route Handlers and Server Actions with Zod validation schemas, directly scaffolded to your target path.
- **🖼️ Data Gate 3 — UI Component Generator**: Produces React 19 + Tailwind CSS feature components with live state, search filtering, and modal forms, ready to write to disk.
- **🛡️ Two-Step Safe Disk Writer & Diff Preview**: Zero blind overwrites — every file write triggers an interactive line-by-line Diff modal (`+` additions, `-` deletions, line counts) for full user approval before touching the disk.
- **📦 Automatic Safety Backups (`.agentic-backup/`)**: When overwriting existing code, a timestamped snapshot is automatically created under `.agentic-backup/` before the write proceeds.
- **🔒 Path Sandboxing & Bounds Security**: Enforced server-side path allowlists and canonical containment checks prevent path traversal attacks beyond the user's selected Homebase directory.
- **📤 Multi-Format Diagram Export**: One-click export of the canvas to PNG (2× retina), SVG vector, and Mermaid.js markdown (`.mmd` / `.md`).
- **🔒 Quality Suite**: Built-in one-click OWASP Security Check and Code Optimization audit with an interactive scorecard modal.
- **💾 Project Persistence & Auto-Resume**: Save, load, and manage architecture sessions in a local SQLite database. Seamlessly resumes your active project upon refresh or reload.

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
| **Testing** | Vitest v5 + Testing Library | 52 unit & security tests (12 suites, 100% pass) |
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
| `test` | `npm run test` | Runs Vitest unit & security test suite (52 tests, 100% passing) |
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
    ├── Chat Sidebar (Vercel AI SDK)        ← Co-Pilot Streaming (Ihminen ⟷ Agentti)
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
| **Live Workspace Bridge** | 🟢 Stable | Real-time state bridge (Ihminen ⟷ Agentti), stage banners, topology awareness |
| **Safe Diff Preview & Sandboxing** | 🟢 Stable | LCS-diff verification, automatic `.agentic-backup/`, allowlists |
| **Data Gate 1: Prisma DB Schema** | 🟢 Stable | Schema generation, relations & sandboxed disk writer |
| **Data Gate 2: Next.js API Routes** | 🟢 Stable | Type-safe Route Handlers & Zod validation generation |
| **Data Gate 3: React 19 UI Dashboards** | 🟢 Stable | Feature dashboard components with Tailwind CSS |
| **Dogfooding & Quality Harness** | 🟢 Stable | 52/52 Vitest suites passing, OWASP Grade A (95/100) |
| **Automated End-to-End Tests** | ⚪ Planned | Full Playwright autonomous agent-in-the-loop repair cycle |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

*Built with ❤️ as a solo developer productivity tool. Designed to save architects hours of boilerplate planning and scaffold work.*
