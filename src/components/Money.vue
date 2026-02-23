<script setup lang="ts">
import { computed } from "vue";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter";

interface Props {
  amount?: number | string | null;
  type?: string;
}

const props = defineProps<Props>();
const { displayMoney } = useCurrencyFormatter();

/**
 * 1. Safe Numeric Conversion
 * Ensures we always have a valid number even if the prop is messy.
 */
const numericAmount = computed(() => {
  const val = typeof props.amount === 'string' ? parseFloat(props.amount) : props.amount;
  return (val !== null && !isNaN(val as number)) ? (val as number) : 0;
});

/**
 * 2. Formatted Output
 * displayMoney is a computed function from useCurrencyFormatter.
 */
const formattedAmount = computed(() => {
  return displayMoney.value(numericAmount.value);
});

/**
 * 3. Color Logic
 * Maps transaction types to semantic CSS classes.
 */
const colorClass = computed(() => {
  const t = props.type?.toLowerCase() || "";

  if (t.includes("income") || t === "plus") return "plus";
  if (t.includes("expense") || t === "minus") return "minus";

  // For "Balance", the color depends on the final value
  if (t.includes("balance")) {
    return numericAmount.value < 0 ? "minus" : "plus";
  }
  return "";
});
</script>

<template>
  <span class="money-display" :class="colorClass">
    {{ formattedAmount }}
  </span>
</template>

<style scoped>
.money-display {
  font-size: 1.25rem; /* 20px equivalent */
  letter-spacing: 1px;
  font-weight: 700;
  white-space: nowrap;
  display: inline-block;
  /* Tabular nums ensure numbers don't jump when values change */
  font-variant-numeric: tabular-nums;
}

.plus {
  color: rgb(var(--v-theme-success)) !important;
}

.minus {
  color: rgb(var(--v-theme-error)) !important;
}
</style>