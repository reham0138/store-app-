
export function validate(config: Record<string, unknown>) {
  const required = [
    'MONGODB_URI',
    'ADMIN_API_KEY',
    'STAFF_API_KEY',
    'JWT_SECRET',
  ];

  const missing = required.filter((key) => !config[key]);

  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  if (
    typeof config.JWT_SECRET !== 'string' ||
    config.JWT_SECRET.length < 32
  ) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  return {
    ...config,
    PORT: config.PORT ? Number(config.PORT) : 3000,
  };
}
