const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
};

const HTML_ESCAPE_REGEX = /[&<>"'`/]/g;

export function escapeHtml(input: string): string {
  return input.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char] || char);
}

export function sanitizeText(input: string): string {
  return escapeHtml(input.trim());
}

export function sanitizeMessageContent(content: string, type: string): string {
  const trimmed = content.trim();

  if (type === "TEXT") {
    return escapeHtml(trimmed).slice(0, 5000);
  }

  if (type === "IMAGE" || type === "AUDIO") {
    return trimmed.slice(0, 5000);
  }

  return escapeHtml(trimmed).slice(0, 5000);
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 255);
}

const PROTOCOL_REGEX = /^(https?:\/\/)/i;
const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript):/i;

export function isSafeUrl(url: string): boolean {
  if (!PROTOCOL_REGEX.test(url)) return false;
  if (DANGEROUS_PROTOCOLS.test(url)) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
