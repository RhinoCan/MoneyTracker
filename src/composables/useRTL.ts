// composables/useRtl.ts
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const RTL_LOCALES = ["ar"];

export function useRtl() {
  const { locale } = useI18n();
  const isRtl = computed(() => RTL_LOCALES.includes(locale.value));
  return { isRtl };
}
