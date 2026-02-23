<script setup lang="ts">
/**
 * KeyboardShortcutsDialog.vue
 * Displays a quick reference guide for form interaction.
 */
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const emit = defineEmits(["close"]);
</script>

<template>
  <v-card color="surface" elevation="12" rounded="lg">
    <v-card-title class="bg-primary text-on-primary d-flex align-center">
      <v-icon start icon="mdi-keyboard-outline" />
      {{ t("keyboard.title") }}

      <v-btn
        icon="mdi-close"
        variant="text"
        color="white"
        density="comfortable"
        :aria-label="t('common.close')"
        position="absolute"
        style="top: 8px; right: 8px"
        @click="emit('close')"
      />
    </v-card-title>

    <v-card-text class="pa-6">
      <div class="shortcut-row mb-4">
        <i18n-t keypath="keyboard.paraEsc" tag="div" class="text-body-1">
          <template #Esc>
            <kbd class="key-cap">{{ t("keyboard.keyEsc") }}</kbd>
          </template>
          <template #iconHelp>
            <v-icon icon="mdi-help" size="small" color="primary" :aria-label="t('common.help')" />
          </template>
        </i18n-t>
      </div>

      <div class="shortcut-row mb-4">
        <i18n-t keypath="keyboard.paraEnter" tag="div" class="text-body-1">
          <template #Enter>
            <kbd class="key-cap">{{ t("keyboard.keyEnter") }}</kbd>
          </template>
        </i18n-t>
      </div>

      <div class="shortcut-row">
        <i18n-t keypath="keyboard.paraTab" tag="div" class="text-body-1">
          <template #Tab>
            <kbd class="key-cap">{{ t("keyboard.keyTab") }}</kbd>
          </template>
        </i18n-t>
      </div>
    </v-card-text>

    <v-divider />

    <v-card-actions class="pa-4 bg-grey-lighten-4">
      <v-spacer />
      <v-btn color="primary" variant="elevated" min-width="100" @click="emit('close')">
        {{ t("common.close") }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.key-cap {
  background-color: #f7f7f7;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow:
    0 1px 0 rgba(0, 0, 0, 0.2),
    0 0 0 2px #fff inset;
  color: #333;
  display: inline-block;
  font-family: inherit;
  font-size: 0.85em;
  font-weight: 700;
  line-height: 1;
  padding: 2px 5px;
  white-space: nowrap;
}

.shortcut-row {
  display: flex;
  align-items: center;
}
</style>
