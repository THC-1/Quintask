<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";

import AppLayout from "../components/AppLayout.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { useAuthStore } from "../stores/auth";
import { useTasksStore, type TaskStatus } from "../stores/tasks";

const route = useRoute();
const auth = useAuthStore();
const tasksStore = useTasksStore();
const actionLoading = ref(false);
const subtaskLoadingId = ref("");

const taskId = computed(() => String(route.params.id));
const task = computed(() => tasksStore.currentTask);
const isOwnerReview = computed(() => auth.isOwner && task.value?.status === "IN_REVIEW");

const availableActions = computed<Array<{ status: TaskStatus; label: string; tone?: "secondary" }>>(() => {
  if (!task.value || auth.isTeacher) {
    return [];
  }

  if (task.value.status === "TODO") {
    return [{ status: "IN_PROGRESS", label: "开始处理" }];
  }

  if (task.value.status === "IN_PROGRESS") {
    return [{ status: "IN_REVIEW", label: "提交验收" }];
  }

  if (isOwnerReview.value) {
    return [
      { status: "DONE", label: "验收完成" },
      { status: "IN_PROGRESS", label: "退回进行中", tone: "secondary" },
    ];
  }

  return [];
});

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "未设置";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function loadTask() {
  await tasksStore.loadTask(taskId.value).catch(() => undefined);
}

async function changeStatus(status: TaskStatus) {
  if (!task.value || actionLoading.value) {
    return;
  }

  actionLoading.value = true;

  try {
    await tasksStore.changeStatus(task.value.id, status);
  } catch {
    // The store owns the Chinese error message shown in the page.
  } finally {
    actionLoading.value = false;
  }
}

async function updateSubtask(id: string, event: Event) {
  const target = event.target as HTMLInputElement;
  subtaskLoadingId.value = id;

  try {
    await tasksStore.updateSubtask(id, target.checked);
  } catch {
    target.checked = !target.checked;
  } finally {
    subtaskLoadingId.value = "";
  }
}

onMounted(loadTask);

watch(taskId, () => {
  loadTask();
});
</script>

<template>
  <AppLayout>
    <section class="page-section task-detail-page">
      <RouterLink class="back-link" to="/board">返回看板</RouterLink>

      <p v-if="tasksStore.error" class="form-error" role="alert">{{ tasksStore.error }}</p>
      <p v-if="tasksStore.loading" class="state-text">正在加载任务详情...</p>

      <template v-else-if="task">
        <div class="detail-header">
          <div>
            <p class="eyebrow">任务详情</p>
            <h1>{{ task.title }}</h1>
          </div>
          <StatusBadge :status="task.status" />
        </div>

        <div v-if="availableActions.length > 0" class="detail-actions">
          <button
            v-for="action in availableActions"
            :key="action.status"
            type="button"
            :class="['primary-button', { 'secondary-button': action.tone === 'secondary' }]"
            :disabled="actionLoading"
            @click="changeStatus(action.status)"
          >
            {{ actionLoading ? "处理中..." : action.label }}
          </button>
        </div>

        <div class="detail-grid">
          <section class="detail-panel detail-main">
            <h2>任务描述</h2>
            <p class="description-text">{{ task.description || "暂无描述。" }}</p>
          </section>

          <aside class="detail-panel detail-side">
            <h2>基本信息</h2>
            <dl class="info-list">
              <div>
                <dt>执行人</dt>
                <dd>{{ task.assignee?.name ?? "未分配" }}</dd>
              </div>
              <div>
                <dt>创建人</dt>
                <dd>{{ task.creator.name }}</dd>
              </div>
              <div>
                <dt>验收人</dt>
                <dd>{{ task.reviewer?.name ?? "未验收" }}</dd>
              </div>
              <div>
                <dt>里程碑</dt>
                <dd>{{ task.milestone?.title ?? "未关联" }}</dd>
              </div>
              <div>
                <dt>截止日期</dt>
                <dd>{{ formatDate(task.dueDate) }}</dd>
              </div>
            </dl>
          </aside>
        </div>

        <section class="detail-panel">
          <h2>依赖任务</h2>
          <div v-if="task.dependencies.length > 0" class="dependency-list">
            <div
              v-for="dependency in task.dependencies"
              :key="dependency.dependsOnTask.id"
              class="dependency-item"
            >
              <span>{{ dependency.dependsOnTask.title }}</span>
              <StatusBadge :status="dependency.dependsOnTask.status" />
            </div>
          </div>
          <p v-else class="state-text">没有依赖任务。</p>
        </section>

        <section class="detail-panel">
          <h2>子任务</h2>
          <div v-if="task.subtasks.length > 0" class="subtask-list">
            <label v-for="subtask in task.subtasks" :key="subtask.id" class="subtask-item">
              <input
                type="checkbox"
                :checked="subtask.isDone"
                :disabled="auth.isTeacher || subtaskLoadingId === subtask.id"
                @change="updateSubtask(subtask.id, $event)"
              />
              <span :class="{ done: subtask.isDone }">{{ subtask.title }}</span>
            </label>
          </div>
          <p v-else class="state-text">暂无子任务。</p>
        </section>

        <section class="detail-panel">
          <h2>标签</h2>
          <div v-if="task.tags.length > 0" class="tag-list">
            <span
              v-for="item in task.tags"
              :key="item.tag.id"
              class="task-tag"
              :style="{ '--tag-color': item.tag.color }"
            >
              {{ item.tag.name }}
            </span>
          </div>
          <p v-else class="state-text">暂无标签。</p>
        </section>

        <section class="detail-panel">
          <h2>评论</h2>
          <div v-if="task.comments.length > 0" class="comment-list">
            <article v-for="comment in task.comments" :key="comment.id" class="comment-item">
              <header>
                <strong>{{ comment.author.name }}</strong>
                <time :datetime="comment.createdAt">{{ formatDateTime(comment.createdAt) }}</time>
              </header>
              <p>{{ comment.content }}</p>
            </article>
          </div>
          <p v-else class="state-text">暂无评论。</p>
        </section>
      </template>
    </section>
  </AppLayout>
</template>
