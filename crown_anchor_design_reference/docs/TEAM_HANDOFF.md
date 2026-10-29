# Team Handoff — Design System

## Shared rules
1. Use the approved tokens from `tokens/design-tokens.json`.
2. Keep `DESIGN_SYSTEM.md` and `styles/globals.css` synchronized when shared values change.
3. Do not introduce one-off brand colors without team discussion.
4. Use the shared components before creating a page-specific duplicate.
5. Use translation keys for Arabic and English interface text.
6. Test both RTL and LTR after any layout change.
7. Use CSS logical properties and test mobile widths.
8. Request review before changing shared contracts in `src/shared/types/`.

## Before merging
- `npm run build` passes.
- `npm run lint` passes.
- Relevant page checked in Arabic RTL and English LTR.
- Keyboard focus and form errors remain visible.
- No accidental horizontal overflow at mobile sizes.
- Shared tokens and documentation are consistent.

## Ownership suggestion
The team lead owns shared tokens, global styles, and layout foundations. Any member can propose changes, but shared changes should be communicated before merging.
