import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const notification = await prisma.notification.findUnique({
    where: { id: params.id },
  })

  if (!notification) {
    return NextResponse.json({ error: '通知不存在' }, { status: 404 })
  }

  const updated = await prisma.notification.update({
    where: { id: params.id },
    data: { isRead: true },
  })

  return NextResponse.json({ data: updated })
}
