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
