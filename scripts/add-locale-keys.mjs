// scripts/add-locale-keys.mjs
// Adds missing translation keys to all locale files.
// Run with: node scripts/add-locale-keys.mjs

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, '../src/i18n/locales');

// Keys to add — { section: { key: { locale: value } } }
const ADDITIONS = {
  "login": {
    "show_password": {
      "ar-SA": "إظهار كلمة المرور",
      "de-DE": "Passwort anzeigen",
      "en-CA": "Show password",
      "en-GB": "Show password",
      "en-US": "Show password",
      "es-ES": "Mostrar contraseña",
      "fr-CA": "Afficher le mot de passe",
      "fr-CH": "Afficher le mot de passe",
      "fr-FR": "Afficher le mot de passe",
      "hi-IN": "पासवर्ड दिखाएं",
      "it-IT": "Mostra password",
      "ja-JP": "パスワードを表示",
      "ko-KR": "비밀번호 표시",
      "pt-BR": "Mostrar senha",
      "ru-RU": "Показать пароль",
      "zh-CN": "显示密码",
    },
    "hide_password": {
      "ar-SA": "إخفاء كلمة المرور",
      "de-DE": "Passwort verbergen",
      "en-CA": "Hide password",
      "en-GB": "Hide password",
      "en-US": "Hide password",
      "es-ES": "Ocultar contraseña",
      "fr-CA": "Masquer le mot de passe",
      "fr-CH": "Masquer le mot de passe",
      "fr-FR": "Masquer le mot de passe",
      "hi-IN": "पासवर्ड छुपाएं",
      "it-IT": "Nascondi password",
      "ja-JP": "パスワードを非表示",
      "ko-KR": "비밀번호 숨기기",
      "pt-BR": "Ocultar senha",
      "ru-RU": "Скрыть пароль",
      "zh-CN": "隐藏密码",
    },
  },
  "register": {
    "confirm_password_label": {
      "ar-SA": "تأكيد كلمة المرور",
      "de-DE": "Passwort bestätigen",
      "en-CA": "Confirm Password",
      "en-GB": "Confirm Password",
      "en-US": "Confirm Password",
      "es-ES": "Confirmar contraseña",
      "fr-CA": "Confirmer le mot de passe",
      "fr-CH": "Confirmer le mot de passe",
      "fr-FR": "Confirmer le mot de passe",
      "hi-IN": "पासवर्ड की पुष्टि करें",
      "it-IT": "Conferma password",
      "ja-JP": "パスワードを確認",
      "ko-KR": "비밀번호 확인",
      "pt-BR": "Confirmar senha",
      "ru-RU": "Подтвердите пароль",
      "zh-CN": "确认密码",
    },
    "password_mismatch": {
      "ar-SA": "كلمتا المرور غير متطابقتين.",
      "de-DE": "Die Passwörter stimmen nicht überein.",
      "en-CA": "Passwords do not match.",
      "en-GB": "Passwords do not match.",
      "en-US": "Passwords do not match.",
      "es-ES": "Las contraseñas no coinciden.",
      "fr-CA": "Les mots de passe ne correspondent pas.",
      "fr-CH": "Les mots de passe ne correspondent pas.",
      "fr-FR": "Les mots de passe ne correspondent pas.",
      "hi-IN": "पासवर्ड मेल नहीं खाते।",
      "it-IT": "Le password non corrispondono.",
      "ja-JP": "パスワードが一致しません。",
      "ko-KR": "비밀번호가 일치하지 않습니다.",
      "pt-BR": "As senhas não coincidem.",
      "ru-RU": "Пароли не совпадают.",
      "zh-CN": "密码不匹配。",
    },
    "password_too_short": {
      "ar-SA": "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
      "de-DE": "Das Passwort muss mindestens 8 Zeichen lang sein.",
      "en-CA": "Password must be at least 8 characters.",
      "en-GB": "Password must be at least 8 characters.",
      "en-US": "Password must be at least 8 characters.",
      "es-ES": "La contraseña debe tener al menos 8 caracteres.",
      "fr-CA": "Le mot de passe doit comporter au moins 8 caractères.",
      "fr-CH": "Le mot de passe doit comporter au moins 8 caractères.",
      "fr-FR": "Le mot de passe doit comporter au moins 8 caractères.",
      "hi-IN": "पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।",
      "it-IT": "La password deve contenere almeno 8 caratteri.",
      "ja-JP": "パスワードは8文字以上にしてください。",
      "ko-KR": "비밀번호는 최소 8자 이상이어야 합니다.",
      "pt-BR": "A senha deve ter pelo menos 8 caracteres.",
      "ru-RU": "Пароль должен содержать не менее 8 символов.",
      "zh-CN": "密码必须至少包含8个字符。",
    },
    "password_too_long": {
      "ar-SA": "يجب ألا تتجاوز كلمة المرور 128 حرفاً.",
      "de-DE": "Das Passwort darf höchstens 128 Zeichen lang sein.",
      "en-CA": "Password must be no more than 128 characters.",
      "en-GB": "Password must be no more than 128 characters.",
      "en-US": "Password must be no more than 128 characters.",
      "es-ES": "La contraseña no puede tener más de 128 caracteres.",
      "fr-CA": "Le mot de passe ne peut pas dépasser 128 caractères.",
      "fr-CH": "Le mot de passe ne peut pas dépasser 128 caractères.",
      "fr-FR": "Le mot de passe ne peut pas dépasser 128 caractères.",
      "hi-IN": "पासवर्ड 128 अक्षरों से अधिक नहीं हो सकता।",
      "it-IT": "La password non può superare i 128 caratteri.",
      "ja-JP": "パスワードは128文字以内にしてください。",
      "ko-KR": "비밀번호는 128자를 초과할 수 없습니다.",
      "pt-BR": "A senha não pode ter mais de 128 caracteres.",
      "ru-RU": "Пароль не может превышать 128 символов.",
      "zh-CN": "密码不能超过128个字符。",
    },
  },
};

const files = readdirSync(LOCALES_DIR).filter(f => f.endsWith('.json'));

for (const file of files) {
  const locale = file.replace('.json', '');
  const filePath = join(LOCALES_DIR, file);
  const json = JSON.parse(readFileSync(filePath, 'utf-8'));

  let changed = false;

  for (const [section, keys] of Object.entries(ADDITIONS)) {
    if (!json[section]) {
      console.warn(`  Warning: section "${section}" not found in ${file} — skipping`);
      continue;
    }
    for (const [key, values] of Object.entries(keys)) {
      if (json[section][key] !== undefined) {
        console.log(`  Skipping ${file} — ${section}.${key} already exists`);
        continue;
      }
      const value = values[locale];
      if (!value) {
        console.warn(`  Warning: no value for ${locale} in ${section}.${key} — skipping`);
        continue;
      }
      json[section][key] = value;
      changed = true;
      console.log(`  Added ${section}.${key} to ${file}`);
    }
  }

  if (changed) {
    writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf-8');
    console.log(`  Saved ${file}`);
  }
}

console.log('\nDone.');