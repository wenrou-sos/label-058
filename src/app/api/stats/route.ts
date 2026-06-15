import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

function getLast7Days(): Date[] {
  const days: Date[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    d.setHours(0, 0, 0, 0)
    days.push(d)
  }
  return days
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplayDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

async function getTaskCountsByDate(startDate: Date, endDate: Date, taskType: 'inbound' | 'picking' | 'delivery') {
  const gte = new Date(startDate)
  gte.setHours(0, 0, 0, 0)
  const lt = new Date(endDate)
  lt.setDate(lt.getDate() + 1)
  lt.setHours(0, 0, 0, 0)

  let records: { createdAt: Date }[] = []

  if (taskType === 'inbound') {
    records = await prisma.inboundTask.findMany({
      where: { createdAt: { gte, lt } },
      select: { createdAt: true },
    })
  } else if (taskType === 'picking') {
    records = await prisma.pickingTask.findMany({
      where: { createdAt: { gte, lt } },
      select: { createdAt: true },
    })
  } else {
    records = await prisma.deliveryTask.findMany({
      where: { createdAt: { gte, lt } },
      select: { createdAt: true },
    })
  }

  const map: Record<string, number> = {}
  for (const r of records) {
    const key = formatDateKey(new Date(r.createdAt))
    map[key] = (map[key] || 0) + 1
  }
  return map
}

export async function GET() {
  const days = getLast7Days()
  const startDate = days[0]
  const endDate = days[days.length - 1]

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
    inboundByDate,
    pickingByDate,
    deliveryByDate,
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
    getTaskCountsByDate(startDate, endDate, 'inbound'),
    getTaskCountsByDate(startDate, endDate, 'picking'),
    getTaskCountsByDate(startDate, endDate, 'delivery'),
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

  const weeklyTrend = days.map((d) => {
    const key = formatDateKey(d)
    return {
      date: formatDisplayDate(d),
      inbound: inboundByDate[key] || 0,
      picking: pickingByDate[key] || 0,
      delivery: deliveryByDate[key] || 0,
    }
  })

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
      weeklyTrend,
    },
  })
}
