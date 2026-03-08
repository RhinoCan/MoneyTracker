// @/i18n/index.ts
import { createI18n } from "vue-i18n";
import { en, ar, de, es, fr, it, ja, ko, pt, ru, zhHans } from "vuetify/locale";
import enUS from "./locales/en-US.json";
import enCA from "./locales/en-CA.json";
import enGB from "./locales/en-GB.json";
import frFR from "./locales/fr-FR.json";
import frCA from "./locales/fr-CA.json";
import frCH from "./locales/fr-CH.json";
import esES from "./locales/es-ES.json";
import deDE from "./locales/de-DE.json";
import zhCN from "./locales/zh-CN.json";
import jaJP from "./locales/ja-JP.json";
import koKR from "./locales/ko-KR.json";
import hiIN from "./locales/hi-IN.json";
import arSA from "./locales/ar-SA.json";
import ruRU from "./locales/ru-RU.json";
import ptBR from "./locales/pt-BR.json";
import itIT from "./locales/it-IT.json";

// There are no Hindi translations for the native Vuetify messages so we have an English fallback for those words.
export const i18n = createI18n({
  legacy: false,
  locale: "en-US",
  fallbackLocale: "en-US",
  messages: {
    "en-US": { ...enUS, $vuetify: en },
    "en-CA": { ...enCA, $vuetify: en },
    "en-GB": { ...enGB, $vuetify: en },
    "fr-FR": { ...frFR, $vuetify: fr },
    "fr-CA": { ...frCA, $vuetify: fr },
    "fr-CH": { ...frCH, $vuetify: fr },
    "es-ES": { ...esES, $vuetify: es },
    "de-DE": { ...deDE, $vuetify: de },
    "zh-CN": { ...zhCN, $vuetify: zhHans },
    "ja-JP": { ...jaJP, $vuetify: ja },
    "ko-KR": { ...koKR, $vuetify: ko },
    "hi-IN": { ...hiIN, $vuetify: en },
    "ar-SA": { ...arSA, $vuetify: ar },
    "ru-RU": { ...ruRU, $vuetify: ru },
    "pt-BR": { ...ptBR, $vuetify: pt },
    "it-IT": { ...itIT, $vuetify: it },
  },
});