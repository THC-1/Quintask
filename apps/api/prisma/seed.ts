import { PrismaClient, TaskPriority, TaskStatus, UserRole, MilestoneStatus } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();

const projectStartDate = new Date("2026-05-04T00:00:00+08:00");

const teamMembers = [
  { name: "董浩楠", username: "donghaonan", role: "产品经理", password: "dong123" },
  { name: "欧阳圣宇", username: "ouyangshengyu", role: "后端开发", password: "ouyang123" },
  { name: "陈泽鑫", username: "chenzexin", role: "后端开发", password: "chen123" },
  { name: "刘岩林", username: "liuyanlin", role: "前端开发", password: "liu123" },
  { name: "郑怡杰", username: "zhengyijie", role: "前端开发", password: "zheng123" },
] as const;

const schedule = [
  {
    day: 1,
    weekday: "周一",
    title: "需求确认与环境搭建",
    milestoneId: "milestone-phase-1",
    tasks: {
      董浩楠: "组织需求评审会，确认第一阶段功能清单，输出需求确认文档",
      欧阳圣宇: "搭建后端 Spring Boot 项目骨架，配置数据库连接、MyBatis、统一返回格式",
      陈泽鑫: "设计数据库表结构（用户表、食堂表、窗口表、菜品表），编写 SQL 初始化脚本",
      刘岩林: "搭建微信小程序项目，配置请求封装、路由、基础组件库",
      郑怡杰: "搭建 Web 管理后台项目（Vue3 + Element Plus），配置路由和布局框架",
    },
  },
  {
    day: 2,
    weekday: "周二",
    title: "用户登录模块",
    milestoneId: "milestone-phase-1",
    tasks: {
      董浩楠: "整理登录流程原型图，确认微信授权登录交互细节",
      欧阳圣宇: "实现学生微信登录接口（code 换 token）、JWT 鉴权、用户信息存储",
      陈泽鑫: "实现卖家登录接口、管理员登录接口、角色权限拦截器",
      刘岩林: "对接学生微信登录，实现登录页、授权弹窗、获取用户信息",
      郑怡杰: "实现管理员登录页面、Token 存储、请求拦截器、权限守卫",
    },
  },
  {
    day: 3,
    weekday: "周三",
    title: "食堂与菜品基础数据",
    milestoneId: "milestone-phase-1",
    tasks: {
      董浩楠: "录入测试数据（食堂、窗口、菜品），准备演示素材",
      欧阳圣宇: "实现食堂列表接口、窗口列表接口、菜品列表接口、菜品详情接口",
      陈泽鑫: "实现菜品条件筛选接口（按食堂/价格/口味/评分）、菜品搜索接口",
      刘岩林: "开发学生端首页（食堂入口、热门菜品、搜索框）",
      郑怡杰: "开发后台食堂管理页面（增删改查）、窗口管理页面",
    },
  },
  {
    day: 4,
    weekday: "周四",
    title: "菜品浏览与详情",
    milestoneId: "milestone-phase-1",
    tasks: {
      董浩楠: "评审学生端页面原型，确认菜品详情页展示字段",
      欧阳圣宇: "实现菜品详情接口（含评分、评论数、收藏数聚合）",
      陈泽鑫: "实现菜品图片上传接口、文件存储服务",
      刘岩林: "开发菜品列表页（筛选条件、下拉加载）、菜品详情页（图片、价格、评分、标签）",
      郑怡杰: "开发后台菜品管理页面（列表、审核、上下架、状态管理）",
    },
  },
  {
    day: 5,
    weekday: "周五",
    title: "评价与收藏功能",
    milestoneId: "milestone-phase-1",
    tasks: {
      董浩楠: "设计评价表单交互、确认评分维度（综合/口味/分量/性价比）",
      欧阳圣宇: "实现评价提交接口、评价列表接口、评分自动计算",
      陈泽鑫: "实现收藏接口（添加/取消/查询）、想吃清单接口",
      刘岩林: "开发评价组件（星级评分、文字输入、图片上传）、收藏按钮交互",
      郑怡杰: "开发后台评论管理页面（列表、删除、隐藏、举报处理）",
    },
  },
  {
    day: 6,
    weekday: "周一",
    title: "抽奖核心功能",
    milestoneId: "milestone-phase-1",
    tasks: {
      董浩楠: "设计抽奖结果展示页面原型，确认抽奖动效需求",
      欧阳圣宇: "实现抽奖接口（全平台随机、按条件筛选随机）、抽奖历史记录",
      陈泽鑫: "实现排行榜接口（好评榜、热门榜、高性价比榜、收藏榜）",
      刘岩林: "开发抽奖页面（转盘/翻牌动效、结果展示、再抽一次、加入收藏）",
      郑怡杰: "开发后台数据统计首页（用户总数、菜品总数、评论总数、今日抽奖次数）",
    },
  },
  {
    day: 7,
    weekday: "周二",
    title: "条件抽奖与排行榜",
    milestoneId: "milestone-phase-1",
    tasks: {
      董浩楠: "评审排行榜页面原型，整理各榜单排序规则",
      欧阳圣宇: "实现条件抽奖接口（按食堂/价格/口味/评分/收藏范围抽取）",
      陈泽鑫: "优化排行榜查询性能（缓存热门数据）、实现榜单分页",
      刘岩林: "开发排行榜页面（好评榜、热门榜、收藏榜 Tab 切换）、条件抽奖筛选面板",
      郑怡杰: "开发后台用户管理页面（学生列表、卖家列表、禁用/恢复）",
    },
  },
  {
    day: 8,
    weekday: "周三",
    title: "卖家端菜品管理",
    milestoneId: "milestone-phase-1",
    tasks: {
      董浩楠: "设计卖家端页面原型（首页、菜品管理、推荐管理）",
      欧阳圣宇: "实现卖家菜品 CRUD 接口（新增/编辑/上下架/售罄状态）",
      陈泽鑫: "实现卖家今日推荐接口（发布推荐、推荐列表、置顶）",
      刘岩林: "开发卖家端首页（今日数据概览、快捷入口）、菜品管理页",
      郑怡杰: "开发后台卖家审核页面（入驻申请列表、审核通过/驳回）",
    },
  },
  {
    day: 9,
    weekday: "周四",
    title: "卖家推荐与留言",
    milestoneId: "milestone-phase-1",
    tasks: {
      董浩楠: "确认卖家推荐展示样式，整理留言反馈交互流程",
      欧阳圣宇: "实现卖家留言查看接口（按菜品筛选、按评分筛选）、回复接口",
      陈泽鑫: "实现反馈状态接口（待查看/已查看/已采纳/已改进）",
      刘岩林: "开发卖家推荐管理页面（发布推荐、查看记录）、留言反馈页",
      郑怡杰: "完善后台数据统计（热门菜品排行、热门商家排行、评分分布）",
    },
  },
  {
    day: 10,
    weekday: "周五",
    title: "第一阶段联调与测试",
    milestoneId: "milestone-phase-1",
    tasks: {
      董浩楠: "组织第一阶段功能走查，记录 Bug 清单，确认优先级",
      欧阳圣宇: "修复后端接口 Bug，补充接口参数校验和异常处理",
      陈泽鑫: "编写后端单元测试，修复接口联调问题",
      刘岩林: "修复小程序页面 Bug，优化加载体验，处理边界情况",
      郑怡杰: "修复后台页面 Bug，统一 UI 样式，完善表格分页",
    },
  },
  {
    day: 11,
    weekday: "周一",
    title: "学生个人中心",
    milestoneId: "milestone-phase-2",
    tasks: {
      董浩楠: "设计“我的”页面原型（收藏、想吃清单、评价记录、抽奖历史）",
      欧阳圣宇: "实现个人中心相关接口（我的收藏、我的评价、抽奖历史、偏好设置）",
      陈泽鑫: "实现学生偏好接口（常去食堂、口味偏好、预算范围、忌口信息）",
      刘岩林: "开发“我的”页面（收藏列表、想吃清单、评价记录、抽奖历史）",
      郑怡杰: "开发后台敏感词管理、评论举报处理页面",
    },
  },
  {
    day: 12,
    weekday: "周二",
    title: "卖家数据看板",
    milestoneId: "milestone-phase-2",
    tasks: {
      董浩楠: "确认卖家看板数据指标，设计数据卡片布局",
      欧阳圣宇: "实现卖家数据统计接口（浏览量、收藏数、评分、评论数）",
      陈泽鑫: "实现卖家菜品数据分析接口（最受欢迎、反馈较多）",
      刘岩林: "开发卖家数据看板页面（数据卡片、图表展示）",
      郑怡杰: "优化后台统计图表（ECharts 集成），增加趋势图和分布图",
    },
  },
  {
    day: 13,
    weekday: "周三",
    title: "改进记录与互动",
    milestoneId: "milestone-phase-2",
    tasks: {
      董浩楠: "设计改进记录展示方式，确认学生端反馈展示交互",
      欧阳圣宇: "实现改进记录接口（卖家发布改进、学生端查看）",
      陈泽鑫: "实现评论点赞接口、商家回复展示优化",
      刘岩林: "开发改进记录展示组件（学生端）、优化评论区（点赞、商家回复标识）",
      郑怡杰: "完善后台卖家管理（查看菜品、查看推荐记录、查看反馈处理）",
    },
  },
  {
    day: 14,
    weekday: "周四",
    title: "体验优化与补全",
    milestoneId: "milestone-phase-2",
    tasks: {
      董浩楠: "收集各端体验问题，整理优化清单并排优先级",
      欧阳圣宇: "优化接口性能（SQL 查询优化、添加必要索引）",
      陈泽鑫: "实现接口限流、完善错误码体系、统一异常处理",
      刘岩林: "优化小程序体验（骨架屏、下拉刷新、空状态、错误提示）",
      郑怡杰: "优化后台体验（批量操作、导出功能、搜索优化）",
    },
  },
  {
    day: 15,
    weekday: "周五",
    title: "第二阶段联调与测试",
    milestoneId: "milestone-phase-2",
    tasks: {
      董浩楠: "组织第二阶段功能走查，更新 Bug 清单",
      欧阳圣宇: "修复 Bug，补充单元测试，准备接口文档",
      陈泽鑫: "修复 Bug，编写集成测试，检查数据一致性",
      刘岩林: "修复小程序 Bug，适配不同机型，优化动效流畅度",
      郑怡杰: "修复后台 Bug，完善权限控制，优化表格性能",
    },
  },
  {
    day: 16,
    weekday: "周一",
    title: "入驻审核与菜品审核",
    milestoneId: "milestone-phase-3",
    tasks: {
      董浩楠: "整理第三阶段功能需求，确认哪些功能可做、哪些需简化",
      欧阳圣宇: "实现卖家入驻审核流程接口、菜品审核接口",
      陈泽鑫: "实现图片审核（基础敏感内容检测）、自动过审逻辑",
      刘岩林: "对接卖家入驻审核流程，完善卖家端身份认证页面",
      郑怡杰: "完善后台审核工作流（批量审核、审核记录）",
    },
  },
  {
    day: 17,
    weekday: "周二",
    title: "举报与内容安全",
    milestoneId: "milestone-phase-3",
    tasks: {
      董浩楠: "确认举报处理流程，设计管理员操作规范文档",
      欧阳圣宇: "实现举报接口（提交举报、举报列表、处理举报）",
      陈泽鑫: "实现敏感词过滤服务、评论内容预检",
      刘岩林: "开发举报入口（学生端评论区长按举报）",
      郑怡杰: "开发后台举报处理页面（举报列表、处理操作、处理记录）",
    },
  },
  {
    day: 18,
    weekday: "周三",
    title: "个性化推荐探索",
    milestoneId: "milestone-phase-3",
    tasks: {
      董浩楠: "调研 LLM 推荐方案，整理推荐逻辑文档",
      欧阳圣宇: "实现基于用户偏好的推荐接口（口味匹配、预算匹配）",
      陈泽鑫: "集成 LLM 智能推荐（调用大模型 API，根据偏好生成推荐理由）",
      刘岩林: "开发推荐结果展示页面（推荐理由、匹配度标签）",
      郑怡杰: "完善后台数据统计报表（导出 PDF/Excel）",
    },
  },
  {
    day: 19,
    weekday: "周四",
    title: "全链路测试",
    milestoneId: "milestone-phase-3",
    tasks: {
      董浩楠: "编写测试用例文档，组织全链路功能测试",
      欧阳圣宇: "后端全量接口回归测试，修复遗留问题",
      陈泽鑫: "压力测试（并发抽奖、排行榜查询），优化性能瓶颈",
      刘岩林: "小程序全量页面测试，修复兼容性问题",
      郑怡杰: "后台全量页面测试，修复权限和数据展示问题",
    },
  },
  {
    day: 20,
    weekday: "周五",
    title: "演示准备",
    milestoneId: "milestone-phase-3",
    tasks: {
      董浩楠: "撰写答辩 PPT（项目背景、核心功能、技术亮点、演示流程）",
      欧阳圣宇: "准备后端技术答辩内容（架构设计、数据库设计、接口设计）",
      陈泽鑫: "准备部署演示环境，确保线上可访问，准备技术难点说明",
      刘岩林: "准备小程序演示流程（学生端核心路径录屏/截图）",
      郑怡杰: "准备后台演示流程（管理员核心路径录屏/截图）",
    },
  },
] as const;

const milestones = [
  {
    id: "milestone-phase-1",
    title: "第一阶段：核心功能",
    description: "完成登录、菜品浏览、评价收藏、抽奖、排行榜、卖家端与后台核心功能。",
    status: MilestoneStatus.ACTIVE,
    sortOrder: 1,
    startDay: 1,
    dueDay: 10,
  },
  {
    id: "milestone-phase-2",
    title: "第二阶段：完善功能",
    description: "补全个人中心、卖家数据看板、改进记录、互动能力与体验优化。",
    status: MilestoneStatus.PLANNED,
    sortOrder: 2,
    startDay: 11,
    dueDay: 15,
  },
  {
    id: "milestone-phase-3",
    title: "第三阶段：加分功能与收尾",
    description: "完成审核、举报、个性化推荐探索、全链路测试与答辩演示准备。",
    status: MilestoneStatus.PLANNED,
    sortOrder: 3,
    startDay: 16,
    dueDay: 20,
  },
];

const tagDefinitions = [
  { name: "产品", color: "#d4553f" },
  { name: "后端", color: "#277a57" },
  { name: "前端", color: "#2563eb" },
  { name: "小程序", color: "#7c3aed" },
  { name: "后台", color: "#0f766e" },
  { name: "测试", color: "#b45309" },
  { name: "已排期", color: "#64748b" },
];

function dueDateForDay(day: number) {
  const date = new Date(projectStartDate);
  const weekOffset = day <= 5 ? 0 : day <= 10 ? 7 : day <= 15 ? 14 : 21;
  const dayInWeek = ((day - 1) % 5) + weekOffset;
  date.setDate(projectStartDate.getDate() + dayInWeek);
  return date;
}

function taskPriority(day: number) {
  if ([10, 15, 19, 20].includes(day)) {
    return TaskPriority.HIGH;
  }

  if (day <= 7) {
    return TaskPriority.MEDIUM;
  }

  return TaskPriority.MEDIUM;
}

function tagNamesFor(memberName: string, content: string) {
  const tags = new Set<string>(["已排期"]);

  if (memberName === "董浩楠") {
    tags.add("产品");
  }

  if (memberName === "欧阳圣宇" || memberName === "陈泽鑫") {
    tags.add("后端");
  }

  if (memberName === "刘岩林" || memberName === "郑怡杰") {
    tags.add("前端");
  }

  if (content.includes("小程序") || content.includes("学生端") || content.includes("卖家端")) {
    tags.add("小程序");
  }

  if (content.includes("后台") || content.includes("管理员")) {
    tags.add("后台");
  }

  if (content.includes("测试") || content.includes("Bug") || content.includes("走查")) {
    tags.add("测试");
  }

  return Array.from(tags);
}

function taskId(day: number, username: string) {
  return `mealbox-day-${day}-${username}`;
}

async function main() {
  await prisma.project.deleteMany({
    where: { id: "default-project" },
  });
  await prisma.user.deleteMany({
    where: { username: { in: ["member1", "member2", "member3", "member4"] } },
  });

  const owner = await prisma.user.upsert({
    where: { username: "owner" },
    update: {
      name: "总负责人",
      role: UserRole.OWNER,
      passwordHash: await hashPassword("owner123"),
      isActive: true,
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
      isActive: true,
    },
    create: {
      username: "teacher",
      passwordHash: await hashPassword("teacher123"),
      role: UserRole.TEACHER,
      name: "老师游客",
    },
  });

  const usersByName = new Map<string, { id: string; username: string; name: string }>();

  for (const member of teamMembers) {
    const user = await prisma.user.upsert({
      where: { username: member.username },
      update: {
        name: member.name,
        role: UserRole.MEMBER,
        passwordHash: await hashPassword(member.password),
        isActive: true,
      },
      create: {
        username: member.username,
        passwordHash: await hashPassword(member.password),
        role: UserRole.MEMBER,
        name: member.name,
      },
    });

    usersByName.set(member.name, user);
  }

  const project = await prisma.project.upsert({
    where: { id: "mealbox-project" },
    update: {
      name: "饭点盲盒",
      description: "面向学生与食堂商家的点餐推荐和管理平台，按任务分配表推进四周交付。",
    },
    create: {
      id: "mealbox-project",
      name: "饭点盲盒",
      description: "面向学生与食堂商家的点餐推荐和管理平台，按任务分配表推进四周交付。",
    },
  });

  for (const milestone of milestones) {
    await prisma.milestone.upsert({
      where: { id: milestone.id },
      update: {
        projectId: project.id,
        title: milestone.title,
        description: milestone.description,
        startDate: dueDateForDay(milestone.startDay),
        dueDate: dueDateForDay(milestone.dueDay),
        status: milestone.status,
        sortOrder: milestone.sortOrder,
      },
      create: {
        id: milestone.id,
        projectId: project.id,
        title: milestone.title,
        description: milestone.description,
        startDate: dueDateForDay(milestone.startDay),
        dueDate: dueDateForDay(milestone.dueDay),
        status: milestone.status,
        sortOrder: milestone.sortOrder,
      },
    });
  }

  for (const tag of tagDefinitions) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: { color: tag.color },
      create: tag,
    });
  }

  const tags = await prisma.tag.findMany();
  const tagsByName = new Map(tags.map((tag) => [tag.name, tag]));

  for (const dayPlan of schedule) {
    for (const [memberName, content] of Object.entries(dayPlan.tasks)) {
      const assignee = usersByName.get(memberName);

      if (!assignee) {
        throw new Error(`Missing user for ${memberName}`);
      }

      const status = dayPlan.day <= 7 ? TaskStatus.DONE : TaskStatus.TODO;
      const id = taskId(dayPlan.day, assignee.username);
      const dueDate = dueDateForDay(dayPlan.day);
      const selectedTags = tagNamesFor(memberName, content)
        .map((name) => tagsByName.get(name))
        .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag));

      await prisma.task.upsert({
        where: { id },
        update: {
          projectId: project.id,
          milestoneId: dayPlan.milestoneId,
          title: `Day ${dayPlan.day} ${dayPlan.title} - ${memberName}`,
          description: `${dayPlan.weekday}任务：${content}`,
          status,
          priority: taskPriority(dayPlan.day),
          creatorId: owner.id,
          assigneeId: assignee.id,
          dueDate,
          completedAt: status === TaskStatus.DONE ? dueDate : null,
          reviewerId: status === TaskStatus.DONE ? owner.id : null,
          tags: {
            deleteMany: {},
            create: selectedTags.map((tag) => ({ tagId: tag.id })),
          },
        },
        create: {
          id,
          projectId: project.id,
          milestoneId: dayPlan.milestoneId,
          title: `Day ${dayPlan.day} ${dayPlan.title} - ${memberName}`,
          description: `${dayPlan.weekday}任务：${content}`,
          status,
          priority: taskPriority(dayPlan.day),
          creatorId: owner.id,
          assigneeId: assignee.id,
          dueDate,
          completedAt: status === TaskStatus.DONE ? dueDate : null,
          reviewerId: status === TaskStatus.DONE ? owner.id : null,
          tags: {
            create: selectedTags.map((tag) => ({ tagId: tag.id })),
          },
        },
      });
    }
  }

  console.log("Seed users:");
  console.log("owner / owner123");
  console.log("teacher / teacher123");
  for (const member of teamMembers) {
    console.log(`${member.username} / ${member.password} (${member.name}，${member.role})`);
  }
  console.log("Day 1-7 tasks have been marked as DONE. Board defaults to the next one-week window.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
