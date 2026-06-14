import { prisma } from '@/lib/prisma'
import { STATUS_LABELS, TASK_TYPE_LABELS } from '@/types'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const updated = await prisma.inboundTask.update({
    where: { id: params.id },
    data: { status: toStatus },
  })

  await prisma.statusHistory.create({
    data: {
      taskId: params.id,
      taskType: 'INBOUND',
      fromStatus,
      toStatus,
      operator: operator || '系统',
      remark,
    },
  })

  await prisma.notification.create({
    data: {
      taskId: params.id,
      taskType: 'INBOUND',
      message: `${TASK_TYPE_LABELS.INBOUND}任务 ${task.taskNo} 状态已更新为 ${STATUS_LABELS[toStatus as keyof typeof STATUS_LABELS] || toStatus}`,
    },
  })

  return NextResponse.json({ data: updated })
}
