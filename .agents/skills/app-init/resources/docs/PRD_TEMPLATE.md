# Product Requirements Document (PRD): {{PROJECT_NAME}}

## 1. Overview
- **Project Name**: {{PROJECT_NAME}}
- **Type**: {{TYPE}} (e.g., SaaS / E-Commerce / Dashboard / Portfolio / Blog / Internal Tool)
- **Target Users**: {{TARGET_USERS}}
- **Tech Stack**: {{TECH_STACK}}
- **Design Style**: {{DESIGN_STYLE}}

---

## 2. Core Features & User Stories
1. **As a [user type]**, I want to [action] so that [benefit].
2. **As a [user type]**, I want to [action] so that [benefit].
3. **As a [user type]**, I want to [action] so that [benefit].

---

## 3. Pages & Navigation
| Page | Route | Description |
| :--- | :--- | :--- |
| Home | `/` | Landing page |
| Dashboard | `/dashboard` | Main authenticated workspace |
| Auth | `/login`, `/register` | Authentication flows |
| Settings | `/settings` | User profile and preferences |

---

## 4. Data Model & API
- **Entities**: [User, etc.]
- **Database**: {{DATABASE}}
- **ORM**: {{ORM}}
- **API Style**: {{API_STYLE}} (REST / GraphQL / tRPC)
- **Auth Provider**: {{AUTH_PROVIDER}}

---

## 5. Acceptance Criteria
- [ ] All pages render without console errors
- [ ] Responsive layout works on mobile, tablet, and desktop
- [ ] Auth flow works end-to-end
- [ ] API endpoints return correct data with proper error handling
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] Core Web Vitals within thresholds (LCP < 2.5s, INP < 200ms, CLS < 0.1)

---

## 6. Technical Architecture Reference
See `.agents/blueprint/ARCHITECTURE.md` for system diagram, directory structure, and data flow.
