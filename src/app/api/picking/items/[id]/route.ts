import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const item = await prisma.pickingItem.findUnique({
    where: { id: params.id },
  })

  if (!item) {
    return NextResponse.json({ error: '拣货明细不存在' }, { status: 404 })
  }

  const updated = await prisma.pickingItem.update({
    where: { id: params.id },
    data: { isPicked: !item.isPicked },
  })

  const pickingTask = await prisma.pickingTask.findUnique({
    where: { id: item.pickingTaskId },
    include: { items: true },
  })

  if (pickingTask) {
    const allPicked = pickingTask.items.every((i) => i.isPicked)
    if (allPicked && pickingTask.status === 'IN_PROGRESS') {
      await prisma.pickingTask.update({
        where: { id: pickingTask.id },
        data: { status: 'COMPLETED' },
      })
      await prisma.statusHistory.create({
        data: {
          taskId: pickingTask.id,
          taskType: 'PICKING',
          fromStatus: 'IN_PROGRESS',
          toStatus: 'COMPLETED',
          operator: '系统',
          remark: '全部拣货完成',
        },
      })
    }
  }

  return NextResponse.json({ data: updated })
}
