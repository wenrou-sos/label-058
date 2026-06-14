import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const task = await prisma.pickingTask.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      statusHistories: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!task) {
    return NextResponse.json({ error: '拣货任务不存在' }, { status: 404 })
  }

  return NextResponse.json({ data: task })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  const task = await prisma.pickingTask.update({
    where: { id: params.id },
    data: {
      orderNo: body.orderNo,
      zone: body.zone,
      priority: body.priority,
      assignee: body.assignee,
      optimizedPath: body.optimizedPath,
    },
    include: { items: true },
  })

  return NextResponse.json({ data: task })
}
