# Quintask Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个面向 5 人内部小组的在线任务分配平台，支持负责人分配和验收任务、成员更新进度、老师游客只读查看成员工作量。

**Architecture:** 采用 npm workspaces 管理前端、后端和共享类型。后端用 Hono + Prisma + MySQL 提供 JSON API，并把权限、任务状态流转和工作量统计放在服务层集中测试。前端用 Vue 3 + Vite + Pinia + Vue Router 实现登录、看板、任务详情、里程碑、成员工作量和成员管理页面。

**Tech Stack:** Vue 3、Vite、TypeScript、Pinia、Vue Router、Hono、Prisma、MySQL、JWT、Vitest、bcryptjs、Zod。

---

## 0. 执行约定

- 计划中的命令默认在 `D:\Java_study\Quintask` 执行。
- 当前目录还不是 Git 仓库；执行计划前先运行 `git init`，否则每个任务的 commit 步骤会失败。
- 第一版使用 npm workspaces，不引入 pnpm/yarn，减少环境要求。
- 开发数据库使用 MySQL；后端单元测试优先测纯服务函数，避免每次测试都依赖数据库。
- 所有用户可见文案使用中文。

## 1. 文件结构

创建以下结构：

```text
D:\Java_study\Quintask
├── apps
│   ├── api
│   │   ├── prisma
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── src
│   │   │   ├── app.ts
│   │   │   ├── index.ts
│   │   │   ├── config.ts
│   │   │   ├── db.ts
│   │   │   ├── lib
│   │   │   │   ├── errors.ts
│   │   │   │   ├── http.ts
│   │   │   │   ├── password.ts
│   │   │   │   └── token.ts
│   │   │   ├── middleware
│   │   │   │   ├── auth.ts
│   │   │   │   └── require-role.ts
│   │   │   ├── modules
│   │   │   │   ├── auth
│   │   │   │   ├── users
│   │   │   │   ├── projects
│   │   │   │   ├── milestones
│   │   │   │   ├── tasks
│   │   │   │   ├── comments
│   │   │   │   ├── subtasks
│   │   │   │   ├── tags
│   │   │   │   ├── dashboard
│   │   │   │   └── workload
│   │   │   └── tests
│   │   │       ├── task-state.test.ts
│   │   │       ├── permissions.test.ts
│   │   │       └── workload.test.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   └── web
│       ├── index.html
│       ├── src
│       │   ├── main.ts
│       │   ├── App.vue
│       │   ├── router.ts
│       │   ├── api
│       │   │   └── client.ts
│       │   ├── stores
│       │   │   ├── auth.ts
│       │   │   └── tasks.ts
│       │   ├── views
│       │   │   ├── LoginView.vue
│       │   │   ├── DashboardView.vue
│       │   │   ├── BoardView.vue
│       │   │   ├── TaskDetailView.vue
│       │   │   ├── MilestonesView.vue
│       │   │   ├── WorkloadView.vue
│       │   │   └── MembersView.vue
│       │   ├── components
│       │   │   ├── AppLayout.vue
│       │   │   ├── StatusBadge.vue
│       │   │   ├── TaskCard.vue
│       │   │   └── WorkloadMemberPanel.vue
│       │   └── styles
│       │       └── main.css
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── packages
│   └── shared
│       ├── src
│       │   ├── enums.ts
│       │   ├── schemas.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── docs
│   └── superpowers
│       ├── specs
│       └── plans
├── package.json
├── tsconfig.base.json
├── .env.example
└── .gitignore
```

职责边界：

- `packages/shared`：只放枚举、Zod schema、前后端共享类型。
- `apps/api/src/modules/*`：每个业务模块包含 `routes.ts`、`service.ts`、`schemas.ts`，服务层不直接读取 HTTP 请求。
- `apps/api/src/lib/*`：错误格式、密码、JWT、HTTP 响应工具。
- `apps/web/src/views/*`：页面级组件，负责组合 store 和展示。
- `apps/web/src/components/*`：可复用展示组件，不直接发请求。

---

## Task 1: 初始化工作区和基础配置

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`

- [ ] **Step 1: 初始化 Git**

Run:

```bash
git init
```

Expected: 输出包含 `Initialized empty Git repository`。

- [ ] **Step 2: 创建根 `package.json`**

写入：

```json
{
  "name": "quintask",
  "private": true,
  "type": "module",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "npm run dev -w @quintask/api",
    "dev:api": "npm run dev -w @quintask/api",
    "dev:web": "npm run dev -w @quintask/web",
    "build": "npm run build -ws",
    "test": "npm run test -ws",
    "lint": "npm run typecheck -ws",
    "db:generate": "npm run db:generate -w @quintask/api",
    "db:migrate": "npm run db:migrate -w @quintask/api",
    "db:seed": "npm run db:seed -w @quintask/api"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

- [ ] **Step 3: 创建 TypeScript 基础配置**

写入 `tsconfig.base.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

- [ ] **Step 4: 创建忽略文件和环境模板**

写入 `.gitignore`：

```gitignore
node_modules
dist
.env
.env.local
coverage
.superpowers
```

写入 `.env.example`：

```env
DATABASE_URL="mysql://root:password@localhost:3306/quintask"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=3000
```

- [ ] **Step 5: 创建三个 workspace 包配置**

写入 `packages/shared/package.json`：

```json
{
  "name": "@quintask/shared",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "echo shared has no tests",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

写入 `apps/api/package.json`：

```json
{
  "name": "@quintask/api",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@hono/node-server": "^1.14.1",
    "@prisma/client": "^6.8.2",
    "@quintask/shared": "0.1.0",
    "bcryptjs": "^3.0.2",
    "hono": "^4.7.10",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.9",
    "prisma": "^6.8.2",
    "tsx": "^4.19.4",
    "typescript": "^5.8.3",
    "vitest": "^3.1.3"
  }
}
```

写入 `apps/web/package.json`：

```json
{
  "name": "@quintask/web",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "vue-tsc -b && vite build",
    "test": "echo web smoke tests are manual for v1",
    "typecheck": "vue-tsc -b"
  },
  "dependencies": {
    "@quintask/shared": "0.1.0",
    "@vitejs/plugin-vue": "^5.2.4",
    "pinia": "^3.0.2",
    "vue": "^3.5.13",
    "vue-router": "^4.5.1"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "vite": "^6.3.5",
    "vue-tsc": "^2.2.10"
  }
}
```

- [ ] **Step 6: 创建各包 tsconfig 和 vite/vitest 配置**

写入 `packages/shared/tsconfig.json`：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "declaration": true
  },
  "include": ["src"]
}
```

写入 `apps/api/tsconfig.json`：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "types": ["node", "vitest/globals"]
  },
  "include": ["src", "prisma"]
}
```

写入 `apps/api/vitest.config.ts`：

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node"
  }
});
```

写入 `apps/web/tsconfig.json`：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "vite.config.ts"]
}
```

写入 `apps/web/vite.config.ts`：

```ts
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:3000"
    }
  }
});
```

- [ ] **Step 7: 安装依赖并验证工作区**

Run:

```bash
npm install
npm run typecheck -ws
```

Expected: `npm install` 成功；`typecheck` 因为源码目录还未创建，允许出现找不到输入文件的 TypeScript 提示。Task 2 会创建源码后再次验证。

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.base.json .gitignore .env.example apps packages
git commit -m "chore: initialize quintask workspace"
```

---

## Task 2: 创建共享枚举和校验 schema

**Files:**
- Create: `packages/shared/src/enums.ts`
- Create: `packages/shared/src/schemas.ts`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: 创建共享枚举**

写入 `packages/shared/src/enums.ts`：

```ts
export const UserRole = {
  OWNER: "OWNER",
  MEMBER: "MEMBER",
  TEACHER: "TEACHER"
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  IN_REVIEW: "IN_REVIEW",
  DONE: "DONE"
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH"
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const MilestoneStatus = {
  PLANNED: "PLANNED",
  ACTIVE: "ACTIVE",
  DONE: "DONE"
} as const;

export type MilestoneStatus = (typeof MilestoneStatus)[keyof typeof MilestoneStatus];

export const CommentType = {
  COMMENT: "COMMENT",
  PROGRESS: "PROGRESS",
  REVIEW: "REVIEW"
} as const;

export type CommentType = (typeof CommentType)[keyof typeof CommentType];
```

- [ ] **Step 2: 创建共享输入 schema**

写入 `packages/shared/src/schemas.ts`：

```ts
import { z } from "zod";
import { CommentType, MilestoneStatus, TaskPriority, TaskStatus, UserRole } from "./enums";

export const loginSchema = z.object({
  username: z.string().min(1, "请输入账号"),
  password: z.string().min(1, "请输入密码")
});

export const createUserSchema = z.object({
  name: z.string().min(1, "请输入姓名"),
  username: z.string().min(3, "账号至少 3 个字符"),
  password: z.string().min(6, "密码至少 6 个字符"),
  role: z.enum([UserRole.MEMBER, UserRole.TEACHER]).default(UserRole.MEMBER)
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional()
});

export const createMilestoneSchema = z.object({
  title: z.string().min(1, "请输入里程碑标题"),
  description: z.string().default(""),
  startDate: z.string().datetime().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  status: z.enum([MilestoneStatus.PLANNED, MilestoneStatus.ACTIVE, MilestoneStatus.DONE]).default(MilestoneStatus.PLANNED),
  sortOrder: z.number().int().min(0).default(0)
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "请输入任务标题"),
  description: z.string().default(""),
  priority: z.enum([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH]).default(TaskPriority.MEDIUM),
  assigneeId: z.string().nullable().optional(),
  milestoneId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  tagIds: z.array(z.string()).default([]),
  dependencyIds: z.array(z.string()).default([])
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.DONE]).optional()
});

export const changeTaskStatusSchema = z.object({
  status: z.enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.DONE])
});

export const createSubtaskSchema = z.object({
  title: z.string().min(1, "请输入子任务标题"),
  assigneeId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0)
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).optional(),
  isDone: z.boolean().optional(),
  assigneeId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).optional()
});

export const createCommentSchema = z.object({
  content: z.string().min(1, "请输入内容"),
  type: z.enum([CommentType.COMMENT, CommentType.PROGRESS, CommentType.REVIEW]).default(CommentType.COMMENT)
});

export const createTagSchema = z.object({
  name: z.string().min(1, "请输入标签名称"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "颜色必须是十六进制值").default("#64748b")
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
```

- [ ] **Step 3: 导出共享模块**

写入 `packages/shared/src/index.ts`：

```ts
export * from "./enums";
export * from "./schemas";
```

- [ ] **Step 4: 验证共享包**

Run:

```bash
npm run typecheck -w @quintask/shared
npm run build -w @quintask/shared
```

Expected: 两条命令都通过。

- [ ] **Step 5: Commit**

```bash
git add packages/shared
git commit -m "feat: add shared enums and validation schemas"
```

---

## Task 3: 建立 Prisma 数据模型和种子数据

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/seed.ts`
- Create: `apps/api/src/db.ts`

- [ ] **Step 1: 写入 Prisma schema**

写入 `apps/api/prisma/schema.prisma`：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  OWNER
  MEMBER
  TEACHER
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}

enum MilestoneStatus {
  PLANNED
  ACTIVE
  DONE
}

enum CommentType {
  COMMENT
  PROGRESS
  REVIEW
}

model User {
  id             String        @id @default(cuid())
  name           String
  username       String        @unique
  passwordHash   String
  role           UserRole
  isActive       Boolean       @default(true)
  createdAt      DateTime      @default(now())
  assignedTasks  Task[]        @relation("AssignedTasks")
  createdTasks   Task[]        @relation("CreatedTasks")
  reviewedTasks  Task[]        @relation("ReviewedTasks")
  subtasks       Subtask[]
  comments       TaskComment[]
}

model Project {
  id          String      @id @default(cuid())
  name        String
  description String      @db.Text
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  milestones  Milestone[]
  tasks       Task[]
}

model Milestone {
  id          String          @id @default(cuid())
  projectId   String
  title       String
  description String          @db.Text
  startDate   DateTime?
  dueDate     DateTime?
  status      MilestoneStatus @default(PLANNED)
  sortOrder   Int             @default(0)
  project     Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks       Task[]
}

model Task {
  id              String           @id @default(cuid())
  projectId       String
  milestoneId     String?
  title           String
  description     String           @db.Text
  status          TaskStatus       @default(TODO)
  priority        TaskPriority     @default(MEDIUM)
  assigneeId      String?
  creatorId       String
  reviewerId      String?
  dueDate         DateTime?
  completedAt     DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  project         Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  milestone       Milestone?       @relation(fields: [milestoneId], references: [id], onDelete: SetNull)
  assignee        User?            @relation("AssignedTasks", fields: [assigneeId], references: [id], onDelete: SetNull)
  creator         User             @relation("CreatedTasks", fields: [creatorId], references: [id], onDelete: Restrict)
  reviewer        User?            @relation("ReviewedTasks", fields: [reviewerId], references: [id], onDelete: SetNull)
  dependencies    TaskDependency[] @relation("TaskDependencies")
  requiredBy      TaskDependency[] @relation("TaskRequiredBy")
  subtasks        Subtask[]
  comments        TaskComment[]
  tags            TaskTag[]
}

model TaskDependency {
  id              String @id @default(cuid())
  taskId          String
  dependsOnTaskId String
  task            Task   @relation("TaskDependencies", fields: [taskId], references: [id], onDelete: Cascade)
  dependsOnTask   Task   @relation("TaskRequiredBy", fields: [dependsOnTaskId], references: [id], onDelete: Cascade)

  @@unique([taskId, dependsOnTaskId])
}

model Subtask {
  id         String   @id @default(cuid())
  taskId     String
  title      String
  isDone     Boolean  @default(false)
  assigneeId String?
  sortOrder  Int      @default(0)
  task       Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  assignee   User?    @relation(fields: [assigneeId], references: [id], onDelete: SetNull)
}

model TaskComment {
  id        String      @id @default(cuid())
  taskId    String
  authorId  String
  content   String      @db.Text
  type      CommentType @default(COMMENT)
  createdAt DateTime    @default(now())
  task      Task        @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author    User        @relation(fields: [authorId], references: [id], onDelete: Restrict)
}

model Tag {
  id        String    @id @default(cuid())
  name      String    @unique
  color     String
  createdAt DateTime  @default(now())
  tasks     TaskTag[]
}

model TaskTag {
  taskId String
  tagId  String
  task   Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([taskId, tagId])
}
```

- [ ] **Step 2: 创建 Prisma client 单例**

写入 `apps/api/src/db.ts`：

```ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

- [ ] **Step 3: 创建种子数据**

写入 `apps/api/prisma/seed.ts`：

```ts
import { PrismaClient, TaskPriority, TaskStatus, UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const ownerPassword = await hashPassword("owner123");
  const memberPassword = await hashPassword("member123");
  const teacherPassword = await hashPassword("teacher123");

  const owner = await prisma.user.upsert({
    where: { username: "owner" },
    update: {},
    create: { name: "总负责人", username: "owner", passwordHash: ownerPassword, role: UserRole.OWNER }
  });

  const teacher = await prisma.user.upsert({
    where: { username: "teacher" },
    update: {},
    create: { name: "老师游客", username: "teacher", passwordHash: teacherPassword, role: UserRole.TEACHER }
  });

  const members = await Promise.all(
    [1, 2, 3, 4].map((index) =>
      prisma.user.upsert({
        where: { username: `member${index}` },
        update: {},
        create: {
          name: `组员${index}`,
          username: `member${index}`,
          passwordHash: memberPassword,
          role: UserRole.MEMBER
        }
      })
    )
  );

  const project = await prisma.project.upsert({
    where: { id: "default-project" },
    update: {},
    create: {
      id: "default-project",
      name: "Quintask 小组项目",
      description: "内部任务分配和进度展示平台"
    }
  });

  const milestone = await prisma.milestone.create({
    data: {
      projectId: project.id,
      title: "第一阶段：基础功能",
      description: "完成登录、任务看板、成员工作量展示",
      sortOrder: 1
    }
  });

  await prisma.tag.createMany({
    data: [
      { name: "前端", color: "#2563eb" },
      { name: "后端", color: "#16a34a" },
      { name: "文档", color: "#9333ea" }
    ],
    skipDuplicates: true
  });

  await prisma.task.create({
    data: {
      projectId: project.id,
      milestoneId: milestone.id,
      title: "完成任务看板页面",
      description: "实现四列看板，并能打开任务详情",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      creatorId: owner.id,
      assigneeId: members[0].id
    }
  });

  console.log({ owner: owner.username, teacher: teacher.username, members: members.map((m) => m.username) });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 4: 先创建密码工具，保证 seed 可编译**

写入 `apps/api/src/lib/password.ts`：

```ts
import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
```

- [ ] **Step 5: 生成 Prisma client**

Run:

```bash
npm run db:generate -w @quintask/api
npm run typecheck -w @quintask/api
```

Expected: Prisma client 生成成功，TypeScript 检查通过。

- [ ] **Step 6: 在本地 MySQL 运行迁移和种子**

先复制环境文件：

```bash
copy .env.example .env
```

确认 `.env` 中 `DATABASE_URL` 指向本机 MySQL 后执行：

```bash
npm run db:migrate -w @quintask/api -- --name init
npm run db:seed -w @quintask/api
```

Expected: 生成数据库表，并输出 `owner`、`teacher`、`member1` 到 `member4`。

- [ ] **Step 7: Commit**

```bash
git add apps/api/prisma apps/api/src/db.ts apps/api/src/lib/password.ts .env.example
git commit -m "feat: add prisma schema and seed data"
```

---

## Task 4: 后端基础设施、统一错误和鉴权

**Files:**
- Create: `apps/api/src/config.ts`
- Create: `apps/api/src/lib/errors.ts`
- Create: `apps/api/src/lib/http.ts`
- Create: `apps/api/src/lib/token.ts`
- Create: `apps/api/src/middleware/auth.ts`
- Create: `apps/api/src/middleware/require-role.ts`
- Create: `apps/api/src/types/hono.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/modules/auth/routes.ts`
- Create: `apps/api/src/modules/auth/service.ts`

- [ ] **Step 1: 写配置和错误工具**

写入 `apps/api/src/config.ts`：

```ts
export const config = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-before-production"
};
```

写入 `apps/api/src/lib/errors.ts`：

```ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

export const errors = {
  unauthorized: () => new AppError("UNAUTHORIZED", "请先登录。", 401),
  forbidden: () => new AppError("FORBIDDEN", "没有权限执行该操作。", 403),
  notFound: (message = "数据不存在。") => new AppError("NOT_FOUND", message, 404),
  validation: (message: string) => new AppError("VALIDATION_ERROR", message, 422),
  invalidTransition: () => new AppError("INVALID_TASK_TRANSITION", "任务状态不允许这样流转。", 400),
  dependencyBlocked: () => new AppError("TASK_DEPENDENCY_BLOCKED", "该任务存在未完成的依赖任务，暂不能提交验收。", 400)
};
```

写入 `apps/api/src/lib/http.ts`：

```ts
import type { Context } from "hono";
import { AppError } from "./errors";

export function ok<T>(c: Context, data: T) {
  return c.json({ data });
}

export function created<T>(c: Context, data: T) {
  return c.json({ data }, 201);
}

export function handleError(error: unknown, c: Context) {
  if (error instanceof AppError) {
    return c.json({ error: { code: error.code, message: error.message } }, error.status);
  }

  console.error(error);
  return c.json({ error: { code: "INTERNAL_ERROR", message: "服务器内部错误。" } }, 500);
}
```

- [ ] **Step 2: 写 JWT 工具**

写入 `apps/api/src/lib/token.ts`：

```ts
import jwt from "jsonwebtoken";
import { config } from "../config";

export interface TokenPayload {
  userId: string;
  role: "OWNER" | "MEMBER" | "TEACHER";
}

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}
```

- [ ] **Step 3: 写 Hono 上下文类型和鉴权中间件**

写入 `apps/api/src/types/hono.ts`：

```ts
import type { User } from "@prisma/client";

declare module "hono" {
  interface ContextVariableMap {
    user: User;
  }
}
```

写入 `apps/api/src/middleware/auth.ts`：

```ts
import { createMiddleware } from "hono/factory";
import { prisma } from "../db";
import { errors } from "../lib/errors";
import { verifyToken } from "../lib/token";

export const authMiddleware = createMiddleware(async (c, next) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    throw errors.unauthorized();
  }

  const payload = verifyToken(token);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });

  if (!user || !user.isActive) {
    throw errors.unauthorized();
  }

  c.set("user", user);
  await next();
});
```

写入 `apps/api/src/middleware/require-role.ts`：

```ts
import type { UserRole } from "@prisma/client";
import { createMiddleware } from "hono/factory";
import { errors } from "../lib/errors";

export function requireRole(...roles: UserRole[]) {
  return createMiddleware(async (c, next) => {
    const user = c.get("user");
    if (!user || !roles.includes(user.role)) {
      throw errors.forbidden();
    }
    await next();
  });
}
```

- [ ] **Step 4: 写登录服务和路由**

写入 `apps/api/src/modules/auth/service.ts`：

```ts
import { loginSchema } from "@quintask/shared";
import { prisma } from "../../db";
import { errors } from "../../lib/errors";
import { signToken } from "../../lib/token";
import { verifyPassword } from "../../lib/password";

export async function login(input: unknown) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    throw errors.validation(parsed.error.issues[0].message);
  }

  const user = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!user || !user.isActive) {
    throw errors.unauthorized();
  }

  const passwordOk = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!passwordOk) {
    throw errors.unauthorized();
  }

  return {
    token: signToken({ userId: user.id, role: user.role }),
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role
    }
  };
}
```

写入 `apps/api/src/modules/auth/routes.ts`：

```ts
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { ok } from "../../lib/http";
import { login } from "./service";

export const authRoutes = new Hono();

authRoutes.post("/login", async (c) => ok(c, await login(await c.req.json())));

authRoutes.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  return ok(c, {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role
  });
});
```

- [ ] **Step 5: 组装 Hono app**

写入 `apps/api/src/app.ts`：

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { handleError, ok } from "./lib/http";
import { authRoutes } from "./modules/auth/routes";

export const app = new Hono();

app.use("*", cors());

app.get("/api/health", (c) => ok(c, { status: "ok" }));

app.route("/api/auth", authRoutes);

app.onError((error, c) => handleError(error, c));
```

写入 `apps/api/src/index.ts`：

```ts
import { serve } from "@hono/node-server";
import { app } from "./app";
import { config } from "./config";

serve({ fetch: app.fetch, port: config.port }, () => {
  console.log(`Quintask API running at http://127.0.0.1:${config.port}`);
});
```

- [ ] **Step 6: 验证后端启动**

Run:

```bash
npm run typecheck -w @quintask/api
npm run dev:api
```

Expected: 类型检查通过；开发服务器输出 `Quintask API running`。手动访问 `http://127.0.0.1:3000/api/health` 返回 `{"data":{"status":"ok"}}`。

- [ ] **Step 7: Commit**

```bash
git add apps/api/src
git commit -m "feat: add api foundation and auth"
```

---

## Task 5: 任务状态流转和权限规则服务

**Files:**
- Create: `apps/api/src/modules/tasks/task-state.ts`
- Create: `apps/api/src/modules/tasks/permissions.ts`
- Create: `apps/api/src/tests/task-state.test.ts`
- Create: `apps/api/src/tests/permissions.test.ts`

- [ ] **Step 1: 先写任务状态流转测试**

写入 `apps/api/src/tests/task-state.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { TaskStatus, UserRole } from "@quintask/shared";
import { canChangeTaskStatus } from "../modules/tasks/task-state";

describe("canChangeTaskStatus", () => {
  it("允许负责人把待验收任务验收为已完成", () => {
    expect(
      canChangeTaskStatus({
        role: UserRole.OWNER,
        currentStatus: TaskStatus.IN_REVIEW,
        nextStatus: TaskStatus.DONE,
        isAssignee: false,
        hasUnfinishedDependencies: false,
        isConfirmedTask: true
      })
    ).toEqual({ ok: true });
  });

  it("禁止成员直接把任务改为已完成", () => {
    expect(
      canChangeTaskStatus({
        role: UserRole.MEMBER,
        currentStatus: TaskStatus.IN_REVIEW,
        nextStatus: TaskStatus.DONE,
        isAssignee: true,
        hasUnfinishedDependencies: false,
        isConfirmedTask: true
      })
    ).toEqual({ ok: false, code: "FORBIDDEN" });
  });

  it("依赖未完成时禁止提交待验收", () => {
    expect(
      canChangeTaskStatus({
        role: UserRole.MEMBER,
        currentStatus: TaskStatus.IN_PROGRESS,
        nextStatus: TaskStatus.IN_REVIEW,
        isAssignee: true,
        hasUnfinishedDependencies: true,
        isConfirmedTask: true
      })
    ).toEqual({ ok: false, code: "TASK_DEPENDENCY_BLOCKED" });
  });

  it("成员不能推进未确认分配的建议任务", () => {
    expect(
      canChangeTaskStatus({
        role: UserRole.MEMBER,
        currentStatus: TaskStatus.TODO,
        nextStatus: TaskStatus.IN_PROGRESS,
        isAssignee: true,
        hasUnfinishedDependencies: false,
        isConfirmedTask: false
      })
    ).toEqual({ ok: false, code: "FORBIDDEN" });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
npm run test -w @quintask/api -- task-state.test.ts
```

Expected: FAIL，提示无法找到 `../modules/tasks/task-state`。

- [ ] **Step 3: 实现状态流转函数**

写入 `apps/api/src/modules/tasks/task-state.ts`：

```ts
import { TaskStatus, UserRole, type TaskStatus as TaskStatusType, type UserRole as UserRoleType } from "@quintask/shared";

interface ChangeTaskStatusInput {
  role: UserRoleType;
  currentStatus: TaskStatusType;
  nextStatus: TaskStatusType;
  isAssignee: boolean;
  hasUnfinishedDependencies: boolean;
  isConfirmedTask: boolean;
}

type ChangeResult = { ok: true } | { ok: false; code: "FORBIDDEN" | "TASK_DEPENDENCY_BLOCKED" | "INVALID_TASK_TRANSITION" };

export function canChangeTaskStatus(input: ChangeTaskStatusInput): ChangeResult {
  if (input.role === UserRole.TEACHER) {
    return { ok: false, code: "FORBIDDEN" };
  }

  if (input.hasUnfinishedDependencies && [TaskStatus.IN_REVIEW, TaskStatus.DONE].includes(input.nextStatus)) {
    return { ok: false, code: "TASK_DEPENDENCY_BLOCKED" };
  }

  if (input.role === UserRole.OWNER) {
    return { ok: true };
  }

  if (!input.isAssignee || !input.isConfirmedTask) {
    return { ok: false, code: "FORBIDDEN" };
  }

  const allowedMemberTransitions = new Set([
    `${TaskStatus.TODO}->${TaskStatus.IN_PROGRESS}`,
    `${TaskStatus.IN_PROGRESS}->${TaskStatus.IN_REVIEW}`
  ]);

  if (!allowedMemberTransitions.has(`${input.currentStatus}->${input.nextStatus}`)) {
    return { ok: false, code: "FORBIDDEN" };
  }

  return { ok: true };
}
```

- [ ] **Step 4: 写权限测试**

写入 `apps/api/src/tests/permissions.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { UserRole } from "@quintask/shared";
import { canWriteGlobalConfig, canWriteTask, canWriteComment } from "../modules/tasks/permissions";

describe("permissions", () => {
  it("老师游客不能写任何任务或评论", () => {
    expect(canWriteTask(UserRole.TEACHER, false)).toBe(false);
    expect(canWriteComment(UserRole.TEACHER)).toBe(false);
  });

  it("负责人可以写任务和全局配置", () => {
    expect(canWriteTask(UserRole.OWNER, false)).toBe(true);
    expect(canWriteGlobalConfig(UserRole.OWNER)).toBe(true);
  });

  it("成员可以创建建议任务和评论，但不能写全局配置", () => {
    expect(canWriteTask(UserRole.MEMBER, true)).toBe(true);
    expect(canWriteComment(UserRole.MEMBER)).toBe(true);
    expect(canWriteGlobalConfig(UserRole.MEMBER)).toBe(false);
  });
});
```

- [ ] **Step 5: 实现权限函数**

写入 `apps/api/src/modules/tasks/permissions.ts`：

```ts
import { UserRole, type UserRole as UserRoleType } from "@quintask/shared";

export function canWriteGlobalConfig(role: UserRoleType) {
  return role === UserRole.OWNER;
}

export function canWriteTask(role: UserRoleType, isCreatingSuggestion: boolean) {
  if (role === UserRole.OWNER) return true;
  if (role === UserRole.MEMBER && isCreatingSuggestion) return true;
  return false;
}

export function canWriteComment(role: UserRoleType) {
  return role === UserRole.OWNER || role === UserRole.MEMBER;
}
```

- [ ] **Step 6: 运行测试**

Run:

```bash
npm run test -w @quintask/api -- task-state.test.ts permissions.test.ts
```

Expected: 所有测试 PASS。

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/tasks apps/api/src/tests
git commit -m "feat: add task state and permission rules"
```

---

## Task 6: 后端任务、子任务、评论、标签接口

**Files:**
- Create: `apps/api/src/modules/tasks/service.ts`
- Create: `apps/api/src/modules/tasks/routes.ts`
- Create: `apps/api/src/modules/subtasks/routes.ts`
- Create: `apps/api/src/modules/comments/routes.ts`
- Create: `apps/api/src/modules/tags/routes.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: 创建任务服务**

写入 `apps/api/src/modules/tasks/service.ts`：

```ts
import { TaskStatus, UserRole } from "@prisma/client";
import { changeTaskStatusSchema, createTaskSchema, updateTaskSchema } from "@quintask/shared";
import { prisma } from "../../db";
import { errors } from "../../lib/errors";
import { canChangeTaskStatus } from "./task-state";

export async function listTasks() {
  return prisma.task.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      assignee: { select: { id: true, name: true } },
      milestone: true,
      dependencies: { include: { dependsOnTask: true } },
      tags: { include: { tag: true } }
    }
  });
}

export async function getTask(id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      reviewer: { select: { id: true, name: true } },
      milestone: true,
      dependencies: { include: { dependsOnTask: true } },
      subtasks: { orderBy: { sortOrder: "asc" } },
      comments: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
      tags: { include: { tag: true } }
    }
  });

  if (!task) throw errors.notFound("任务不存在。");
  return task;
}

export async function createTask(input: unknown, currentUser: { id: string; role: UserRole }) {
  if (currentUser.role === UserRole.TEACHER) throw errors.forbidden();

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) throw errors.validation(parsed.error.issues[0].message);

  const project = await prisma.project.findFirst();
  if (!project) throw errors.notFound("项目不存在。");

  return prisma.task.create({
    data: {
      projectId: project.id,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      creatorId: currentUser.id,
      assigneeId: currentUser.role === UserRole.OWNER ? parsed.data.assigneeId ?? null : null,
      milestoneId: currentUser.role === UserRole.OWNER ? parsed.data.milestoneId ?? null : null,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      tags: { create: parsed.data.tagIds.map((tagId) => ({ tagId })) },
      dependencies: { create: parsed.data.dependencyIds.map((dependsOnTaskId) => ({ dependsOnTaskId })) }
    }
  });
}

export async function updateTask(id: string, input: unknown, currentUser: { id: string; role: UserRole }) {
  if (currentUser.role !== UserRole.OWNER) throw errors.forbidden();

  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) throw errors.validation(parsed.error.issues[0].message);

  await getTask(id);

  return prisma.task.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      assigneeId: parsed.data.assigneeId,
      milestoneId: parsed.data.milestoneId,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined
    }
  });
}

export async function changeTaskStatus(id: string, input: unknown, currentUser: { id: string; role: UserRole }) {
  const parsed = changeTaskStatusSchema.safeParse(input);
  if (!parsed.success) throw errors.validation(parsed.error.issues[0].message);

  const task = await prisma.task.findUnique({
    where: { id },
    include: { dependencies: { include: { dependsOnTask: true } } }
  });
  if (!task) throw errors.notFound("任务不存在。");

  const hasUnfinishedDependencies = task.dependencies.some((item) => item.dependsOnTask.status !== TaskStatus.DONE);
  const result = canChangeTaskStatus({
    role: currentUser.role,
    currentStatus: task.status,
    nextStatus: parsed.data.status,
    isAssignee: task.assigneeId === currentUser.id,
    hasUnfinishedDependencies,
    isConfirmedTask: Boolean(task.assigneeId)
  });

  if (!result.ok && result.code === "TASK_DEPENDENCY_BLOCKED") throw errors.dependencyBlocked();
  if (!result.ok && result.code === "INVALID_TASK_TRANSITION") throw errors.invalidTransition();
  if (!result.ok) throw errors.forbidden();

  return prisma.task.update({
    where: { id },
    data: {
      status: parsed.data.status,
      reviewerId: parsed.data.status === TaskStatus.DONE ? currentUser.id : undefined,
      completedAt: parsed.data.status === TaskStatus.DONE ? new Date() : null
    }
  });
}
```

- [ ] **Step 2: 创建任务路由**

写入 `apps/api/src/modules/tasks/routes.ts`：

```ts
import { Hono } from "hono";
import { created, ok } from "../../lib/http";
import { authMiddleware } from "../../middleware/auth";
import { changeTaskStatus, createTask, getTask, listTasks, updateTask } from "./service";

export const taskRoutes = new Hono();

taskRoutes.use("*", authMiddleware);
taskRoutes.get("/", async (c) => ok(c, await listTasks()));
taskRoutes.post("/", async (c) => created(c, await createTask(await c.req.json(), c.get("user"))));
taskRoutes.get("/:id", async (c) => ok(c, await getTask(c.req.param("id"))));
taskRoutes.patch("/:id", async (c) => ok(c, await updateTask(c.req.param("id"), await c.req.json(), c.get("user"))));
taskRoutes.post("/:id/status", async (c) => ok(c, await changeTaskStatus(c.req.param("id"), await c.req.json(), c.get("user"))));
```

- [ ] **Step 3: 创建子任务路由**

写入 `apps/api/src/modules/subtasks/routes.ts`：

```ts
import { Hono } from "hono";
import { createSubtaskSchema, updateSubtaskSchema } from "@quintask/shared";
import { UserRole } from "@prisma/client";
import { prisma } from "../../db";
import { errors } from "../../lib/errors";
import { created, ok } from "../../lib/http";
import { authMiddleware } from "../../middleware/auth";

export const subtaskRoutes = new Hono();

subtaskRoutes.use("*", authMiddleware);

subtaskRoutes.post("/tasks/:taskId/subtasks", async (c) => {
  const user = c.get("user");
  if (user.role === UserRole.TEACHER) throw errors.forbidden();

  const parsed = createSubtaskSchema.safeParse(await c.req.json());
  if (!parsed.success) throw errors.validation(parsed.error.issues[0].message);

  const subtask = await prisma.subtask.create({
    data: { taskId: c.req.param("taskId"), ...parsed.data }
  });

  return created(c, subtask);
});

subtaskRoutes.patch("/subtasks/:id", async (c) => {
  const user = c.get("user");
  if (user.role === UserRole.TEACHER) throw errors.forbidden();

  const parsed = updateSubtaskSchema.safeParse(await c.req.json());
  if (!parsed.success) throw errors.validation(parsed.error.issues[0].message);

  return ok(c, await prisma.subtask.update({ where: { id: c.req.param("id") }, data: parsed.data }));
});
```

- [ ] **Step 4: 创建评论和标签路由**

写入 `apps/api/src/modules/comments/routes.ts`：

```ts
import { Hono } from "hono";
import { createCommentSchema } from "@quintask/shared";
import { UserRole } from "@prisma/client";
import { prisma } from "../../db";
import { errors } from "../../lib/errors";
import { created } from "../../lib/http";
import { authMiddleware } from "../../middleware/auth";

export const commentRoutes = new Hono();

commentRoutes.use("*", authMiddleware);

commentRoutes.post("/tasks/:taskId/comments", async (c) => {
  const user = c.get("user");
  if (user.role === UserRole.TEACHER) throw errors.forbidden();

  const parsed = createCommentSchema.safeParse(await c.req.json());
  if (!parsed.success) throw errors.validation(parsed.error.issues[0].message);

  return created(
    c,
    await prisma.taskComment.create({
      data: { taskId: c.req.param("taskId"), authorId: user.id, content: parsed.data.content, type: parsed.data.type }
    })
  );
});
```

写入 `apps/api/src/modules/tags/routes.ts`：

```ts
import { Hono } from "hono";
import { createTagSchema } from "@quintask/shared";
import { UserRole } from "@prisma/client";
import { prisma } from "../../db";
import { errors } from "../../lib/errors";
import { created, ok } from "../../lib/http";
import { authMiddleware } from "../../middleware/auth";

export const tagRoutes = new Hono();

tagRoutes.use("*", authMiddleware);
tagRoutes.get("/", async (c) => ok(c, await prisma.tag.findMany({ orderBy: { name: "asc" } })));

tagRoutes.post("/", async (c) => {
  const user = c.get("user");
  if (user.role !== UserRole.OWNER) throw errors.forbidden();

  const parsed = createTagSchema.safeParse(await c.req.json());
  if (!parsed.success) throw errors.validation(parsed.error.issues[0].message);

  return created(c, await prisma.tag.create({ data: parsed.data }));
});
```

- [ ] **Step 5: 注册路由**

修改 `apps/api/src/app.ts`，加入：

```ts
import { commentRoutes } from "./modules/comments/routes";
import { subtaskRoutes } from "./modules/subtasks/routes";
import { tagRoutes } from "./modules/tags/routes";
import { taskRoutes } from "./modules/tasks/routes";

app.route("/api/tasks", taskRoutes);
app.route("/api", commentRoutes);
app.route("/api", subtaskRoutes);
app.route("/api/tags", tagRoutes);
```

- [ ] **Step 6: 验证**

Run:

```bash
npm run typecheck -w @quintask/api
npm run test -w @quintask/api
```

Expected: 类型检查和已有测试通过。

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules apps/api/src/app.ts
git commit -m "feat: add task collaboration APIs"
```

---

## Task 7: 后端成员、里程碑、项目、统计接口

**Files:**
- Create: `apps/api/src/modules/users/routes.ts`
- Create: `apps/api/src/modules/milestones/routes.ts`
- Create: `apps/api/src/modules/projects/routes.ts`
- Create: `apps/api/src/modules/dashboard/routes.ts`
- Create: `apps/api/src/modules/workload/service.ts`
- Create: `apps/api/src/modules/workload/routes.ts`
- Create: `apps/api/src/tests/workload.test.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: 写工作量统计纯函数测试**

写入 `apps/api/src/tests/workload.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { TaskPriority, TaskStatus } from "@quintask/shared";
import { summarizeMemberWorkload } from "../modules/workload/service";

describe("summarizeMemberWorkload", () => {
  it("按成员汇总主任务状态和优先级", () => {
    const result = summarizeMemberWorkload([
      { assigneeId: "u1", status: TaskStatus.TODO, priority: TaskPriority.HIGH, hasUnfinishedDependencies: false },
      { assigneeId: "u1", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, hasUnfinishedDependencies: true },
      { assigneeId: "u2", status: TaskStatus.DONE, priority: TaskPriority.LOW, hasUnfinishedDependencies: false }
    ]);

    expect(result.u1).toMatchObject({
      total: 2,
      todo: 1,
      inProgress: 1,
      inReview: 0,
      done: 0,
      blocked: 1,
      high: 1,
      medium: 1,
      low: 0
    });
  });
});
```

- [ ] **Step 2: 实现工作量统计服务**

写入 `apps/api/src/modules/workload/service.ts`：

```ts
import { TaskPriority, TaskStatus, type TaskPriority as TaskPriorityType, type TaskStatus as TaskStatusType } from "@quintask/shared";
import { prisma } from "../../db";

interface WorkloadTask {
  assigneeId: string | null;
  status: TaskStatusType;
  priority: TaskPriorityType;
  hasUnfinishedDependencies: boolean;
}

export function summarizeMemberWorkload(tasks: WorkloadTask[]) {
  const summary: Record<string, { total: number; todo: number; inProgress: number; inReview: number; done: number; blocked: number; high: number; medium: number; low: number }> = {};

  for (const task of tasks) {
    if (!task.assigneeId) continue;
    summary[task.assigneeId] ??= { total: 0, todo: 0, inProgress: 0, inReview: 0, done: 0, blocked: 0, high: 0, medium: 0, low: 0 };
    const item = summary[task.assigneeId];
    item.total += 1;
    if (task.status === TaskStatus.TODO) item.todo += 1;
    if (task.status === TaskStatus.IN_PROGRESS) item.inProgress += 1;
    if (task.status === TaskStatus.IN_REVIEW) item.inReview += 1;
    if (task.status === TaskStatus.DONE) item.done += 1;
    if (task.hasUnfinishedDependencies) item.blocked += 1;
    if (task.priority === TaskPriority.HIGH) item.high += 1;
    if (task.priority === TaskPriority.MEDIUM) item.medium += 1;
    if (task.priority === TaskPriority.LOW) item.low += 1;
  }

  return summary;
}

export async function getWorkload() {
  const users = await prisma.user.findMany({ where: { role: "MEMBER", isActive: true }, orderBy: { createdAt: "asc" } });
  const tasks = await prisma.task.findMany({
    include: {
      milestone: true,
      comments: { orderBy: { createdAt: "desc" }, take: 3 },
      dependencies: { include: { dependsOnTask: true } }
    }
  });

  const summary = summarizeMemberWorkload(
    tasks.map((task) => ({
      assigneeId: task.assigneeId,
      status: task.status,
      priority: task.priority,
      hasUnfinishedDependencies: task.dependencies.some((item) => item.dependsOnTask.status !== "DONE")
    }))
  );

  return users.map((user) => ({
    user,
    summary: summary[user.id] ?? { total: 0, todo: 0, inProgress: 0, inReview: 0, done: 0, blocked: 0, high: 0, medium: 0, low: 0 },
    tasks: tasks.filter((task) => task.assigneeId === user.id)
  }));
}
```

- [ ] **Step 3: 创建成员、里程碑、项目、统计路由**

写入 `apps/api/src/modules/workload/routes.ts`：

```ts
import { Hono } from "hono";
import { ok } from "../../lib/http";
import { authMiddleware } from "../../middleware/auth";
import { getWorkload } from "./service";

export const workloadRoutes = new Hono();
workloadRoutes.use("*", authMiddleware);
workloadRoutes.get("/", async (c) => ok(c, await getWorkload()));
```

写入 `apps/api/src/modules/projects/routes.ts`：

```ts
import { Hono } from "hono";
import { prisma } from "../../db";
import { errors } from "../../lib/errors";
import { ok } from "../../lib/http";
import { authMiddleware } from "../../middleware/auth";

export const projectRoutes = new Hono();
projectRoutes.use("*", authMiddleware);
projectRoutes.get("/current", async (c) => {
  const project = await prisma.project.findFirst();
  if (!project) throw errors.notFound("项目不存在。");
  return ok(c, project);
});
```

写入 `apps/api/src/modules/dashboard/routes.ts`：

```ts
import { Hono } from "hono";
import { prisma } from "../../db";
import { ok } from "../../lib/http";
import { authMiddleware } from "../../middleware/auth";

export const dashboardRoutes = new Hono();
dashboardRoutes.use("*", authMiddleware);
dashboardRoutes.get("/", async (c) => {
  const [total, done, inReview, activeMilestone, recentComments] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({ where: { status: "DONE" } }),
    prisma.task.count({ where: { status: "IN_REVIEW" } }),
    prisma.milestone.findFirst({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } }),
    prisma.taskComment.findMany({ include: { author: true, task: true }, orderBy: { createdAt: "desc" }, take: 5 })
  ]);

  return ok(c, {
    totalTasks: total,
    doneTasks: done,
    progress: total === 0 ? 0 : Math.round((done / total) * 100),
    pendingReviewTasks: inReview,
    currentMilestone: activeMilestone,
    recentComments
  });
});
```

写入 `apps/api/src/modules/users/routes.ts`：

```ts
import { Hono } from "hono";
import { UserRole } from "@prisma/client";
import { createUserSchema, updateUserSchema } from "@quintask/shared";
import { prisma } from "../../db";
import { errors } from "../../lib/errors";
import { hashPassword } from "../../lib/password";
import { created, ok } from "../../lib/http";
import { authMiddleware } from "../../middleware/auth";

export const userRoutes = new Hono();

userRoutes.use("*", authMiddleware);

userRoutes.get("/", async (c) => {
  return ok(
    c,
    await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, username: true, role: true, isActive: true, createdAt: true }
    })
  );
});

userRoutes.post("/", async (c) => {
  const user = c.get("user");
  if (user.role !== UserRole.OWNER) throw errors.forbidden();

  const parsed = createUserSchema.safeParse(await c.req.json());
  if (!parsed.success) throw errors.validation(parsed.error.issues[0].message);

  const createdUser = await prisma.user.create({
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
      passwordHash: await hashPassword(parsed.data.password),
      role: parsed.data.role
    },
    select: { id: true, name: true, username: true, role: true, isActive: true, createdAt: true }
  });

  return created(c, createdUser);
});

userRoutes.patch("/:id", async (c) => {
  const user = c.get("user");
  if (user.role !== UserRole.OWNER) throw errors.forbidden();

  const parsed = updateUserSchema.safeParse(await c.req.json());
  if (!parsed.success) throw errors.validation(parsed.error.issues[0].message);

  const data = {
    name: parsed.data.name,
    isActive: parsed.data.isActive,
    passwordHash: parsed.data.password ? await hashPassword(parsed.data.password) : undefined
  };

  return ok(
    c,
    await prisma.user.update({
      where: { id: c.req.param("id") },
      data,
      select: { id: true, name: true, username: true, role: true, isActive: true, createdAt: true }
    })
  );
});
```

写入 `apps/api/src/modules/milestones/routes.ts`：

```ts
import { Hono } from "hono";
import { UserRole } from "@prisma/client";
import { createMilestoneSchema } from "@quintask/shared";
import { prisma } from "../../db";
import { errors } from "../../lib/errors";
import { created, ok } from "../../lib/http";
import { authMiddleware } from "../../middleware/auth";

export const milestoneRoutes = new Hono();

milestoneRoutes.use("*", authMiddleware);

milestoneRoutes.get("/", async (c) => {
  const milestones = await prisma.milestone.findMany({
    orderBy: { sortOrder: "asc" },
    include: { tasks: true }
  });

  return ok(
    c,
    milestones.map((milestone) => {
      const totalTasks = milestone.tasks.length;
      const doneTasks = milestone.tasks.filter((task) => task.status === "DONE").length;
      return {
        ...milestone,
        totalTasks,
        doneTasks,
        progress: totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100)
      };
    })
  );
});

milestoneRoutes.post("/", async (c) => {
  const user = c.get("user");
  if (user.role !== UserRole.OWNER) throw errors.forbidden();

  const parsed = createMilestoneSchema.safeParse(await c.req.json());
  if (!parsed.success) throw errors.validation(parsed.error.issues[0].message);

  const project = await prisma.project.findFirst();
  if (!project) throw errors.notFound("项目不存在。");

  return created(
    c,
    await prisma.milestone.create({
      data: {
        projectId: project.id,
        title: parsed.data.title,
        description: parsed.data.description,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        status: parsed.data.status,
        sortOrder: parsed.data.sortOrder
      }
    })
  );
});

milestoneRoutes.patch("/:id", async (c) => {
  const user = c.get("user");
  if (user.role !== UserRole.OWNER) throw errors.forbidden();

  const parsed = createMilestoneSchema.partial().safeParse(await c.req.json());
  if (!parsed.success) throw errors.validation(parsed.error.issues[0].message);

  return ok(
    c,
    await prisma.milestone.update({
      where: { id: c.req.param("id") },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
        status: parsed.data.status,
        sortOrder: parsed.data.sortOrder
      }
    })
  );
});
```

- [ ] **Step 4: 注册路由**

修改 `apps/api/src/app.ts`，加入：

```ts
import { dashboardRoutes } from "./modules/dashboard/routes";
import { milestoneRoutes } from "./modules/milestones/routes";
import { projectRoutes } from "./modules/projects/routes";
import { userRoutes } from "./modules/users/routes";
import { workloadRoutes } from "./modules/workload/routes";

app.route("/api/dashboard", dashboardRoutes);
app.route("/api/milestones", milestoneRoutes);
app.route("/api/projects", projectRoutes);
app.route("/api/users", userRoutes);
app.route("/api/workload", workloadRoutes);
```

- [ ] **Step 5: 验证**

Run:

```bash
npm run test -w @quintask/api -- workload.test.ts
npm run typecheck -w @quintask/api
```

Expected: 测试和类型检查通过。

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules apps/api/src/tests apps/api/src/app.ts
git commit -m "feat: add project management and workload APIs"
```

---

## Task 8: 前端应用骨架、登录和布局

**Files:**
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.ts`
- Create: `apps/web/src/App.vue`
- Create: `apps/web/src/router.ts`
- Create: `apps/web/src/api/client.ts`
- Create: `apps/web/src/stores/auth.ts`
- Create: `apps/web/src/components/AppLayout.vue`
- Create: `apps/web/src/views/LoginView.vue`
- Create: `apps/web/src/styles/main.css`

- [ ] **Step 1: 创建入口文件**

写入 `apps/web/index.html`：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Quintask</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

写入 `apps/web/src/main.ts`：

```ts
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import "./styles/main.css";

createApp(App).use(createPinia()).use(router).mount("#app");
```

写入 `apps/web/src/App.vue`：

```vue
<template>
  <RouterView />
</template>
```

- [ ] **Step 2: 创建 API client 和 auth store**

写入 `apps/web/src/api/client.ts`：

```ts
const API_BASE = "/api";

export class ApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("quintask_token");
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const body = await response.json();
  if (!response.ok) {
    throw new ApiError(body.error.code, body.error.message);
  }
  return body.data as T;
}
```

写入 `apps/web/src/stores/auth.ts`：

```ts
import { defineStore } from "pinia";
import { apiFetch } from "../api/client";

interface CurrentUser {
  id: string;
  name: string;
  username: string;
  role: "OWNER" | "MEMBER" | "TEACHER";
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as CurrentUser | null,
    token: localStorage.getItem("quintask_token")
  }),
  getters: {
    isOwner: (state) => state.user?.role === "OWNER",
    isTeacher: (state) => state.user?.role === "TEACHER"
  },
  actions: {
    async login(username: string, password: string) {
      const result = await apiFetch<{ token: string; user: CurrentUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      this.token = result.token;
      this.user = result.user;
      localStorage.setItem("quintask_token", result.token);
    },
    async loadMe() {
      if (!this.token) return;
      this.user = await apiFetch<CurrentUser>("/auth/me");
    },
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem("quintask_token");
    }
  }
});
```

- [ ] **Step 3: 创建路由和布局**

写入 `apps/web/src/router.ts`：

```ts
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "./stores/auth";
import LoginView from "./views/LoginView.vue";
import DashboardView from "./views/DashboardView.vue";
import BoardView from "./views/BoardView.vue";
import TaskDetailView from "./views/TaskDetailView.vue";
import MilestonesView from "./views/MilestonesView.vue";
import WorkloadView from "./views/WorkloadView.vue";
import MembersView from "./views/MembersView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: LoginView },
    { path: "/", redirect: "/dashboard" },
    { path: "/dashboard", component: DashboardView },
    { path: "/board", component: BoardView },
    { path: "/tasks/:id", component: TaskDetailView },
    { path: "/milestones", component: MilestonesView },
    { path: "/workload", component: WorkloadView },
    { path: "/members", component: MembersView }
  ]
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.user && auth.token) await auth.loadMe();
  if (to.path !== "/login" && !auth.user) return "/login";
  if (to.path === "/login" && auth.user) return "/dashboard";
});
```

写入 `apps/web/src/components/AppLayout.vue`：

```vue
<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">Quintask</div>
      <RouterLink to="/dashboard">首页</RouterLink>
      <RouterLink to="/board">任务看板</RouterLink>
      <RouterLink to="/milestones">里程碑</RouterLink>
      <RouterLink to="/workload">团队工作量</RouterLink>
      <RouterLink v-if="auth.isOwner" to="/members">成员管理</RouterLink>
    </aside>
    <main class="main-panel">
      <header class="topbar">
        <span>{{ auth.user?.name }}</span>
        <button @click="logout">退出</button>
      </header>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();

function logout() {
  auth.logout();
  router.push("/login");
}
</script>
```

- [ ] **Step 4: 创建登录页和样式**

写入 `apps/web/src/views/LoginView.vue`：

```vue
<template>
  <main class="login-page">
    <form class="login-panel" @submit.prevent="submit">
      <h1>Quintask</h1>
      <p>小组任务分配与进度查看平台</p>
      <label>
        账号
        <input v-model="username" autocomplete="username" />
      </label>
      <label>
        密码
        <input v-model="password" type="password" autocomplete="current-password" />
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit">登录</button>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();
const username = ref("");
const password = ref("");
const error = ref("");

async function submit() {
  error.value = "";
  try {
    await auth.login(username.value, password.value);
    router.push("/dashboard");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "登录失败。";
  }
}
</script>
```

写入 `apps/web/src/styles/main.css`：

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Inter, "Microsoft YaHei", system-ui, sans-serif;
  color: #172033;
  background: #f4f6f8;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  border: 0;
  border-radius: 6px;
  padding: 8px 12px;
  color: #ffffff;
  background: #2563eb;
  cursor: pointer;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid #d5dbe3;
  border-radius: 6px;
  padding: 9px 10px;
  background: #ffffff;
}

a {
  color: inherit;
  text-decoration: none;
}

.login-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
}

.login-panel {
  width: min(420px, 100%);
  border: 1px solid #e1e6ee;
  border-radius: 8px;
  padding: 28px;
  background: #ffffff;
  box-shadow: 0 16px 40px rgba(23, 32, 51, 0.08);
}

.login-panel label {
  display: grid;
  gap: 6px;
  margin-top: 16px;
}

.error {
  color: #dc2626;
}

.app-shell {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-right: 1px solid #dfe4ec;
  padding: 18px;
  background: #ffffff;
}

.brand {
  margin-bottom: 18px;
  font-size: 20px;
  font-weight: 800;
}

.sidebar a {
  border-radius: 6px;
  padding: 10px 12px;
  color: #526071;
}

.sidebar a.router-link-active {
  color: #174ea6;
  background: #eaf1ff;
}

.main-panel {
  min-width: 0;
}

.topbar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-bottom: 1px solid #dfe4ec;
  padding: 14px 22px;
  background: #ffffff;
}

.page {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.board {
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 16px;
  overflow-x: auto;
}

.board-column {
  min-height: 520px;
  border: 1px solid #e1e6ee;
  border-radius: 8px;
  padding: 12px;
  background: #ffffff;
}

.task-card,
.workload-panel,
.summary-card {
  border: 1px solid #e1e6ee;
  border-radius: 8px;
  padding: 12px;
  background: #ffffff;
}

.task-card {
  margin-top: 10px;
  cursor: pointer;
}

.task-card__title {
  font-weight: 700;
}

.task-card__meta,
.tag-row,
.workload-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  color: #64748b;
  font-size: 14px;
}

.tag {
  border: 1px solid;
  border-radius: 999px;
  padding: 2px 8px;
  background: #ffffff;
}

.blocked {
  color: #b45309;
}

.status-badge {
  display: inline-flex;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 13px;
  background: #e2e8f0;
}

.status-badge[data-status="IN_PROGRESS"] {
  color: #075985;
  background: #e0f2fe;
}

.status-badge[data-status="IN_REVIEW"] {
  color: #92400e;
  background: #fef3c7;
}

.status-badge[data-status="DONE"] {
  color: #166534;
  background: #dcfce7;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 760px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }

  .board {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: 创建空页面组件保证路由可编译**

为 `DashboardView.vue`、`BoardView.vue`、`TaskDetailView.vue`、`MilestonesView.vue`、`WorkloadView.vue`、`MembersView.vue` 写入同样结构：

```vue
<template>
  <AppLayout>
    <section class="page">
      <h1>页面建设中</h1>
    </section>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from "../components/AppLayout.vue";
</script>
```

- [ ] **Step 6: 验证前端**

Run:

```bash
npm run typecheck -w @quintask/web
npm run dev:web
```

Expected: 类型检查通过，Vite 输出 `http://127.0.0.1:5173/`。

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat: add web shell and login"
```

---

## Task 9: 前端任务看板和任务详情

**Files:**
- Create: `apps/web/src/stores/tasks.ts`
- Create: `apps/web/src/components/StatusBadge.vue`
- Create: `apps/web/src/components/TaskCard.vue`
- Modify: `apps/web/src/views/BoardView.vue`
- Modify: `apps/web/src/views/TaskDetailView.vue`

- [ ] **Step 1: 创建任务 store**

写入 `apps/web/src/stores/tasks.ts`：

```ts
import { defineStore } from "pinia";
import { apiFetch } from "../api/client";

export interface TaskListItem {
  id: string;
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  assignee: { id: string; name: string } | null;
  milestone: { id: string; title: string } | null;
  dependencies: Array<{ dependsOnTask: { id: string; title: string; status: string } }>;
  tags: Array<{ tag: { id: string; name: string; color: string } }>;
}

export const useTasksStore = defineStore("tasks", {
  state: () => ({
    tasks: [] as TaskListItem[],
    currentTask: null as unknown
  }),
  actions: {
    async loadTasks() {
      this.tasks = await apiFetch<TaskListItem[]>("/tasks");
    },
    async loadTask(id: string) {
      this.currentTask = await apiFetch(`/tasks/${id}`);
    },
    async changeStatus(id: string, status: TaskListItem["status"]) {
      await apiFetch(`/tasks/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status })
      });
      await this.loadTasks();
    }
  }
});
```

- [ ] **Step 2: 创建状态和任务卡片组件**

写入 `apps/web/src/components/StatusBadge.vue`：

```vue
<template>
  <span class="status-badge" :data-status="status">{{ label }}</span>
</template>

<script setup lang="ts">
const props = defineProps<{ status: string }>();

const labelMap: Record<string, string> = {
  TODO: "待处理",
  IN_PROGRESS: "进行中",
  IN_REVIEW: "待验收",
  DONE: "已完成"
};

const label = labelMap[props.status] ?? props.status;
</script>
```

写入 `apps/web/src/components/TaskCard.vue`：

```vue
<template>
  <article class="task-card" @click="$router.push(`/tasks/${task.id}`)">
    <div class="task-card__title">{{ task.title }}</div>
    <div class="task-card__meta">
      <span>{{ task.assignee?.name ?? "未分配" }}</span>
      <span>{{ priorityText }}</span>
    </div>
    <div class="tag-row">
      <span v-for="item in task.tags" :key="item.tag.id" class="tag" :style="{ borderColor: item.tag.color }">{{ item.tag.name }}</span>
    </div>
    <p v-if="isBlocked" class="blocked">存在未完成依赖</p>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TaskListItem } from "../stores/tasks";

const props = defineProps<{ task: TaskListItem }>();

const priorityText = computed(() => ({ HIGH: "高", MEDIUM: "中", LOW: "低" })[props.task.priority]);
const isBlocked = computed(() => props.task.dependencies.some((item) => item.dependsOnTask.status !== "DONE"));
</script>
```

- [ ] **Step 3: 实现看板页**

修改 `apps/web/src/views/BoardView.vue`：

```vue
<template>
  <AppLayout>
    <section class="page">
      <div class="page-header">
        <h1>任务看板</h1>
      </div>
      <div class="board">
        <section v-for="column in columns" :key="column.status" class="board-column">
          <h2>{{ column.label }}</h2>
          <TaskCard v-for="task in tasksByStatus(column.status)" :key="task.id" :task="task" />
        </section>
      </div>
    </section>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import AppLayout from "../components/AppLayout.vue";
import TaskCard from "../components/TaskCard.vue";
import { useTasksStore, type TaskListItem } from "../stores/tasks";

const store = useTasksStore();

const columns = [
  { status: "TODO", label: "待处理" },
  { status: "IN_PROGRESS", label: "进行中" },
  { status: "IN_REVIEW", label: "待验收" },
  { status: "DONE", label: "已完成" }
] as const;

function tasksByStatus(status: TaskListItem["status"]) {
  return store.tasks.filter((task) => task.status === status);
}

onMounted(() => store.loadTasks());
</script>
```

- [ ] **Step 4: 实现任务详情只读主体和状态按钮**

修改 `apps/web/src/views/TaskDetailView.vue`，展示标题、描述、执行人、里程碑、依赖、子任务、评论。根据角色控制按钮：

```vue
<template>
  <AppLayout>
    <section class="page" v-if="task">
      <RouterLink to="/board">返回看板</RouterLink>
      <h1>{{ task.title }}</h1>
      <StatusBadge :status="task.status" />
      <p>{{ task.description }}</p>
      <section class="detail-grid">
        <div>执行人：{{ task.assignee?.name ?? "未分配" }}</div>
        <div>里程碑：{{ task.milestone?.title ?? "未归入里程碑" }}</div>
      </section>
      <section>
        <h2>依赖任务</h2>
        <p v-if="task.dependencies.length === 0">没有依赖任务</p>
        <ul>
          <li v-for="item in task.dependencies" :key="item.dependsOnTask.id">
            {{ item.dependsOnTask.title }} - {{ item.dependsOnTask.status }}
          </li>
        </ul>
      </section>
      <section>
        <h2>子任务</h2>
        <ul>
          <li v-for="subtask in task.subtasks" :key="subtask.id">
            <input type="checkbox" :checked="subtask.isDone" :disabled="auth.isTeacher" />
            {{ subtask.title }}
          </li>
        </ul>
      </section>
      <section class="actions" v-if="!auth.isTeacher">
        <button v-if="task.status === 'TODO'" @click="changeStatus('IN_PROGRESS')">开始处理</button>
        <button v-if="task.status === 'IN_PROGRESS'" @click="changeStatus('IN_REVIEW')">提交验收</button>
        <button v-if="auth.isOwner && task.status === 'IN_REVIEW'" @click="changeStatus('DONE')">验收完成</button>
      </section>
    </section>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import AppLayout from "../components/AppLayout.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { useAuthStore } from "../stores/auth";
import { useTasksStore } from "../stores/tasks";

const route = useRoute();
const auth = useAuthStore();
const store = useTasksStore();
const task = computed<any>(() => store.currentTask);

async function changeStatus(status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE") {
  await store.changeStatus(String(route.params.id), status);
  await store.loadTask(String(route.params.id));
}

onMounted(() => store.loadTask(String(route.params.id)));
</script>
```

- [ ] **Step 5: 验证**

Run:

```bash
npm run typecheck -w @quintask/web
```

Expected: 类型检查通过。

- [ ] **Step 6: Commit**

```bash
git add apps/web/src
git commit -m "feat: add task board and detail views"
```

---

## Task 10: 前端 Dashboard、里程碑、工作量、成员管理

**Files:**
- Create: `apps/web/src/components/WorkloadMemberPanel.vue`
- Modify: `apps/web/src/views/DashboardView.vue`
- Modify: `apps/web/src/views/MilestonesView.vue`
- Modify: `apps/web/src/views/WorkloadView.vue`
- Modify: `apps/web/src/views/MembersView.vue`

- [ ] **Step 1: 实现 Dashboard**

修改 `apps/web/src/views/DashboardView.vue`：

```vue
<template>
  <AppLayout>
    <section class="page">
      <h1>项目概览</h1>
      <div v-if="dashboard" class="detail-grid">
        <article class="summary-card">
          <strong>{{ dashboard.progress }}%</strong>
          <p>整体完成率</p>
        </article>
        <article class="summary-card">
          <strong>{{ dashboard.doneTasks }} / {{ dashboard.totalTasks }}</strong>
          <p>已完成任务</p>
        </article>
        <article class="summary-card">
          <strong>{{ dashboard.pendingReviewTasks }}</strong>
          <p>待验收任务</p>
        </article>
        <article class="summary-card">
          <strong>{{ dashboard.currentMilestone?.title ?? "未设置" }}</strong>
          <p>当前里程碑</p>
        </article>
      </div>
      <section>
        <h2>最近进度</h2>
        <ul>
          <li v-for="comment in dashboard?.recentComments ?? []" :key="comment.id">
            {{ comment.author.name }}：{{ comment.content }}
          </li>
        </ul>
      </section>
    </section>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { apiFetch } from "../api/client";
import AppLayout from "../components/AppLayout.vue";

const dashboard = ref<any>(null);

onMounted(async () => {
  dashboard.value = await apiFetch("/dashboard");
});
</script>
```

- [ ] **Step 2: 实现里程碑页**

修改 `apps/web/src/views/MilestonesView.vue`：

```vue
<template>
  <AppLayout>
    <section class="page">
      <div class="page-header">
        <h1>里程碑</h1>
        <button v-if="auth.isOwner">新增里程碑</button>
      </div>
      <article v-for="milestone in milestones" :key="milestone.id" class="summary-card">
        <h2>{{ milestone.title }}</h2>
        <p>{{ milestone.description }}</p>
        <p>状态：{{ statusText[milestone.status] }}</p>
        <p>任务：{{ milestone.doneTasks }} / {{ milestone.totalTasks }}，完成率 {{ milestone.progress }}%</p>
      </article>
    </section>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { apiFetch } from "../api/client";
import AppLayout from "../components/AppLayout.vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const milestones = ref<any[]>([]);
const statusText: Record<string, string> = { PLANNED: "计划中", ACTIVE: "进行中", DONE: "已完成" };

onMounted(async () => {
  milestones.value = await apiFetch("/milestones");
});
</script>
```

- [ ] **Step 3: 实现工作量组件**

写入 `apps/web/src/components/WorkloadMemberPanel.vue`：

```vue
<template>
  <article class="workload-panel">
    <header>
      <h2>{{ item.user.name }}</h2>
      <strong>{{ item.summary.total }} 个主任务</strong>
    </header>
    <div class="workload-stats">
      <span>待处理 {{ item.summary.todo }}</span>
      <span>进行中 {{ item.summary.inProgress }}</span>
      <span>待验收 {{ item.summary.inReview }}</span>
      <span>已完成 {{ item.summary.done }}</span>
      <span>阻塞 {{ item.summary.blocked }}</span>
    </div>
    <ul>
      <li v-for="task in item.tasks" :key="task.id">
        {{ task.title }} - {{ task.status }} - {{ task.priority }}
      </li>
    </ul>
  </article>
</template>

<script setup lang="ts">
defineProps<{ item: any }>();
</script>
```

- [ ] **Step 4: 实现工作量页面**

`WorkloadView.vue` 调用 `/api/workload`：

```vue
<template>
  <AppLayout>
    <section class="page">
      <h1>团队工作量</h1>
      <WorkloadMemberPanel v-for="item in workload" :key="item.user.id" :item="item" />
    </section>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { apiFetch } from "../api/client";
import AppLayout from "../components/AppLayout.vue";
import WorkloadMemberPanel from "../components/WorkloadMemberPanel.vue";

const workload = ref<any[]>([]);

onMounted(async () => {
  workload.value = await apiFetch("/workload");
});
</script>
```

- [ ] **Step 5: 实现成员管理页面**

修改 `apps/web/src/views/MembersView.vue`：

```vue
<template>
  <AppLayout>
    <section class="page">
      <p v-if="!auth.isOwner">只有负责人可以管理成员。</p>
      <template v-else>
        <div class="page-header">
          <h1>成员管理</h1>
          <button @click="createMember">新增成员</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>账号</th>
              <th>角色</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.username }}</td>
              <td>{{ roleText[user.role] }}</td>
              <td>{{ user.isActive ? "启用" : "禁用" }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </section>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { apiFetch } from "../api/client";
import AppLayout from "../components/AppLayout.vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const users = ref<any[]>([]);
const roleText: Record<string, string> = { OWNER: "负责人", MEMBER: "成员", TEACHER: "老师游客" };

async function loadUsers() {
  users.value = await apiFetch("/users");
}

async function createMember() {
  const suffix = Date.now().toString().slice(-4);
  await apiFetch("/users", {
    method: "POST",
    body: JSON.stringify({
      name: `新成员${suffix}`,
      username: `member${suffix}`,
      password: "member123",
      role: "MEMBER"
    })
  });
  await loadUsers();
}

onMounted(loadUsers);
</script>
```

- [ ] **Step 6: 验证**

Run:

```bash
npm run typecheck -w @quintask/web
npm run build -w @quintask/web
```

Expected: 类型检查和构建通过。

- [ ] **Step 7: Commit**

```bash
git add apps/web/src
git commit -m "feat: add dashboard workload and management views"
```

---

## Task 11: 端到端手工验收和修正

**Files:**
- Modify: files changed by defects found during verification

- [ ] **Step 1: 启动后端和前端**

终端 1：

```bash
npm run dev:api
```

终端 2：

```bash
npm run dev:web
```

Expected:

- API: `http://127.0.0.1:3000`
- Web: `http://127.0.0.1:5173`

- [ ] **Step 2: 验收负责人流程**

使用账号：

```text
账号：owner
密码：owner123
```

验收内容：

- 能登录。
- 能看到 Dashboard。
- 能进入任务看板。
- 能打开任务详情。
- 能将待验收任务改成已完成。
- 能进入成员管理页面。

- [ ] **Step 3: 验收成员流程**

使用账号：

```text
账号：member1
密码：member123
```

验收内容：

- 能登录。
- 能看到看板和工作量。
- 不能看到成员管理入口。
- 能将自己的任务从待处理改为进行中。
- 能将自己的任务提交待验收。
- 不能直接改成已完成。

- [ ] **Step 4: 验收老师流程**

使用账号：

```text
账号：teacher
密码：teacher123
```

验收内容：

- 能登录。
- 能查看 Dashboard、看板、任务详情、里程碑、团队工作量。
- 看不到创建、编辑、验收、评论、成员管理按钮。
- 直接调用写接口时后端返回 `FORBIDDEN`。

- [ ] **Step 5: 验收依赖规则**

创建任务 A 和任务 B，让 B 依赖 A。A 未完成时，把 B 提交到待验收。

Expected:

```json
{
  "error": {
    "code": "TASK_DEPENDENCY_BLOCKED",
    "message": "该任务存在未完成的依赖任务，暂不能提交验收。"
  }
}
```

- [ ] **Step 6: 全量验证**

Run:

```bash
npm run test
npm run build
```

Expected: 所有 workspace 测试和构建通过。

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "fix: complete v1 verification"
```

---

## 自查结果

### 规格覆盖

- 内部 5 人小组、负责人、成员、老师游客：Task 3、4、7、8、10、11 覆盖。
- 混合看板任务流转：Task 5、6、9、11 覆盖。
- 里程碑：Task 3、7、10 覆盖。
- 主任务、子任务、依赖、评论、标签：Task 2、3、5、6、9 覆盖。
- 团队工作量展示：Task 7、10、11 覆盖。
- 老师只读：Task 4、5、6、7、8、10、11 覆盖。
- 无附件、无工时、无复杂嵌套：数据模型和页面任务均未引入这些功能。

### 类型一致性

- 用户角色统一使用 `OWNER | MEMBER | TEACHER`。
- 任务状态统一使用 `TODO | IN_PROGRESS | IN_REVIEW | DONE`。
- 优先级统一使用 `LOW | MEDIUM | HIGH`。
- 共享枚举、Prisma enum、前端类型命名一致。

### 验证命令

最终完成前必须执行：

```bash
npm run typecheck -ws
npm run test
npm run build
```
