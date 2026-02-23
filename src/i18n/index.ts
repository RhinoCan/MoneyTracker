// @/i18n/index.ts
import { createI18n } from 'vue-i18n'
import enUS from './locales/en-US.json'
import enCA from './locales/en-CA.json'
import enGB from './locales/en-GB.json'
import frFR from './locales/fr-FR.json'
import frCA from './locales/fr-CA.json'
import frCH from './locales/fr-CH.json'
import esES from './locales/es-ES.json'
import deDE from './locales/de-DE.json'
import zhCN from './locales/zh-CN.json'
import jaJP from './locales/ja-JP.json'
import koKR from './locales/ko-KR.json'
import hiIN from './locales/hi-IN.json'
import arSA from './locales/ar-SA.json'
import ruRU from './locales/ru-RU.json'
import ptBR from './locales/pt-BR.json'
import itIT from './locales/it-IT.json'

export const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: {
    'en-US': enUS,
    'en-CA': enCA,
    'en-GB': enGB,
    'fr-FR': frFR,
    'fr-CA': frCA,
    'fr-CH': frCH,
    'es-ES': esES,
    'de-DE': deDE,
    'zh-CN': zhCN,
    'ja-JP': jaJP,
    'ko-KR': koKR,
    'hi-IN': hiIN,
    'ar-SA': arSA,
    'ru-RU': ruRU,
    'pt-BR': ptBR,
    'it-IT': itIT
  }
})
