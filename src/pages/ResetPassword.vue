<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";
import { useNotificationStore } from "@/stores/NotificationStore";
import { logWarning } from "@/lib/Logger";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const router = useRouter();
const notificationStore = useNotificationStore();

const password = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);
const tokenValid = ref(false);

let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null;

onMounted(async () => {
  // Check if we already have a recovery session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    tokenValid.value = true;
  }

  // Also listen for the event in case it fires after mount
  authListener = supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
      tokenValid.value = true;
    }
  });
});

onUnmounted(() => {
  authListener?.data.subscription.unsubscribe();
});

async function handleResetPassword() {
  if (!password.value || !confirmPassword.value) {
    notificationStore.showMessage(t("common.fill_all_fields"), "error");
    return;
  }

  if (password.value.length < 8) {
    notificationStore.showMessage(t("resetPassword.shortError"), "error");
    return;
  }

  if (password.value !== confirmPassword.value) {
    notificationStore.showMessage(t("resetPassword.mismatchError"), "error");
    return;
  }

  loading.value = true;

  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value,
    });

    if (error) {
      notificationStore.showMessage(t("resetPassword.errorMessage"), "error");
      logWarning(error.message, {
        module: "ResetPassword",
        action: "handleResetPassword",
        slug: "reset_password.update_failed",
      });
      return;
    }

    // Sign out the recovery session before redirecting to login
    await supabase.auth.signOut();
    notificationStore.showMessage(t("resetPassword.successMessage"), "success");
    router.push({ name: "login" });
  } catch (err) {
    logWarning(err instanceof Error ? err.message : String(err), {
      module: "ResetPassword",
      action: "handleResetPassword_catch",
      slug: "reset_password.unexpected",
    });
    notificationStore.showMessage(t("resetPassword.errorMessage"), "error");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="d-flex justify-center align-center fill-height bg-grey-lighten-4">
    <v-card width="400" elevation="2" class="pa-4" style="background-color:  #ffffff !important; color: rgba(0,0,0,87);">
      <v-card-title class="text-h5 text-center mb-4">
        {{ t("resetPassword.title") }}
      </v-card-title>

      <v-card-text>
        <div v-if="!tokenValid">
          <p class="text-body-2 text-medium-emphasis mb-4" style="color: rgba(0,0,0,0.87);">
            {{ t("resetPassword.invalidToken") }}
          </p>
          <v-btn block color="primary" @click="router.push({ name: 'login' })">
            {{ t("forgotPassword.backToLogin") }}
          </v-btn>
        </div>

        <div v-else>
          <p class="text-body-2 text-medium-emphasis mb-4">
            {{ t("resetPassword.instruction") }}
          </p>

          <v-form @submit.prevent="handleResetPassword">
            <v-text-field
              v-model="password"
              :label="t('resetPassword.passwordLabel')"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              data-testid="password-field"
              @click:append-inner="showPassword = !showPassword"
              :disabled="loading"
            />

            <v-text-field
              v-model="confirmPassword"
              :label="t('resetPassword.confirmPasswordLabel')"
              :type="showConfirmPassword ? 'text' : 'password'"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
              data-testid="confirm-password-field"
              @click:append-inner="showConfirmPassword = !showConfirmPassword"
              :disabled="loading"
            />

            <v-btn block color="primary" size="large" class="mt-4" :loading="loading" type="submit">
              {{ t("resetPassword.submitButton") }}
            </v-btn>
          </v-form>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>
