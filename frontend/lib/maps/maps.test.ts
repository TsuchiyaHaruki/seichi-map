import { describe, it, expect } from "vitest";
import { haversineDistanceKm, formatDistance } from "@/lib/maps/distance";
import { walkingRouteUrl } from "@/lib/maps/routeUrl";

describe("haversineDistanceKm", () => {
  it("同一地点は0km", () => {
    const p = { lat: 35.1225, lng: 136.9478 };
    expect(haversineDistanceKm(p, p)).toBeCloseTo(0, 5);
  });

  it("東京駅〜大阪駅は約400km(±20km)", () => {
    const tokyo = { lat: 35.681236, lng: 139.767125 };
    const osaka = { lat: 34.702485, lng: 135.495951 };
    const km = haversineDistanceKm(tokyo, osaka);
    expect(km).toBeGreaterThan(380);
    expect(km).toBeLessThan(420);
  });
});

describe("formatDistance", () => {
  it("1km未満はメートル表記", () => {
    expect(formatDistance(0.25)).toBe("250m");
  });

  it("1km以上はキロメートル表記(小数1桁)", () => {
    expect(formatDistance(3.14)).toBe("3.1km");
  });

  it("不正値はハイフン", () => {
    expect(formatDistance(Number.NaN)).toBe("-");
    expect(formatDistance(-1)).toBe("-");
  });
});

describe("walkingRouteUrl", () => {
  it("徒歩モードのGoogleマップ経路URLを生成する", () => {
    const url = walkingRouteUrl(35.1225, 136.9478);
    expect(url).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=35.1225,136.9478&travelmode=walking",
    );
  });
});
