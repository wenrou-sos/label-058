import { prisma } from '@/lib/prisma'
import { STATUS_LABELS, TASK_TYPE_LABELS } from '@/types'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { toStatus, operator, remark } = body

    const task = await prisma.deliveryTask.findUnique({
      where: { id: params.id },
    })

    if (!task) {
      return NextResponse.json({ error: '配送任务不存在' }, { status: 404 })
    }

    const fromStatus = task.status
    if (fromStatus === toStatus) {
      return NextResponse.json({ error: '状态未变化' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.deliveryTask.update({
        where: { id: params.id },
        data: { status: toStatus },
      })

      await tx.statusHistory.create({
        data: {
          taskId: params.id,
          taskType: 'DELIVERY',
          fromStatus,
          toStatus,
          operator: operator || '系统',
          remark,
          deliveryTaskId: params.id,
        },
      })

      await tx.notification.create({
        data: {
          taskId: params.id,
          taskType: 'DELIVERY',
          message: `${TASK_TYPE_LABELS.DELIVERY}任务 ${task.taskNo} 状态已更新为 ${STATUS_LABELS[toStatus as keyof typeof STATUS_LABELS] || toStatus}`,
          deliveryTaskId: params.id,
        },
      })

      return updated
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('配送状态更新失败:', error)
    return NextResponse.json(
      { error: '状态更新失败，请稍后重试' },
      { status: 500 }
    )
  }
}
