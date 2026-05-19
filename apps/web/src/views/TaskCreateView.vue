<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";

import AppLayout from "../components/AppLayout.vue";
import { apiFetch } from "../api/client";

import { useTasksStore, type TaskPriority } from "../stores/tasks";

type AssignableUser = {
  id: string;
  name: string;
  role: "OWNER" | "MEMBER" | "TEACHER";
  isActive: boolean;
};

type MilestoneOption = {
  id: string;
  title: string;
};

type TagOption = {
  id: string;
  name: string;
  color: string;
};

const router = useRouter();

const tasksStore = useTasksStore();

const createLoading = ref(false);
const optionsLoading = ref(false);
const createError = ref("");

const users = ref<AssignableUser[]>([]);
const milestones = ref<MilestoneOption[]>([]);
const tags = ref<TagOption[]>([]);

const form = ref({
  title: "",
  description: "",
  priority: "MEDIUM" as TaskPriority,
  assigneeId: "",
  milestoneId: "",
  dueDate: "",
  tagIds: [] as string[],
  dependencyIds: [] as string[],
});

const priorityOptions: Array<{ value: TaskPriority; label: string }> = [
  { value: "HIGH", label: "高" },
  { value: "MEDIUM", label: "中" },
  { value: "LOW", label: "低" },
];

const dependencyOptions = computed(() => tasksStore.tasks);

function updateSelection(field: "tagIds" | "dependencyIds", id: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  const current = form.value[field];
  form.value[field] = checked ? [...new Set([...current, id])] : current.filter((item) => item !== id);
}

function toApiDate(value: string) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : null;
}

async function loadOptions() {
  optionsLoading.value = true;

  try {
    const [userList, milestoneList, tagList] = await Promise.all([
      apiFetch<AssignableUser[]>("/users"),
      apiFetch<MilestoneOption[]>("/milestones"),
      apiFetch<TagOption[]>("/tags"),
      tasksStore.loadTasks(),
    ]);
    users.value = userList.filter((u) => u.isActive && u.role !== "TEACHER");
    milestones.value = milestoneList;
    tags.value = tagList;
  } catch {
    createError.value = "加载选项失败，请稍后重试";
  } finally {
    optionsLoading.value = false;
  }
}

function validate(): string | null {
  if (!form.value.title.trim()) return "请输入任务标题";
  if (!form.value.description.trim()) return "请输入任务描述";
  if (!form.value.assigneeId) return "请选择执行人";
  if (!form.value.milestoneId) return "请选择里程碑";
  if (!form.value.dueDate) return "请选择截止日期";
  if (form.value.tagIds.length === 0) return "请至少选择一个标签";
  return null;
}

async function submitTask() {
  if (createLoading.value) return;

  const error = validate();
  if (error) {
    createError.value = error;
    return;
  }

  createError.value = "";
  createLoading.value = true;

  try {
    const task = await tasksStore.createTask({
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      priority: form.value.priority,
      assigneeId: form.value.assigneeId || null,
      milestoneId: form.value.milestoneId || null,
      dueDate: toApiDate(form.value.dueDate),
      tagIds: form.value.tagIds,
      dependencyIds: form.value.dependencyIds,
    });
    router.push({ name: "task-detail", params: { id: task.id } });
  } catch {
    createError.value = tasksStore.error || "任务创建失败，请稍后重试";
  } finally {
    createLoading.value = false;
  }
}

function cancel() {
  router.push({ name: "board" });
}

onMounted(loadOptions);
</script>

<template>
  <AppLayout>
    <section class="page-section task-create-page">
      <RouterLink class="back-link" to="/board">返回看板</RouterLink>

      <div class="page-heading">
        <p class="eyebrow">任务管理</p>
        <h1>新建任务</h1>
      </div>

      <p v-if="createError" class="form-error" role="alert">{{ createError }}</p>

      <form class="detail-panel task-create-form" @submit.prevent="submitTask">
        <div class="task-edit-grid">
          <label class="task-edit-field">
            任务标题
            <input v-model="form.title" type="text" placeholder="请输入任务标题" />
          </label>

          <label class="task-edit-field">
            优先级
            <select v-model="form.priority">
              <option v-for="option in priorityOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="task-edit-field">
            执行人
            <select v-model="form.assigneeId" :disabled="optionsLoading">
              <option value="">请选择执行人</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
          </label>

          <label class="task-edit-field">
            里程碑
            <select v-model="form.milestoneId" :disabled="optionsLoading">
              <option value="">请选择里程碑</option>
              <option v-for="milestone in milestones" :key="milestone.id" :value="milestone.id">
                {{ milestone.title }}
              </option>
            </select>
          </label>

          <label class="task-edit-field">
            截止日期
            <input v-model="form.dueDate" type="date" />
          </label>

          <label class="task-edit-field task-edit-wide">
            任务描述
            <textarea v-model="form.description" rows="5" placeholder="补充目标、背景或交付物"></textarea>
          </label>
        </div>

        <fieldset class="task-edit-options">
          <legend>标签</legend>
          <p v-if="optionsLoading" class="state-text">正在加载标签...</p>
          <p v-else-if="tags.length === 0" class="state-text">暂无可选标签。</p>
          <template v-else>
            <label v-for="tag in tags" :key="tag.id" class="task-edit-option">
              <input
                type="checkbox"
                :checked="form.tagIds.includes(tag.id)"
                @change="updateSelection('tagIds', tag.id, $event)"
              />
              <span class="task-tag" :style="{ '--tag-color': tag.color }">{{ tag.name }}</span>
            </label>
          </template>
        </fieldset>

        <fieldset class="task-edit-options">
          <legend>依赖任务（选填）</legend>
          <p v-if="optionsLoading" class="state-text">正在加载任务...</p>
          <p v-else-if="dependencyOptions.length === 0" class="state-text">暂无可选依赖任务。</p>
          <template v-else>
            <label v-for="option in dependencyOptions" :key="option.id" class="task-edit-option">
              <input
                type="checkbox"
                :checked="form.dependencyIds.includes(option.id)"
                @change="updateSelection('dependencyIds', option.id, $event)"
              />
              <span>{{ option.title }}</span>
            </label>
          </template>
        </fieldset>

        <div class="task-edit-actions">
          <button type="submit" class="primary-button" :disabled="createLoading || optionsLoading">
            {{ createLoading ? "创建中..." : "创建任务" }}
          </button>
          <button type="button" class="primary-button secondary-button" :disabled="createLoading" @click="cancel">
            取消
          </button>
        </div>
      </form>
    </section>
  </AppLayout>
</template>
