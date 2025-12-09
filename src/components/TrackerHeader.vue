<script setup lang="ts">
import { ref } from "vue"
import ChangeLocale from "@/components/ChangeLocale.vue"
import ChangeCurrency from "@/components/ChangeCurrency.vue"

const showLocaleDialog = ref(false)
const showCurrencyDialog = ref(false)
</script>

<template>
  <v-app-bar title="Money Tracker" color="primary">
    <v-btn id="showSettingsMenu" color="yellow" prepend-icon="mdi-cog">
      Settings
    </v-btn>

    <v-menu activator="#showSettingsMenu" :close-on-content-click="false">
      <v-list>
        <v-list-item>
          <v-btn
            id="localeDialog"
            prepend-icon="mdi-map-marker-outline"
            @click="showLocaleDialog = true"
          >
            Change Locale
          </v-btn>
        </v-list-item>

        <v-list-item>
          <v-btn
            id="currencyDialog"
            prepend-icon="mdi-currency-sign"
            @click="showCurrencyDialog = true"
          >
            Change Currency and Currency Appearance
          </v-btn>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- LOCALE DIALOG -->
    <v-dialog v-model="showLocaleDialog" max-width="400">
      <ChangeLocale @saved="showLocaleDialog = false" @cancel="showLocaleDialog = false" />
    </v-dialog>

    <!-- CURRENCY DIALOG -->
    <v-dialog v-model="showCurrencyDialog" max-width="500">
      <ChangeCurrency @saved="showCurrencyDialog = false" @cancel="showCurrencyDialog = false" />
    </v-dialog>
  </v-app-bar>
</template>
