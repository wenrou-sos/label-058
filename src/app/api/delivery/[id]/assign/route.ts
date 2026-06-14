import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  const task = await prisma.deliveryTask.findUnique({
    where: { id: params.id },
  })

  if (!task) {
    return NextResponse.json({ error: '配送任务不存在' }, { status: 404 })
  }

  const updated = await prisma.deliveryTask.update({
    where: { id: params.id },
    data: {
      courierName: body.courierName,
      courierPhone: body.courierPhone,
    },
  })

  return NextResponse.json({ data: updated })
}
