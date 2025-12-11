/**
 * Generate a random ID using crypto.randomUUID
 */
export function nanoid(): string {
  return crypto.randomUUID();
}
