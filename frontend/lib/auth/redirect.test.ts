import { describe, it, expect } from "vitest";
import { safeRedirectPath } from "@/lib/auth/redirect";

describe("safeRedirectPath(オープンリダイレクト防止)", () => {
  it("サイト内のパスはそのまま許可する", () => {
    expect(safeRedirectPath("/mypage")).toBe("/mypage");
    expect(safeRedirectPath("/spots/1/edit?tab=images#top")).toBe(
      "/spots/1/edit?tab=images#top",
    );
  });

  it.each([
    ["プロトコル相対URL", "//evil.example"],
    ["バックスラッシュ", "/\\evil.example"],
    ["バックスラッシュの後にスラッシュ", "/\\/evil.example"],
    ["タブ文字", "/\t/evil.example"],
    ["改行文字", "/\n/evil.example"],
    ["絶対URL", "https://evil.example/login"],
    ["javascript: URL", "javascript:alert(1)"],
    ["スラッシュで始まらない", "mypage"],
  ])("%sはトップへ戻す", (_label, value) => {
    expect(safeRedirectPath(value)).toBe("/");
  });

  it("未指定・空文字はトップへ戻す", () => {
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath("")).toBe("/");
  });
});
