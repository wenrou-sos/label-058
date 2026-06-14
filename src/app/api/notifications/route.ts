import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const isRead = searchParams.get('isRead')

  const where: Record<string, unknown> = {}
  if (isRead !== null && isRead !== '') {
    where.isRead = isRead === 'true'
  }

  const data = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data })
}
