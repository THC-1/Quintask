<script setup lang="ts">
import { onMounted, ref } from "vue";

import AppLayout from "../components/AppLayout.vue";
import { ApiError, apiFetch } from "../api/client";
import { useAuthStore } from "../stores/auth";

type MilestoneStatus = "PLANNED" | "ACTIVE" | "DONE";

type Milestone = {
  id: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  totalTasks: number;
  doneTasks: number;
  progress: number;
};

const auth = useAuthStore();
const milestones = ref<Milestone[]>([]);
const loading = ref(false);
const creating = ref(false);
const showCreateForm = ref(false);
const error = ref("");
const createError = ref("");
const form = ref({
  title: "",
  description: "",
  status: "PLANNED" as MilestoneStatus,
});

const statusLabels: Record<MilestoneStatus, string> = {
  PLANNED: "计划中",
  ACTIVE: "进行中",
  DONE: "已完成",
};

function toChineseError(value: unknown) {
  return value instanceof ApiError ? value.message : "里程碑加载失败，请稍后重试";
}

function resetForm() {
  form.value = {
    title: "",
    description: "",
    status: "PLANNED",
  };
}

async function loadMilestones() {
  loading.value = true;
  error.value = "";

  try {
    milestones.value = await apiFetch<Milestone[]>("/milestones");
  } catch (value) {
    milestones.value = [];
    error.value = toChineseError(value);
  } finally {
    loading.value = false;
  }
}

async function createMilestone() {
  const title = form.value.title.trim();

  if (!title || creating.value) {
    return;
  }

  creating.value = true;
  createError.value = "";

  try {
    await apiFetch<Milestone>("/milestones", {
      method: "POST",
      body: JSON.stringify({
        title,
        description: form.value.description.trim(),
        status: form.value.status,
        sortOrder: milestones.value.length,
      }),
    });
    resetForm();
    showCreateForm.value = false;
    await loadMilestones();
  } catch (value) {
    createError.value =
      value instanceof ApiError ? value.message : "新增里程碑失败，请稍后重试";
  } finally {
    creating.value = false;
  }
}

onMounted(() => {
  loadMilestones();
});
</script>

<template>
  <AppLayout>
    <section class="page-section milestones-page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">阶段目标</p>
          <h1>里程碑</h1>
        </div>
        <button
          v-if="auth.isOwner"
          type="button"
          class="primary-button"
          @click="showCreateForm = !showCreateForm"
        >
          {{ showCreateForm ? "收起表单" : "新增里程碑" }}
        </button>
      </div>

      <form
        v-if="auth.isOwner && showCreateForm"
        class="inline-create-form"
        @submit.prevent="createMilestone"
      >
        <label>
          <span>标题</span>
          <input v-model="form.title" type="text" required placeholder="输入里程碑标题" />
        </label>
        <label>
          <span>描述</span>
          <input v-model="form.description" type="text" placeholder="可选" />
        </label>
        <label>
          <span>状态</span>
          <select v-model="form.status">
            <option value="PLANNED">计划中</option>
            <option value="ACTIVE">进行中</option>
            <option value="DONE">已完成</option>
          </select>
        </label>
        <button type="submit" class="primary-button" :disabled="creating || !form.title.trim()">
          {{ creating ? "正在新增..." : "保存" }}
        </button>
        <p v-if="createError" class="form-error" role="alert">{{ createError }}</p>
      </form>

      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <p v-else-if="loading" class="state-text">正在加载里程碑...</p>
      <p v-else-if="milestones.length === 0" class="state-text">暂无里程碑。</p>

      <div v-else class="milestone-list">
        <article v-for="milestone in milestones" :key="milestone.id" class="milestone-row">
          <div class="milestone-main">
            <div class="milestone-title-line">
              <h2>{{ milestone.title }}</h2>
              <span class="milestone-status" :data-status="milestone.status">
                {{ statusLabels[milestone.status] }}
              </span>
            </div>
            <p>{{ milestone.description || "暂无描述。" }}</p>
          </div>

          <div class="milestone-progress">
            <span>{{ milestone.doneTasks }}/{{ milestone.totalTasks }} 任务</span>
            <strong>{{ milestone.progress }}%</strong>
            <div class="progress-track" aria-label="里程碑进度">
              <span :style="{ '--progress-value': `${milestone.progress}%` }"></span>
            </div>
          </div>
        </article>
      </div>
    </section>
  </AppLayout>
</template>
