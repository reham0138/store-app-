# Shared UI and styling rules

- Before styling a UI change, check the project design system and reuse its tokens and shared components.
- Use Tailwind CSS v4 utilities. Prefer the approved brand tokens over arbitrary colors, spacing, and one-off styles.
- Use `lucide-react` for interface icons. Do not use emoji as functional icons.
- Use approved brand artwork from `frontend/public/brand/`. Do not recolor, stretch, or add effects to logos.
- Keep layouts responsive and support both Arabic RTL and English LTR. Prefer logical layout utilities and CSS properties over left/right-specific rules.
- Follow the design system’s accessibility guidance: visible keyboard focus, readable contrast, accessible labels, and clear UI states.
- Before adding or changing shared tokens or component styles, check whether an existing shared rule or component can be reused. Coordinate shared design changes with the team.
- Keep the design reference and implementation aligned. When a shared design decision changes, update the relevant reference documentation too.
- After frontend changes, run `npm run build` and `npm run lint` from `frontend/`.