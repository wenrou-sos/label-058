import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  const task = await prisma.pickingTask.findUnique({
    where: { id: params.id },
  })

  if (!task) {
    return NextResponse.json({ error: '拣货任务不存在' }, { status: 404 })
  }

  const updated = await prisma.pickingTask.update({
    where: { id: params.id },
    data: { assignee: body.assignee },
  })

  return NextResponse.json({ data: updated })
}
