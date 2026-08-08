# Architecture Context

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Framework | Next.js (App Router) | Web application, API routes, and Server Actions |
| UI | Tailwind CSS + React Flow | Styling and visual architecture canvas |
| AI Engine | LangGraph | Complex, cyclic agent workflows and human-in-the-loop orchestration |
| Async Processing | AWS SQS + AWS Lambda | Resource-intensive AI process management and scaling |
| Preview | Sandpack / WebContainers | In-browser real-time preview of generated applications |

## System Boundaries

- `src/app` — Next.js App Router pages and layouts.
- `src/components` — Reusable UI components, including React Flow nodes and edges.
- `src/agents` — AI agents (`architecture-agent.ts` for automated React Flow diagram generation from prompts).
- `src/services/aws` — Integration with SQS and Lambda for background tasks.
- `src/services/preview` — Sandpack/WebContainer integration logic.

## Storage Model

- **Primary Database**: Project metadata, user configurations, generated schemas, and quality gate statuses.
- **Blob/File Storage**: Generated source code artifacts, temporary build files.

## Auth and Access Model

- Expert/Developer authentication to manage and approve agent outputs.
- Project ownership linking generated codebases to specific users/organizations.

## Invariants

1. Agents must not bypass quality gates; expert human approval is strictly required before moving between phases (Data -> Backend -> Design -> Features).
2. The output must always be a clean, independent source code repository without proprietary vendor lock-in.
3. Expensive AI models (Claude 3.5 Sonnet/GPT-4o) are reserved for architecture and complex logic; cheaper models (Gemini Flash/Haiku) are used for testing and validation.
