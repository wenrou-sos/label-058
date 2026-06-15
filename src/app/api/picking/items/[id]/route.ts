import { prisma } from '@/lib/prisma'
import { STATUS_LABELS, TASK_TYPE_LABELS } from '@/types'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.pickingItem.findUnique({
      where: { id: params.id },
    })

    if (!item) {
      return NextResponse.json({ error: '拣货明细不存在' }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.pickingItem.update({
        where: { id: params.id },
        data: { isPicked: !item.isPicked },
      })

      const pickingTask = await tx.pickingTask.findUnique({
        where: { id: item.pickingTaskId },
        include: { items: true },
      })

      if (pickingTask) {
        const allPicked = pickingTask.items.every(
          (i) => i.id === item.id ? !item.isPicked : i.isPicked
        )
        if (allPicked && pickingTask.status === 'IN_PROGRESS') {
          await tx.pickingTask.update({
            where: { id: pickingTask.id },
            data: { status: 'COMPLETED' },
          })
          await tx.statusHistory.create({
            data: {
              taskId: pickingTask.id,
              taskType: 'PICKING',
              fromStatus: 'IN_PROGRESS',
              toStatus: 'COMPLETED',
              operator: '系统',
              remark: '全部拣货完成',
              pickingTaskId: pickingTask.id,
            },
          })
          await tx.notification.create({
            data: {
              taskId: pickingTask.id,
              taskType: 'PICKING',
              message: `${TASK_TYPE_LABELS.PICKING}任务 ${pickingTask.taskNo} ${STATUS_LABELS.COMPLETED}`,
              pickingTaskId: pickingTask.id,
            },
          })
        }
      }

      return updated
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('拣货明细更新失败:', error)
    return NextResponse.json(
      { error: '更新失败，请稍后重试' },
      { status: 500 }
    )
  }
}
