import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  sanitizeText,
  sanitizeMessageContent,
  sanitizeFilename,
  isSafeUrl,
} from "@/lib/sanitize";

describe("escapeHtml", () => {
  it("escapes ampersands", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;&#x2F;script&gt;"
    );
  });

  it("escapes quotes", () => {
    expect(escapeHtml('"hello\' world')).toBe("&quot;hello&#x27; world");
  });

  it("escapes forward slashes", () => {
    expect(escapeHtml("a/b")).toBe("a&#x2F;b");
  });

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("leaves safe text unchanged", () => {
    expect(escapeHtml("hello world 123")).toBe("hello world 123");
  });
});

describe("sanitizeText", () => {
  it("trims and escapes HTML", () => {
    expect(sanitizeText("  <b>bold</b>  ")).toBe("&lt;b&gt;bold&lt;&#x2F;b&gt;");
  });

  it("handles plain text", () => {
    expect(sanitizeText("hello")).toBe("hello");
  });
});

describe("sanitizeMessageContent", () => {
  it("escapes HTML in TEXT messages", () => {
    const input = '<img src=x onerror="alert(1)">';
    const result = sanitizeMessageContent(input, "TEXT");
    expect(result).not.toContain("<img");
    expect(result).toContain("&lt;img");
  });

  it("does not escape HTML in IMAGE messages (URLs)", () => {
    const url = "https://example.com/image.jpg";
    const result = sanitizeMessageContent(url, "IMAGE");
    expect(result).toBe(url);
  });

  it("truncates to 5000 chars", () => {
    const long = "a".repeat(6000);
    const result = sanitizeMessageContent(long, "TEXT");
    expect(result.length).toBe(5000);
  });

  it("trims whitespace", () => {
    expect(sanitizeMessageContent("  hello  ", "TEXT")).toBe("hello");
  });
});

describe("sanitizeFilename", () => {
  it("replaces unsafe characters", () => {
    expect(sanitizeFilename("my file (1).jpg")).toBe("my_file_1_.jpg");
  });

  it("preserves safe characters", () => {
    expect(sanitizeFilename("photo-2024.png")).toBe("photo-2024.png");
  });

  it("truncates long filenames", () => {
    const long = "a".repeat(300);
    expect(sanitizeFilename(long).length).toBe(255);
  });

  it("collapses multiple underscores", () => {
    expect(sanitizeFilename("a___b")).toBe("a_b");
  });
});

describe("isSafeUrl", () => {
  it("accepts http URLs", () => {
    expect(isSafeUrl("http://example.com")).toBe(true);
  });

  it("accepts https URLs", () => {
    expect(isSafeUrl("https://example.com/path?q=1")).toBe(true);
  });

  it("rejects javascript URLs", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects data URLs", () => {
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("rejects relative paths", () => {
    expect(isSafeUrl("/path/to/resource")).toBe(false);
  });

  it("rejects invalid URLs", () => {
    expect(isSafeUrl("not a url")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isSafeUrl("")).toBe(false);
  });
});
