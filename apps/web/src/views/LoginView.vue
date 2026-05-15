<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { ApiError } from "../api/client";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const username = ref("");
const password = ref("");
const error = ref("");
const isSubmitting = ref(false);

const canSubmit = computed(() => username.value.trim().length > 0 && password.value.length > 0);

async function submitLogin() {
  if (!canSubmit.value || isSubmitting.value) {
    return;
  }

  error.value = "";
  isSubmitting.value = true;

  try {
    await auth.login(username.value.trim(), password.value);
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/dashboard";
    await router.push(redirect);
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught.message : "登录失败，请稍后重试";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-panel" aria-labelledby="login-title">
      <div class="login-copy">
        <p class="eyebrow">Quintask</p>
        <h1 id="login-title">登录任务协作台</h1>
        <p>查看任务、里程碑和团队工作量，保持交付节奏清晰。</p>
      </div>

      <form class="login-form" @submit.prevent="submitLogin">
        <label>
          <span>用户名</span>
          <input v-model="username" type="text" autocomplete="username" required />
        </label>

        <label>
          <span>密码</span>
          <input v-model="password" type="password" autocomplete="current-password" required />
        </label>

        <p v-if="error" class="form-error" role="alert">{{ error }}</p>

        <button type="submit" :disabled="!canSubmit || isSubmitting">
          {{ isSubmitting ? "正在登录" : "登录" }}
        </button>
      </form>
    </section>
  </main>
</template>
