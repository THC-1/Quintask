<script setup lang="ts">
import { onMounted, ref } from "vue";

import AppLayout from "../components/AppLayout.vue";
import WorkloadOverviewCharts from "../components/WorkloadOverviewCharts.vue";
import WorkloadMemberPanel from "../components/WorkloadMemberPanel.vue";
import { ApiError, apiFetch } from "../api/client";
import type { WorkloadItem } from "../types/workload";

const workload = ref<WorkloadItem[]>([]);
const loading = ref(false);
const error = ref("");

function toChineseError(value: unknown) {
  return value instanceof ApiError ? value.message : "任务总览加载失败，请稍后重试";
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
          <p class="eyebrow">任务态势</p>
          <h1>任务总览</h1>
          <p class="page-subtitle">用图表快速判断进度、成员负载和阻塞风险。</p>
        </div>
        <span class="page-count">{{ workload.length }} 位成员</span>
      </div>

      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <p v-else-if="loading" class="state-text">正在加载任务总览...</p>
      <p v-else-if="workload.length === 0" class="state-text">暂无任务总览数据。</p>

      <template v-else>
        <WorkloadOverviewCharts :workload="workload" />

        <div class="workload-grid">
          <WorkloadMemberPanel v-for="item in workload" :key="item.user.id" :item="item" />
        </div>
      </template>
    </section>
  </AppLayout>
</template>
