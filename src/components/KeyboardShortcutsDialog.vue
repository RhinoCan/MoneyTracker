<script setup lang="ts">
const emit = defineEmits(["close"]);
</script>

<template>
  <v-card color="surface">
    <v-card-title class="bg-primary text-on-primary"
      >Keyboard Shortcuts</v-card-title
    >
    <v-btn
      icon="mdi-close"
      variant="text"
      color="white"
      aria-label="Close dialog"
      position="absolute"
      style="top: 8px; right: 8px"
      @click="emit('close')"
    />
    <v-card-text
      ><p>
        You may use the <kbd>Esc</kbd> key on your keyboard to cancel this
        update rather than using the <v-icon>mdi-close</v-icon> icon or the
        <strong>Cancel</strong> button.
      </p>

      <p class="mt-4">
        You may use the <kbd>Enter</kbd> key on your keyboard to save the
        changes you made here rather than using the
        <strong>Save</strong> button.
      </p>

      <p class="mt-4">
        You may use the <kbd>Tab</kbd> key on your keyboard to jump between
        fields on forms that contain multiple fields.
      </p>
    </v-card-text>

    <v-card-actions>
      <v-btn
        text="close"
        color="primary"
        variant="elevated"
        @click="emit('close')"
      ></v-btn>
    </v-card-actions>
  </v-card>
</template>
