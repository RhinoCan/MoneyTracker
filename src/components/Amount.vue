<script setup lang="ts">
import { computed } from "vue";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter";
import type { TransactionType } from "@/types/Transaction";

// 1. HONESTY: Use the actual TransactionType or specific literals
interface Props {
  amount?: number | string | null;
  type?: TransactionType | "Balance" | "plus" | "minus";
}

const props = defineProps<Props>();
const { formatCurrency } = useCurrencyFormatter();

/**
 * 2. Safe Numeric Conversion
 */
const numericAmount = computed(() => {
  const val = typeof props.amount === "string" ? parseFloat(props.amount) : props.amount;
  return typeof val === "number" && !isNaN(val) ? val : 0;
});

const formattedAmount = computed(() => {
  return formatCurrency(numericAmount.value);
});

/**
 * 3. Declarative Color Logic
 */
const colorClass = computed(() => {
  const t = props.type?.toLowerCase() || "";

  // Explicit mapping
  if (t === "income" || t === "plus") return "money-plus";
  if (t === "expense" || t === "minus") return "money-minus";

  // Balance logic remains dynamic
  if (t === "balance") {
    return numericAmount.value < 0 ? "money-minus" : "money-plus";
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
  font-size: 1.25rem;
  letter-spacing: 1px;
  font-weight: 700;
  white-space: nowrap;
  display: inline-block;
  font-variant-numeric: tabular-nums;
}

/* 4. Consistent naming with your Add/Update components */
.money-plus {
  color: rgb(var(--v-theme-success)) !important;
}

.money-minus {
  color: rgb(var(--v-theme-error)) !important;
}
</style>