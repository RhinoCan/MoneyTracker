<script setup lang="ts">
import { ref } from "vue";
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
const showPassword = ref(false);
const loading = ref(false);

const goToRegister = () => {
  router.push({ name: "register" });
};

const goToForgotPassword = () => {
  router.push({ name: "forgot-password" });
};

async function handleLogin() {
  if (!email.value || !password.value) {
    notificationStore.showMessage(t("common.fill_all_fields"), "error");
    return;
  }

  loading.value = true;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (error) {
      let userMessage = t("login.fail_generic");

      if (error.message.includes("Email not confirmed")) {
        userMessage = t("login.fail_unconfirmed");
      } else if (error.message.includes("Invalid login credentials")) {
        userMessage = t("login.fail_credentials");
      }

      notificationStore.showMessage(userMessage, "error");

      logException(error, {
        module: "Login",
        action: "handleLogin",
        slug: "login.auth_login_failed",
        data: { email: email.value },
      });
      return;
    }

    if (data.session && data.user) {
      notificationStore.showMessage(t("login.success"), "success");
      router.push("/");
    }
  } catch (err) {
    logException(err, {
      module: "Login",
      action: "handleLogin_catch",
      slug: "login.auth_unexpected",
    });
    notificationStore.showMessage(t("login.error_unexpected"), "error");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="d-flex justify-center align-center fill-height bg-grey-lighten-4">
    <v-card width="400" elevation="2" class="pa-4">
      <v-card-title class="text-h5 text-center mb-4">
        {{ t("login.title") }}
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="handleLogin">
          <v-text-field
            v-model="email"
            :label="t('login.email_label')"
            type="email"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-email-outline"
            :disabled="loading"
          />

          <v-text-field
            v-model="password"
            :label="t('login.password_label')"
            :type="showPassword ? 'text' : 'password'"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            :aria-label="showPassword ? t('login.hide_password') : t('login.show_password')"
            data-testid="password-field"
            @click:append-inner="showPassword = !showPassword"
            :disabled="loading"
          />

          <v-btn block color="primary" size="large" class="mt-4" :loading="loading" type="submit">
            {{ t("login.button") }}
          </v-btn>
        </v-form>
      </v-card-text>
      <v-card-actions class="justify-center mt-2">
        <v-btn variant="text" color="secondary" class="ml-1" @click="goToForgotPassword">
          {{ t("forgotPassword.title") }}
        </v-btn>
      </v-card-actions>

      <v-card-actions class="justify-center">
        <span class="text-body-2 text-medium-emphasis">
          {{ t("login.no_account") }}
        </span>
        <v-btn variant="text" color="secondary" class="ml-1" @click="goToRegister">
          {{ t("login.go_register") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
