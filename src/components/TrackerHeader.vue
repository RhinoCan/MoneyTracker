<script setup lang="ts">
import { ref, computed } from "vue"
import SettingsDialog from "@/components/SettingsDialog.vue"
import * as Sentry from "@sentry/vue";


const appEnvironment = computed(() => {
  const envValue = import.meta.env.VITE_APP_ENV;

  // The most reliable check: If the variable has *any* truthy value (i.e.,
  // it was set by cross-env and is not undefined or an empty string),
  // assume we are in the custom 'live' environment.
  if (envValue) {
    return 'Live (GitHub Pages)';
  }

  // You can also check the mode that Vite sets automatically,
  // though checking the custom variable is usually better:
  // if (import.meta.env.MODE === 'production') { return 'Live (GitHub Pages)'; }


  // If the variable is falsy (undefined/empty string), we default to Dev Server
  return 'Dev Server';
});

const showSettings = ref(false);

</script>

<template>
  <v-app-bar title="Money Tracker" color="primary">
    <v-spacer></v-spacer>
    <v-chip :color="appEnvironment.includes('Dev') ? 'warning' : 'success'" variant="elevated" class="mr-4">
      {{ appEnvironment }}
    </v-chip>
    <v-btn id="showSettings" color="yellow" @click="showSettings = true"><v-icon>mdi-cog</v-icon>Settings</v-btn>

    <!--SETTINGS DIALOG-->
    <v-dialog v-model="showSettings" max-width="550">
      <SettingsDialog @close="showSettings = false" />
    </v-dialog>

  </v-app-bar>
</template>
