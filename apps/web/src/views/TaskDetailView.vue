<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";

import AppLayout from "../components/AppLayout.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { apiFetch } from "../api/client";
import { useAuthStore } from "../stores/auth";
import { useTasksStore, type CommentType, type TaskPriority, type TaskStatus, type UpdateTaskInput } from "../stores/tasks";

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

type TaskEditForm = {
  title: string;
  description: string;
  priority: TaskPriority;
  assigneeId: string;
  milestoneId: string;
  dueDate: string;
  tagIds: string[];
  dependencyIds: string[];
};

const route = useRoute();
const auth = useAuthStore();
const tasksStore = useTasksStore();
const actionLoading = ref(false);
const subtaskLoadingId = ref("");
const commentLoading = ref(false);
const subtaskCreateLoading = ref(false);
const isEditingTask = ref(false);
const editLoading = ref(false);
const editOptionsLoading = ref(false);
const commentError = ref("");
const subtaskCreateError = ref("");
const editError = ref("");
const commentContent = ref("");
const commentType = ref<CommentType>("COMMENT");
const subtaskTitle = ref("");
const editUsers = ref<AssignableUser[]>([]);
const editMilestones = ref<MilestoneOption[]>([]);
const editTags = ref<TagOption[]>([]);
const editForm = ref<TaskEditForm>({
  title: "",
  description: "",
  priority: "MEDIUM",
  assigneeId: "",
  milestoneId: "",
  dueDate: "",
  tagIds: [],
  dependencyIds: [],
});

const taskId = computed(() => String(route.params.id));
const task = computed(() => tasksStore.currentTask);
const isAssignee = computed(() => task.value?.assignee?.id === auth.user?.id);
const canEditTask = computed(() => auth.isOwner && Boolean(task.value));
const canMoveAssignedTask = computed(() => auth.isOwner || isAssignee.value);
const canEditSubtasks = computed(() => !auth.isTeacher && (auth.isOwner || isAssignee.value));
const canCreateComment = computed(() => Boolean(auth.user) && !auth.isTeacher);
const isOwnerReview = computed(() => auth.isOwner && task.value?.status === "IN_REVIEW");
const priorityOptions: Array<{ value: TaskPriority; label: string }> = [
  { value: "HIGH", label: "高" },
  { value: "MEDIUM", label: "中" },
  { value: "LOW", label: "低" },
];
const commentTypeOptions = computed<Array<{ type: CommentType; label: string }>>(() => {
  const options: Array<{ type: CommentType; label: string }> = [
    { type: "COMMENT", label: "评论" },
    { type: "PROGRESS", label: "进展" },
  ];

  if (auth.isOwner) {
    options.push({ type: "REVIEW", label: "验收" });
  }

  return options;
});

const availableActions = computed<Array<{ status: TaskStatus; label: string; tone?: "secondary" }>>(() => {
  if (!task.value || auth.isTeacher) {
    return [];
  }

  if (task.value.status === "TODO" && canMoveAssignedTask.value) {
    return [{ status: "IN_PROGRESS", label: "开始处理" }];
  }

  if (task.value.status === "IN_PROGRESS" && canMoveAssignedTask.value) {
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
const dependencyOptions = computed(() => tasksStore.tasks.filter((item) => item.id !== taskId.value));

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

function toDateInput(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function toApiDate(value: string) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : null;
}

function resetEditForm() {
  if (!task.value) {
    return;
  }

  editForm.value = {
    title: task.value.title,
    description: task.value.description,
    priority: task.value.priority,
    assigneeId: task.value.assignee?.id ?? "",
    milestoneId: task.value.milestone?.id ?? "",
    dueDate: toDateInput(task.value.dueDate),
    tagIds: task.value.tags.map((item) => item.tag.id),
    dependencyIds: task.value.dependencies.map((dependency) => dependency.dependsOnTask.id),
  };
}

function updateSelection(field: "tagIds" | "dependencyIds", id: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  const current = editForm.value[field];

  editForm.value[field] = checked ? [...new Set([...current, id])] : current.filter((item) => item !== id);
}

async function loadEditOptions() {
  if (!auth.isOwner) {
    return;
  }

  editOptionsLoading.value = true;

  try {
    const [users, milestones, tags] = await Promise.all([
      apiFetch<AssignableUser[]>("/users"),
      apiFetch<MilestoneOption[]>("/milestones"),
      apiFetch<TagOption[]>("/tags"),
      tasksStore.loadTasks(),
    ]);

    editUsers.value = users.filter((user) => user.isActive && user.role !== "TEACHER");
    editMilestones.value = milestones;
    editTags.value = tags;
  } catch {
    editError.value = tasksStore.error || "编辑选项加载失败，请稍后重试";
  } finally {
    editOptionsLoading.value = false;
  }
}

async function openTaskEditor() {
  if (!task.value || !canEditTask.value) {
    return;
  }

  editError.value = "";
  resetEditForm();
  isEditingTask.value = true;
  await loadEditOptions();
}

function cancelTaskEdit() {
  editError.value = "";
  isEditingTask.value = false;
  resetEditForm();
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

async function submitTaskEdit() {
  if (!task.value || editLoading.value) {
    return;
  }

  editError.value = "";

  if (!editForm.value.title.trim()) {
    editError.value = "请输入任务标题";
    return;
  }

  editLoading.value = true;

  const input: UpdateTaskInput = {
    title: editForm.value.title.trim(),
    description: editForm.value.description.trim(),
    priority: editForm.value.priority,
    assigneeId: editForm.value.assigneeId || null,
    milestoneId: editForm.value.milestoneId || null,
    dueDate: toApiDate(editForm.value.dueDate),
    tagIds: editForm.value.tagIds,
    dependencyIds: editForm.value.dependencyIds.filter((id) => id !== task.value?.id),
  };

  try {
    await tasksStore.updateTask(task.value.id, input);
    isEditingTask.value = false;
  } catch {
    editError.value = tasksStore.error || "任务更新失败，请稍后重试";
  } finally {
    editLoading.value = false;
  }
}

async function updateSubtask(id: string, event: Event) {
  const target = event.target as HTMLInputElement;

  if (!canEditSubtasks.value) {
    target.checked = !target.checked;
    return;
  }

  subtaskLoadingId.value = id;

  try {
    await tasksStore.updateSubtask(id, target.checked);
  } catch {
    target.checked = !target.checked;
  } finally {
    subtaskLoadingId.value = "";
  }
}

async function submitComment() {
  if (!task.value || commentLoading.value) {
    return;
  }

  commentError.value = "";

  if (!commentContent.value.trim()) {
    commentError.value = "请输入内容";
    return;
  }

  commentLoading.value = true;

  try {
    await tasksStore.createComment(task.value.id, {
      content: commentContent.value.trim(),
      type: commentType.value,
    });
    commentContent.value = "";
    commentType.value = "COMMENT";
  } catch {
    commentError.value = tasksStore.error || "提交失败，请稍后重试";
  } finally {
    commentLoading.value = false;
  }
}

async function submitSubtask() {
  if (!task.value || subtaskCreateLoading.value) {
    return;
  }

  subtaskCreateError.value = "";

  if (!subtaskTitle.value.trim()) {
    subtaskCreateError.value = "请输入子任务标题";
    return;
  }

  subtaskCreateLoading.value = true;

  try {
    await tasksStore.createSubtask(task.value.id, subtaskTitle.value.trim());
    subtaskTitle.value = "";
  } catch {
    subtaskCreateError.value = tasksStore.error || "创建子任务失败，请稍后重试";
  } finally {
    subtaskCreateLoading.value = false;
  }
}

onMounted(loadTask);

watch(taskId, () => {
  isEditingTask.value = false;
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

        <div v-if="availableActions.length > 0 || canEditTask" class="detail-actions">
          <button
            v-if="canEditTask && !isEditingTask"
            type="button"
            class="primary-button secondary-button"
            :disabled="editOptionsLoading"
            @click="openTaskEditor"
          >
            {{ editOptionsLoading ? "加载编辑项..." : "编辑任务" }}
          </button>
          <template v-if="!isEditingTask">
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
          </template>
        </div>

        <form v-if="isEditingTask" class="detail-panel task-edit-form" @submit.prevent="submitTaskEdit">
          <div class="task-edit-grid">
            <label class="task-edit-field">
              任务标题
              <input v-model="editForm.title" type="text" />
            </label>

            <label class="task-edit-field">
              优先级
              <select v-model="editForm.priority">
                <option v-for="option in priorityOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="task-edit-field">
              执行人
              <select v-model="editForm.assigneeId" :disabled="editOptionsLoading">
                <option value="">未分配</option>
                <option v-for="user in editUsers" :key="user.id" :value="user.id">
                  {{ user.name }}
                </option>
              </select>
            </label>

            <label class="task-edit-field">
              里程碑
              <select v-model="editForm.milestoneId" :disabled="editOptionsLoading">
                <option value="">未关联</option>
                <option v-for="milestone in editMilestones" :key="milestone.id" :value="milestone.id">
                  {{ milestone.title }}
                </option>
              </select>
            </label>

            <label class="task-edit-field">
              截止日期
              <input v-model="editForm.dueDate" type="date" />
            </label>

            <label class="task-edit-field task-edit-wide">
              任务描述
              <textarea v-model="editForm.description" rows="5"></textarea>
            </label>
          </div>

          <fieldset class="task-edit-options">
            <legend>标签</legend>
            <p v-if="editOptionsLoading" class="state-text">正在加载标签...</p>
            <p v-else-if="editTags.length === 0" class="state-text">暂无可选标签。</p>
            <template v-else>
              <label v-for="tag in editTags" :key="tag.id" class="task-edit-option">
                <input
                  type="checkbox"
                  :checked="editForm.tagIds.includes(tag.id)"
                  @change="updateSelection('tagIds', tag.id, $event)"
                />
                <span class="task-tag" :style="{ '--tag-color': tag.color }">{{ tag.name }}</span>
              </label>
            </template>
          </fieldset>

          <fieldset class="task-edit-options">
            <legend>依赖任务</legend>
            <p v-if="editOptionsLoading" class="state-text">正在加载任务...</p>
            <p v-else-if="dependencyOptions.length === 0" class="state-text">暂无可选依赖任务。</p>
            <template v-else>
              <label v-for="option in dependencyOptions" :key="option.id" class="task-edit-option">
                <input
                  type="checkbox"
                  :checked="editForm.dependencyIds.includes(option.id)"
                  @change="updateSelection('dependencyIds', option.id, $event)"
                />
                <span>{{ option.title }}</span>
                <StatusBadge :status="option.status" />
              </label>
            </template>
          </fieldset>

          <p v-if="editError" class="form-error" role="alert">{{ editError }}</p>

          <div class="task-edit-actions">
            <button type="submit" class="primary-button" :disabled="editLoading || editOptionsLoading">
              {{ editLoading ? "保存中..." : "保存修改" }}
            </button>
            <button type="button" class="primary-button secondary-button" :disabled="editLoading" @click="cancelTaskEdit">
              取消
            </button>
          </div>
        </form>

        <div v-else class="detail-grid">
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
          <form v-if="canEditSubtasks" class="inline-panel-form" @submit.prevent="submitSubtask">
            <input v-model="subtaskTitle" type="text" placeholder="新增子任务" />
            <button type="submit" class="primary-button" :disabled="subtaskCreateLoading">
              {{ subtaskCreateLoading ? "提交中..." : "添加" }}
            </button>
            <p v-if="subtaskCreateError" class="form-error" role="alert">{{ subtaskCreateError }}</p>
          </form>
          <div v-if="task.subtasks.length > 0" class="subtask-list">
            <label v-for="subtask in task.subtasks" :key="subtask.id" class="subtask-item">
              <input
                type="checkbox"
                :checked="subtask.isDone"
                :disabled="!canEditSubtasks || subtaskLoadingId === subtask.id"
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
          <form v-if="canCreateComment" class="comment-form" @submit.prevent="submitComment">
            <div class="comment-form-row">
              <select v-model="commentType">
                <option v-for="option in commentTypeOptions" :key="option.type" :value="option.type">
                  {{ option.label }}
                </option>
              </select>
              <input v-model="commentContent" type="text" placeholder="记录评论或进展" />
              <button type="submit" class="primary-button" :disabled="commentLoading">
                {{ commentLoading ? "提交中..." : "发布" }}
              </button>
            </div>
            <p v-if="commentError" class="form-error" role="alert">{{ commentError }}</p>
          </form>
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
