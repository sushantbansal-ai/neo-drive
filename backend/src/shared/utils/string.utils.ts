export function normalizeText(value?: string): string | undefined {
  return value?.trim().toLowerCase() || undefined;
}
