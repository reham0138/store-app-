# The Crown & Anchor — Design Reference Pack

This pack defines the initial visual rules for the multi-branch e-commerce platform.
It is a design reference, not a complete application or a guarantee that project files already exist.

## Brand
- Name: The Crown & Anchor
- Tagline: MORE THAN JUST A STORE
- Primary navy: `#0B2D4A`
- Gold accent: `#D4AF37`
- Warm cream: `#F8F7F4`
- Slate: `#64748B`
- Main text: `#1F2937`

## Bilingual interface
- Arabic: `lang="ar"` and `dir="rtl"`
- English: `lang="en"` and `dir="ltr"`
- Direction should be set at the application/document level based on the active language.
- Prefer CSS logical properties (`margin-inline-start`, `padding-inline`, `text-align: start`) over left/right-specific rules.
- Suggested fonts: Cairo for Arabic and Inter for English. Confirm font loading/licensing and final choice before production.

## Tailwind
The CSS starter in `styles/globals.css` uses Tailwind CSS v4 syntax (`@import "tailwindcss";` and `@theme`).
Do not use it unchanged in a Tailwind v3 project. First confirm the installed Tailwind version.

## How to use
1. Share this pack with all five team members.
2. Treat values as initial design tokens; discuss changes before editing shared values.
3. Implement shared UI components once and reuse them.
4. Keep branch, cart, auth, and product data logic separate from visual styling.
5. Review color contrast and keyboard focus before release.

## Files
- `DESIGN_SYSTEM.md`: design decisions and usage rules.
- `styles/globals.css`: Tailwind v4 starter tokens and base styles.
- `tokens/design-tokens.json`: machine-readable token reference.
- `docs/COMPONENT_GUIDELINES.md`: shared component rules.
- `docs/TEAM_HANDOFF.md`: collaboration and change-control rules.
