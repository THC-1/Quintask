<script setup lang="ts">
import { onMounted, ref } from "vue";

import AppLayout from "../components/AppLayout.vue";
import WorkloadMemberPanel from "../components/WorkloadMemberPanel.vue";
import { ApiError, apiFetch } from "../api/client";
import type { TaskPriority, TaskStatus } from "../stores/tasks";

type WorkloadItem = {
  user: {
    id: string;
    name: string;
  };
  summary: {
    total: number;
    todo: number;
    inProgress: number;
    inReview: number;
    done: number;
    blocked: number;
    high: number;
    medium: number;
    low: number;
  };
  tasks: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
  }>;
};

const workload = ref<WorkloadItem[]>([]);
const loading = ref(false);
const error = ref("");

function toChineseError(value: unknown) {
  return value instanceof ApiError ? value.message : "团队工作量加载失败，请稍后重试";
}

async function loadWorkload() {
  loading.value = true;
  error.value = "";

  try {
    const items = await apiFetch<WorkloadItem[]>("/workload");
    workload.value = [...items].sort((left, right) => {
      const blockedDelta = right.summary.blocked - left.summary.blocked;
      if (blockedDelta !== 0) {
        return blockedDelta;
      }

      const highDelta = right.summary.high - left.summary.high;
      if (highDelta !== 0) {
        return highDelta;
      }

      return right.summary.total - left.summary.total;
    });
  } catch (value) {
    workload.value = [];
    error.value = toChineseError(value);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadWorkload();
});
</script>

<template>
  <AppLayout>
    <section class="page-section workload-page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">成员负载</p>
          <h1>团队工作量</h1>
        </div>
        <span class="page-count">{{ workload.length }} 位成员</span>
      </div>

      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <p v-else-if="loading" class="state-text">正在加载团队工作量...</p>
      <p v-else-if="workload.length === 0" class="state-text">暂无成员工作量。</p>

      <div v-else class="workload-grid">
        <WorkloadMemberPanel v-for="item in workload" :key="item.user.id" :item="item" />
      </div>
    </section>
  </AppLayout>
</template>
