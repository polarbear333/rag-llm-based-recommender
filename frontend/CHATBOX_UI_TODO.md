## Chatbox UI / UX — Enhanced, actionable plan (Geist)

This document replaces and expands the earlier TODO with a clearer, prioritized, and implementable roadmap for the Maximized Chatbox UI. It assumes the backend structured JSON described in `backend_output_example.md` (query, results[], analysis, similarity/combined_score, reviews, warnings). The goal: surface the "why" behind recommendations in a scannable, accessible, and polished chat UI using Geist (or Geist Mono) typography and a restrained visual system.

If you'd like, I can implement the first small PR described at the end — by default this will use Geist (Geist or Geist Mono) and keep the current placeholder image (no image library changes).

---

## Quick contract (inputs / outputs / success)
- Inputs: backend JSON (query + results[] where each result may include asin, product_title, cleaned_item_description, product_categories, reviews[], analysis{main_selling_points,best_for,review_highlights,warnings,confidence}, similarity/combined_score, avg_rating, rating_count, displayed_rating).
- Outputs: improved chat UI (Maximized Chat area) that shows recommendation cards with title, rating, color-coded match pill, up to 3 selling-point chips, visible warnings badge, and an accessible details panel for each product.
- Success criteria: cards show title + match pill + selling-point chips; warnings visible; skeletons replace spinner during loads; AI outputs announced via aria-live; keyboard and screen-reader basics pass.

Edge cases handled: missing analysis (fall back to categories or description), missing images or placeholders (use current placeholder), large result lists (lazy render / "show more"), partially-streamed backend responses (show streaming skeletons).

---

## Top-level priorities (A / B / C)

Priority A — Must-have (fast wins)
- Apply Geist / Geist Mono as the chat font and set root tokens (sizes, colors).
- Product card compact view: title, rating, displayed_rating, match% pill (color-coded), up to 3 selling-point chips, warnings badge.
- Replace global spinner-only loading with skeletons for the message bubble and product cards.
- Add basic accessibility: AI output area wrapped in a `role="log"` and `aria-live="polite"`; input has `aria-label` and keyboard handling (Enter/Shift+Enter).

Priority B — Important polish
- Collapsible `ProductAnalysisPanel` (selling points, review highlights, sample reviews, warnings, confidence).
- Typing indicator and streaming skeletons while backend streams partial results.
- Quick action chips (Compare, Top rated, Similar) and copy/open actions on cards.
- Lazy render or "Show more" for long results; consider virtualization for >100 items.

Priority C — Delight & accessibility
- Micro-animations (fade/slide for messages, hover lift for cards) using CSS or `framer-motion` optionally.
- Full keyboard navigation and ARIA improvements (aria-controls/aria-expanded on disclosure widgets).
- Action icons for share/save/open and robust contrast/accessibility tuning.

---

## File-level tasks (concrete edits)

Note: this repo currently uses a placeholder image for product cards. We will keep the placeholder (no `next/image` migration) for the safety-first PR.

1) `frontend/app/globals.css` (or `frontend/styles/globals.css`)
- Add Geist / Geist Mono import (or fallback to system fonts) and define tokens:
   - --font-sans: 'Geist', 'Geist Mono', ui-sans-serif, system-ui, -apple-system, "Segoe UI";
   - --text-xs .. --text-2xl, --line-height-base
   - color tokens: --primary, --surface, --muted, --text, --muted-text, --success, --warning, --danger
- Set `body { font-family: var(--font-sans); font-size:15px; line-height:1.4; color:var(--text); }` and base card/shadow tokens.

2) `tailwind.config.js` (if Tailwind is used)
- Add a `fontFamily` entry for Geist and map CSS variables for the color tokens above. Provide small utilities for pill colors.

3) `frontend/components/MaximizedChatbox.tsx`
- Wrap assistant output region in `<div role="log" aria-live="polite">`.
- Replace single spinner with loading skeletons: one message-bubble skeleton + 2–3 card skeletons.
- Add typing indicator UI state and streaming placeholder skeleton while results are arriving.

4) `frontend/components/ChatProductCard.tsx`
- Compact header row: left: placeholder image (unchanged), center: title (16–18px semibold); under it, rating row (stars, `displayed_rating`, `rating_count`), right-most: match pill.
- Match pill: compute score = `combined_score ?? similarity ?? 0` (display as percentage). Color rules:
   - >= 80% -> `--success` (green) with white text
   - 60–79% -> `--warning` (amber) with dark text
   - < 60% -> neutral gray background with dark text
- Selling-point chips: show up to 3 from `analysis.main_selling_points` (truncate single line with ellipsis). If missing, fallback to `product_categories` chips.
- Warnings badge: if `analysis.warnings` present, show a prominent small badge (red/orange) top-right with concise copy "Warning" or the first warning title; clicking toggles details.
- Details toggle: a small "Details" button to reveal the `ProductAnalysisPanel` (no external navigation required).
- Keep placeholder image usage; ensure `alt` text is present: `alt={product_title || 'Product image'}`.

5) `frontend/components/ProductAnalysisPanel.tsx` (new)
- Collapsible panel that reveals:
   - main selling points as expanded chips/list
   - review highlights grouped (positive/negative) with colored badges
   - up to 2 sample reviews (verified icon + timestamp + truncated content)
   - warnings list and confidence level if present
- Panel is keyboard-focusable and announces opening via `aria-expanded` toggling.

6) `frontend/components/ui/Badge.tsx` (existing — reuse & small recommendations)
- This repository already includes `frontend/components/ui/badge.tsx`. Reuse the existing `Badge` component for:
   - Match pills (right-aligned match %),
   - Selling-point chips (compact chips under the title), and
   - Warnings badge (destructive/warning style).
- Recommended usage pattern (no API changes required): pass `className` for size and color tweaks and use the `variant` system already present in the file (it uses `cva`). Example usage in the card:

   - `<Badge className="px-3 py-0.5 text-xs" variant="default">82% match</Badge>`
   - `<Badge className="mr-2 px-2 py-0.5 text-xs">Fast charging</Badge>`

- Low-risk optional tweaks (choose one):
   1. Add a small `warning` variant to `badge.tsx` mapped to `--warning`/amber styles.
   2. Add a `size?: 'sm'|'md'` prop (or use utility classes) if you want consistent sizing across the app.

- Why reuse: keeps styling consistent, avoids duplication, and benefits from existing accessibility/focus handling present in the shared `Badge` component.

7) `frontend/components/ui/Skeleton.tsx` (existing — reuse & small recommendations)
- A simple `Skeleton` already exists at `frontend/components/ui/skeleton.tsx` and is used elsewhere in the app. Reuse it for:
   - Message-bubble skeletons in the chat stream,
   - Card skeletons in the maximized chat area (image + title lines + chips),
   - Inline line skeletons where product text will appear.
- Current API: the component accepts `className` which is sufficient to create different shapes (rect, circle, line) by passing height/width/rounded utilities.
- Optional, low-risk improvement: add a `shimmer?: boolean` prop (default false) which toggles a CSS shimmer animation instead of `animate-pulse`, or add a `variant?: 'line'|'rect'|'circle'` prop for convenience. These keep the existing `className` contract while providing nicer visuals.
- Example usage:

   - `<Skeleton className="h-4 w-32 rounded-md" />` (line)
   - `<Skeleton className="h-24 w-full rounded-lg" />` (image)

- Why reuse: using the existing `Skeleton` keeps the visual language consistent and avoids creating a second, slightly-different skeleton implementation that fragments the UI.

8) `frontend/components/ChatboxOverlay.tsx` and `ChatbotInterface.tsx`
- Update bubble styles: AI bubble → neutral surface card with small "Assistant" label; User bubble → right-aligned compact pill.
- Ensure input has `aria-label`, Enter vs Shift+Enter handling, and quick-action chips above input.

---

## Design tokens (Geist-inspired)
Use CSS variables as the source-of-truth. Suggested values:
- --primary: #3b82f6
- --surface: #ffffff
- --muted: #f3f4f6
- --text: #0f172a
- --muted-text: #6b7280
- --success: #16a34a
- --warning: #f59e0b
- --danger: #ef4444
- --card-radius: 8px
- --shadow-sm: 0 2px 6px rgba(15,23,42,0.04)

Match pill rules (same as above) — compute and render color dynamically.

Spacing / type scale:
- base 15px, small 12px, title 16–18px semibold, chip text 12px. Card padding 12–16px.

---

## Accessibility & interaction details
- AI outputs: wrap in `role="log" aria-live="polite"` so screen readers announce assistant messages.
- Cards: `tabindex=0` and `role="article"` for keyboard focus. Details toggle must be `button` with `aria-expanded` and `aria-controls`.
- Images: preserve `alt` text; use the placeholder and mark it `aria-hidden="true"` if decorative.
- Colors: ensure sufficient contrast for pills/badges (WCAG AA minimum).
- Keyboard: Enter sends, Shift+Enter newline. Quick-action chips focusable and selectable via keyboard.

---

## Loading, streaming & error states
- Loading: show skeleton message + 2–3 card skeletons. Skeletons should match final card dimensions to reduce layout shift.
- Streaming/partial responses: show streaming bubble skeleton and progressively render cards as items arrive.
- Empty results: friendly empty state with suggestions and a quick-action button "Show popular options".
- Errors: inline error banner with Retry action.

---

## Tests & quality gates
- Unit tests:
   - `ChatProductCard` renders match pill, chips, and warnings (happy path + missing fields fallback).
   - `ProductAnalysisPanel` toggles and is accessible (aria-expanded flips).
- Accessibility checks (axe or jest-axe) for `aria-live` and role usage.
- Lint/type checks (TS/ESLint) and a local smoke-run of the Next dev server.

Recommended test files:
- `frontend/components/__tests__/ChatProductCard.test.tsx`
- `frontend/components/__tests__/ProductAnalysisPanel.test.tsx`

Quality gate checklist before merging:
- Build: PASS
- Lint/Typecheck: PASS
- Unit tests (new): PASS
- Manual visual smoke test: PASS

---

## Small, safe first PR (exact steps — no image changes, use Geist)

This minimal PR gives high visual value and is low risk. Implement these three edits in one PR and verify locally.

Change 1 — Fonts & tokens:
- Edit: `frontend/app/globals.css` (or `frontend/styles/globals.css`)
- Add: Geist/Geist Mono import (or local/hosted CSS entry), root CSS variables listed above, base `body` font-family and base sizes.

Change 2 — `ChatProductCard.tsx` (visual, non-breaking):
- Show match% pill using `combined_score ?? similarity ?? 0` and apply color logic.
- Show up to 3 `analysis.main_selling_points` chips (truncate with ellipsis).
- Show warnings badge if `analysis.warnings` exists (click opens `ProductAnalysisPanel` — initially can be a no-op or simple expand/collapse).
- Keep placeholder image usage and ensure `alt` text is present (no `next/image` change).

Change 3 — `ui/Skeleton.tsx` and basic use in `MaximizedChatbox.tsx`:
- Add a small skeleton component and show skeletons while `isLoading` instead of only a spinner.

Acceptance criteria for PR:
- Geist font is applied across chat components.
- `ChatProductCard` shows title + match pill + up to 3 chips; warnings badge visible when present.
- Loading shows skeletons for message and card area.

Estimated time: 1–3 hours to implement and verify locally.

---

## Notes & references
- Backend sample file: `backend_output_example.md` (contains sample product JSON).
- Primary UI components to edit: `frontend/components/MaximizedChatbox.tsx`, `frontend/components/ChatboxOverlay.tsx`, `frontend/components/ChatProductCard.tsx`, `frontend/components/ChatbotInterface.tsx`, and the new `frontend/components/ProductAnalysisPanel.tsx` and `frontend/components/ui/*` utilities.





