# Agentic Architect

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](https://github.com/Samrude1/Agentic-Architect)
[![Version](https://img.shields.io/badge/version-1.0.0--MVP-blueviolet.svg)](https://github.com/Samrude1/Agentic-Architect/releases)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-34%20Passing-brightgreen.svg)](./tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

> An AI-powered fullstack architecture visualizer and code generation engine for technical founders, software architects, and solo developers — transforming plain-language requirements into interactive 4-tier system diagrams, Prisma schemas, API handlers, and React UI components.

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
| **Testing** | Vitest v5 + Testing Library | 34 unit & security tests |
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
| `test` | `npm run test` | Runs Vitest unit & security test suite (34 tests) |
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

## 🗺️ Roadmap

- [ ] Multi-file document dropzone support
- [ ] Automated Cypress E2E test coverage
- [ ] Team collaboration (shared project links)
- [ ] Cloud deployment target (Vercel / Railway)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

*Built with ❤️ as a solo developer productivity tool. Designed to save architects hours of boilerplate planning and scaffold work.*
