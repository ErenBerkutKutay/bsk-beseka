export function normalizeOEM(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function parseCodeList(input: string): string[] {
  return input
    .split(/[\n,;]+/)
    .map((code) => code.trim())
    .filter(Boolean);
}

export function buildOEMEntries(codes: string[]) {
  return codes.map((code) => ({
    code,
    codeNormalized: normalizeOEM(code),
  }));
}
