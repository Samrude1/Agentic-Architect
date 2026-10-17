# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

*(Planned items post-MVP)*

### Planned
- Multi-file document dropzone support
- Automated Cypress E2E browser testing coverage
- Team collaboration via shared project links
- Cloud deployment packaging (Vercel / Railway)

## [1.4.1] - 2026-10-17

> **Zero-Config Turnkey Execution & Post-Mortem Hardening** — SQLite zero-config defaults, pre-bundled active `.env`, automated Prisma-to-TypeScript contract generation (`src/types/index.ts`), strict UI import rules forbidding phantom modules, and 2-step setup (`npm install && npm run setup`).

### Added
- **Zero-Config SQLite Default**: Configured both Prisma LLM system prompt and scaffold engine to default to `provider = "sqlite"` and `DATABASE_URL="file:./dev.db"`, eliminating Postgres connection errors on non-configured machines.
- **Pre-Bundled Active `.env`**: Bundled `.env` alongside `.env.example` in both `.zip` archives and local directory scaffolding.
- **Automated Shared TypeScript Contracts (`generateTypeScriptContracts`)**: Automatically parses Prisma schema models and outputs typed TypeScript interfaces directly to `src/types/index.ts`, eliminating phantom type imports.
- **Combined Setup Script**: Added `"setup": "npx prisma db push && npm run dev"` and `"autoprefixer": "^10.4.20"` to generated `package.json`.
- **Strict UI Generation Rules**: Hardened Gate 3 system prompt to forbid phantom module imports (`@/api/...`, `// Assume...`) and uninstalled packages (`next-auth/react`), while strictly enforcing 4 KPI analytics cards and master-detail modal inspection.

### Fixed
- **PostCSS / Tailwind Error**: Added `autoprefixer` dependency to scaffolded `package.json` to prevent build crashes in fresh environments.
- **Path Security Allowlist**: Added `.env` and `src/types/index.ts` to `ALLOWED_SCAFFOLD_PATHS` in `path-security.ts`.

## [1.4.0] - 2026-10-17

> **Turnkey Project Handover, Packaging & Scaffolding Engine** — One-click standalone `.zip` export (JSZip) with turnkey Next.js 15 App Router boilerplate, local target folder scaffolding with automated backups, interactive 5-step IDE quickstart guide, and Co-Pilot handover guidance trigger.

### Added
- **Turnkey Project Handover Engine (`src/app/actions/handover.ts`)**: Generates standalone Next.js 15 App Router applications (`package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`, `src/lib/prisma.ts`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `README.md`, `docs/ARCHITECTURE.md`) bundling all Gate 1-3 codes into a single downloadable `.zip` package via `JSZip`.
- **Local Target Folder Scaffolding (`scaffoldProjectTargetFolder`)**: Scaffolds missing root files directly into the active project directory on disk (`pulsedesk`) with automated timestamped backups under `.agentic-backup/`.
- **Project Handover Modal (`ProjectHandoverModal`)**: Interactive dialog with 3 tabs:
  1. *Paketointi & Luovutus*: Instant `.zip` download with file count indicator and local folder scaffolding.
  2. *Asennus- & IDE-ohjeet*: 5-step IDE setup guide (VS Code, Cursor, Windsurf, Antigravity) with one-click copyable quickstart commands (`npm install && npx prisma db push && npm run dev`).
  3. *Co-Pilot Opastus*: 1-click trigger sending a tailored handover prompt directly into the Co-Pilot chat.
- **Workflow & Header Integration**: Added prominent `[ 📦 Paketoi ]` button in `WorkspaceHeader` and automatic next-step progression in Gate 3 (`[ 🎉 Kaikki 3 Gatea valmiina! Paketoi ja luovuta projekti ➔ ]`).
- **Scaffold Security Guardrails (`path-security.ts`)**: Added `ALLOWED_SCAFFOLD_PATHS` and `validateProjectScaffoldWritePath` with strict directory traversal prevention.
- **Testing**: Added unit test suite `tests/unit/handover.test.ts` (6 tests). Total Vitest suite passing: **60 tests across 13 test files (100%)**.

### Fixed
- **Modal Width & Button Clipping**: Fixed Tailwind CSS v4 dialog max-width constraint (`w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl`) and added responsive two-line button layout to prevent text clipping on long project names.

## [1.3.1] - 2026-10-12

> **Foolproof UX & Unambiguous Gate Step Progression** — Simplified single-action workflow for non-technical users, step banners (Vaihe 1/3, 2/3, 3/3), sequential next-step buttons upon disk writes, and reactive header state badges.

### Added
- **Unambiguous Primary Action Priority (`gate1-schema-tab.tsx`, `gate2-api-tab.tsx`, `gate3-ui-tab.tsx`)**: Replaced competing buttons with a single clear primary action per gate state. When AI updates are staged, the only highlighted button is a pulsating emerald `[💾 Tallenna muutokset levylle]`.
- **Step-by-Step Visual Guidance Banners**: Added explicit Finnish plain-language banners for each gate (`⚡ Vaihe 1/3`, `2/3`, `3/3`) explaining what was modified and what to click next.
- **Sequential Next-Step Guidance (`onNavigateNext`)**: Added direct green completion banners with automatic next-step progression buttons:
  - Gate 1 saved ➔ `[ Siirry Gate 2:een (API) ➔ ]`
  - Gate 2 saved ➔ `[ Siirry Gate 3:een (UI) ➔ ]`
  - Gate 3 saved ➔ `[ 🎉 Kaikki 3 Gatea valmiina! Avaa kaavio ➔ ]`
- **Dynamic Header Status Badges (`workspace-header.tsx`)**: Välilehdet näyttävät sykkivän keltaisen merkkivalon (`⚡ Odottaa tallennusta`) tallentamattomille AI-päivityksille ja vihreän merkin (`✓`) levylle tallennetuille tiedostoille.

### Fixed
- **Canvas Empty Edge Crash**: Eliminated empty `{}` edge objects from PulseDesk SQLite database and added auto-sanitization fallback in React Flow.
- **Deterministic Studio AI Handler**: Prioritized structured studio analysis over LLM hallucinations in chat endpoint.

---

## [1.3.0] - 2026-10-12

> **Codebase Optimization Suite & Platform Stability** — Automated deep codebase scanner, live progress audit banner, interactive confirmation gate, Co-Pilot AI optimization tool, React 19 render cycle fixes, and Mermaid export guards.

### Added
- **Automated Codebase Optimization Scanner (`src/app/actions/audit.ts`)**: Direct local static code analysis inspecting the target project disk for bloated files (> 1,000 lines), spaghetti anti-patterns (nested callbacks, multi-responsibility files), missing composite database indexes (`@@index([userId, status])`), Next.js cache revalidation, and missing React memoization in ~140ms.
- **Interactive Confirmation Gate (`ConfirmActionDialog`, `workspace-header.tsx`, `playground-workspace.tsx`)**: Reusable modal dialog preventing accidental triggers by explicitly prompting the user before launching code audits or optimizations.
- **Live Progress Audit Banner (`workspace-header.tsx`)**: Prominent top status banner with animated spinner providing real-time feedback during ongoing code audits.
- **AI Co-Pilot Code Optimization Tool (`apply_code_optimization` in `/api/chat`, `ChatSidebar.tsx`)**: Enables Co-Pilot to directly inspect, optimize, and stage refactored code across Data Gates with user approval.

### Fixed
- **React 19 Render Cycle Crash (`playground-workspace.tsx`)**: Eliminated illegal `startTransition` calls inside state updater callbacks (`handleArchitectureUpdate`), preventing infinite render loops and Node.js process out-of-memory crashes.
- **Mermaid Export Null-Safety Guard (`src/lib/mermaid-export.ts`)**: Hardened `sanitizeNodeId(id)` against undefined/null IDs to eliminate `TypeError: Cannot read properties of undefined (reading 'replace')` in `ExportModal`.
- **Optimization Action Syntax (`src/app/actions/audit.ts`)**: Cleaned syntax errors and duplicate braces in server actions.

---

## [1.2.0] - 2026-10-12

> **Live Workspace Bridge & Co-Pilot Topology Awareness** — Bi-directional state bridge (Ihminen ⟷ Agentti), real-time edge topology awareness, resilient partial graph merging, position guards, and staged gate callout banners.

### Added
- **Live Workspace Bridge (`src/types/workspace-context.ts`, `ChatSidebar.tsx`, `route.ts`)**: Bi-directional context passing where Co-Pilot receives real-time active tab, staged code, audit findings, and can directly mutate Data Gates (`update_gate_code`).
- **Full Architecture Topology Awareness (`/api/chat`)**: Co-Pilot receives live source-to-target connection graphs (`[Source] --[edge]--> [Target]`), eliminating guesswork and enabling precise architectural diagnosis.
- **Staged Gate Action Callout Banners (`workspace/gate*.tsx`)**: Eye-catching callout banners on Gate 1 (Prisma), Gate 2 (API), and Gate 3 (UI) tabs indicating AI staged changes with a 1-click `[💾 Tallenna muutokset levylle]` button opening Diff preview.
- **Auto-Resume Project on Playground Reload (`src/app/playground/page.tsx`)**: Visiting `/playground` without parameters now automatically redirects to the active project rather than loading an empty canvas.

### Fixed
- **Layer 3 Node Misidentification Bug (`buildSecureArchitecture`)**: Fixed condition that previously renamed all nodes at `y === 500` to `PostgreSQL Database`, properly distinguishing PostgreSQL (database), Redis (cache & queue), and External Webhooks.
- **Node Inspector Crash on Single-Node Audit (`playground-workspace.tsx`, `route.ts`)**: Implemented partial graph merging so that running single-node audits merges updates into existing nodes rather than wiping out the rest of the canvas.
- **React Flow Position Guard**: Added automatic position coordinate resolution ensuring nodes never throw runtime errors due to undefined positions.

### Changed
- **Documentation Center (`docs/`)**: Restructured documentation into a 3-tier hierarchy: Master Executive Brief (`01-master-brief-agentic-suite.md`), Part 1 Development System (`02-part1-agentic-development-system.md`), and Part 2 Agentic Architect Platform (`03-part2-agentic-architect-platform.md`), with updated `docs/README.md` reading guide and root `README.md` cross-links.

---

## [1.1.0] - 2026-10-02

> **Agent Experience & AI SDK 4/7 Streaming Upgrade** — Real-time streaming fix, Co-Pilot interactive UX, canvas completion banners, and responsive layout polish.

### Added
- **Interactive Co-Pilot Empty State**: Rich welcoming card with a 1-click `[⚡ Käynnistä Co-Pilot -analyysi]` trigger and 3 pre-built architecture quick-prompt chips (scalability, security & auth, cache & queues).
- **Dynamic 3-Phase Live Progress HUD**: Animated status indicator showing real-time analysis phases (*1/3 Puretaan vaatimusmäärittelyä*, *2/3 Lasketaan integraatioita*, *3/3 Viimeistellään suosituksia*).
- **Analysis Completion Status Badge**: `✓ Analyysi valmis • Co-Pilot aktiivinen` visual indicator appended to completed assistant messages.
- **Canvas Completion Banner**: Floating dismissible notification banner with 1-click CTA to `[Luo Tietokantamalli (Gate 1) →]`.
- **Canvas Agent Working HUD Overlay**: Glassmorphism status overlay displaying real-time step checkmarks during architecture graph synthesis.

### Fixed
- **AI SDK 7 Streaming Integration (`/api/chat`)**: Replaced broken `toDataStreamResponse()` with `toUIMessageStreamResponse()`, enabling native SSE event streams for `@ai-sdk/react` 4.0.
- **Message Structure Normalization (`/api/chat`)**: Added automatic normalization converting `@ai-sdk/react` 4.0 `UIMessage` `parts` into CoreMessage `content` strings, eliminating `AI_TypeValidationError`.
- **Co-Pilot Send Hook (`ChatSidebar.tsx`)**: Replaced deprecated `append` with modern `chat.sendMessage({ text })` method and added universal fallback.
- **Header Title Overlap (`PlaygroundWorkspace.tsx`)**: Added truncation, `min-w-0`, and `shrink-0` bounds to prevent long project titles from wrapping into 3 lines and covering top bar buttons on smaller screens.

---

## [1.0.0] - 2026-09-15

> **MVP Release** — Production-ready AI architecture visualizer and fullstack code generation engine.

### Added
- **AI Architecture Generation**: Prompt or PDF/MD/TXT spec input → AI-generated 4-tier React Flow diagram with Finnish node descriptions via OpenRouter (GPT-4o-mini).
- **Interactive Visual Canvas**: `@xyflow/react`-based diagram with animated signal edges, tier auto-layout (Client → API Gateway → Services → Data), and full pan/zoom support.
- **Node Inspector**: Slide-over panel for live node title & tag editing, AI-generated Finnish/English descriptions, and single-node AI audit trigger.
- **AI Co-Pilot Chat**: Vercel AI SDK streaming chat sidebar with `update_architecture` tool calling for live canvas mutations from natural language.
- **Smart Fallback Mode**: Automatic `generateSmartPromptArchitecture()` fallback when no API key is configured — ensures the app is always functional.
- **Data Gate 1 — Prisma Schema Generator**: AI converts architecture graph to valid `schema.prisma` and writes it directly to `{targetPath}/prisma/schema.prisma`.
- **Data Gate 2 — API Code Generator**: Generates Next.js Route Handlers and Server Actions with Zod validation; writes to local target directory.
- **Data Gate 3 — UI Component Generator**: Generates React 19 + Tailwind CSS feature components with live state, search, and modal forms; writes to local target directory.
- **Multi-Format Diagram Export**: PNG (2× retina), SVG vector, and Mermaid.js `.mmd`/`.md` export via `export-modal.tsx` and `mermaid-export.ts`.
- **Smart Tech Stack Inference**: `tech-stack.ts` auto-detects app tier (Lightweight / Standard / Heavy SaaS) and generates `.env.local.example` with exact API key instructions.
- **Quality Suite**: One-click OWASP Security Check and Code Optimization audit with interactive `audit-modal.tsx` scorecard.
- **Confirmation Safety Gates**: `confirm-action-dialog.tsx` ("Oletko varma?") prevents accidental disk writes and destructive actions.
- **Project CRUD**: Save, load, update, and delete architecture sessions in local SQLite DB via Prisma (`project.ts` server actions).
- **File Parsing**: `file-parser.ts` extracts clean text from `.pdf`, `.txt`, and `.md` spec documents using `pdf-parse` v2 native class support.
- **Automated Test Suite**: 34 Vitest unit and security tests across 9 test files covering security bounds, file parsing, and the architecture engine.

### Changed
- Upgraded to Next.js 16.3.5 with security hardening.
- Upgraded Vercel AI SDK to v7 with structured streaming tool calling.

### Fixed
- Enforced mandatory Finnish node descriptions in AI tool schema and system prompts.
- Resolved `playground-workspace.tsx` modularization into `workspace/` subcomponents (`Gate1SchemaTab`, `Gate2ApiTab`, `Gate3UiTab`, `HomebasePathCard`).
- Applied `path.relative` path traversal check on all filesystem write actions.
- Sanitized sample API key placeholders to avoid false-positive Secret Scanning alerts.

### Security
- API keys isolated strictly to `.env.local` (server-side only, never bundled to client).
- `OPENROUTER_API_KEY` guard in `route.ts` — falls back safely if key is missing or placeholder.
- Strict path bounds validation in `codegen.ts` prevents directory traversal attacks.
- Resolved 4 tracked CVEs in `@prisma/config` dev sub-dependencies (runtime unaffected).
- Applied `npm audit fix` and updated CSP headers in `next.config.ts`.

---

## [0.4.0] - 2026-09-14

### Added
- Workspace modularization: extracted Gate tabs and HomebasePathCard into `src/components/workspace/`.
- Canvas diagram export: PNG (2×), SVG, Mermaid.js (Step 4 complete).
- Data Gate 3: React 19 UI Component Generator with live metrics, search, and modal forms.

---

## [0.3.0] - 2026-09-10

### Added
- Data Gate 2: Next.js Route Handlers and Server Actions generator with Zod validation.
- Vitest test suite: 19 initial tests covering security bounds and file parsing.
- Quality Suite: Security Check (OWASP) and Optimize Code audit modals.
- Smart Tech Stack Inference and `.env.local.example` auto-generator.
- Confirmation dialog ("Oletko varma?") for heavy actions.

---

## [0.2.0] - 2026-09-05

### Added
- Data Gate 1: AI Prisma schema generator and direct local disk write.
- Project CRUD: Save and load sessions from SQLite.
- `pdf-parse` v2 integration for spec document ingestion.

---

## [0.1.0] - 2026-09-01

### Added
- Initial application scaffold with Next.js 16 App Router and React 19.
- Interactive React Flow canvas with 4-tier architecture layout.
- Node Detail Inspector and AI Architecture Audit features.
- AI Co-Pilot chat with Vercel AI SDK and OpenRouter integration.
- Smart Fallback architecture generator for offline/keyless use.
