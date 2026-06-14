import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = request.nextUrl
  const taskType = searchParams.get('taskType')

  if (!taskType) {
    return NextResponse.json(
      { error: 'taskType 查询参数必填（INBOUND/PICKING/DELIVERY）' },
      { status: 400 }
    )
  }

  let task: Record<string, unknown> | null = null

  if (taskType === 'INBOUND') {
    task = await prisma.inboundTask.findUnique({ where: { id: params.id } })
  } else if (taskType === 'PICKING') {
    task = await prisma.pickingTask.findUnique({ where: { id: params.id } })
  } else if (taskType === 'DELIVERY') {
    task = await prisma.deliveryTask.findUnique({ where: { id: params.id } })
  }

  if (!task) {
    return NextResponse.json({ error: '任务不存在' }, { status: 404 })
  }

  const history = await prisma.statusHistory.findMany({
    where: { taskId: params.id, taskType },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: history })
}
