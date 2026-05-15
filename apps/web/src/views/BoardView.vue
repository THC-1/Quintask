<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";

import AppLayout from "../components/AppLayout.vue";
import TaskCard from "../components/TaskCard.vue";
import { useAuthStore } from "../stores/auth";
import { useTasksStore, type TaskListItem, type TaskStatus } from "../stores/tasks";

const auth = useAuthStore();
const tasksStore = useTasksStore();
const createLoading = ref(false);
const createError = ref("");
const createForm = reactive({
  title: "",
  description: "",
  priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
  dueDate: "",
});
const canCreateTask = computed(() => Boolean(auth.user) && !auth.isTeacher);

const columns: Array<{ status: TaskStatus; title: string }> = [
  { status: "TODO", title: "待处理" },
  { status: "IN_PROGRESS", title: "进行中" },
  { status: "IN_REVIEW", title: "待验收" },
  { status: "DONE", title: "已完成" },
];

const tasksByStatus = computed(() =>
  columns.reduce(
    (result, column) => {
      result[column.status] = tasksStore.tasks.filter((task) => task.status === column.status);
      return result;
    },
    {} as Record<TaskStatus, TaskListItem[]>,
  ),
);

async function submitTask() {
  if (createLoading.value) {
    return;
  }

  createError.value = "";

  if (!createForm.title.trim()) {
    createError.value = "请输入任务标题";
    return;
  }

  createLoading.value = true;

  try {
    await tasksStore.createTask({
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      priority: createForm.priority,
      dueDate: createForm.dueDate ? new Date(`${createForm.dueDate}T00:00:00`).toISOString() : null,
    });
    createForm.title = "";
    createForm.description = "";
    createForm.priority = "MEDIUM";
    createForm.dueDate = "";
  } catch {
    createError.value = tasksStore.error || "任务创建失败，请稍后重试";
  } finally {
    createLoading.value = false;
  }
}

onMounted(() => {
  tasksStore.loadTasks().catch(() => undefined);
});
</script>

<template>
  <AppLayout>
    <section class="page-section board-page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">任务流转</p>
          <h1>任务看板</h1>
        </div>
        <span class="page-count">{{ tasksStore.tasks.length }} 个任务</span>
      </div>

      <form v-if="canCreateTask" class="inline-create-form board-create-form" @submit.prevent="submitTask">
        <label>
          标题
          <input v-model="createForm.title" type="text" placeholder="新增任务或建议" />
        </label>
        <label>
          描述
          <input v-model="createForm.description" type="text" placeholder="补充目标、背景或交付物" />
        </label>
        <label v-if="auth.isOwner">
          优先级
          <select v-model="createForm.priority">
            <option value="LOW">低</option>
            <option value="MEDIUM">中</option>
            <option value="HIGH">高</option>
          </select>
        </label>
        <label v-if="auth.isOwner">
          截止日期
          <input v-model="createForm.dueDate" type="date" />
        </label>
        <button type="submit" class="primary-button" :disabled="createLoading">
          {{ createLoading ? "提交中..." : auth.isOwner ? "创建任务" : "提交建议" }}
        </button>
        <p v-if="createError" class="form-error" role="alert">{{ createError }}</p>
      </form>

      <p v-if="tasksStore.error" class="form-error" role="alert">{{ tasksStore.error }}</p>
      <p v-else-if="tasksStore.loading" class="state-text">正在加载任务...</p>
      <p v-else-if="tasksStore.tasks.length === 0" class="state-text">暂无任务。</p>

      <div v-else class="task-board" aria-label="任务看板">
        <section v-for="column in columns" :key="column.status" class="board-column">
          <header class="board-column-header">
            <h2>{{ column.title }}</h2>
            <span>{{ tasksByStatus[column.status].length }}</span>
          </header>

          <div class="board-column-list">
            <TaskCard
              v-for="task in tasksByStatus[column.status]"
              :key="task.id"
              :task="task"
            />
            <p v-if="tasksByStatus[column.status].length === 0" class="column-empty">暂无任务</p>
          </div>
        </section>
      </div>
    </section>
  </AppLayout>
</template>
