export function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function envOptional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}
