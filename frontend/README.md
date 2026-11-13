# React + TypeScript + Vite

## Shared design system

The frontend uses Tailwind CSS v4 with shared colors, typography, and base styles
from `../crown_anchor_design_reference/styles/globals.css`. Keep that file and
`../crown_anchor_design_reference/tokens/design-tokens.json` in sync when shared
design tokens change.

Use the shared `lucide-react` icon library for interface icons. Approved logo and
social artwork is available under `/brand/logo/` and `/brand/social/` in the
frontend's public assets; use the logo artwork without recoloring or stretching it.
See the design reference pack's `DESIGN_SYSTEM.md` and `docs/COMPONENT_GUIDELINES.md`
for RTL/LTR, accessibility, and component conventions.

## Branch selector

The shared branch selection state is provided by `BranchProvider`. Set available
branches through its `initialBranches` prop or the context's `setBranches`
function, then use `BranchSelector` and `BranchBadge` wherever branch context is
available. `BranchSelector` is composed from the shared `Input`, `Label`,
`Select`, and `Button` components. Branches can include `latitude` and
`longitude` for nearest-branch selection via the browser's Geolocation API;
location is requested only after the user chooses **Use my location**. Visit
`/branch-test` to try searching, switching, and resetting branches with
isolated sample data.

## Semantic search

Product search on the product page searches by meaning, in Arabic and English, using the shared [semantic-search-engine](https://github.com/reham0138/semantic-search-engine) service (the delivery app uses the same service). Products are filtered by stock in the selected branch first, then sent to `POST /search/store-products`. To use it locally:

1. Clone and start the service by following **Run it** in its README. In short: `pip install -r requirements.txt`, then `python -m uvicorn app.main:app --port 8000`. The first start downloads a ~470 MB model.
2. Keep it running and start this frontend with `npm run dev`.

The frontend calls `http://127.0.0.1:8000` by default. To use another address, create `frontend/.env.local` containing `VITE_SEARCH_API_URL=http://your-host:8000`. No API keys are needed. Never put secrets in `VITE_` variables, because they end up in browser code.

If the service is not running, the product page shows a notice and falls back to exact text matches.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
