import { PrismaClient, TaskPriority, TaskStatus, UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();

async function main() {
  const owner = await prisma.user.upsert({
    where: { username: "owner" },
    update: {
      name: "总负责人",
      role: UserRole.OWNER,
      passwordHash: await hashPassword("owner123"),
    },
    create: {
      username: "owner",
      passwordHash: await hashPassword("owner123"),
      role: UserRole.OWNER,
      name: "总负责人",
    },
  });

  await prisma.user.upsert({
    where: { username: "teacher" },
    update: {
      name: "老师游客",
      role: UserRole.TEACHER,
      passwordHash: await hashPassword("teacher123"),
    },
    create: {
      username: "teacher",
      passwordHash: await hashPassword("teacher123"),
      role: UserRole.TEACHER,
      name: "老师游客",
    },
  });

  const members = await Promise.all(
    [1, 2, 3, 4].map(async (index) =>
      prisma.user.upsert({
        where: { username: `member${index}` },
        update: {
          name: `组员${index}`,
          role: UserRole.MEMBER,
          passwordHash: await hashPassword("member123"),
        },
        create: {
          username: `member${index}`,
          passwordHash: await hashPassword("member123"),
          role: UserRole.MEMBER,
          name: `组员${index}`,
        },
      }),
    ),
  );

  const project = await prisma.project.upsert({
    where: { id: "default-project" },
    update: {
      name: "Quintask 小组项目",
      description: "内部任务分配和进度展示平台",
    },
    create: {
      id: "default-project",
      name: "Quintask 小组项目",
      description: "内部任务分配和进度展示平台",
    },
  });

  const milestone = await prisma.milestone.upsert({
    where: { id: "milestone-foundation" },
    update: {
      projectId: project.id,
      title: "第一阶段：基础功能",
      description: "完成登录、任务看板、成员工作量展示",
      sortOrder: 1,
    },
    create: {
      id: "milestone-foundation",
      projectId: project.id,
      title: "第一阶段：基础功能",
      description: "完成登录、任务看板、成员工作量展示",
      sortOrder: 1,
    },
  });

  await prisma.tag.createMany({
    data: [
      { name: "前端", color: "#2563eb" },
      { name: "后端", color: "#16a34a" },
      { name: "文档", color: "#9333ea" },
    ],
    skipDuplicates: true,
  });

  await prisma.task.upsert({
    where: { id: "task-board-page" },
    update: {
      projectId: project.id,
      milestoneId: milestone.id,
      title: "完成任务看板页面",
      description: "实现四列看板，并能打开任务详情",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      creatorId: owner.id,
      assigneeId: members[0].id,
    },
    create: {
      id: "task-board-page",
      projectId: project.id,
      milestoneId: milestone.id,
      title: "完成任务看板页面",
      description: "实现四列看板，并能打开任务详情",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      creatorId: owner.id,
      assigneeId: members[0].id,
    },
  });

  console.log("Seed users:");
  console.log("owner / owner123");
  console.log("teacher / teacher123");
  console.log("member1..member4 / member123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
