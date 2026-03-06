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
  "app.retry": {
    "ar-SA": "إعادة المحاولة",
    "de-DE": "Neu starten",
    "en-CA": "Restart",
    "en-GB": "Restart",
    "en-US": "Restart",
    "es-ES": "Reintentar",
    "fr-CA": "Redémarrer",
    "fr-CH": "Redémarrer",
    "fr-FR": "Redémarrer",
    "hi-IN": "पुनः प्रयास करें",
    "it-IT": "Riprova",
    "ja-JP": "再試行",
    "ko-KR": "다시 시도",
    "pt-BR": "Tentar novamente",
    "ru-RU": "Повторить",
    "zh-CN": "重试",
  }
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