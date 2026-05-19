# Task Create Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace BoardView inline create form with a dedicated owner-only task creation page at `/tasks/new` with full field support.

**Architecture:** New `TaskCreateView.vue` page loads option data (users/milestones/tags/tasks) on mount, validates required fields client-side, and submits via the existing `POST /api/tasks` endpoint. BoardView inline form is removed and replaced with a RouterLink button.

**Tech Stack:** Vue 3 + Pinia + Vue Router + existing Hono API (no backend changes)

---

### Task 1: Expand Pinia store createTask

**Files:**
- Modify: `apps/web/src/stores/tasks.ts:155-173`

- [ ] **Step 1: Update createTask to accept all fields and return the created task**

Replace the `createTask` action (lines 155-173) with:

```ts
async createTask(input: {
  title: string;
  description: string;
  priority: TaskPriority;
  assigneeId: string;
  milestoneId: string;
  dueDate: string | null;
  tagIds: string[];
  dependencyIds: string[];
}) {
  this.error = "";

  try {
    const task = await apiFetch<TaskDetail>("/tasks", {
      method: "POST",
      body: JSON.stringify(input),
    });
    await this.loadTasks();
    return task;
  } catch (error) {
    this.error = toChineseError(error, "任务创建失败，请稍后重试");
    throw error;
  }
},
```

The changes from the current version:
- Input type expanded from `{ title, description, priority?, dueDate? }` to include `assigneeId`, `milestoneId`, `tagIds`, `dependencyIds` (all required except `dueDate: string | null`)
- `priority` is now required (`TaskPriority`, not optional)
- Captures the API response (`const task = await ...`) and returns it as `Promise<TaskDetail>`

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd apps/web && npx vue-tsc --noEmit 2>&1 | head -20`
Expected: No new type errors from tasks.ts.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/stores/tasks.ts
git commit -m "feat: expand createTask store action to accept full task fields"
```

---

### Task 2: Add /tasks/new route

**Files:**
- Modify: `apps/web/src/router.ts:13-23`

- [ ] **Step 1: Add the route before /tasks/:id**

Add the import at the top (after the existing view imports, line 8):

```ts
import TaskCreateView from "./views/TaskCreateView.vue";
```

We'll create the actual file in Task 3. For now, the import will cause a build error — that's expected at this intermediate step. If your toolchain checks imports eagerly, swap Task 2 and Task 3.

Insert the route before `/tasks/:id` so `new` is not matched as `:id`:

```ts
{ path: "/tasks/new", name: "task-create", component: TaskCreateView, meta: { requiresOwner: true } },
```

The full route array should be:

```ts
const routes: RouteRecordRaw[] = [
  { path: "/login", name: "login", component: LoginView, meta: { public: true } },
  { path: "/", redirect: "/dashboard" },
  { path: "/dashboard", name: "dashboard", component: DashboardView },
  { path: "/board", name: "board", component: BoardView },
  { path: "/tasks", name: "tasks", component: TasksView },
  { path: "/tasks/new", name: "task-create", component: TaskCreateView, meta: { requiresOwner: true } },
  { path: "/tasks/:id", name: "task-detail", component: TaskDetailView },
  { path: "/milestones", name: "milestones", component: MilestonesView },
  { path: "/workload", name: "workload", component: WorkloadView },
  { path: "/members", name: "members", component: MembersView, meta: { requiresOwner: true } },
];
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/router.ts
git commit -m "feat: add /tasks/new route for task creation page"
```

---

### Task 3: Create TaskCreateView.vue

**Files:**
- Create: `apps/web/src/views/TaskCreateView.vue`

- [ ] **Step 1: Create the component file**

Write `apps/web/src/views/TaskCreateView.vue`:

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";

import AppLayout from "../components/AppLayout.vue";
import { apiFetch } from "../api/client";
import { useAuthStore } from "../stores/auth";
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
const auth = useAuthStore();
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
      assigneeId: form.value.assigneeId,
      milestoneId: form.value.milestoneId,
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
```

All CSS classes (`task-edit-grid`, `task-edit-field`, `task-edit-wide`, `task-edit-options`, `task-edit-option`, `task-edit-actions`, `task-tag`, `detail-panel`, `back-link`, `page-section`, `page-heading`, `eyebrow`, `form-error`, `state-text`, `primary-button`, `secondary-button`) are defined globally in `apps/web/src/styles/main.css`.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd apps/web && npx vue-tsc --noEmit 2>&1 | head -20`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/views/TaskCreateView.vue
git commit -m "feat: add task create page with full form fields"
```

---

### Task 4: Update BoardView — remove inline form, add link button

**Files:**
- Modify: `apps/web/src/views/BoardView.vue`

- [ ] **Step 1: Remove inline form code from script**

In `<script setup>`, remove:

1. Lines 23-24: `const createLoading = ref(false);` and `const createError = ref("");`
2. Lines 27-32: The `createForm` reactive object
3. Line 33: `const canCreateTask = computed(...)`
4. Lines 51-81: The entire `submitTask()` function

- [ ] **Step 2: Remove inline form from template**

Remove lines 156-181 (the `<form class="inline-create-form">` block).

- [ ] **Step 3: Add the create button**

Add the RouterLink button in place of the removed form. The surrounding template context is: after the category filter bar (line 155), before the error/loading/empty state lines (183-185).

```html
<RouterLink v-if="auth.isOwner" class="primary-button" :to="{ name: 'task-create' }">
  创建任务
</RouterLink>
```

- [ ] **Step 4: Verify no unused imports remain**

The `reactive` import (line 1) may still be used elsewhere — check. `computed` and `ref` are still used by `selectedWeek`, `weekTasks`, etc., so they stay. `RouterLink` is already imported (line 2).

Run: `cd apps/web && npx vue-tsc --noEmit 2>&1 | head -20`
Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/views/BoardView.vue
git commit -m "feat: replace BoardView inline create form with link to task create page"
```

---

### Task 5: End-to-end verification

- [ ] **Step 1: Start the dev server and test manually**

Start the API and web dev server, then verify:

1. Log in as owner
2. Navigate to `/board` — see the "创建任务" button, no inline form
3. Click "创建任务" — navigates to `/tasks/new`
4. Form loads with all options (users, milestones, tags)
5. Try submitting with empty fields — see validation errors
6. Fill all required fields and submit — redirects to new task detail page
7. Navigate to `/tasks/:id` — verify all fields are populated correctly
8. Log in as member — "创建任务" button is not visible on board
9. Navigate directly to `/tasks/new` as member — redirected to dashboard

- [ ] **Step 2: Fix any issues found during manual testing**

- [ ] **Step 3: Final commit if any fixes were made**
