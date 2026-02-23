<script setup lang="ts">
/**
 * InfoIcon.vue
 * A reusable information tooltip component.
 * Prevents event bubbling to avoid triggering parent actions.
 */
interface Props {
  text: string;
  title?: string;
  maxWidth?: string | number;
}

const props = defineProps<Props>();

function handleClick(event: Event) {
  // Prevent clicks from triggering parent elements (like list items or cards)
  event.stopPropagation();
  event.preventDefault();
}
</script>

<template>
  <v-menu
    location="top"
    open-on-hover
    open-on-click
    :close-on-content-click="false"
    transition="scale-transition"
  >
    <template v-slot:activator="{ props: menuProps }">
      <v-icon
        v-bind="menuProps"
        icon="mdi-information-outline"
        size="small"
        color="info"
        class="ml-2 cursor-help"
        role="button"
        :aria-label="title || 'Information'"
        @click="handleClick"
      />
    </template>

    <v-card
      :max-width="maxWidth || 300"
      class="pa-3"
      elevation="8"
      @click.stop
    >
      <div v-if="title" class="text-subtitle-2 font-weight-bold mb-1">
        {{ title }}
      </div>
      <div class="text-caption text-medium-emphasis" style="line-height: 1.5">
        {{ text }}
      </div>
    </v-card>
  </v-menu>
</template>

<style scoped>
.cursor-help {
  cursor: help;
}
</style>