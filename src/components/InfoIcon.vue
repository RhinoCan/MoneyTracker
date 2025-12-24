<script setup lang="ts">
defineProps<{
  title?: string;
  text: string;
  maxWidth?: string | number;
}>();

function handleClick(event: Event) {
  event.stopPropagation();
  event.preventDefault();
}
</script>

<template>
  <v-menu location="top" open-on-click :close-on-content-click="false">
    <template v-slot:activator="{ props }">
      <v-icon
        v-bind="props"
        icon="mdi-information-outline"
        size="small"
        color="info"
        class="ml-2 cursor-pointer"
        @click="handleClick"
      />
    </template>

    <v-card :max-width="maxWidth || 300" class="pa-3" @click.stop>
      <div v-if="title" class="text-subtitle-2 mb-1">{{ title }}</div>
      <div class="text-caption" style="line-height: 1.4">
        {{ text }}
      </div>
    </v-card>
  </v-menu>
</template>