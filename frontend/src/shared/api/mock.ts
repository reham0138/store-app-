/**
 * Single switch for mock vs real API.
 * Default: mock ON (safe for development/demo).
 * Set VITE_USE_MOCK=false and VITE_API_URL=http://localhost:3000 to hit the backend.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
