# Frontend

## Shared design system

The frontend uses Tailwind CSS v4 with shared colors, typography, and base styles
from `../crown_anchor_design_reference/styles/globals.css`. Keep that file and
`../crown_anchor_design_reference/tokens/design-tokens.json` in sync when shared
design tokens change.

Use the shared `lucide-react` icon library and approved brand assets under
`public/brand/`. See the design reference pack's `DESIGN_SYSTEM.md` and
`docs/COMPONENT_GUIDELINES.md` for RTL/LTR, accessibility, and component
conventions.

## Backend integration

The app uses Axios for HTTP and TanStack React Query for server state. Use the
shared query hooks in `src/shared/hooks/useApiQueries.ts` and query keys in
`src/shared/api/queryKeys.ts`; keep request/caching logic out of page-local
effects.

For local backend development, set `frontend/.env.local`:

```dotenv
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:3000
VITE_DEFAULT_BRANCH_ID=<valid MongoDB branch ObjectId>
VITE_DEFAULT_BRANCH_NAME=Main Branch
```

The backend only allows staff to list branches, while public product reads
require a branch ID. The configured default is therefore used for public
browsing. Never put secrets in `VITE_` variables because they are embedded in
browser code.

The current backend does not persist shipping address or payment method on
orders, does not expose public branch discovery, and uses `paid` rather than
`processing` as an order status. The live frontend adapts to those capabilities.
Keep the mock switch enabled (default) to use the broader demo behavior.

## Branch selection

In mock mode, `BranchProvider` loads demo branches and the selector supports
switching branches and nearest-branch selection when coordinates are available.
In live mode, public users use the configured default branch; staff can load
branches from the backend. Visit `/branch-test` to try the mock selector with
isolated sample data.

After frontend changes, run `npm run build` and `npm run lint` from this folder.
