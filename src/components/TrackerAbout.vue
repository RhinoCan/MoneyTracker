<script setup lang="ts">
/**
 * TrackerAbout.vue
 * Attribution and technology stack information.
 */
import { useI18n } from 'vue-i18n';

const { t, tm } = useI18n();

defineOptions({
  name: "TrackerAbout",
});

// Tech stack using absolute paths for the public folder
const techStack = [
  { logo: "vue3-logo.png", key: "about.textVue" },
  { logo: "vuetify3-logo.png", key: "about.textVuetify" },
  { logo: "pinia-logo.png", key: "about.textPinia" },
  { logo: "sentry-logo.png", key: "about.textSentry" },
  { logo: "posthog-logo.png", key: "about.textPostHog" },
  { logo: "supabase-logo.png", key: "about.textSupabase" },
];
</script>

<template>
  <v-expansion-panels>
    <v-expansion-panel color="surface">
      <v-expansion-panel-title class="bg-primary text-on-primary">
        {{ t('about.title') }}
        <template v-slot:actions="{ expanded }">
          <v-icon :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
        </template>
      </v-expansion-panel-title>

      <v-expansion-panel-text class="pa-4">
        <v-card flat class="mx-auto maincard-width mb-6">
          <div class="maincard-title text-primary">{{ t('about.origins') }}</div>

          <i18n-t keypath="about.introParagraph" tag="p" class="text-body-1 mb-4">
            <template #linkTraversy>
              <a
                href="https://www.youtube.com/watch?v=hNPwdOZ3qFU"
                target="_blank"
                class="text-decoration-none text-secondary font-weight-bold"
              >
                {{ t('about.linkText') }}
              </a>
            </template>
          </i18n-t>

          <ul class="custom-list">
            <li v-for="point in tm('about.enhancements')" :key="String(point)">
              {{ point }}
            </li>
          </ul>
        </v-card>

        <v-card flat class="mx-auto maincard-width">
          <div class="maincard-title text-primary">{{ t('about.packages') }}</div>

          <v-row dense>
            <v-col
              v-for="tech in techStack"
              :key="tech.key"
              cols="6"
              sm="4"
              md="2"
            >
              <v-card variant="outlined" class="pa-2 text-center h-100 d-flex flex-column align-center border-opacity-25">
                <div class="logo-container d-flex align-center justify-center mb-2">
                  <img :src="tech.logo" :alt="t(tech.key)" class="logo-img" />
                </div>
                <v-card-text class="pa-0 text-caption font-weight-bold">
                  {{ t(tech.key) }}
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<style scoped>
/* Styles remain unchanged as they were working */
.custom-list {
  list-style-type: square;
  padding-inline-start: 1.5rem;
  margin-top: 0.5rem;
}
.maincard-title {
  font-weight: 900;
  font-size: 1.25rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.logo-container {
  width: 48px;
  height: 48px;
}
.logo-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.2s ease-in-out;
}
.v-card:hover .logo-img {
  transform: scale(1.1);
}
</style>