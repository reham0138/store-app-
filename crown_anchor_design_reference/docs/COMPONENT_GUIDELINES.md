# Shared Component Guidelines

These are implementation guidelines for the React team; they are not component implementations.

## Shared UI components
Suggested shared components:
- `Button`
- `Input`
- `Select`
- `Badge`
- `ProductCard`
- `Price`
- `SearchBar`
- `Header`
- `Footer`
- `BranchSelector`
- `LoadingState`
- `EmptyState`
- `ErrorState`

Place reusable UI in `src/shared/components/` and shared layouts in `src/shared/layouts/`, consistent with the project README.

## Component contract
- Type component props with TypeScript.
- Prefer explicit variants such as `primary`, `secondary`, and `outline` over ad hoc styling.
- Keep business logic out of presentational components where practical.
- Support both RTL and LTR without duplicating entire components.
- Include accessible labels and keyboard focus.
- Use consistent disabled/loading states.
- Do not make assumptions about API behavior; mock services remain separate from UI.

## Product cards
A product card should consistently display the product image, name, price, optional previous price/discount, and branch availability where relevant. Do not show unavailable fields as invented values.

## Branch selector
Show the current branch clearly. Branch changes should trigger the appropriate state/data update and should not silently imply that inventory is global.

## Forms
Use visible labels, validation messages, required-field indicators where appropriate, and accessible error states.

## Icons
Use `lucide-react` consistently. Prefer icon + text for important actions, and add accessible labels for icon-only controls.
