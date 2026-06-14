import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const [
    inboundCount,
    pickingCount,
    deliveryCount,
    inboundCompleted,
    pickingCompleted,
    deliveryCompleted,
    inboundPending,
    pickingInProgress,
    deliveringCount,
    inboundByStatus,
    pickingByStatus,
    deliveryByStatus,
    recentInbound,
    recentPicking,
    recentDelivery,
  ] = await Promise.all([
    prisma.inboundTask.count(),
    prisma.pickingTask.count(),
    prisma.deliveryTask.count(),
    prisma.inboundTask.count({ where: { status: 'COMPLETED' } }),
    prisma.pickingTask.count({ where: { status: 'COMPLETED' } }),
    prisma.deliveryTask.count({ where: { status: 'COMPLETED' } }),
    prisma.inboundTask.count({ where: { status: 'PENDING' } }),
    prisma.pickingTask.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.deliveryTask.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.inboundTask.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.pickingTask.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.deliveryTask.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.inboundTask.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, taskNo: true, status: true, priority: true, createdAt: true },
    }),
    prisma.pickingTask.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, taskNo: true, status: true, priority: true, createdAt: true },
    }),
    prisma.deliveryTask.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, taskNo: true, status: true, priority: true, createdAt: true },
    }),
  ])

  const statusMap: Record<string, number> = {}
  for (const item of [...inboundByStatus, ...pickingByStatus, ...deliveryByStatus]) {
    statusMap[item.status] = (statusMap[item.status] || 0) + item._count.status
  }
  const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({
    status,
    count,
  }))

  const recentTasks = [
    ...recentInbound.map((t) => ({ ...t, type: 'INBOUND' as const })),
    ...recentPicking.map((t) => ({ ...t, type: 'PICKING' as const })),
    ...recentDelivery.map((t) => ({ ...t, type: 'DELIVERY' as const })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  return NextResponse.json({
    data: {
      inboundCount,
      pickingCount,
      deliveryCount,
      completedCount: inboundCompleted + pickingCompleted + deliveryCompleted,
      inboundPending,
      pickingInProgress,
      deliveringCount,
      statusDistribution,
      recentTasks,
    },
  })
}
