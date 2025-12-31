<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import SettingsLocale from "@/components/SettingsTabLocale.vue";
import SettingsCurrency from "@/components/SettingsTabCurrency.vue";
import SettingsDateFormat from "@/components/SettingsTabDateFormat.vue";
import SettingsOther from "@/components/SettingsTabOther.vue";
import { useOtherStore } from "@/stores/OtherStore.ts";
import { useToast } from "vue-toastification";
import KeyboardShortcutsDialog from "@/components/KeyboardShortcutsDialog.vue";

const toast = useToast();

const otherStore = useOtherStore();
const { getTimeout } = storeToRefs(otherStore);

const showKeyboardShortcuts = ref(false);

const openHelp = () => {
  showKeyboardShortcuts.value = true;
}

const closeDialog = () => {
  emit('close');
}

const emit = defineEmits(["close"]);

const activeTab = ref("locale");

// Template Refs to child components
const localeRef = ref<InstanceType<typeof SettingsLocale> | null>(null);
const currencyRef = ref<InstanceType<typeof SettingsCurrency> | null>(null);
const dateFormatRef = ref<InstanceType<typeof SettingsDateFormat> | null>(null);
const otherRef = ref<InstanceType<typeof SettingsOther> | null>(null);

/**
 * Computed property to check if all forms are valid.
 */
const isEverythingValid = computed(() => {
  return (
    (localeRef.value?.isValid ?? true) &&
    (currencyRef.value?.isValid ?? true) &&
    (dateFormatRef.value?.isValid ?? true) &&
    (otherRef.value?.isValid ?? true)
  );
});

/**
 * The "Master Save"
 * Calls the exposed saveChanges() method on every tab.
 */
async function saveAllTabs() {
  if (!isEverythingValid.value) return;
  localeRef.value?.saveChanges();
  currencyRef.value?.saveChanges();
  dateFormatRef.value?.saveChanges();
  otherRef.value?.saveChanges();

  toast.success("Successfully updated the settings.", {
    timeout: getTimeout.value,
  });

  emit("close");
}

/**
 * Keyboard Handler
 * Triggers save on 'Enter' unless the user is inside a numeric input.
 */
function handleEnter(event: KeyboardEvent) {
  if (!isEverythingValid.value) return;
  const target = event.target as HTMLElement;

  if (target.tagName === "INPUT" && target.getAttribute("type") === "number") {
    return;
  }

  // Brief delay to ensure v-select/v-autocomplete menus close before saving
  setTimeout(() => {
    saveAllTabs();
  }, 100);
}

// <-- Expose the methods to template and tests
defineExpose({ saveAllTabs, handleEnter });
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
        @click="openHelp"
      />
      <v-btn
        icon="mdi-close"
        variant="text"
        color="white"
        aria-label="Close dialog"
        position="absolute"
        style="top: 0px; right: 8px"
        @click="closeDialog"
      />
    </v-card-title>

    <v-tabs v-model="activeTab" color="surface" bg-color="primary">
      <v-tab value="locale">
        Locale
        <v-icon v-if="!localeRef?.isValid" icon="mdi-alert-circle" color="error" size="small" class="ml-1"/>
      </v-tab>
      <v-tab value="currency">
        Currency
        <v-icon v-if="!currencyRef?.isValid" icon="mdi-alert-circle" color="error" size="small" class="ml-1"/>
      </v-tab>
      <v-tab value="dateFormat">
        Date Format
        <v-icon v-if="!dateFormatRef?.isValid" icon="mdi-alert-circle" color="error" size="small" class="ml-1"/>
      </v-tab>
      <v-tab value="other">
        Other
        <v-icon v-if="!otherRef?.isValid" icon="mdi-alert-circle" color="error" size="small" class="ml-1"/>
      </v-tab>
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

    <v-divider></v-divider>

    <v-card-actions class="d-block pa-4">
      <v-fade-transition>
        <div v-if="!isEverythingValid" class="text-right mb-2">
          <span class="text-error text-caption font-weight-bold">
            <v-icon icon="mdi-alert-circle-outline" size="small" class="mr-1"/>
            Please fix errors on all tabs before saving
          </span>
        </div>
      </v-fade-transition>

      <div class="d-flex justify-end">
        <v-btn color="secondary" variant="outlined" class="mr-2" @click="emit('close')">
          Cancel
        </v-btn>
        <v-btn color="primary" variant="elevated" :disabled="!isEverythingValid" @click="saveAllTabs">
          Save Changes
        </v-btn>
      </div>
    </v-card-actions>
  </v-card>

  <v-dialog v-model="showKeyboardShortcuts" max-width="300">
    <KeyboardShortcutsDialog @close="showKeyboardShortcuts = false" />
  </v-dialog>
</template>
