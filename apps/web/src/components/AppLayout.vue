<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRouter } from "vue-router";

import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();

const navigation = computed(() => {
  const items = [
    { to: "/dashboard", label: "首页" },
    { to: "/board", label: "任务看板" },
    { to: "/milestones", label: "里程碑" },
    { to: "/workload", label: "任务总览" }
  ];

  if (auth.isOwner) {
    items.push({ to: "/members", label: "成员管理" });
  }

  return items;
});

function logout() {
  auth.logout();
  router.push({ name: "login" });
}
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar" aria-label="主导航">
      <RouterLink class="brand" to="/dashboard">
        <span class="brand-mark">Q</span>
        <span>Quintask</span>
      </RouterLink>

      <nav class="side-nav">
        <RouterLink v-for="item in navigation" :key="item.to" :to="item.to">
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <div class="app-main">
      <header class="topbar">
        <div class="topbar-title">任务协作台</div>
        <div class="user-actions">
          <span class="user-name">{{ auth.user?.name }}</span>
          <button type="button" class="ghost-button" @click="logout">退出登录</button>
        </div>
      </header>

      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>
