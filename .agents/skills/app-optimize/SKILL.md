---
name: app-optimize
description: >-
  Refactors codebase, untangles spaghetti code, decomposes monolithic files, and optimizes fullstack architecture. Use this skill whenever the user requests code refactoring, cleanup, modularization, monolith splitting, or runs /optimize, /refactor, or /clean.
---

# App Codebase Optimization & Monolith Refactoring Skill

This skill guides the agent in conducting deep, structural code refactoring and codebase optimization across the entire fullstack application. While `app-review` performs high-level audits and scorecards, and `app-perf` focuses on runtime metrics (Core Web Vitals and bundle size), **`app-optimize` actively executes code-level transformations**: identifying and untangling spaghetti logic, breaking massive monolithic files into clean modular components, eliminating dead code, and enforcing architectural decoupling.

---

## 🎯 Optimization Objectives

1. **Architecture Alignment**: Ground every refactoring decision in `.agents/blueprint/ARCHITECTURE.md` and `.agents/rules/fullstack-dev.md`.
2. **Monolith Decomposition**: Deconstruct god components, overloaded controllers, and multi-hundred-line files into single-responsibility, composable units (< 200–250 lines).
3. **Spaghetti Untangling**: Flatten deeply nested conditional branches, eliminate callback hell, remove circular references, and enforce deterministic unidirectional data flow.
4. **Separation of Concerns**: Strictly isolate UI presentation, state management, business logic, and data access layers.
5. **Zero Functional Regression**: Refactor with atomic steps, validating type safety (`npx tsc --noEmit`) and automated tests (`/test-unit`) at each milestone.

---

## 🔍 Step 1: Architectural & Codebase Discovery

Before touching any code, analyze the project structure and map dependencies:

1. **Read Blueprint Context**:
   - Inspect `.agents/blueprint/ARCHITECTURE.md` to understand intended module boundaries, tech stack choices, and data flow.
   - Review `.agents/rules/fullstack-dev.md` for non-negotiable conventions (Zod envelopes, parameterization, component standards).
2. **Scan Codebase Topography**:
   - Map directory layout (`src/components/`, `src/app/`, `src/services/`, `src/lib/`, `src/api/`).
   - Identify oversized files (> 250–300 lines) using ripgrep or directory exploration:
     ```bash
     # Find files exceeding 250 lines
     git ls-files "*.ts" "*.tsx" "*.js" "*.jsx" | xargs wc -l | sort -nr
     ```
   - Map circular dependencies and tangled import paths.

---

## 🍝 Step 2: Code Smell & Spaghetti Detection Matrix

Audit targeted files for classic code smells and anti-patterns:

| Code Smell | Diagnostic Symptoms | Refactoring Remedy |
| :--- | :--- | :--- |
| **Monolithic God Component** | Component file > 250 lines; mixes fetch calls, local state, derived math, and complex JSX. | Split into Presentational + Container pattern, extract Custom Hooks (`use*`), and slice child components. |
| **Arrow Anti-Pattern / Deep Nesting** | Nested `if/else`, loops, and promises 4+ levels deep ("pyramid of doom"). | Flatten with Guard Clauses (early `return`), pattern matching, or strategy lookup maps. |
| **Prop Drilling Abyss** | Props passed down 3+ component levels without intermediate components using them. | Extract domain context, use compound components, or migrate to atomic state (Zustand/Jotai). |
| **Layer Leakage (Leaky Abstraction)** | Direct SQL/Prisma queries inside UI components, or UI formatting inside database queries. | Extract to dedicated service functions (`src/services/`) and standardized API routes (`src/api/`). |
| **God Function / Monster Handler** | Form submit or click handler > 60 lines containing validation, mutation, state changes, and alerts. | Extract sub-handlers: payload validation (`schema.parse`), service dispatch, and UI notification. |
| **Duplicated Logic (DRY Violation)** | Copy-pasted formatting, calculations, or query parameters across multiple files. | Centralize into typed utility functions (`src/lib/utils/`) or domain transformers. |
| **Dead Code & Zombie Imports** | Unused imports, orphaned helper functions, commented-out dead blocks, unused variables. | Prune aggressively with tree-shaking verification. |

---

## 🔨 Step 3: Refactoring Execution Protocols

Execute optimizations incrementally using proven architectural patterns:

### Protocol A: Monolith Component Slicing
When a UI component has grown into a monolith:
1. **Extract Business & State Logic into Custom Hooks**:
   ```tsx
   // ❌ Before: Monolithic Component mixing 10 useState/useEffect calls with JSX
   export function UserDashboard() {
     const [users, setUsers] = useState([]);
     const [loading, setLoading] = useState(true);
     const [filter, setFilter] = useState('');
     useEffect(() => { /* 40 lines of fetch logic */ }, [filter]);
     return <div>... 200 lines of mixed markup ...</div>;
   }

   // ✅ After: Extracted Custom Hook (src/hooks/useUserDashboard.ts)
   export function useUserDashboard(initialFilter = '') {
     // Encapsulate state, effects, and memoized handlers
     return { users, loading, filter, setFilter, handleUserDelete };
   }
   ```
2. **Deconstruct Markup into Focused Subcomponents**:
   - Extract table rows, modal dialogs, search bars, and card items into dedicated subcomponents under `src/components/<Feature>/components/`.
   - Maintain pure presentation props (`items`, `onSelect`, `isLoading`).

### Protocol B: Guard Clauses & Logic Flattening
Eliminate deep conditional nesting:
```typescript
// ❌ Before: Nested Spaghetti
function processPayment(user, order, payment) {
  if (user) {
    if (user.isActive) {
      if (order && order.items.length > 0) {
        if (payment.isValid) {
          return executeTransaction(order, payment);
        } else {
          throw new Error('Invalid payment');
        }
      } else {
        throw new Error('Empty order');
      }
    } else {
      throw new Error('User inactive');
    }
  } else {
    throw new Error('User not found');
  }
}

// ✅ After: Linear Guard Clauses
function processPayment(user, order, payment) {
  if (!user) throw new Error('User not found');
  if (!user.isActive) throw new Error('User inactive');
  if (!order || order.items.length === 0) throw new Error('Empty order');
  if (!payment.isValid) throw new Error('Invalid payment');

  return executeTransaction(order, payment);
}
```

### Protocol C: API Route & Service Decoupling
Separate HTTP transport from business logic:
```typescript
// ❌ Before: Monolithic API Route doing everything
export async function POST(req: Request) {
  const body = await req.json();
  // 50 lines of ad-hoc validation, DB calls, email sending, formatting...
}

// ✅ After: 3-Tier Layered Architecture
// 1. Route Handler (Transport & Validation)
export async function POST(req: Request) {
  const parsed = orderSchema.safeParse(await req.json());
  if (!parsed.success) return apiError('VALIDATION_ERROR', parsed.error.issues, 400);

  const result = await orderService.createOrder(parsed.data);
  return apiSuccess(result, 201);
}
// 2. Service Layer (src/services/orderService.ts) -> pure business logic
// 3. Data Access Layer (src/db/orders.ts) -> parameterized database queries
```

---

## 🛡️ Step 4: Verification & Regression Gate

Never declare an optimization complete without verifying behavior:

1. **Type Safety Verification**:
   ```bash
   npx tsc --noEmit
   ```
   Ensure zero new type errors or loose `any` casts introduced during refactoring.
2. **Linting & Formatting**:
   ```bash
   npm run lint
   ```
   Enforce zero warnings, clean import order, and dead code eradication.
3. **Unit & Integration Regression Test**:
   ```bash
   npm test
   ```
   Run automated unit tests (`app-test-unit`) to prove that inputs and outputs remain 100% identical.
4. **Visual & Behavioral Check**:
   If UI components were decomposed, run `/test` to verify browser layout, click handlers, and responsive styling.

---

## 📝 Step 5: Blueprint & Documentation Sync

Record architectural improvements in project memory:

1. **Update Architecture Blueprint**:
   - If new layers, directories, or services were created, update `.agents/blueprint/ARCHITECTURE.md`.
2. **Log Refactoring Metrics in `.agents/blueprint/DEV_LOG.md`**:
   - Files decomposed and new modules created.
   - Net lines of code reduced or condensed.
   - Code smells eradicated.
3. **Deliver Executive Optimization Report to Developer**:
   ```markdown
   ## ⚡ Codebase Optimization Summary

   - **Files Refactored**: [e.g. `src/app/checkout/page.tsx` (480 lines -> 3 modular files < 120 lines)]
   - **Monoliths Decomposed**: [Extracted `useCheckoutFlow` hook + `OrderSummaryCard` subcomponent]
   - **Spaghetti Cleaned**: [Replaced 5-level nested callback with linear async/await guard clauses]
   - **Layer Separation**: [Moved raw SQL from API handler into `src/services/checkoutService.ts`]
   - **Verification**: [✅ `tsc --noEmit` passed | ✅ Unit tests passed (14/14) | ✅ Zero ESLint warnings]
   ```

---

## 🚨 Error Handling & Fallbacks

1. **Circular Dependency Loops**:
   - If splitting files causes circular imports (`A -> B -> A`), introduce a neutral types/interfaces file (`types.ts`) or extract shared logic to `src/lib/`.
2. **Breaking Public Interface**:
   - When refactoring shared utilities or components, maintain backward-compatible barrel exports (`index.ts`) with `@deprecated` notices if callers cannot all be updated at once.
3. **Unexpected Test Failures**:
   - If tests fail after refactoring, revert to the last atomic git checkpoint and break down the refactoring into smaller single-function extractions. Never guess or patch broken logic with temporary hacks.
