// scripts/add-locale-keys.mjs
// Adds missing translation keys to all locale files.
// Run with: node scripts/add-locale-keys.mjs

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, "../src/i18n/locales");

// Keys to add — { section: { key: { locale: value } } }
const ADDITIONS = {
  register: {
    caution: {
      "ar-SA": "هذا تطبيق تجريبي - لا تدخل بيانات مالية حقيقية.",
      "de-DE": "Dies ist eine Demo-App – bitte keine echten Finanzdaten eingeben.",
      "en-CA": "This is a demonstration/portfolio app - do not enter real financial data.",
      "en-GB": "This is a demonstration/portfolio app - do not enter real financial data.",
      "en-US": "This is a demonstration/portfolio app - do not enter real financial data.",
      "es-ES": "Esta es una aplicación de demostración - no introduzca datos financieros reales.",
      "fr-CA": "Cette application est une démo - ne saisissez pas de données financières réelles.",
      "fr-CH": "Cette application est une démo - ne saisissez pas de données financières réelles.",
      "fr-FR": "Cette application est une démo - ne saisissez pas de données financières réelles.",
      "hi-IN": "यह एक डेमो ऐप है - वास्तविक वित्तीय डेटा दर्ज न करें।",
      "it-IT": "Questa è un'app dimostrativa - non inserire dati finanziari reali.",
      "ja-JP": "これはデモ用アプリです - 実際の金融データを入力しないでください。",
      "ko-KR": "이것은 데모 앱입니다 - 실제 금융 데이터를 입력하지 마세요.",
      "pt-BR": "Este é um aplicativo de demonstração - não insira dados financeiros reais.",
      "ru-RU": "Это демонстрационное приложение - не вводите реальные финансовые данные.",
      "zh-CN": "这是一个演示应用 - 请勿输入真实财务数据。",
    },
  },
};

const files = readdirSync(LOCALES_DIR).filter((f) => f.endsWith(".json"));

for (const file of files) {
  const locale = file.replace(".json", "");
  const filePath = join(LOCALES_DIR, file);
  const json = JSON.parse(readFileSync(filePath, "utf-8"));

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
    writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n", "utf-8");
    console.log(`  Saved ${file}`);
  }
}

console.log("\nDone.");
