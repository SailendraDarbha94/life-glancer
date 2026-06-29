// Server-only environment access. Each provider reads its own keys lazily so a
// missing key surfaces as a friendly "needs setup" state for that one widget,
// rather than crashing the whole dashboard.

export class MissingEnvError extends Error {
  constructor(public readonly key: string) {
    super(`Missing environment variable: ${key}`);
    this.name = "MissingEnvError";
  }
}

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new MissingEnvError(key);
  return value;
}

export function optionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}
