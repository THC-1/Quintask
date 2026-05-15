<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import AppLayout from "../components/AppLayout.vue";
import { ApiError, apiFetch } from "../api/client";

type DashboardComment = {
  id: string;
  content: string;
  type: "COMMENT" | "PROGRESS" | "REVIEW";
  createdAt: string;
  author: {
    name: string;
  };
  task: {
    title: string;
  };
};

type DashboardData = {
  totalTasks: number;
  doneTasks: number;
  progress: number;
  pendingReviewTasks: number;
  currentMilestone: {
    title: string;
  } | null;
  recentComments: DashboardComment[];
};

const dashboard = ref<DashboardData | null>(null);
const loading = ref(false);
const error = ref("");

const progressStyle = computed(() => ({
  "--progress-value": `${dashboard.value?.progress ?? 0}%`,
}));

const commentTypeLabels: Record<DashboardComment["type"], string> = {
  COMMENT: "评论",
  PROGRESS: "进展",
  REVIEW: "验收",
};

function toChineseError(value: unknown) {
  return value instanceof ApiError ? value.message : "首页数据加载失败，请稍后重试";
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function loadDashboard() {
  loading.value = true;
  error.value = "";

  try {
    dashboard.value = await apiFetch<DashboardData>("/dashboard");
  } catch (value) {
    dashboard.value = null;
    error.value = toChineseError(value);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDashboard();
});
</script>

<template>
  <AppLayout>
    <section class="page-section dashboard-page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">项目概览</p>
          <h1>首页</h1>
        </div>
      </div>

      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <p v-else-if="loading" class="state-text">正在加载首页数据...</p>

      <div v-else-if="dashboard" class="dashboard-stack">
        <section class="summary-hero">
          <div>
            <p class="summary-label">总体进度</p>
            <strong>{{ dashboard.progress }}%</strong>
          </div>
          <div class="progress-track" aria-label="总体进度">
            <span :style="progressStyle"></span>
          </div>
        </section>

        <div class="summary-grid">
          <section class="summary-tile">
            <span>任务完成</span>
            <strong>{{ dashboard.doneTasks }}/{{ dashboard.totalTasks }}</strong>
          </section>
          <section class="summary-tile">
            <span>待验收</span>
            <strong>{{ dashboard.pendingReviewTasks }}</strong>
          </section>
          <section class="summary-tile">
            <span>当前里程碑</span>
            <strong>{{ dashboard.currentMilestone?.title ?? "未设置" }}</strong>
          </section>
        </div>

        <section class="activity-panel">
          <header>
            <h2>最近进展与评论</h2>
          </header>
          <div v-if="dashboard.recentComments.length > 0" class="activity-list">
            <article
              v-for="comment in dashboard.recentComments"
              :key="comment.id"
              class="activity-item"
            >
              <div>
                <strong>{{ comment.task.title }}</strong>
                <p>{{ comment.content }}</p>
              </div>
              <aside>
                <span>{{ commentTypeLabels[comment.type] }}</span>
                <time :datetime="comment.createdAt">{{ formatTime(comment.createdAt) }}</time>
                <small>{{ comment.author.name }}</small>
              </aside>
            </article>
          </div>
          <p v-else class="state-text">暂无进展或评论。</p>
        </section>
      </div>
    </section>
  </AppLayout>
</template>
