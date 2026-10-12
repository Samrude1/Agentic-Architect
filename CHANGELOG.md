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
