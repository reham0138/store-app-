# The Crown & Anchor — Design System

**Status:** Initial reference for team review  
**Product:** Multi-Branch E-Commerce Platform  
**Stack:** React + TypeScript + Vite + Tailwind CSS  
**Languages:** Arabic and English

## 1. Brand identity

- Brand: **The Crown & Anchor**
- Tagline: **MORE THAN JUST A STORE**
- Visual character: refined, confident, premium, clear, practical.
- Use the supplied approved logo artwork as the source of truth. Do not redraw, stretch, recolor, or add effects to the logo without approval.
- Prefer SVG for the production logo when an approved vector version is available. Keep raster logo files for references/mockups.

## 2. Color tokens

| Token | Hex | Intended use |
|---|---|---|
| `brand-navy` | `#0B2D4A` | Primary actions, key navigation, strong brand elements |
| `brand-gold` | `#D4AF37` | Accent details, highlights, selected decorative elements |
| `surface-cream` | `#F8F7F4` | Main warm background and calm surfaces |
| `text-slate` | `#64748B` | Secondary text, supporting metadata |
| `text-main` | `#1F2937` | Main body text and headings on light surfaces |
| `surface-white` | `#FFFFFF` | Cards, forms, and content surfaces |
| `border-subtle` | `#E5E7EB` | Dividers and neutral borders |
| `status-success` | `#15803D` | Success states |
| `status-error` | `#B91C1C` | Error states |
| `status-warning` | `#A16207` | Warning states |
| `status-info` | `#1D4ED8` | Informational states |

Gold is an accent, not the default text color on cream or white. Check contrast before using gold for small text or important controls.

## 3. Typography

Initial recommendation:
- Arabic: **Cairo**
- English and Latin/numeric UI: **Inter**
- Fallbacks: `system-ui`, `sans-serif`

Suggested scale:
| Token | Size | Typical use |
|---|---:|---|
| `text-xs` | 12px | Fine print, compact metadata |
| `text-sm` | 14px | Secondary labels |
| `text-base` | 16px | Default body text and controls |
| `text-lg` | 18px | Emphasized body text |
| `text-xl` | 20px | Small section headings |
| `text-2xl` | 24px | Section headings |
| `text-3xl` | 30px | Page headings |
| `text-4xl` | 36px | Large desktop hero heading |

Use comfortable Arabic line-height (about 1.6 for body text). Use a clear hierarchy rather than using many font sizes. Final font files and loading method should be confirmed by the team.

## 4. Spacing and layout

Use Tailwind's spacing scale consistently; avoid arbitrary one-off values unless a design requires them.

Recommended baseline:
- Main content width: `max-w-7xl`
- Page horizontal padding: `px-4 sm:px-6 lg:px-8`
- Section spacing: `py-8` to `py-16`
- Common component gaps: `gap-2`, `gap-3`, `gap-4`, `gap-6`
- Product grid gaps: `gap-4` mobile/tablet, `gap-6` large screens
- Avoid fixed page widths; layouts should adapt to viewport width.

## 5. Shape, borders, shadows

- Small controls: `rounded-md` or `rounded-lg`
- Product cards and content panels: `rounded-xl`
- Modal/dialog surfaces: `rounded-2xl` when appropriate
- Neutral borders: `border border-gray-200` or the project token
- Shadows should be subtle and reserved for raised surfaces; avoid heavy shadows everywhere.

## 6. Buttons and controls

- Primary button: navy background, white text.
- Secondary button: white/cream background, navy text and border.
- Accent treatment: use gold sparingly for highlights or selected decorative details.
- All buttons need visible hover, active, disabled, and keyboard-focus states.
- Form controls must have labels, clear validation messages, and an accessible focus indicator.
- Do not communicate status using color alone; include text or an icon.

## 7. Icons

- Recommended library: `lucide-react`
- Use one consistent outline icon family.
- Standard sizes: 16px for compact inline use, 20px for common actions, 24px for prominent navigation.
- Keep stroke weight visually consistent.
- Do not mix emoji and outline icons as functional UI icons.
- Give icon-only buttons accessible labels.

## 8. Bilingual and RTL/LTR rules

- Arabic active: set document/app language to `ar` and direction to `rtl`.
- English active: set language to `en` and direction to `ltr`.
- Use CSS logical properties and Tailwind logical utilities where available; avoid hard-coded left/right assumptions.
- Keep product codes, email addresses, URLs, and many numeric identifiers readable in their natural direction where needed.
- Mirror directional icons (e.g. back/forward arrows) when their meaning depends on reading direction. Do not mirror universal icons such as search, cart, or settings.
- Do not translate brand name or tagline unless the team explicitly approves a localized brand treatment.
- Use translation keys rather than embedding language-specific strings throughout components.

## 9. Responsive behavior

Design and test at:
- Mobile: 320–639px
- Tablet/small laptop: 640–1023px
- Desktop: 1024px and above

These are team guidelines, not rigid breakpoints. Prioritize readable content, usable touch targets, and no horizontal overflow.

## 10. Accessibility and states

- Aim for WCAG AA contrast for text and interactive elements.
- Keyboard navigation and focus indicators must remain visible.
- Include loading, empty, error, success, disabled, and unavailable states where relevant.
- Images need meaningful alternative text; decorative images should use empty alt text.
- Forms must not rely on placeholder text as the only label.

## 11. Multi-branch commerce rules

- Always make the selected branch clear wherever branch-specific inventory, price, or availability is shown.
- If branch selection changes prices or availability, update the relevant UI and provide clear feedback.
- Never imply live data when the app is using mock services.
- Cart and checkout should make branch-dependent product availability understandable.
- Role-specific navigation should reflect permissions for `customer`, `branchManager`, and `admin`.

## 12. Change control

Because these tokens are shared by five team members:
- Propose changes to shared colors, typography, spacing, shared types, or shared components before merging.
- Keep the CSS tokens and this document synchronized.
- Do not introduce a new shade or component style in a single page without checking whether a shared token/component should be updated.
