import { prisma } from '@/lib/prisma'
import { STATUS_LABELS, TASK_TYPE_LABELS } from '@/types'
import { handleTaskStatusChange } from '@/lib/task-flow'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { toStatus, operator, remark } = body

    const task = await prisma.inboundTask.findUnique({
      where: { id: params.id },
    })

    if (!task) {
      return NextResponse.json({ error: '入库任务不存在' }, { status: 404 })
    }

    const fromStatus = task.status
    if (fromStatus === toStatus) {
      return NextResponse.json({ error: '状态未变化' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.inboundTask.update({
        where: { id: params.id },
        data: { status: toStatus },
      })

      await tx.statusHistory.create({
        data: {
          taskId: params.id,
          taskType: 'INBOUND',
          fromStatus,
          toStatus,
          operator: operator || '系统',
          remark,
          inboundTaskId: params.id,
        },
      })

      await tx.notification.create({
        data: {
          taskId: params.id,
          taskType: 'INBOUND',
          message: `${TASK_TYPE_LABELS.INBOUND}任务 ${task.taskNo} 状态已更新为 ${STATUS_LABELS[toStatus as keyof typeof STATUS_LABELS] || toStatus}`,
          inboundTaskId: params.id,
        },
      })

      return updated
    })

    let generatedTask = null
    if (toStatus === 'COMPLETED') {
      generatedTask = await handleTaskStatusChange(prisma, 'INBOUND', params.id, toStatus)
    }

    return NextResponse.json({
      data: result,
      generatedTask,
    })
  } catch (error) {
    console.error('入库状态更新失败:', error)
    return NextResponse.json(
      { error: '状态更新失败，请稍后重试' },
      { status: 500 }
    )
  }
}
