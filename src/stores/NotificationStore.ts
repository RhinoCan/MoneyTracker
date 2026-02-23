import { defineStore } from "pinia";
import { ref, nextTick } from "vue";

export const useNotificationStore = defineStore("notification", () => {
  const isVisible = ref(false);
  const text = ref("");
  const color = ref("success");

  const snackbarKey = ref(0);

  async function showMessage(
    message: string,
    type: "success" | "error" | "info" | "warning" = "success"
  ) {
    text.value = message;
    color.value = type;
    snackbarKey.value++;
    await nextTick();
    isVisible.value = true;
  }

  return { isVisible, text, color, snackbarKey, showMessage };
});
