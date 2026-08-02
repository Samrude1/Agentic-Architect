# UI Registry

## Design Tokens

### Colors
- **Primary**: `bg-primary text-primary-foreground` (from shadcn default)
- **Secondary**: `bg-secondary text-secondary-foreground` 
- **Background**: `bg-muted/40` - App background (Page container)
- **Text**: `text-foreground` - Primary typography color
- **Text Muted**: `text-muted-foreground` - Sub-text, captions, empty states

### Typography
- **Headings**: `text-3xl font-bold tracking-tight` (H1 Page Title), `text-xl font-semibold` (Card Title)
- **Body**: `text-base`, `text-sm` (Secondary/muted info)

### Spacing & Borders
- **Border Radius**: `rounded-lg` (Empty states, large containers), `rounded-full` (Badges), `rounded-md` (Inputs, Buttons)
- **Layout Spacing**: `p-8` (Page padding), `space-y-8` (Major vertical sections), `gap-4` (Grid layout gaps)

---

## Component Registry

### Project Dashboard (Page)
File: `src/app/page.tsx`
Last updated: 2026-07-28

| Property         | Class           |
| ---------------- | --------------- |
| Background       | `bg-muted/40`   |
| Border           | `border border-dashed` (Empty state) |
| Border radius    | `rounded-lg` (Empty state) |
| Text — primary   | `text-3xl font-bold tracking-tight` (H1) |
| Text — secondary | `text-sm text-muted-foreground` |
| Spacing          | `p-8` (Container), `mx-auto max-w-5xl space-y-8` |
| Hover state      | `hover:bg-accent/50 transition-colors` (Project Card) |

**Pattern notes:**
- The page uses a max-width container (`max-w-5xl`) centered with `mx-auto`.
- Empty states use dashed borders and centered muted text.
- Interactive cards use subtle background transitions on hover (`hover:bg-accent/50`).
- Badges use `bg-primary/10 text-primary` for subtle coloring.

### New Project Dialog
File: `src/components/new-project-dialog.tsx`
Last updated: 2026-07-28

| Property         | Class           |
| ---------------- | --------------- |
| Border radius    | `rounded-md` (Inputs/Textareas) |
| Spacing          | `grid gap-4 py-4`, `grid gap-2` (Form groups) |
| Text — muted     | `text-muted-foreground` |
| Shadow           | `shadow-sm` (Inputs) |

**Pattern notes:**
- Dialogs use standard `sm:max-w-[425px]` sizing.
- Form fields are wrapped in `grid gap-2` with `Label` above `Input`/Textarea.
