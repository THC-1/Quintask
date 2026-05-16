<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import AppLayout from "../components/AppLayout.vue";
import TaskCard from "../components/TaskCard.vue";
import { useTasksStore } from "../stores/tasks";
import {
  categoryFromQuery,
  filterTasksByCategory,
  filterTasksByWeek,
  taskCategoryOptions,
  weekWindows,
  type TaskCategory,
} from "../utils/taskSchedule";

const route = useRoute();
const router = useRouter();
const tasksStore = useTasksStore();
const selectedWeekIndex = ref(1);
const selectedCategory = ref<TaskCategory>("ALL");

function weekIndexFromQuery(value: unknown) {
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 && index < weekWindows.length ? index : 1;
}

watch(
  () => route.query.week,
  (week) => {
    selectedWeekIndex.value = weekIndexFromQuery(week);
  },
  { immediate: true },
);

watch(
  () => route.query.category,
  (category) => {
    selectedCategory.value = categoryFromQuery(category);
  },
  { immediate: true },
);

const selectedWeek = computed(() => weekWindows[selectedWeekIndex.value]);
const weekTasks = computed(() => filterTasksByWeek(tasksStore.tasks, selectedWeek.value));
const visibleTasks = computed(() => filterTasksByCategory(weekTasks.value, selectedCategory.value));
const categoryLabel = computed(
  () => taskCategoryOptions.find((option) => option.value === selectedCategory.value)?.label ?? "全部分类",
);

function selectWeek(index: number) {
  selectedWeekIndex.value = index;
  router.replace({ name: "tasks", query: { week: index, category: selectedCategory.value } });
}

function selectCategory(category: TaskCategory) {
  selectedCategory.value = category;
  router.replace({ name: "tasks", query: { week: selectedWeekIndex.value, category } });
}

function handleCategoryChange(event: Event) {
  selectCategory((event.target as HTMLSelectElement).value as TaskCategory);
}

onMounted(() => {
  tasksStore.loadTasks().catch(() => undefined);
});
</script>

<template>
  <AppLayout>
    <section class="page-section tasks-page">
      <RouterLink class="back-link" :to="{ name: 'board', query: { week: selectedWeekIndex, category: selectedCategory } }">
        返回看板
      </RouterLink>

      <div class="page-heading">
        <div>
          <p class="eyebrow">完整任务卡</p>
          <h1>{{ selectedWeek.label }}</h1>
          <p class="page-subtitle">当前周的完整任务卡片都在这里，点击任意卡片可进入任务详情。</p>
        </div>
        <span class="page-count">{{ visibleTasks.length }} 个任务</span>
      </div>

      <div class="week-switcher" aria-label="任务周切换">
        <button
          v-for="(week, index) in weekWindows"
          :key="week.label"
          type="button"
          :class="{ active: selectedWeekIndex === index }"
          @click="selectWeek(index)"
        >
          <strong>{{ week.label }}</strong>
          <span>{{ week.hint }}</span>
        </button>
      </div>

      <div class="task-filter-bar">
        <label>
          任务分类
          <select :value="selectedCategory" @change="handleCategoryChange">
            <option v-for="option in taskCategoryOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <span>{{ categoryLabel }}：{{ visibleTasks.length }} / {{ weekTasks.length }} 个任务</span>
      </div>

      <p v-if="tasksStore.error" class="form-error" role="alert">{{ tasksStore.error }}</p>
      <p v-else-if="tasksStore.loading" class="state-text">正在加载任务...</p>
      <p v-else-if="visibleTasks.length === 0" class="state-text">当前周暂无任务。</p>

      <div v-else class="tasks-card-grid">
        <TaskCard v-for="task in visibleTasks" :key="task.id" :task="task" />
      </div>
    </section>
  </AppLayout>
</template>
