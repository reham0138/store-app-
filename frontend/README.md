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
VITE_DEFAULT_BRANCH_ID=<24-character MongoDB branch ObjectId from Compass>
VITE_DEFAULT_BRANCH_NAME=Main Branch
```

Public users can list active branches and choose one. Add `latitude` and
`longitude` to each MongoDB branch document to enable GPS-based nearest-branch
selection. Product reads still require a branch ID. Use the branch document's
exact `_id` value, not its name or code (for example, `damascus`). Never put
secrets in `VITE_` variables because they are embedded in browser code.

The current backend does not persist shipping address or payment method on
orders and uses `paid` rather than `processing` as an order status. The live
frontend adapts to those capabilities. Keep the mock switch enabled (default)
to use the broader demo behavior.

## Product images

Live product image uploads use the admin-only `POST /api/products/images`
endpoint. Configure these values in `backend/.env` using your Cloudinary
account's credentials; never put the API secret in a `VITE_` variable:

```dotenv
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
```

Set `VITE_USE_MOCK=false` in `frontend/.env.local`, sign in as an admin, and
upload up to 8 JPEG, PNG, WebP, or AVIF images per product (8 MB each). Product
image URLs are persisted by the backend; the first image is the main image.

## Branch selection

In mock mode, `BranchProvider` loads demo branches and the selector supports
switching branches and nearest-branch selection when coordinates are available.
In live mode, public users can select from active backend branches. The
nearest-branch action requires coordinates on those branch documents. Visit
`/branch-test` to try the mock selector with isolated sample data.

After frontend changes, run `npm run build` and `npm run lint` from this folder.
