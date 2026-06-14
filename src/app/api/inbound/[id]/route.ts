import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const task = await prisma.inboundTask.findUnique({
    where: { id: params.id },
    include: { statusHistories: { orderBy: { createdAt: 'desc' } } },
  })

  if (!task) {
    return NextResponse.json({ error: '入库任务不存在' }, { status: 404 })
  }

  return NextResponse.json({ data: task })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  const task = await prisma.inboundTask.update({
    where: { id: params.id },
    data: {
      productName: body.productName,
      quantity: body.quantity,
      batchNo: body.batchNo,
      storageLocation: body.storageLocation,
      priority: body.priority,
      assignee: body.assignee,
    },
  })

  return NextResponse.json({ data: task })
}
