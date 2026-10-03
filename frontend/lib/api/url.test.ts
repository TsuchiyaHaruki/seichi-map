import { describe, it, expect } from "vitest";
import { buildApiUrl } from "@/lib/api/url";

describe("buildApiUrl", () => {
  it("ベースURLが空文字なら同一オリジンの相対URLになる", () => {
    expect(buildApiUrl("/api/v1/sacred-spots", undefined, "")).toBe(
      "/api/v1/sacred-spots",
    );
  });

  it("ベースURLを先頭に付ける", () => {
    expect(
      buildApiUrl("/api/v1/sacred-spots", undefined, "http://localhost:8080"),
    ).toBe("http://localhost:8080/api/v1/sacred-spots");
  });

  it("undefinedと空文字の検索パラメーターは送信しない", () => {
    expect(
      buildApiUrl(
        "/api/v1/sacred-spots",
        { keyword: "", category: undefined, page: 0, size: 20 },
        "",
      ),
    ).toBe("/api/v1/sacred-spots?page=0&size=20");
  });

  it("検索パラメーターをエンコードする", () => {
    expect(
      buildApiUrl("/api/v1/sacred-spots", { keyword: "東京 駅&" }, ""),
    ).toBe("/api/v1/sacred-spots?keyword=%E6%9D%B1%E4%BA%AC+%E9%A7%85%26");
  });
});
