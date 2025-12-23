<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import SettingsLocale from "@/components/SettingsTabLocale.vue";
import SettingsCurrency from "@/components/SettingsTabCurrency.vue";
import SettingsDateFormat from "@/components/SettingsTabDateFormat.vue";
import SettingsOther from "@/components/SettingsTabOther.vue";
import { useOtherStore } from '@/stores/OtherStore.ts';
import { useToast } from 'vue-toastification';
import KeyboardShortcutsDialog from "@/components/KeyboardShortcutsDialog.vue";

const toast = useToast();

const otherStore = useOtherStore();
const { getTimeout } = storeToRefs(otherStore);

const showKeyboardShortcuts = ref(false);

const emit = defineEmits(["close"]);

const activeTab = ref('locale');

// Template Refs to child components
const localeRef = ref();
const currencyRef = ref();
const dateFormatRef = ref();
const otherRef = ref();

/**
 * The "Master Save"
 * Calls the exposed saveChanges() method on every tab.
 * Thanks to :eager="true", these refs will be populated even if
 * the user hasn't clicked on the tab yet.
 */
async function saveAllTabs() {
  localeRef.value?.saveChanges();
  currencyRef.value?.saveChanges();
  dateFormatRef.value?.saveChanges();
  otherRef.value?.saveChanges();

  toast.success("Successfully updated the settings.", { timeout: getTimeout.value });

  emit("close");
}

/**
 * Keyboard Handler
 * Triggers save on 'Enter' unless the user is specifically
 * inside a numeric input (where they might just be finishing a number).
 */
function handleEnter(event: KeyboardEvent) {
  const target = event.target as HTMLElement;

  if (target.tagName === 'INPUT' && target.getAttribute('type') === 'number') {
    return;
  }

  // Brief delay to ensure v-select/v-autocomplete menus close before saving
  setTimeout(() => {
    saveAllTabs();
  }, 100);
}
</script>

<template>
  <v-card color="surface" @keydown.enter="handleEnter">
    <v-card-title class="bg-primary text-on-primary">
      Settings
      <v-btn
        icon="mdi-help"
        variant="text"
        color="white"
        aria-label="Help"
        position="absolute"
        style="top: 0px; right: 48px"
        @click="showKeyboardShortcuts = true"
      />
      <v-btn
        icon="mdi-close"
        variant="text"
        color="white"
        aria-label="Close dialog"
        position="absolute"
        style="top: 0px; right: 8px"
        @click="emit('close')"
      />
    </v-card-title>

    <v-tabs v-model="activeTab" color="surface" bg-color="primary">
      <v-tab value="locale">Locale</v-tab>
      <v-tab value="currency">Currency</v-tab>
      <v-tab value="dateFormat">Date Format</v-tab>
      <v-tab value="other">Other</v-tab>
    </v-tabs>

    <v-tabs-window v-model="activeTab">
      <v-tabs-window-item value="locale" :eager="true">
        <SettingsLocale ref="localeRef" />
      </v-tabs-window-item>

      <v-tabs-window-item value="currency" :eager="true">
        <SettingsCurrency ref="currencyRef" />
      </v-tabs-window-item>

      <v-tabs-window-item value="dateFormat" :eager="true">
        <SettingsDateFormat ref="dateFormatRef" />
      </v-tabs-window-item>

      <v-tabs-window-item value="other" :eager="true">
        <SettingsOther ref="otherRef" />
      </v-tabs-window-item>
    </v-tabs-window>

    <v-card-actions>
      <v-spacer />
      <v-btn color="secondary" variant="outlined" @click="emit('close')">
        Cancel
      </v-btn>
      <v-btn color="primary" variant="elevated" @click="saveAllTabs">
        Save Changes
      </v-btn>
    </v-card-actions>
  </v-card>

    <!--KEYBOARD SHORTCUTS DIALOG-->
    <v-dialog v-model="showKeyboardShortcuts" max-width="300">
      <KeyboardShortcutsDialog @close="showKeyboardShortcuts = false" />
    </v-dialog>
</template>