<script setup lang="ts">
import { computed, onMounted } from "vue";

import AppLayout from "../components/AppLayout.vue";
import TaskCard from "../components/TaskCard.vue";
import { useTasksStore, type TaskListItem, type TaskStatus } from "../stores/tasks";

const tasksStore = useTasksStore();

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
