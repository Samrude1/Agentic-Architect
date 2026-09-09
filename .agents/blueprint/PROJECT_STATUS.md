# Project Status & Roadmap (PROJECT_STATUS.md) - Agentic Architect

This document tracks verified implementation progress, active feature matrix, technical debt, and sprint action plans for **Agentic Architect**.

---

## 1. Executive Status
- **Current State**: Phase 1 (Canvas), Data Gate 1 (Prisma), Data Gate 2 (Backend APIs), Quality Suite (Security & Optimize), Smart Tech Stack & .env Inference, Confirmation Dialogs & Automated Testing Suite (28 Vitest tests) Complete
- **Estimated Completion**: 98%
- **Last Updated**: 2026-09-09
- **Key Focus**:
  - Interactive Visual Canvas with tier layout & edge animation.
  - Node Inspector with live audit & AI descriptions.
  - Document parsing (`.pdf`, `.txt`, `.md`) with `pdf-parse` v2 native class support.
  - Data Gate 1: AI Prisma database schema generator & direct local disk write.
  - Data Gate 2: AI Next.js Route Handlers & Server Actions generator with Zod validation & local disk write.
  - Smart Tech Inference: Auto-detects lightweight apps (no DB/API keys needed) vs. heavy SaaS (PostgreSQL, Stripe, Resend).
  - Environment Guidance: Auto-generates `.env.local.example` with exact API key sourcing instructions and disk-writer.
  - Quality Suite: One-click "Security Check" and "Optimize Code" with interactive audit scorecard modal.
  - Confirmation Dialog ("Oletko varma?"): Prevents accidental background triggers or file overwrites.
  - Security & Path bounds validation enforced across filesystem writes.
  - Vitest automated testing suite with 28 passing tests (0 failures).

---

## 2. Feature Matrix

| Feature Domain | Module / Component | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Document Input** | `file-parser.ts`, `idea-input-form.tsx` | 🟩 Complete | Parses `.pdf`, `.txt`, `.md` into prompt context |
| **Visual Canvas** | `architecture-canvas.tsx` | 🟩 Complete | 4-tier React Flow diagram with custom node styles |
| **Node Inspector** | `node-inspector.tsx` | 🟩 Complete | Live node title, tag editing, AI descriptions, single-node audit |
| **AI Co-Pilot** | `architecture-agent.ts`, `/api/chat` | 🟩 Complete | Structured AI system breakdown & OpenRouter streaming |
| **Data Gate 1 (Prisma)** | `codegen.ts`, `code-viewer.tsx` | 🟩 Complete | AI Prisma schema generation & direct filesystem output |
| **Data Gate 2 (APIs)** | `codegen.ts`, `playground-workspace.tsx` | 🟩 Complete | Next.js Route Handlers & Server Actions generator with Zod validation |
| **Tech Inference & .env** | `tech-stack.ts`, `env-dialog.tsx` | 🟩 Complete | Auto-detects app tier (Lightweight/Standard/Heavy), DB need, and generates `.env.local.example` |
| **Quality Suite (Audit)** | `audit.ts`, `audit-modal.tsx` | 🟩 Complete | 1-click Security Check (OWASP) & Optimize Code with scorecard modal |
| **Safety / Confirmation** | `confirm-action-dialog.tsx` | 🟩 Complete | "Oletko varma?" confirmation gate before heavy actions/disk writes |
| **Project CRUD** | `project.ts`, `delete-project-button.tsx` | 🟩 Complete | Save/load/delete projects in SQLite DB |
| **Security & Paths** | `.env.local`, `codegen.ts` | 🟩 Complete | API key isolated in `.env.local`, strict path bounds validation |
| **Automated Testing** | Vitest (`tests/unit/`) | 🟩 Complete | 28 unit & security tests passing (utils, parser, paths, engine, codegen, audits, tech-stack) |
| **Export Formats** | — | ⬜ Planned | Canvas diagram export as PNG/SVG & Mermaid.js |

*Status Legend: 🟩 Complete | 🟨 In Progress | 🟥 Defect / Missing | ⬜ Planned*

---

## 3. Prioritized Action Plan

1. **Step 1: Security & Path Sanitization**: 🟩 Completed (Secrets in `.env.local`, `path.relative` path traversal check).
2. **Step 2: Test Infrastructure**: 🟩 Completed (Vitest + jsdom configured with 19 passing tests covering security bounds, file parsing, and architecture engine).
3. **Step 3: Data Gate 2 Code Generation**: 🟩 Completed (Next.js API route handlers, server actions, Zod validation schemas, workspace Gate 2 tab, and disk writer).
4. **Step 4: Export Formats & Next Gates**: Canvas diagram export as PNG/SVG & Mermaid.js, plus Gate 3 (UI Components).
