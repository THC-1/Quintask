<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";

import AppLayout from "../components/AppLayout.vue";
import TaskCard from "../components/TaskCard.vue";
import { useAuthStore } from "../stores/auth";
import { useTasksStore } from "../stores/tasks";
import {
  categoryFromQuery,
  dayNumberFromTask,
  filterTasksByCategory,
  filterTasksByWeek,
  taskCategoryOptions,
  weekWindows,
  type TaskCategory,
} from "../utils/taskSchedule";

const auth = useAuthStore();
const tasksStore = useTasksStore();
const route = useRoute();
const deletingTaskId = ref("");
const selectedWeekIndex = ref(1);
const selectedCategory = ref<TaskCategory>("ALL");
function weekIndexFromQuery(value: unknown) {
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 && index < weekWindows.length ? index : 1;
}

const selectedWeek = computed(() => weekWindows[selectedWeekIndex.value]);
const weekTasks = computed(() => filterTasksByWeek(tasksStore.tasks, selectedWeek.value));
const visibleTasks = computed(() => filterTasksByCategory(weekTasks.value, selectedCategory.value));
const previewTasks = computed(() => visibleTasks.value.slice(0, 4));
const completedEarlierCount = computed(
  () => tasksStore.tasks.filter((task) => (dayNumberFromTask(task) ?? 99) <= 7 && task.status === "DONE").length,
);
const categoryLabel = computed(
  () => taskCategoryOptions.find((option) => option.value === selectedCategory.value)?.label ?? "全部分类",
);

async function deleteTask(task: { id: string; title: string }) {
  if (deletingTaskId.value || !auth.isOwner) {
    return;
  }

  const confirmed = window.confirm(`确定要删除任务“${task.title}”吗？此操作不可恢复。`);

  if (!confirmed) {
    return;
  }

  deletingTaskId.value = task.id;

  try {
    await tasksStore.deleteTask(task.id);
  } catch {
    // The store owns the page-level error message.
  } finally {
    deletingTaskId.value = "";
  }
}

onMounted(() => {
  selectedWeekIndex.value = weekIndexFromQuery(route.query.week);
  selectedCategory.value = categoryFromQuery(route.query.category);
  tasksStore.loadTasks().catch(() => undefined);
});
</script>

<template>
  <AppLayout>
    <section class="page-section board-page">
      <div class="page-heading board-heading">
        <div>
          <p class="eyebrow">饭点盲盒任务排期</p>
          <h1>{{ selectedWeek.label }}</h1>
          <p class="page-subtitle">
            默认只展示一周任务；Day 7 及以前已完成，后续任务可提前切换查看。
          </p>
        </div>
        <span class="page-count">{{ visibleTasks.length }} 个任务</span>
      </div>

      <div class="week-switcher" aria-label="任务周切换">
        <button
          v-for="(week, index) in weekWindows"
          :key="week.label"
          type="button"
          :class="{ active: selectedWeekIndex === index }"
          @click="selectedWeekIndex = index"
        >
          <strong>{{ week.label }}</strong>
          <span>{{ week.hint }}</span>
        </button>
      </div>

      <div class="schedule-note">
        <strong>已完成基线</strong>
        <span>Day 1-7 已完成 {{ completedEarlierCount }} 个任务，本周从 Day 8 开始继续推进。</span>
      </div>

      <div class="task-filter-bar">
        <label>
          任务分类
          <select v-model="selectedCategory">
            <option v-for="option in taskCategoryOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <span>{{ categoryLabel }}：{{ visibleTasks.length }} / {{ weekTasks.length }} 个任务</span>
      </div>

      <RouterLink v-if="auth.isOwner" class="primary-button" :to="{ name: 'task-create' }">
        创建任务
      </RouterLink>

      <p v-if="tasksStore.error" class="form-error" role="alert">{{ tasksStore.error }}</p>
      <p v-else-if="tasksStore.loading" class="state-text">正在加载任务...</p>
      <p v-else-if="visibleTasks.length === 0" class="state-text">当前周暂无任务。</p>

      <section v-else class="task-preview-panel" aria-label="任务看板">
        <header class="task-preview-header">
          <div>
            <h2>本周任务卡</h2>
            <p>当前分类先看最靠前的 {{ previewTasks.length }} 个任务，完整列表放在独立页面中查看。</p>
          </div>
          <RouterLink
            class="primary-button view-more-button"
            :to="{ name: 'tasks', query: { week: selectedWeekIndex, category: selectedCategory } }"
          >
            查看更多
          </RouterLink>
        </header>

        <div class="task-preview-row">
          <TaskCard
            v-for="task in previewTasks"
            :key="task.id"
            :task="task"
            :can-delete="auth.isOwner"
            :deleting="deletingTaskId === task.id"
            @delete="deleteTask"
          />
        </div>
      </section>
    </section>
  </AppLayout>
</template>
