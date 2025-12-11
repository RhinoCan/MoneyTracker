// src/utils/localeList.ts
export interface LocaleItem {
  code: string;
  name: string;
}

export function generateLocaleList(): LocaleItem[] {
  const display = new Intl.DisplayNames(["en"], { type: "language" });

  let localeCodes: string[] = [];

  try {
    // Modern browsers (ES2023+)
    // @ts-expect-error: TypeScript may not know about this yet
    localeCodes = Intl.supportedValuesOf("language");
  } catch {
    // Fallback for unsupported environments
    localeCodes = [
      "en-US",
      "en-CA",
      "fr-CA",
      "en-GB",
      "fr-CH",
      "fr-FR",
      "es-ES",
      "de-DE",
      "zh-CN",
      "ja-JP",
      "ko-KR",
      "hi-IN",
      "ar-SA",
      "ru-RU",
    ];
  }

  const items: LocaleItem[] = localeCodes.map((code) => {
    const name = display.of(code) || code;
    return { code: code.toLowerCase(), name };
  });

  items.sort((a, b) => a.name.localeCompare(b.name));

  return items;
}

export const localeList: LocaleItem[] = generateLocaleList();
