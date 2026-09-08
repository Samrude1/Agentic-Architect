# Product Requirements Document (PRD.md) - Agentic Architect

This document is the official Product Requirements specification for **Agentic Architect** (Fullstack AI Architecture & Scaffolding Engine).

---

## 1. Overview
- **Project Name**: Agentic Architect (`anti-saas-architecture-app`)
- **Type**: AI-Driven Fullstack Architecture Visualizer & Code Generation Engine
- **Target Users**: Technical founders, software architects, solo developers, and engineering leads.
- **Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma (SQLite), @xyflow/react (React Flow), Vercel AI SDK, OpenRouter AI API.
- **Design Style**: High-Tech Dark Mode, Vibrant AI Accents, Inter Typography Scale, Animated Canvas Signal Edge Flows.

---

## 2. Core Features & User Stories

1. **Freeform Specification & Document Input**:
   - As a user, I want to paste a prompt or drop standard document files (`.pdf`, `.txt`, `.md`) so that the AI can extract and process system requirements.

2. **Interactive Visual Architecture Canvas**:
   - As an architect, I want to view a 4-tier visual diagram (Client Layer → API Gateway → Services & Logic → Data Layer) with auto-layout and node detail inspectors so that I can refine system boundaries.

3. **Node Inspector & AI Auditing**:
   - As a developer, I can click any node to customize technology tags, read AI descriptions in Finnish/English, and trigger specific node audits ("AI Tarkista tämä node") or full system checks.

4. **Co-Pilot AI Chat Assistant**:
   - As an engineer, I can chat with an embedded AI co-pilot powered by Vercel AI SDK to iterate on architecture diagrams in real time with prompt fallback support.

5. **Prisma Schema Generation & Local Disk Scaffolding**:
   - As a fullstack developer, I can generate production-grade Prisma database schemas from the visual canvas and write them directly to my local project folder (`targetPath/prisma/schema.prisma`).

6. **Project Persistence & Management**:
   - As a user, I can save interactive playground sessions into SQLite DB, load them anytime, and manage (view/edit/delete) saved projects from the dashboard home page.

---

## 3. Pages & Navigation

| Page / Route | Component / File | Description |
| :--- | :--- | :--- |
| Home (`/`) | `src/app/page.tsx`, `idea-input-form.tsx` | Hero workspace, prompt input, document uploader, saved project dashboard |
| Playground (`/playground`) | `src/app/playground/page.tsx`, `playground-workspace.tsx` | Visual React Flow canvas, node inspector, chat sidebar, schema generator |
| Project View (`/projects/[id]`) | `src/app/projects/[id]/page.tsx` | Saved project overview, detailed architecture inspection, code viewer & disk export |
| AI Chat API (`/api/chat`) | `src/app/api/chat/route.ts` | Vercel AI SDK streaming endpoint with tool calling capability |

---

## 4. Data Model & API Contracts

### Prisma Data Model (`prisma/schema.prisma`)
```prisma
model Project {
  id           String   @id @default(uuid())
  createdAt    DateTime @default(now())
  name         String
  status       String   @default("PLANNING")
  prompt       String?
  architecture String?  // Stringified JSON representing React Flow nodes & edges
  prismaSchema String?  // Generated schema.prisma code string
  targetPath   String?  // Target local directory path on disk
}
```

### Server Actions (`src/app/actions/`)
- `file-parser.ts`: `parseFileAction(formData)` -> extracts text content from `.pdf`, `.txt`, `.md`.
- `codegen.ts`: `generatePrismaSchemaAction(architecture, prompt)`, `writePrismaSchemaToDiskAction(targetPath, schema)`.
- `project.ts`: `saveProjectAction(data)`, `updateProjectAction(id, data)`, `deleteProjectAction(id)`, `getProjectAction(id)`.

---

## 5. Acceptance Criteria
- [x] Document parsing extracts clean text from `.pdf`, `.txt`, and `.md` files.
- [x] Visual Canvas renders 4 tier layers without overlapping nodes.
- [x] Node inspector allows live text and tag editing with immediate canvas node state sync.
- [x] Co-Pilot AI streams responses and can generate or update canvas architectures.
- [x] Schema generator converts architecture nodes into syntactically valid Prisma SQLite schemas.
- [x] Local disk write action correctly targets `{targetPath}/prisma/schema.prisma`.
- [ ] Automated Vitest / Cypress unit and E2E test coverage.
- [ ] Multi-file document dropzone support.
