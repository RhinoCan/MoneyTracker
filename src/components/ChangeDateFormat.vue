<script setup lang="ts">
import { ref } from "vue";
import { useDateFormatStore } from "@/stores/DateFormatStore.ts";
import { DateFormatTemplate } from "@/types/CommonTypes.ts";

const emit = defineEmits<{
  (e: "cancel"): void; //Closes without saving
  (e: "saved"): void; //Closes after saving
}>();

const dateFormatStore = useDateFormatStore();

const dateFormatModel = ref<DateFormatTemplate>(
  dateFormatStore.activeDateFormat
);

const dateFormatOptions = [
  { title: "ISO (YYYY-MM-DD) e.g. 2025-12-25", value: DateFormatTemplate.ISO },
  { title: "USA (MM/DD/YYYY) e.g. 12/25/2025", value: DateFormatTemplate.USA },
  { title: "EUR (DD.MM.YYYY) e.g. 25.12.2025", value: DateFormatTemplate.EUR },
];

function saveChanges() {
  dateFormatStore.setDateFormat(dateFormatModel.value);
  emit("saved");
}
</script>

<template>
  <v-card color="surface">
    <v-card-title class="bg-primary text-on-primary"
      >Change Date Format</v-card-title
    >

    <v-card-text>
      <v-row dense>
        <v-col cols="12">
          <v-select
            label="Date Format"
            variant="outlined"
            :items="dateFormatOptions"
            item-title="title"
            item-value="value"
            v-model="dateFormatModel"
          />
        </v-col>
      </v-row>

    </v-card-text>

    <v-card-actions>
      <v-btn color="secondary" variant="outlined" @click="emit('cancel')"
        >Cancel</v-btn
      >
      <v-btn color="primary" variant="elevated" @click="saveChanges"
        >Change Date Format</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
