import type { RegisterRequest } from "@/types/auth";
import type { SpotRequest } from "@/types/spot";

export type ValidationErrors = Record<string, string>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** ユーザー登録フォームの検証(AI_SPECIFICATION.md §19) */
export function validateRegisterForm(
  values: RegisterRequest,
): ValidationErrors {
  const errors: ValidationErrors = {};
  const userName = values.userName.trim();
  if (!userName) {
    errors.userName = "ユーザー名は必須です。";
  } else if (userName.length < 2 || userName.length > 50) {
    errors.userName = "ユーザー名は2〜50文字で入力してください。";
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = "メールアドレスは必須です。";
  } else if (email.length > 255) {
    errors.email = "メールアドレスは255文字以内で入力してください。";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "メールアドレスの形式が正しくありません。";
  }

  if (!values.password) {
    errors.password = "パスワードは必須です。";
  } else if (values.password.length < 8) {
    errors.password = "パスワードは8文字以上で入力してください。";
  }

  if (values.passwordConfirmation !== values.password) {
    errors.passwordConfirmation = "パスワードが一致しません。";
  }
  return errors;
}

/** ログインフォームの検証 */
export function validateLoginForm(values: {
  email: string;
  password: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!values.email.trim()) {
    errors.email = "メールアドレスは必須です。";
  }
  if (!values.password) {
    errors.password = "パスワードは必須です。";
  }
  return errors;
}

/** 聖地登録・編集フォームの検証(AI_SPECIFICATION.md §19) */
export function validateSpotForm(values: SpotRequest): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!values.workName.trim()) {
    errors.workName = "作品名は必須です。";
  } else if (values.workName.length > 100) {
    errors.workName = "作品名は100文字以内で入力してください。";
  }

  if (!values.spotName.trim()) {
    errors.spotName = "聖地名は必須です。";
  } else if (values.spotName.length > 100) {
    errors.spotName = "聖地名は100文字以内で入力してください。";
  }

  if (!["GAME", "ANIME", "GAME_AND_ANIME"].includes(values.category)) {
    errors.category = "カテゴリーを選択してください。";
  }

  if (!values.address.trim()) {
    errors.address = "住所は必須です。";
  } else if (values.address.length > 255) {
    errors.address = "住所は255文字以内で入力してください。";
  }

  if (values.prefecture && values.prefecture.length > 50) {
    errors.prefecture = "都道府県は50文字以内で入力してください。";
  }

  if (!Number.isFinite(values.latitude)) {
    errors.latitude = "緯度は必須です。地図で位置を指定してください。";
  } else if (values.latitude < -90 || values.latitude > 90) {
    errors.latitude = "緯度は-90〜90の範囲で入力してください。";
  }

  if (!Number.isFinite(values.longitude)) {
    errors.longitude = "経度は必須です。地図で位置を指定してください。";
  } else if (values.longitude < -180 || values.longitude > 180) {
    errors.longitude = "経度は-180〜180の範囲で入力してください。";
  }

  if (values.sceneDescription && values.sceneDescription.length > 500) {
    errors.sceneDescription = "登場場面は500文字以内で入力してください。";
  }

  if (values.description && values.description.length > 5000) {
    errors.description = "説明は5000文字以内で入力してください。";
  }

  if (values.sourceUrl) {
    if (values.sourceUrl.length > 500) {
      errors.sourceUrl = "出典URLは500文字以内で入力してください。";
    } else {
      try {
        const url = new URL(values.sourceUrl);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          errors.sourceUrl = "出典URLはhttpまたはhttpsで入力してください。";
        }
      } catch {
        errors.sourceUrl = "出典URLの形式が正しくありません。";
      }
    }
  }

  if (values.sourceDescription && values.sourceDescription.length > 500) {
    errors.sourceDescription = "出典説明は500文字以内で入力してください。";
  }
  return errors;
}

/** 却下理由の検証(却下時必須、500文字以内) */
export function validateRejectionReason(reason: string): string | null {
  if (!reason.trim()) {
    return "却下理由は必須です。";
  }
  if (reason.length > 500) {
    return "却下理由は500文字以内で入力してください。";
  }
  return null;
}
