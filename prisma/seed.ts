import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const dateStr = "20260614";

function inboundNo(index: number) {
  return `IN${dateStr}${String(index).padStart(3, "0")}`;
}

function pickingNo(index: number) {
  return `PK${dateStr}${String(index).padStart(3, "0")}`;
}

function deliveryNo(index: number) {
  return `DL${dateStr}${String(index).padStart(3, "0")}`;
}

const assignees = ["张明", "李华", "王强", "赵磊", "陈静", "刘洋", "周涛", "吴芳"];
const zones = ["A区", "B区", "C区", "D区"];
const storageLocations = [
  "A-01-01", "A-01-02", "A-02-01", "A-02-03",
  "B-01-01", "B-01-02", "B-02-01", "B-03-01",
  "C-01-01", "C-01-03", "C-02-02",
  "D-01-01", "D-01-02", "D-02-01",
];

const productNames = [
  "精密轴承组件", "不锈钢螺栓M10", "铜质垫片套装",
  "工业润滑油20L", "电子传感器模块", "液压缸密封圈",
  "碳钢法兰盘DN50", "铝合金散热片", "耐高温硅胶管",
  "伺服电机驱动器", "PVC绝缘电线100m", "尼龙扎带包装袋",
  "钛合金紧固件套", "铸铁阀门DN80", "陶瓷绝缘子",
  "变频器控制面板", "橡胶减震垫", "不锈钢管件Φ25",
  "光学透镜组件", "导轨滑块套装",
];

const batchNos = [
  "BH2026-001", "BH2026-002", "BH2026-003", "BH2026-004",
  "BH2026-005", "BH2026-006", "BH2026-007", "BH2026-008",
];

const statuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const courierNames = ["顺丰速运-王刚", "京东物流-孙鹏", "中通快递-马丽", "圆通速递-郑伟"];
const courierPhones = ["13800138001", "13800138002", "13800138003", "13800138004"];
const deliveryRoutes = [
  "上海浦东仓库→杭州分拨中心",
  "苏州工业园→南京配送站",
  "无锡物流园→合肥中转站",
  "昆山仓储中心→宁波配送点",
  "上海嘉定仓→嘉兴物流站",
  "常州集散中心→扬州配送点",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickUnique<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function main() {
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF");

  console.log("🗑️ 清空现有数据...");
  await prisma.notification.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.pickingItem.deleteMany();
  await prisma.pickingTask.deleteMany();
  await prisma.deliveryTask.deleteMany();
  await prisma.inboundTask.deleteMany();

  console.log("📦 创建入库任务...");
  const inboundData = [
    { idx: 1, product: "精密轴承组件", qty: 500, batch: "BH2026-001", location: "A-01-01", status: "PENDING", priority: "HIGH", assignee: "张明" },
    { idx: 2, product: "不锈钢螺栓M10", qty: 2000, batch: "BH2026-001", location: "A-01-02", status: "IN_PROGRESS", priority: "MEDIUM", assignee: "李华" },
    { idx: 3, product: "铜质垫片套装", qty: 800, batch: "BH2026-002", location: "A-02-01", status: "COMPLETED", priority: "LOW", assignee: "王强" },
    { idx: 4, product: "工业润滑油20L", qty: 100, batch: "BH2026-002", location: "B-01-01", status: "COMPLETED", priority: "MEDIUM", assignee: "赵磊" },
    { idx: 5, product: "电子传感器模块", qty: 300, batch: "BH2026-003", location: "C-01-01", status: "IN_PROGRESS", priority: "URGENT", assignee: "陈静" },
    { idx: 6, product: "液压缸密封圈", qty: 1500, batch: "BH2026-003", location: "A-02-03", status: "PENDING", priority: "HIGH", assignee: "刘洋" },
    { idx: 7, product: "碳钢法兰盘DN50", qty: 200, batch: "BH2026-004", location: "B-02-01", status: "CANCELLED", priority: "LOW", assignee: null },
    { idx: 8, product: "铝合金散热片", qty: 600, batch: "BH2026-004", location: "C-01-03", status: "IN_PROGRESS", priority: "MEDIUM", assignee: "周涛" },
    { idx: 9, product: "耐高温硅胶管", qty: 400, batch: "BH2026-005", location: "B-01-02", status: "PENDING", priority: "HIGH", assignee: "吴芳" },
    { idx: 10, product: "伺服电机驱动器", qty: 50, batch: "BH2026-005", location: "D-01-01", status: "COMPLETED", priority: "URGENT", assignee: "张明" },
    { idx: 11, product: "PVC绝缘电线100m", qty: 1000, batch: "BH2026-006", location: "B-03-01", status: "PENDING", priority: "MEDIUM", assignee: null },
    { idx: 12, product: "钛合金紧固件套", qty: 350, batch: "BH2026-006", location: "A-01-02", status: "IN_PROGRESS", priority: "HIGH", assignee: "李华" },
    { idx: 13, product: "铸铁阀门DN80", qty: 80, batch: "BH2026-007", location: "D-01-02", status: "CANCELLED", priority: "LOW", assignee: null },
    { idx: 14, product: "陶瓷绝缘子", qty: 250, batch: "BH2026-007", location: "C-02-02", status: "COMPLETED", priority: "MEDIUM", assignee: "王强" },
    { idx: 15, product: "变频器控制面板", qty: 30, batch: "BH2026-008", location: "D-02-01", status: "PENDING", priority: "URGENT", assignee: "陈静" },
    { idx: 16, product: "橡胶减震垫", qty: 1200, batch: "BH2026-008", location: "B-02-01", status: "IN_PROGRESS", priority: "MEDIUM", assignee: "赵磊" },
  ];

  const inboundTasks = [];
  for (const d of inboundData) {
    const task = await prisma.inboundTask.create({
      data: {
        taskNo: inboundNo(d.idx),
        productName: d.product,
        quantity: d.qty,
        batchNo: d.batch,
        storageLocation: d.location,
        status: d.status,
        priority: d.priority,
        assignee: d.assignee,
      },
    });
    inboundTasks.push(task);
  }

  console.log("📋 创建拣货任务及拣货明细...");
  const pickingData = [
    {
      idx: 1, orderNo: "ORD-20260614-001", zone: "A区", status: "PENDING", priority: "HIGH", assignee: "张明",
      items: [
        { product: "精密轴承组件", qty: 20, location: "A-01-01", picked: false },
        { product: "不锈钢螺栓M10", qty: 100, location: "A-01-02", picked: false },
        { product: "铜质垫片套装", qty: 50, location: "A-02-01", picked: false },
      ],
    },
    {
      idx: 2, orderNo: "ORD-20260614-002", zone: "B区", status: "IN_PROGRESS", priority: "MEDIUM", assignee: "李华",
      items: [
        { product: "工业润滑油20L", qty: 10, location: "B-01-01", picked: true },
        { product: "耐高温硅胶管", qty: 30, location: "B-01-02", picked: false },
      ],
    },
    {
      idx: 3, orderNo: "ORD-20260614-003", zone: "A区", status: "COMPLETED", priority: "URGENT", assignee: "王强",
      items: [
        { product: "伺服电机驱动器", qty: 5, location: "D-01-01", picked: true },
        { product: "电子传感器模块", qty: 15, location: "C-01-01", picked: true },
        { product: "铝合金散热片", qty: 40, location: "C-01-03", picked: true },
        { product: "液压缸密封圈", qty: 100, location: "A-02-03", picked: true },
      ],
    },
    {
      idx: 4, orderNo: "ORD-20260614-004", zone: "C区", status: "PENDING", priority: "LOW", assignee: null,
      items: [
        { product: "陶瓷绝缘子", qty: 20, location: "C-02-02", picked: false },
        { product: "碳钢法兰盘DN50", qty: 10, location: "B-02-01", picked: false },
      ],
    },
    {
      idx: 5, orderNo: "ORD-20260614-005", zone: "D区", status: "IN_PROGRESS", priority: "HIGH", assignee: "赵磊",
      items: [
        { product: "变频器控制面板", qty: 3, location: "D-02-01", picked: true },
        { product: "铸铁阀门DN80", qty: 5, location: "D-01-02", picked: false },
        { product: "橡胶减震垫", qty: 200, location: "B-02-01", picked: false },
      ],
    },
    {
      idx: 6, orderNo: "ORD-20260614-006", zone: "A区", status: "COMPLETED", priority: "MEDIUM", assignee: "陈静",
      items: [
        { product: "钛合金紧固件套", qty: 25, location: "A-01-02", picked: true },
        { product: "PVC绝缘电线100m", qty: 50, location: "B-03-01", picked: true },
      ],
    },
    {
      idx: 7, orderNo: "ORD-20260614-007", zone: "B区", status: "CANCELLED", priority: "LOW", assignee: null,
      items: [
        { product: "尼龙扎带包装袋", qty: 300, location: "B-01-02", picked: false },
        { product: "不锈钢管件Φ25", qty: 40, location: "A-02-01", picked: false },
      ],
    },
    {
      idx: 8, orderNo: "ORD-20260614-008", zone: "C区", status: "IN_PROGRESS", priority: "HIGH", assignee: "刘洋",
      items: [
        { product: "光学透镜组件", qty: 8, location: "C-01-01", picked: true },
        { product: "导轨滑块套装", qty: 12, location: "C-01-03", picked: false },
        { product: "电子传感器模块", qty: 30, location: "C-01-01", picked: false },
      ],
    },
    {
      idx: 9, orderNo: "ORD-20260614-009", zone: "D区", status: "PENDING", priority: "URGENT", assignee: "周涛",
      items: [
        { product: "伺服电机驱动器", qty: 2, location: "D-01-01", picked: false },
        { product: "变频器控制面板", qty: 1, location: "D-02-01", picked: false },
      ],
    },
    {
      idx: 10, orderNo: "ORD-20260614-010", zone: "A区", status: "COMPLETED", priority: "MEDIUM", assignee: "吴芳",
      items: [
        { product: "精密轴承组件", qty: 50, location: "A-01-01", picked: true },
        { product: "铜质垫片套装", qty: 100, location: "A-02-01", picked: true },
        { product: "液压缸密封圈", qty: 200, location: "A-02-03", picked: true },
        { product: "不锈钢螺栓M10", qty: 500, location: "A-01-02", picked: true },
      ],
    },
    {
      idx: 11, orderNo: "ORD-20260614-011", zone: "B区", status: "IN_PROGRESS", priority: "MEDIUM", assignee: "张明",
      items: [
        { product: "工业润滑油20L", qty: 5, location: "B-01-01", picked: true },
        { product: "橡胶减震垫", qty: 100, location: "B-02-01", picked: false },
      ],
    },
  ];

  const pickingTasks = [];
  for (const d of pickingData) {
    const task = await prisma.pickingTask.create({
      data: {
        taskNo: pickingNo(d.idx),
        orderNo: d.orderNo,
        zone: d.zone,
        status: d.status,
        priority: d.priority,
        assignee: d.assignee,
        optimizedPath: d.status !== "PENDING" ? `${d.zone}→主通道→出库区` : null,
        items: {
          create: d.items.map((item) => ({
            productName: item.product,
            quantity: item.qty,
            storageLocation: item.location,
            isPicked: item.picked,
          })),
        },
      },
    });
    pickingTasks.push(task);
  }

  console.log("🚚 创建配送任务...");
  const deliveryData = [
    { idx: 1, orderNo: "ORD-20260614-001", courier: "顺丰速运-王刚", phone: "13800138001", route: "上海浦东仓库→杭州分拨中心", status: "PENDING", priority: "HIGH", eta: new Date("2026-06-16T14:00:00") },
    { idx: 2, orderNo: "ORD-20260614-002", courier: "京东物流-孙鹏", phone: "13800138002", route: "苏州工业园→南京配送站", status: "IN_PROGRESS", priority: "MEDIUM", eta: new Date("2026-06-15T18:00:00") },
    { idx: 3, orderNo: "ORD-20260614-003", courier: "中通快递-马丽", phone: "13800138003", route: "无锡物流园→合肥中转站", status: "COMPLETED", priority: "URGENT", eta: new Date("2026-06-14T10:00:00") },
    { idx: 4, orderNo: "ORD-20260614-004", courier: "圆通速递-郑伟", phone: "13800138004", route: "昆山仓储中心→宁波配送点", status: "PENDING", priority: "LOW", eta: new Date("2026-06-18T12:00:00") },
    { idx: 5, orderNo: "ORD-20260614-005", courier: "顺丰速运-王刚", phone: "13800138001", route: "上海嘉定仓→嘉兴物流站", status: "IN_PROGRESS", priority: "HIGH", eta: new Date("2026-06-15T16:00:00") },
    { idx: 6, orderNo: "ORD-20260614-006", courier: "京东物流-孙鹏", phone: "13800138002", route: "常州集散中心→扬州配送点", status: "COMPLETED", priority: "MEDIUM", eta: new Date("2026-06-14T09:00:00") },
    { idx: 7, orderNo: "ORD-20260614-007", courier: null, phone: null, route: "上海浦东仓库→杭州分拨中心", status: "CANCELLED", priority: "LOW", eta: null },
    { idx: 8, orderNo: "ORD-20260614-008", courier: "中通快递-马丽", phone: "13800138003", route: "苏州工业园→南京配送站", status: "IN_PROGRESS", priority: "HIGH", eta: new Date("2026-06-15T20:00:00") },
    { idx: 9, orderNo: "ORD-20260614-009", courier: "圆通速递-郑伟", phone: "13800138004", route: "无锡物流园→合肥中转站", status: "PENDING", priority: "URGENT", eta: new Date("2026-06-16T08:00:00") },
    { idx: 10, orderNo: "ORD-20260614-010", courier: "顺丰速运-王刚", phone: "13800138001", route: "昆山仓储中心→宁波配送点", status: "COMPLETED", priority: "MEDIUM", eta: new Date("2026-06-14T11:30:00") },
    { idx: 11, orderNo: "ORD-20260614-011", courier: "京东物流-孙鹏", phone: "13800138002", route: "上海嘉定仓→嘉兴物流站", status: "PENDING", priority: "MEDIUM", eta: new Date("2026-06-17T15:00:00") },
  ];

  const deliveryTasks = [];
  for (const d of deliveryData) {
    const task = await prisma.deliveryTask.create({
      data: {
        taskNo: deliveryNo(d.idx),
        orderNo: d.orderNo,
        courierName: d.courier,
        courierPhone: d.phone,
        deliveryRoute: d.route,
        estimatedDelivery: d.eta,
        status: d.status,
        priority: d.priority,
      },
    });
    deliveryTasks.push(task);
  }

  console.log("📝 创建状态变更历史...");
  const statusHistories: { taskId: string; taskType: string; from: string; to: string; operator: string; remark: string | null }[] = [];

  for (const task of inboundTasks) {
    if (task.status === "IN_PROGRESS") {
      statusHistories.push({ taskId: task.id, taskType: "INBOUND", from: "PENDING", to: "IN_PROGRESS", operator: task.assignee ?? "系统", remark: "开始入库操作" });
    }
    if (task.status === "COMPLETED") {
      statusHistories.push({ taskId: task.id, taskType: "INBOUND", from: "PENDING", to: "IN_PROGRESS", operator: task.assignee ?? "系统", remark: "开始入库操作" });
      statusHistories.push({ taskId: task.id, taskType: "INBOUND", from: "IN_PROGRESS", to: "COMPLETED", operator: task.assignee ?? "系统", remark: "入库完成，已上架" });
    }
    if (task.status === "CANCELLED") {
      statusHistories.push({ taskId: task.id, taskType: "INBOUND", from: "PENDING", to: "CANCELLED", operator: "系统", remark: "供应商取消订单" });
    }
  }

  for (const task of pickingTasks) {
    if (task.status === "IN_PROGRESS") {
      statusHistories.push({ taskId: task.id, taskType: "PICKING", from: "PENDING", to: "IN_PROGRESS", operator: task.assignee ?? "系统", remark: "开始拣货作业" });
    }
    if (task.status === "COMPLETED") {
      statusHistories.push({ taskId: task.id, taskType: "PICKING", from: "PENDING", to: "IN_PROGRESS", operator: task.assignee ?? "系统", remark: "开始拣货作业" });
      statusHistories.push({ taskId: task.id, taskType: "PICKING", from: "IN_PROGRESS", to: "COMPLETED", operator: task.assignee ?? "系统", remark: "全部拣货完成" });
    }
    if (task.status === "CANCELLED") {
      statusHistories.push({ taskId: task.id, taskType: "PICKING", from: "PENDING", to: "CANCELLED", operator: "系统", remark: "订单取消" });
    }
  }

  for (const task of deliveryTasks) {
    if (task.status === "IN_PROGRESS") {
      statusHistories.push({ taskId: task.id, taskType: "DELIVERY", from: "PENDING", to: "IN_PROGRESS", operator: task.courierName ?? "系统", remark: "配送员已取件" });
    }
    if (task.status === "COMPLETED") {
      statusHistories.push({ taskId: task.id, taskType: "DELIVERY", from: "PENDING", to: "IN_PROGRESS", operator: task.courierName ?? "系统", remark: "配送员已取件" });
      statusHistories.push({ taskId: task.id, taskType: "DELIVERY", from: "IN_PROGRESS", to: "COMPLETED", operator: task.courierName ?? "系统", remark: "已签收" });
    }
    if (task.status === "CANCELLED") {
      statusHistories.push({ taskId: task.id, taskType: "DELIVERY", from: "PENDING", to: "CANCELLED", operator: "系统", remark: "客户取消配送" });
    }
  }

  for (const h of statusHistories) {
    const data: any = {
      taskId: h.taskId,
      taskType: h.taskType,
      fromStatus: h.from,
      toStatus: h.to,
      operator: h.operator,
      remark: h.remark,
    };
    if (h.taskType === "INBOUND") data.inboundTaskId = h.taskId;
    if (h.taskType === "PICKING") data.pickingTaskId = h.taskId;
    if (h.taskType === "DELIVERY") data.deliveryTaskId = h.taskId;
    await prisma.statusHistory.create({ data });
  }

  console.log("🔔 创建通知记录...");
  const notifications: { taskId: string; taskType: string; message: string }[] = [];

  for (const task of inboundTasks) {
    if (task.priority === "URGENT") {
      notifications.push({ taskId: task.id, taskType: "INBOUND", message: `紧急入库任务 ${task.taskNo}：${task.productName} 需立即处理` });
    }
    if (task.status === "PENDING" && task.priority === "HIGH") {
      notifications.push({ taskId: task.id, taskType: "INBOUND", message: `高优先级入库任务 ${task.taskNo} 等待处理，产品：${task.productName}` });
    }
    if (task.status === "COMPLETED") {
      notifications.push({ taskId: task.id, taskType: "INBOUND", message: `入库任务 ${task.taskNo} 已完成，${task.productName} 已入库至 ${task.storageLocation}` });
    }
  }

  for (const task of pickingTasks) {
    if (task.priority === "URGENT") {
      notifications.push({ taskId: task.id, taskType: "PICKING", message: `紧急拣货任务 ${task.taskNo}：订单 ${task.orderNo} 需优先拣货` });
    }
    if (task.status === "COMPLETED") {
      notifications.push({ taskId: task.id, taskType: "PICKING", message: `拣货任务 ${task.taskNo} 已完成，订单 ${task.orderNo} 可安排配送` });
    }
  }

  for (const task of deliveryTasks) {
    if (task.priority === "URGENT") {
      notifications.push({ taskId: task.id, taskType: "DELIVERY", message: `紧急配送任务 ${task.taskNo}：订单 ${task.orderNo} 需尽快配送` });
    }
    if (task.status === "COMPLETED") {
      notifications.push({ taskId: task.id, taskType: "DELIVERY", message: `配送任务 ${task.taskNo} 已完成签收，订单 ${task.orderNo}` });
    }
    if (task.status === "IN_PROGRESS") {
      notifications.push({ taskId: task.id, taskType: "DELIVERY", message: `配送任务 ${task.taskNo} 配送中，${task.courierName} 正在派送` });
    }
  }

  for (const n of notifications) {
    const data: any = {
      taskId: n.taskId,
      taskType: n.taskType,
      message: n.message,
      isRead: Math.random() > 0.5,
    };
    if (n.taskType === "INBOUND") data.inboundTaskId = n.taskId;
    if (n.taskType === "PICKING") data.pickingTaskId = n.taskId;
    if (n.taskType === "DELIVERY") data.deliveryTaskId = n.taskId;
    await prisma.notification.create({ data });
  }

  console.log("\n✅ 种子数据创建完成！");
  console.log(`  📦 入库任务: ${inboundTasks.length} 条`);
  console.log(`  📋 拣货任务: ${pickingTasks.length} 条`);
  console.log(`  🚚 配送任务: ${deliveryTasks.length} 条`);
  console.log(`  📝 状态历史: ${statusHistories.length} 条`);
  console.log(`  🔔 通知记录: ${notifications.length} 条`);

  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");
}

main()
  .catch((e) => {
    console.error("❌ 种子数据创建失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
