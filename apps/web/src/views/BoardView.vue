<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
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
const createLoading = ref(false);
const createError = ref("");
const selectedWeekIndex = ref(1);
const selectedCategory = ref<TaskCategory>("ALL");
const createForm = reactive({
  title: "",
  description: "",
  priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
  dueDate: "",
});
const canCreateTask = computed(() => Boolean(auth.user) && !auth.isTeacher);

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
          <TaskCard v-for="task in previewTasks" :key="task.id" :task="task" />
        </div>
      </section>
    </section>
  </AppLayout>
</template>
