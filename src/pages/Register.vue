<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";
import { useNotificationStore } from "@/stores/NotificationStore";
import { logException } from "@/lib/Logger";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const router = useRouter();
const notificationStore = useNotificationStore();

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);

const passwordRules = [
  (v: string) => v.length >= 8 || t("register.password_too_short"),
  (v: string) => v.length <= 128 || t("register.password_too_long"),
];

const passwordMismatch = computed(
  () => confirmPassword.value.length > 0 && confirmPassword.value !== password.value
);

async function handleRegister() {
  if (!email.value || !password.value || !confirmPassword.value) {
    notificationStore.showMessage(t("common.fill_all_fields"), "error");
    return;
  }

  if (password.value.length < 8) {
    notificationStore.showMessage(t("register.password_too_short"), "error");
    return;
  }

  if (password.value !== confirmPassword.value) {
    notificationStore.showMessage(t("register.password_mismatch"), "error");
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
        module: "Register",
        action: "handleRegister",
        slug: "register.auth_register_failed",
      });
      notificationStore.showMessage(t("register.fail"), "error");
      return;
    }
    if (data.session) {
      // Auto-confirm is enabled — session created immediately, redirect to home
      router.push("/");
    } else if (data.user) {
      // Email confirmation required — show message, stay on register page
      notificationStore.showMessage(t("register.success_check_email"), "success");
    }
  } catch (err) {
    logException(err, {
      module: "Register",
      action: "handleRegister_catch",
      slug: "register.auth_register_unexpected",
    });
    notificationStore.showMessage(t("common.error_unexpected"), "error");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="d-flex justify-center align-center fill-height bg-grey-lighten-4">
    <v-card width="400" elevation="2" class="pa-4">
      <v-card-title class="text-h5 text-center mb-4">
        {{ t("register.title") }}
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
            :type="showPassword ? 'text' : 'password'"
            variant="outlined"
            density="comfortable"
            :disabled="loading"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            :aria-label="showPassword ? t('login.hide_password') : t('login.show_password')"
            data-testid="password-field"
            :rules="passwordRules"
            @click:append-inner="showPassword = !showPassword"
          />
          <v-text-field
            v-model="confirmPassword"
            :label="t('register.confirm_password_label')"
            :type="showConfirmPassword ? 'text' : 'password'"
            variant="outlined"
            density="comfortable"
            :disabled="loading"
            prepend-inner-icon="mdi-lock-check-outline"
            :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
            :aria-label="showConfirmPassword ? t('login.hide_password') : t('login.show_password')"
            data-testid="confirm-password-field"
            :error-messages="passwordMismatch ? t('register.password_mismatch') : ''"
            @click:append-inner="showConfirmPassword = !showConfirmPassword"
          />
          <v-btn color="primary" block size="large" type="submit" :loading="loading" class="mt-4">
            {{ t("register.button") }}
          </v-btn>
          <v-card-text class="text-medium-emphasis text-center text-caption px-4 pt-0">{{
            t("register.caution")
          }}</v-card-text>
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-center">
        <v-btn
          variant="text"
          size="small"
          color="secondary"
          @click="router.push({ name: 'login' })"
        >
          {{ t("register.go_login") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
