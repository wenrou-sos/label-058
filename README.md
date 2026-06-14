# 仓储物流配送管理系统

一个基于 Next.js 14 + TypeScript + Prisma + SQLite 构建的完整仓储物流配送管理系统，实现从入库、拣货、配送到状态实时追踪的全流程管控。

## 功能特性

### 1. 入库管理模块
- 支持批量导入和手动创建入库任务
- 记录商品信息、数量、批次、存储位置等关键数据
- 提供入库任务审核和确认功能
- 多条件筛选与搜索

### 2. 拣货管理模块
- 根据订单自动生成拣货任务
- 支持按区域、优先级等条件进行拣货任务分配
- 提供拣货路径优化建议
- 拣货商品逐项确认功能

### 3. 配送管理模块
- 支持配送任务创建与分配
- 记录配送员信息、配送路线、预计送达时间
- 提供批量打印配送单功能
- 配送进度可视化追踪

### 4. 状态实时追踪模块
- 任务状态实时更新（待处理、进行中、已完成、已取消）
- 任务状态变更历史记录（时间线展示）
- 关键节点通知功能（系统通知中心）

### 5. 任务管理中心
- 直观清晰的任务管理界面（列表视图 + 看板视图）
- 完整的任务生命周期管理：创建、编辑、状态流转
- 多条件组合筛选（按状态、时间、负责人、优先级等）
- 任务搜索功能（按任务编号、商品名称等关键词）
- 任务详情查看，展示完整任务信息和状态变更历史

## 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js | 14.2+ |
| UI | React | 18.3+ |
| 语言 | TypeScript | 5.4+ |
| 样式 | Tailwind CSS | 3.4+ |
| ORM | Prisma | 5.14+ |
| 数据库 | SQLite | - |
| 状态管理 | Zustand | 4.5+ |
| 图表 | Recharts | 2.12+ |
| 验证 | Zod | 3.23+ |
| 图标 | Lucide React | 0.379+ |
| 工具库 | date-fns、clsx | - |
| 测试 | Vitest | 1.6+ |

## 项目结构

```
label-058/
├── prisma/                    # 数据库相关
│   ├── schema.prisma         # 数据模型定义
│   ├── seed.ts               # 种子数据脚本
│   └── dev.db                # SQLite 数据库文件
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API Routes
│   │   │   ├── inbound/      # 入库 API
│   │   │   ├── picking/      # 拣货 API
│   │   │   ├── delivery/     # 配送 API
│   │   │   ├── tracking/     # 追踪 API
│   │   │   ├── tasks/        # 任务 API
│   │   │   ├── notifications/# 通知 API
│   │   │   └── stats/        # 统计 API
│   │   ├── inbound/          # 入库管理页面
│   │   ├── picking/          # 拣货管理页面
│   │   ├── delivery/         # 配送管理页面
│   │   ├── tracking/         # 状态追踪页面
│   │   ├── tasks/            # 任务管理页面
│   │   ├── layout.tsx        # 根布局
│   │   ├── page.tsx          # 首页（仪表盘）
│   │   └── globals.css       # 全局样式
│   ├── components/           # 组件
│   │   ├── layout/           # 布局组件
│   │   │   ├── app-shell.tsx
│   │   │   ├── header.tsx
│   │   │   └── sidebar.tsx
│   │   └── ui/               # UI 组件
│   │       ├── status-badge.tsx
│   │       ├── priority-badge.tsx
│   │       ├── empty-state.tsx
│   │       └── loading-skeleton.tsx
│   ├── lib/                  # 工具库
│   │   ├── prisma.ts         # Prisma 客户端
│   │   ├── utils.ts          # 工具函数
│   │   └── utils.test.ts     # 单元测试
│   ├── store/                # 状态管理
│   │   ├── task-store.ts
│   │   ├── notification-store.ts
│   │   └── ui-store.ts
│   └── types/                # 类型定义
│       └── index.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
└── vitest.config.ts
```

## 数据库模型

- **InboundTask** - 入库任务
- **PickingTask** - 拣货任务
- **PickingItem** - 拣货明细
- **DeliveryTask** - 配送任务
- **StatusHistory** - 状态变更历史
- **Notification** - 系统通知

## 快速开始

### 环境要求

- Node.js 18.17 或更高版本
- npm 或 yarn

### 安装步骤

1. **安装依赖**

```bash
npm install
```

2. **初始化数据库**

```bash
# 生成 Prisma Client
npm run db:generate

# 推送数据库 schema
npm run db:push
```

3. **填充示例数据**

```bash
npm run db:seed
```

4. **启动开发服务器**

```bash
npm run dev
```

5. **访问应用**

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | 代码检查 |
| `npm run db:generate` | 生成 Prisma Client |
| `npm run db:push` | 推送数据库 schema |
| `npm run db:seed` | 填充种子数据 |
| `npm run db:studio` | 打开 Prisma Studio（可视化数据库管理） |
| `npm run test` | 运行单元测试 |
| `npm run test:watch` | 运行单元测试（监听模式） |

## 功能使用说明

### 仪表盘
- 展示入库、拣货、配送任务概览统计
- 任务状态分布柱状图
- 最近创建的任务列表

### 入库管理
- 点击「创建入库任务」手动新增入库单
- 点击「批量导入」一次性创建多条入库任务
- 支持按状态、优先级筛选，支持关键词搜索
- 待处理状态的任务可点击「审核确认」开始处理
- 点击任务编号或「查看详情」查看完整信息和状态历史

### 拣货管理
- 点击「生成拣货任务」新增拣货单并添加商品明细
- 点击「分配」为拣货任务指定拣货员
- 点击「状态」推进任务流程（待处理→进行中→已完成）
- 详情页可逐项勾选确认已拣商品，全部拣完自动完成任务

### 配送管理
- 点击「创建配送任务」新增配送单
- 点击「分配」为配送任务指定配送员和联系电话
- 勾选多条任务后点击「批量打印」可批量打印配送单
- 详情页可查看配送进度时间线

### 状态追踪
- 实时查看所有任务的当前状态
- 点击左侧任务卡片，右侧显示详细信息和状态变更历史
- 支持按任务类型、状态筛选和关键词搜索
- 点击「刷新」按钮获取最新数据

### 任务管理
- 统一查看所有类型的任务
- 支持「列表视图」和「看板视图」两种展示方式
- 看板视图按状态分为四列：待处理、进行中、已完成、已取消
- 支持按类型、状态、优先级多条件组合筛选

## 响应式设计

系统支持桌面端和移动端访问：
- 桌面端：侧边栏固定展开，表格完整展示
- 移动端：侧边栏可收起/展开，表格支持横向滚动

## 测试

运行单元测试：

```bash
npm run test
```

测试覆盖核心工具函数：
- 类名合并函数 (cn)
- 任务编号生成 (generateTaskNo)
- 日期格式化 (formatDate, formatDateTime)
- 状态颜色映射 (getStatusDotColor)
- 所有标签和颜色常量

## 设计亮点

1. **完整的业务流程**：入库→拣货→配送全链路打通
2. **状态机管理**：严格的状态流转校验（PENDING→IN_PROGRESS→COMPLETED）
3. **操作审计**：每次状态变更都记录操作人、时间、备注
4. **通知系统**：关键节点自动生成系统通知
5. **数据验证**：使用 Zod 进行服务端参数校验
6. **优雅的 UI**：Tailwind CSS 构建的现代化响应式界面
7. **类型安全**：全程 TypeScript 严格模式开发
8. **可扩展架构**：模块化设计，易于后续功能扩展

## License

MIT
