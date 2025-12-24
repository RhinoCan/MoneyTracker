<script setup lang="ts">
import { ref } from "vue";
import { useDateFormatStore } from "@/stores/DateFormatStore.ts";
import { DateFormatTemplate } from "@/types/CommonTypes.ts";

const formValid = ref(true);

const dateFormatStore = useDateFormatStore();

// This is your single source of truth for the "buffer"
const dateFormatModel = ref<DateFormatTemplate>(
  dateFormatStore.currentDateFormat
);

const dateFormatOptions = [
  { title: "ISO (YYYY-MM-DD) e.g. 2025-12-25", value: DateFormatTemplate.ISO },
  { title: "USA (MM/DD/YYYY) e.g. 12/25/2025", value: DateFormatTemplate.USA },
  { title: "EUR (DD.MM.YYYY) e.g. 25.12.2025", value: DateFormatTemplate.EUR },
];

// Called by the parent Dialog's "Save" button
function saveChanges() {
  dateFormatStore.setDateFormat(dateFormatModel.value);
}

// Crucial for the Parent-Child "Save" coordination
defineExpose({
  saveChanges,
  get isValid() {
    return formValid.value;
  }
});
</script>

<template>
  <v-form ref="dateForm" v-model="formValid">
    <v-container>
      <p>
        This is the date format currently being used. If you would like to have a
        different date format, choose one of the other formats from the drop-down.
        The date format used in this app will change when you click the <strong>Save Changes</strong> button.
      </p>
      <v-row dense>
        <v-col cols="12">
          <v-select
            class="mt-6 mb-4"
            label="Date Format"
            variant="outlined"
            :items="dateFormatOptions"
            item-title="title"
            item-value="value"
            v-model="dateFormatModel"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>