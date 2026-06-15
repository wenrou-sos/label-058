import { PrismaClient } from '@prisma/client'
import { generateTaskNo } from './utils'

const DEFAULT_ROUTES = [
  '上海浦东仓库→杭州分拨中心',
  '苏州工业园→南京配送站',
  '无锡物流园→合肥中转站',
  '昆山仓储中心→宁波配送点',
  '上海嘉定仓→嘉兴物流站',
  '常州集散中心→扬州配送点',
]

const DEFAULT_ZONES = ['A区', 'B区', 'C区', 'D区', 'E区']

function getZoneFromLocation(storageLocation: string): string {
  const match = storageLocation.match(/^([A-E])-/)
  if (match) {
    return `${match[1]}区`
  }
  return DEFAULT_ZONES[0]
}

function getDefaultRoute(): string {
  return DEFAULT_ROUTES[Math.floor(Math.random() * DEFAULT_ROUTES.length)]
}

function generateOrderNo(prefix: string, inboundTaskNo?: string): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  if (inboundTaskNo) {
    return `${prefix}-${inboundTaskNo}-${rand}`
  }
  return `${prefix}${date}${rand}`
}

export async function createPickingTaskFromInbound(
  prisma: PrismaClient,
  inboundTaskId: string
) {
  const inboundTask = await prisma.inboundTask.findUnique({
    where: { id: inboundTaskId },
  })

  if (!inboundTask) {
    throw new Error(`入库任务 ${inboundTaskId} 不存在`)
  }

  const existingPicking = await prisma.pickingTask.findFirst({
    where: { sourceInboundTaskId: inboundTaskId },
  })

  if (existingPicking) {
    return existingPicking
  }

  const orderNo = inboundTask.orderNo || generateOrderNo('ORD', inboundTask.taskNo)
  const zone = getZoneFromLocation(inboundTask.storageLocation)

  const pickingTask = await prisma.pickingTask.create({
    data: {
      taskNo: generateTaskNo('PK'),
      orderNo,
      zone,
      status: 'PENDING',
      priority: inboundTask.priority,
      assignee: inboundTask.assignee,
      sourceInboundTaskId: inboundTask.id,
      items: {
        create: {
          productName: inboundTask.productName,
          quantity: inboundTask.quantity,
          storageLocation: inboundTask.storageLocation,
          isPicked: false,
        },
      },
    },
    include: { items: true },
  })

  await prisma.notification.create({
    data: {
      taskId: pickingTask.id,
      taskType: 'PICKING',
      message: `入库任务 ${inboundTask.taskNo} 已完成，系统自动生成拣货任务 ${pickingTask.taskNo}`,
      pickingTaskId: pickingTask.id,
    },
  })

  return pickingTask
}

export async function createDeliveryTaskFromPicking(
  prisma: PrismaClient,
  pickingTaskId: string
) {
  const pickingTask = await prisma.pickingTask.findUnique({
    where: { id: pickingTaskId },
    include: { items: true },
  })

  if (!pickingTask) {
    throw new Error(`拣货任务 ${pickingTaskId} 不存在`)
  }

  const existingDelivery = await prisma.deliveryTask.findFirst({
    where: { sourcePickingTaskId: pickingTaskId },
  })

  if (existingDelivery) {
    return existingDelivery
  }

  const deliveryTask = await prisma.deliveryTask.create({
    data: {
      taskNo: generateTaskNo('DL'),
      orderNo: pickingTask.orderNo,
      deliveryRoute: getDefaultRoute(),
      status: 'PENDING',
      priority: pickingTask.priority,
      sourcePickingTaskId: pickingTask.id,
    },
  })

  await prisma.notification.create({
    data: {
      taskId: deliveryTask.id,
      taskType: 'DELIVERY',
      message: `拣货任务 ${pickingTask.taskNo} 已完成，系统自动生成配送任务 ${deliveryTask.taskNo}`,
      deliveryTaskId: deliveryTask.id,
    },
  })

  return deliveryTask
}

export async function handleTaskStatusChange(
  prisma: PrismaClient,
  taskType: 'INBOUND' | 'PICKING' | 'DELIVERY',
  taskId: string,
  toStatus: string
) {
  if (toStatus !== 'COMPLETED') {
    return null
  }

  switch (taskType) {
    case 'INBOUND': {
      const pickingTask = await createPickingTaskFromInbound(prisma, taskId)
      return { type: 'PICKING' as const, task: pickingTask }
    }
    case 'PICKING': {
      const deliveryTask = await createDeliveryTaskFromPicking(prisma, taskId)
      return { type: 'DELIVERY' as const, task: deliveryTask }
    }
    default:
      return null
  }
}
