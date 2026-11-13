export function validate(config: Record<string, unknown>) {
  const required = ['MONGODB_URI', 'ADMIN_API_KEY', 'STAFF_API_KEY'];
  const missing = required.filter((k) => !config[k]);
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  return {
    ...config,
    PORT: config.PORT ? Number(config.PORT) : 3000,
  };
}