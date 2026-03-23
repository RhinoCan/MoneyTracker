<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";
import { useNotificationStore } from "@/stores/NotificationStore";
import { logWarning } from "@/lib/Logger";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const router = useRouter();
const notificationStore = useNotificationStore();

const email = ref("");
const loading = ref(false);

const goToLogin = () => {
  router.push({ name: "login" });
};

async function handleForgotPassword() {
  if (!email.value) {
    notificationStore.showMessage(t("common.fill_all_fields"), "error");
    return;
  }

  loading.value = true;

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/MoneyTracker/reset-password`,
    });

    if (error) {
      notificationStore.showMessage(t("forgotPassword.errorMessage"), "error");
      logWarning(error.message, {
        module: "ForgotPassword",
        action: "handleForgotPassword",
        slug: "forgot_password.request_failed",
        data: { email: email.value },
      });
      return;
    }

    notificationStore.showMessage(t("forgotPassword.successMessage"), "success");
    router.push({ name: "login" });
  } catch (err) {
    logWarning(err instanceof Error ? err.message : String(err), {
      module: "ForgotPassword",
      action: "handleForgotPassword_catch",
      slug: "forgot_password.unexpected",
    });
    notificationStore.showMessage(t("forgotPassword.errorMessage"), "error");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="d-flex justify-center align-center fill-height bg-grey-lighten-4">
    <v-card width="400" elevation="2" class="pa-4">
      <v-card-title class="text-h5 text-center mb-4">
        {{ t("forgotPassword.title") }}
      </v-card-title>

      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ t("forgotPassword.instruction") }}
        </p>

        <v-form @submit.prevent="handleForgotPassword">
          <v-text-field
            v-model="email"
            :label="t('forgotPassword.emailLabel')"
            type="email"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-email-outline"
            :disabled="loading"
          />

          <v-btn
            block
            color="primary"
            size="large"
            class="mt-4"
            :loading="loading"
            type="submit"
          >
            {{ t("forgotPassword.submitButton") }}
          </v-btn>
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-center mt-2">
        <v-btn variant="text" color="secondary" @click="goToLogin">
          {{ t("forgotPassword.backToLogin") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>