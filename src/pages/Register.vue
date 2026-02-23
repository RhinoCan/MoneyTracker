<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/stores/NotificationStore';
import { logException } from '@/lib/Logger';
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const router = useRouter();
const notificationStore = useNotificationStore();

// Reactive state for the form
const email = ref('');
const password = ref('');
const loading = ref(false);

async function handleRegister() {
  if (!email.value || !password.value) {
    notificationStore.showMessage(t('common.fill_all_fields'), 'error');
    return;
  }

  loading.value = true;

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    });

    if (error) {
      logException(error, {
        module: 'Register',
        action: 'handleRegister',
        slug: 'register.auth_register_failed'
      });
      notificationStore.showMessage(`${t('register.fail')}: ${error.message}`, 'error');
      return;
    }

    if (data.user) {
      // Supabase usually sends a confirmation email by default
      notificationStore.showMessage(t('register.success_check_email'), 'success');
      router.push({ name: 'login' });
    }
  } catch (err) {
    logException(err, { module: 'Register', action: 'handleRegister_catch', slug: 'register.auth_register_unexpected' });
    notificationStore.showMessage(t('common.error_unexpected'), 'error');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="d-flex justify-center align-center fill-height bg-grey-lighten-4">
    <v-card width="400" elevation="2" class="pa-4">
      <v-card-title class="text-h5 text-center mb-4">
        {{ t('register.title') }}
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="handleRegister">
          <v-text-field
            v-model="email"
            :label="t('login.email_label')"
            type="email"
            variant="outlined"
            density="comfortable"
            :disabled="loading"
            prepend-inner-icon="mdi-email-outline"
          />
          <v-text-field
            v-model="password"
            :label="t('login.password_label')"
            type="password"
            variant="outlined"
            density="comfortable"
            :disabled="loading"
            prepend-inner-icon="mdi-lock-outline"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="flex-column">
        <v-btn
          color="primary"
          block
          size="large"
          :loading="loading"
          @click="handleRegister"
          class="mb-4"
        >
          {{ t('register.button') }}
        </v-btn>

        <v-btn
          variant="text"
          size="small"
          color="secondary"
          @click="router.push({ name: 'login' })"
        >
          {{ t('register.go_login') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>