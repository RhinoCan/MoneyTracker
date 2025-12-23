<script setup lang="ts">
import { ref } from "vue";
import { useOtherStore } from "@/stores/OtherStore.ts";
import InfoIcon from "@/components/InfoIcon.vue";

const otherStore = useOtherStore();

// Initialize directly from the store's current state
const timeoutModel = ref<number>(otherStore.currentTimeout);

const timeoutRules = [
  (v: number) => v >= 0 || "Must be 0 or greater",
  (v: number) => v <= 15000 || "Must be 15000 or less",
  (v: number) => Number.isInteger(v) || "Must be a whole number",
];

function saveChanges() {
  // Only save if the value is valid (Vuetify's internal check)
  // Note: Parent will likely call this.
  otherStore.setTimeout(timeoutModel.value);
}

defineExpose({ saveChanges });
</script>

<template>
  <v-form ref="otherForm">
    <v-container>
      <p>
        This is the current value of the timeout for the Toast messages. If you would like to have a
        different length of the timeout, adjust the spinners until the timeout is the duration you want.
        The timeout value of future Toast messages will change when you click the
        <strong>Save Changes</strong> button.
      </p>
      <v-row dense>
        <v-col cols="12">
          <v-text-field
            class="mt-6 mb-4"
            type="number"
            label="Toast timeout"
            variant="outlined"
            :step="500"
            v-model.number="timeoutModel"
            :rules="timeoutRules"
            suffix="milliseconds"
            @click.prevent.stop
          >
            <template v-slot:append>

              <InfoIcon title="Toast Timeout"
                text="A value of zero means the Toast message stays visible until you close it manually. Values
                greater than zero indicate the number of milliseconds the Toast message stays visible until it
                closes itself automatically." />
            </template>
            </v-text-field>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>