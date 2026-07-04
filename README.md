# 🧠 Agentic Fullstack Template (Anti-SaaS)

Welcome to the **Agentic Fullstack Template**. This is not just another Next.js boilerplate. It is a highly opinionated, AI-first development environment designed for **Autonomous Engineering**. 

Instead of relying on expensive, closed-ecosystem SaaS products (like Clerk, Trigger.dev, or Liveblocks), this template provides a robust, self-hosted "Anti-SaaS" architecture (Next.js 15, Auth.js, AWS SQS/Lambda, FastAPI).

Most importantly, it includes an **AI Brain** (`.agents/` directory) that forces your AI coding assistant (like Antigravity IDE, Claude, or Cursor) to act like a disciplined Senior Engineer, rather than a junior developer writing spaghetti code.

---

## 🚀 The Secret Sauce: The `.agents` Directory

AI agents are fast, but without discipline, they create technical debt. This template solves that with the `.agents` workspace—a set of rules, workflows, and cognitive skills that your AI assistant must read and follow.

### 📁 Structure
- **`/context`**: The Ground Truth. Inspired by JS Mastery's Spec-Driven Dev methodology. Contains your `project-overview.md`, `architecture.md`, `database-schema.md`, `ui-registry.md`, and `env-context.md`. The AI reads this before modifying *any* code.
- **`/workflows`**: The Processes. Defines *what* the AI should do (e.g., API development, Database migrations, CI/CD setup).
- **`/skills`**: The Cognitive Tools. Defines *how* the AI should think and execute. Includes commands like `/init`, `/architect`, `/optimize`, `/test`, and `/review`.
- **`/feature-specs`**: The History. A permanent, numbered archive (`01-feature.md`) of all approved implementation plans, providing a perfect spec-driven audit trail.

---

## ⚙️ The Engineering Loop

You don't tell the AI to "just build a feature". You put it through the **Engineering Loop**.

1. **Architect (`/architect`)**: The AI creates an Implementation Plan and surfaces architectural decisions. It waits for your approval.
2. **Develop**: The AI writes the code according to the approved plan.
3. **Review (`/review`)**: The AI audits its own code against the project's architecture and design system.
4. **Imprint (`/imprint`)**: If a new UI component was built, the AI extracts the design tokens and saves them to `ui-registry.md` to guarantee perfect consistency in the future.
5. **Remember (`/remember save`)**: At the end of the session, the AI saves the state to `memory.md` so it never loses context between days.

---

## 🛠️ How to Start Using This Template

1. **Clone & Initialize**
   ```bash
   git clone https://github.com/yourusername/agentic-fullstack-template.git my-new-project
   cd my-new-project
   npm install
   ```

2. **Set Your Project Context**
   Go to the `.agents/context/` directory and fill in the 4 generic template files (`project-overview.md`, `architecture.md`, etc.) with the specific goals and tech stack of your new app.

3. **Engage the AI**
   Open your AI editor (Antigravity IDE, Cursor, etc.). Give your first prompt to kick off the project by handing it your vision and the workflow:
   > *"Read `docs/future-project-vision.md` to understand the goal. Let's start building it. Follow the `.agents/workflows/new-feature-workflow.md`."*

4. **Follow the Loop**
   Watch the AI run `/architect`, ask for your approval, build the feature, and run `/review`.

---

## 📦 Tech Stack (Anti-SaaS Philosophy)
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4 + Custom UI Registry
- **Auth**: Auth.js / NextAuth (Self-hosted)
- **Background Jobs**: AWS SQS + AWS Lambda
- **AI Agent Backend**: FastAPI + LangGraph/CrewAI

*Built for engineers who want to own their stack and lead their AI.*

---
