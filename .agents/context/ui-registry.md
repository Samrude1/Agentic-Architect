# UI Registry

## Design Tokens

### Colors
- **Primary**: `bg-primary text-primary-foreground` (from shadcn default)
- **Secondary**: `bg-secondary text-secondary-foreground` 
- **Background**: `bg-muted/30` / `bg-muted/40` - App background (Page container)
- **Text**: `text-foreground` - Primary typography color
- **Text Muted**: `text-muted-foreground` - Sub-text, captions, empty states
- **AI Accent**: `text-purple-500` / `text-purple-400` - AI Sparkles & Co-Pilot indicators

### Typography
- **Font Family**: Inter (`font-sans` from `next/font/google`)
- **Headings**: `text-4xl font-extrabold tracking-tight` (Hero H1), `text-3xl font-bold tracking-tight` (Page Title), `text-xl font-semibold` (Section/Card Title)
- **Scaled Tokens**: `--text-xs: 0.875rem` (14px baseline minimum), `--text-sm: 0.95rem` (15.2px), `--text-base: 1.0625rem` (17px body)

### Spacing & Borders
- **Border Radius**: `rounded-xl` (Hero Forms, AI Banners), `rounded-lg` (Containers, Sidebar, Cards), `rounded-full` (Badges, Floating Overlays, Avatars), `rounded-md` (Inputs, Buttons)
- **Layout Spacing**: `p-6` / `p-8` (Page padding), `space-y-4` (Form/Section spacing), `grid gap-4` (Workspace grid layout)

---

## Component Registry

### Project Dashboard (Page)
File: `src/app/page.tsx`
Last updated: 2026-08-08

| Property         | Class           |
| ---------------- | --------------- |
| Background       | `bg-muted/30`   |
| Border           | `border-t` (Saved projects section) |
| Text — primary   | `text-4xl font-extrabold tracking-tight sm:text-5xl` (Hero H1) |
| Text — secondary | `text-muted-foreground text-base sm:text-lg` |
| Spacing          | `p-6 md:p-12`, `mx-auto max-w-4xl space-y-12` |
| Accent usage     | `bg-primary/10 text-primary` (AI Pill Tag) |

---

### Idea Input Form
File: `src/components/idea-input-form.tsx`
Last updated: 2026-08-08

| Property         | Class           |
| ---------------- | --------------- |
| Background       | `bg-background` (Form container), `bg-muted/20` (Textarea) |
| Border           | `border shadow-sm` (Container), `border border-input` (Textarea) |
| Border radius    | `rounded-xl` (Form container), `rounded-md` (Textarea, Buttons) |
| Text — primary   | `text-sm font-medium` (Label) |
| Spacing          | `p-6 space-y-4` |
| Accent usage     | `text-purple-400` (AI Sparkles icon), `bg-primary/10 text-primary` (Attached File Badge) |

---

### Chat Sidebar (Co-Pilot)
File: `src/components/chat-sidebar.tsx`
Last updated: 2026-08-08

| Property         | Class           |
| ---------------- | --------------- |
| Background       | `bg-background` (Container), `bg-muted/30` (Header), `bg-primary text-primary-foreground` (User Bubble), `bg-muted/60 text-foreground border` (Assistant Bubble) |
| Border           | `border rounded-lg` (Container), `border-b` (Header), `border-t` (Input Footer) |
| Border radius    | `rounded-lg` (Container, Bubbles), `rounded-full` (Avatars), `rounded-md` (Input), `rounded-xl` (AI Loading Banner) |
| Loading Banner   | `p-3.5 rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-600 animate-pulse` |
| Text — primary   | `font-semibold text-sm` (Header Title) |
| Text — secondary | `text-xs text-muted-foreground` |
| Spacing          | `p-4 space-y-4` (Messages list), `p-3` (Input footer) |
| Accent usage     | `text-primary` (Bot icon), `bg-primary/10 text-primary` (Realtime Badge) |

---

### Playground Workspace
File: `src/components/playground-workspace.tsx`
Last updated: 2026-08-08

| Property         | Class           |
| ---------------- | --------------- |
| Background       | `bg-muted/20` (Screen wrapper), `bg-background` (Header bar) |
| Border           | `h-14 border-b px-6` (Header bar) |
| Layout           | `h-screen flex flex-col`, `grid grid-cols-1 lg:grid-cols-12 gap-4 p-4` |
| Text — title     | `font-bold text-lg tracking-tight` |
| Primary Action   | `bg-purple-600 hover:bg-purple-700 text-white font-medium` (Tallenna Projekti button) |
| Accent usage     | `text-purple-500` (Sparkles icon), `bg-muted font-mono` (Tag badge) |

---

### Delete Project Button
File: `src/components/delete-project-button.tsx`
Last updated: 2026-08-08

| Property         | Class           |
| ---------------- | --------------- |
| Background       | `bg-destructive/10` (Confirm banner), `variant="destructive"` (Confirm button) |
| Border           | `border border-destructive/20` |
| Text             | `text-destructive font-medium text-xs` |
| Border radius    | `rounded-lg` |

---

### Architecture Canvas
File: `src/components/architecture-canvas.tsx`
Last updated: 2026-08-08

| Property         | Class           |
| ---------------- | --------------- |
| Background       | `bg-background` (Canvas container) |
| Border           | `border rounded-md overflow-hidden` |
| Spacing          | `flex flex-col h-full space-y-4` |
| Floating Overlay | `bg-background/95 backdrop-blur-md px-5 py-2.5 rounded-full border border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.35)] animate-bounce` |
| Selection style  | `border: 2px solid #a855f7`, `boxShadow: 0 0 12px rgba(168, 85, 247, 0.4)` |
| Edge animations  | `animated: true` (Signal pulse particle flows) |
| Accent usage     | `text-purple-500` (AI Generate icon) |

---

### Node Inspector
File: `src/components/node-inspector.tsx`
Last updated: 2026-08-08

| Property         | Class           |
| ---------------- | --------------- |
| Background       | `bg-background` (Container), `bg-muted/40` (Header), `bg-muted/20` (Layer info box) |
| Border           | `border rounded-lg shadow-sm`, `border-b` (Header) |
| Text — title     | `font-semibold text-sm` |
| Text — secondary | `text-xs text-muted-foreground` |
| Accent usage     | `bg-purple-500/10 text-purple-600` (Inspector Icon), `border-purple-500/30 text-purple-600` (AI Audit Button) |
