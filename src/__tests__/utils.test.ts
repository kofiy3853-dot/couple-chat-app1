import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn() utility", () => {
  it("merges class names", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const result = cn("base", isActive && "active", false && "hidden");
    expect(result).toContain("base");
    expect(result).toContain("active");
    expect(result).not.toContain("hidden");
  });

  it("handles empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("handles single class", () => {
    const result = cn("text-lg");
    expect(result).toBe("text-lg");
  });

  it("merges tailwind classes correctly", () => {
    const result = cn("p-4 p-8");
    expect(result).toBe("p-8");
  });

  it("handles undefined and null gracefully", () => {
    const result = cn("base", undefined, null, "extra");
    expect(result).toContain("base");
    expect(result).toContain("extra");
  });

  it("merges conflicting color classes", () => {
    const result = cn("bg-red-500", "bg-blue-500");
    expect(result).toBe("bg-blue-500");
  });

  it("preserves non-conflicting classes", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toContain("text-red-500");
    expect(result).toContain("bg-blue-500");
  });

  it("handles arrays of classes", () => {
    const result = cn(["text-lg", "font-bold"], "text-red-500");
    expect(result).toContain("text-lg");
    expect(result).toContain("font-bold");
    expect(result).toContain("text-red-500");
  });

  it("handles objects with boolean values", () => {
    const result = cn({
      "text-lg": true,
      "text-sm": false,
      "font-bold": true,
    });
    expect(result).toContain("text-lg");
    expect(result).toContain("font-bold");
    expect(result).not.toContain("text-sm");
  });
});
