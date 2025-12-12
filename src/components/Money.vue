<script setup lang="ts">
import { computed } from "vue";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter.ts";
import type { AmountType } from "@/types/Transaction.ts";

interface Props {
  amount: number;
  type: AmountType; // "Income" | "Expense" | "Balance"
}

const props = defineProps<Props>();

const { displayMoney } = useCurrencyFormatter();

// Reactive formatted amount
const formattedAmount = computed(() => displayMoney(props.amount));

// Reactive class based on type and value
const colorClass = computed(() => {
  switch (props.type) {
    case "Income":
      return "plus";
    case "Expense":
      return "minus";
    case "Balance":
      return props.amount < 0 ? "minus" : "plus";
    default:
      return "";
  }
});
</script>

<template>
  <span class="money" :class="colorClass">{{ formattedAmount }}</span>
</template>

<style lang="css" scoped>
.money {
  font-size: 20px;
  letter-spacing: 1px;
  margin: 5px 0;
}

.plus {
  color: #2ecc71 !important;
}

.minus {
  color: #c0392b !important;
} 
</style>
