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

    const task = await prisma.pickingTask.findUnique({
      where: { id: params.id },
    })

    if (!task) {
      return NextResponse.json({ error: '拣货任务不存在' }, { status: 404 })
    }

    const fromStatus = task.status
    if (fromStatus === toStatus) {
      return NextResponse.json({ error: '状态未变化' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.pickingTask.update({
        where: { id: params.id },
        data: { status: toStatus },
      })

      await tx.statusHistory.create({
        data: {
          taskId: params.id,
          taskType: 'PICKING',
          fromStatus,
          toStatus,
          operator: operator || '系统',
          remark,
          pickingTaskId: params.id,
        },
      })

      await tx.notification.create({
        data: {
          taskId: params.id,
          taskType: 'PICKING',
          message: `${TASK_TYPE_LABELS.PICKING}任务 ${task.taskNo} 状态已更新为 ${STATUS_LABELS[toStatus as keyof typeof STATUS_LABELS] || toStatus}`,
          pickingTaskId: params.id,
        },
      })

      return updated
    })

    let generatedTask = null
    if (toStatus === 'COMPLETED') {
      generatedTask = await handleTaskStatusChange(prisma, 'PICKING', params.id, toStatus)
    }

    return NextResponse.json({
      data: result,
      generatedTask,
    })
  } catch (error) {
    console.error('拣货状态更新失败:', error)
    return NextResponse.json(
      { error: '状态更新失败，请稍后重试' },
      { status: 500 }
    )
  }
}
