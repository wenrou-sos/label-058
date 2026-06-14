import { prisma } from '@/lib/prisma'
import { STATUS_LABELS, TASK_TYPE_LABELS } from '@/types'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const updated = await prisma.pickingTask.update({
    where: { id: params.id },
    data: { status: toStatus },
  })

  await prisma.statusHistory.create({
    data: {
      taskId: params.id,
      taskType: 'PICKING',
      fromStatus,
      toStatus,
      operator: operator || '系统',
      remark,
    },
  })

  await prisma.notification.create({
    data: {
      taskId: params.id,
      taskType: 'PICKING',
      message: `${TASK_TYPE_LABELS.PICKING}任务 ${task.taskNo} 状态已更新为 ${STATUS_LABELS[toStatus as keyof typeof STATUS_LABELS] || toStatus}`,
    },
  })

  return NextResponse.json({ data: updated })
}
