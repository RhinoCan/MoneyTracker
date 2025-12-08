<script setup lang="ts">
import type { AmountType } from '@/types/Transaction.ts';
import { computed } from 'vue';
import { useCurrencyFormatter } from '@/composables/useCurrencyFormatter.ts';

interface Props {
    amount: number;
    type: AmountType;
}

const props = defineProps<Props>();

const { displayMoney } = useCurrencyFormatter();

const formattedAmount = computed(() => {
    return displayMoney.value(props.amount);
});

const colorClass = computed(() => {
    if (props.type === "Income") return "plus";
    if (props.type === "Expense") return "minus";
    if (props.type === "Balance") return props.amount < 0 ? "minus" : "plus";
    return "";
})
</script>



<template>
    <span class="money" :class="colorClass">{{ formattedAmount }}</span>
</template>



<style scoped>
.money {
    font-size: 20px;
    letter-spacing: 1px;
    margin: 5px, 0;
}
.plus {
    color: #2ecc71;
}
.minus {
    color: #c0392b;
}
</style>