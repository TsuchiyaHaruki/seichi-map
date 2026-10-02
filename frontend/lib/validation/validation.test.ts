import { describe, it, expect } from "vitest";
import {
  validateRegisterForm,
  validateLoginForm,
  validateSpotForm,
  validateRejectionReason,
} from "@/lib/validation";
import type { SpotRequest } from "@/types/spot";

const validSpot: SpotRequest = {
  workName: "CLANNAD",
  spotName: "瑞穂運動場東駅周辺",
  category: "GAME_AND_ANIME",
  address: "愛知県名古屋市瑞穂区",
  prefecture: "愛知県",
  latitude: 35.1225,
  longitude: 136.9478,
};

describe("validateRegisterForm", () => {
  const valid = {
    userName: "tutti",
    email: "tutti@example.com",
    password: "SecurePass123",
    passwordConfirmation: "SecurePass123",
  };

  it("正しい入力ならエラーなし", () => {
    expect(validateRegisterForm(valid)).toEqual({});
  });

  it("ユーザー名は2〜50文字", () => {
    expect(validateRegisterForm({ ...valid, userName: "a" }).userName).toBeDefined();
    expect(
      validateRegisterForm({ ...valid, userName: "" }).userName,
    ).toBeDefined();
  });

  it("メール形式を検証する", () => {
    expect(validateRegisterForm({ ...valid, email: "bad" }).email).toBeDefined();
  });

  it("パスワードは8文字以上", () => {
    expect(
      validateRegisterForm({
        ...valid,
        password: "short",
        passwordConfirmation: "short",
      }).password,
    ).toBeDefined();
  });

  it("確認用パスワードの不一致を検出する", () => {
    expect(
      validateRegisterForm({ ...valid, passwordConfirmation: "different" })
        .passwordConfirmation,
    ).toBeDefined();
  });
});

describe("validateLoginForm", () => {
  it("メール・パスワード必須", () => {
    const errors = validateLoginForm({ email: "", password: "" });
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
  });

  it("入力があればエラーなし", () => {
    expect(
      validateLoginForm({ email: "a@example.com", password: "x" }),
    ).toEqual({});
  });
});

describe("validateSpotForm", () => {
  it("正しい入力ならエラーなし", () => {
    expect(validateSpotForm(validSpot)).toEqual({});
  });

  it("作品名・聖地名・住所は必須", () => {
    const errors = validateSpotForm({
      ...validSpot,
      workName: "",
      spotName: "",
      address: "",
    });
    expect(errors.workName).toBeDefined();
    expect(errors.spotName).toBeDefined();
    expect(errors.address).toBeDefined();
  });

  it("緯度・経度の範囲を検証する", () => {
    expect(validateSpotForm({ ...validSpot, latitude: 100 }).latitude).toBeDefined();
    expect(
      validateSpotForm({ ...validSpot, longitude: 200 }).longitude,
    ).toBeDefined();
  });

  it("緯度・経度が数値でない場合はエラー", () => {
    expect(
      validateSpotForm({ ...validSpot, latitude: Number.NaN }).latitude,
    ).toBeDefined();
  });

  it("出典URLの形式を検証する", () => {
    expect(
      validateSpotForm({ ...validSpot, sourceUrl: "not-a-url" }).sourceUrl,
    ).toBeDefined();
    expect(
      validateSpotForm({ ...validSpot, sourceUrl: "https://example.com" })
        .sourceUrl,
    ).toBeUndefined();
  });

  it("不正なカテゴリーを弾く", () => {
    expect(
      validateSpotForm({
        ...validSpot,
        category: "INVALID" as SpotRequest["category"],
      }).category,
    ).toBeDefined();
  });
});

describe("validateRejectionReason", () => {
  it("空欄はエラー", () => {
    expect(validateRejectionReason("")).not.toBeNull();
    expect(validateRejectionReason("   ")).not.toBeNull();
  });

  it("500文字超はエラー", () => {
    expect(validateRejectionReason("あ".repeat(501))).not.toBeNull();
  });

  it("正しい理由はnull", () => {
    expect(validateRejectionReason("出典を確認できませんでした。")).toBeNull();
  });
});
