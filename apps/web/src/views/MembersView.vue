<script setup lang="ts">
import { onMounted, ref } from "vue";

import AppLayout from "../components/AppLayout.vue";
import { ApiError, apiFetch } from "../api/client";
import { useAuthStore } from "../stores/auth";

type UserRole = "OWNER" | "MEMBER" | "TEACHER";

type Member = {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  isActive: boolean;
};

const auth = useAuthStore();
const members = ref<Member[]>([]);
const loading = ref(false);
const saving = ref(false);
const actionUserId = ref("");
const error = ref("");

const roleLabels: Record<UserRole, string> = {
  OWNER: "负责人",
  MEMBER: "成员",
  TEACHER: "教师",
};

function toChineseError(value: unknown, fallback: string) {
  return value instanceof ApiError ? value.message : fallback;
}

async function loadMembers() {
  if (!auth.isOwner) {
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    members.value = await apiFetch<Member[]>("/users");
  } catch (value) {
    members.value = [];
    error.value = toChineseError(value, "成员列表加载失败，请稍后重试");
  } finally {
    loading.value = false;
  }
}

async function createGeneratedMember() {
  if (saving.value) {
    return;
  }

  saving.value = true;
  error.value = "";

  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  try {
    await apiFetch<Member>("/users", {
      method: "POST",
      body: JSON.stringify({
        name: `新成员${suffix}`,
        username: `member${suffix}`,
        password: "member123",
        role: "MEMBER",
      }),
    });
    await loadMembers();
  } catch (value) {
    error.value = toChineseError(value, "新增成员失败，请稍后重试");
  } finally {
    saving.value = false;
  }
}

async function updateMember(member: Member, input: { isActive?: boolean; password?: string }) {
  if (actionUserId.value) {
    return;
  }

  actionUserId.value = member.id;
  error.value = "";

  try {
    await apiFetch<Member>(`/users/${member.id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    await loadMembers();
  } catch (value) {
    error.value = toChineseError(value, "成员更新失败，请稍后重试");
  } finally {
    actionUserId.value = "";
  }
}

onMounted(() => {
  loadMembers();
});
</script>

<template>
  <AppLayout>
    <section class="page-section members-page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">权限与成员</p>
          <h1>成员管理</h1>
        </div>
        <button
          v-if="auth.isOwner"
          type="button"
          class="primary-button"
          :disabled="saving"
          @click="createGeneratedMember"
        >
          {{ saving ? "正在新增..." : "新增成员" }}
        </button>
      </div>

      <p v-if="!auth.isOwner" class="state-text">只有负责人可以管理成员。</p>
      <template v-else>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <p v-else-if="loading" class="state-text">正在加载成员...</p>

        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>账号</th>
                <th>角色</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in members" :key="member.id">
                <td>{{ member.name }}</td>
                <td>{{ member.username }}</td>
                <td>{{ roleLabels[member.role] }}</td>
                <td>{{ member.isActive ? "启用" : "停用" }}</td>
                <td>
                  <div class="table-actions">
                    <button
                      type="button"
                      class="ghost-button"
                      :disabled="actionUserId === member.id"
                      @click="updateMember(member, { isActive: !member.isActive })"
                    >
                      {{ member.isActive ? "停用" : "启用" }}
                    </button>
                    <button
                      type="button"
                      class="ghost-button"
                      :disabled="actionUserId === member.id"
                      @click="updateMember(member, { password: 'member123' })"
                    >
                      重置为 member123
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="members.length === 0">
                <td colspan="5">暂无成员。</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>
  </AppLayout>
</template>
