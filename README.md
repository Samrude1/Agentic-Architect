# 🧠 Agentic Architect

**An AI-driven fullstack development platform that translates business requirements into production-ready architecture using interactive visual canvases.**

---

## 🚀 Overview

Agentic Architect is a tool designed for technical founders, software architects, and developers to scale their expertise and automate routine coding tasks. It bridges the gap between high-level business requirements and technical implementation by combining human oversight with autonomous AI agents.

Instead of writing boilerplate or setting up basic infrastructure, users define their project through a high-level prompt. The system generates an interactive, node-based **Visual Architecture Canvas** (using React Flow) representing database models, APIs, and UI components. The user can tweak this architecture visually before letting AI agents generate the underlying code.

## ✨ Key Features

1. **Visual Architecture Canvas**
   - Automatically generates interactive architecture diagrams (nodes and edges) from text prompts.
   - Real-time visual editing of the system design before any code is written.

2. **Intelligent Workflow Orchestration**
   - Dynamic routing of tasks using AWS SQS and AWS Lambda for scalable AI background processing.
   - Leverages LangGraph for complex, cyclic agent workflows with built-in human-in-the-loop checkpoints.

3. **Autonomous Quality Assurance (Read-Act-Repeat-Plan-Stop)**
   - Test-driven code generation and validation.
   - AI agents analyze error logs and self-heal code to pass tests autonomously.

4. **Quality Gates & Human Oversight**
   - The development process is divided into logical phases (Data Models, Backend, Design System, Features).
   - Each phase requires expert approval, ensuring the AI does not deviate from the intended architecture.

5. **No Vendor Lock-In Delivery**
   - The final output is an independent, complete source code repository. You own the code and can deploy it anywhere (AWS, Vercel, etc.).

## 📦 Tech Stack

- **Frontend & Dashboard**: Next.js (App Router), Tailwind CSS, Shadcn/UI
- **Visual Canvas**: React Flow (`@xyflow/react`)
- **Database & ORM**: Prisma + SQLite (Local Dev) / PostgreSQL (Prod)
- **AI Engine**: LangGraph for cyclic agentic workflows
- **Async Processing**: AWS SQS + AWS Lambda
- **Preview Environment**: Sandpack / WebContainers for in-browser testing

---

## 🛠️ Getting Started

### Prerequisites

Ensure you have Node.js and npm installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/agentic-architect.git
   cd agentic-architect
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup the database:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You can start creating projects and generating visual architectures immediately!
