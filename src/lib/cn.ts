/**
 * Conditional className joiner.
 *
 * Deliberately not `clsx` + `tailwind-merge`: the component library below uses
 * explicit variant maps rather than merging conflicting utilities, so the
 * 60-byte version is all that is needed and nothing ships to the client that
 * isn't earning its bytes.
 */
export type ClassValue = string | false | null | undefined;

export function cn(...values: readonly ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
