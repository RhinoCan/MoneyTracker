// @/composables/useNumberFormatHints.ts
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/SettingsStore'

export function useNumberFormatHints() {
  const settingsStore = useSettingsStore()

  /**
   * Gets the decimal separator for the current locale
   */
  const decimalSeparator = computed(() => {
    const parts = new Intl.NumberFormat(settingsStore.locale).formatToParts(1.1)
    return parts.find(p => p.type === 'decimal')?.value ?? '.'
  })

  /**
   * Gets the thousands/group separator for the current locale
   */
  const groupSeparator = computed(() => {
    const parts = new Intl.NumberFormat(settingsStore.locale).formatToParts(1111)
    return parts.find(p => p.type === 'group')?.value ?? ','
  })

  /**
   * Generates a placeholder showing the expected format
   * e.g., "0.00" for en-US, "0,00" for de-DE
   */
  const amountPlaceholder = computed(() => {
    return `0${decimalSeparator.value}00`
  })

  /**
   * Generates an example formatted number for hint text
   * e.g., "Example: 1,234.56" for en-US, "Beispiel: 1.234,56" for de-DE
   */
  const amountExample = computed(() => {
    return new Intl.NumberFormat(settingsStore.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(1234.56)
  })

  /**
   * Validates if a string uses the correct decimal separator
   */
  const hasCorrectSeparator = (value: string): boolean => {
    if (!value || !value.includes('.') && !value.includes(',')) {
      return true // No separator used yet
    }

    // Check if they're using the wrong separator for decimals
    const wrongSeparator = decimalSeparator.value === ',' ? '.' : ','

    // If the value ends with wrongSeparator + 1-2 digits, they're using wrong format
    const wrongDecimalPattern = new RegExp(`\\${wrongSeparator}\\d{1,2}$`)

    return !wrongDecimalPattern.test(value)
  }

  return {
    decimalSeparator,
    groupSeparator,
    amountPlaceholder,
    amountExample,
    hasCorrectSeparator
  }
}