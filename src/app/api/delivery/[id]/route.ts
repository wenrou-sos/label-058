import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const task = await prisma.deliveryTask.findUnique({
    where: { id: params.id },
    include: { statusHistories: { orderBy: { createdAt: 'desc' } } },
  })

  if (!task) {
    return NextResponse.json({ error: '配送任务不存在' }, { status: 404 })
  }

  return NextResponse.json({ data: task })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  const task = await prisma.deliveryTask.update({
    where: { id: params.id },
    data: {
      orderNo: body.orderNo,
      courierName: body.courierName,
      courierPhone: body.courierPhone,
      deliveryRoute: body.deliveryRoute,
      estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : null,
      priority: body.priority,
    },
  })

  return NextResponse.json({ data: task })
}
