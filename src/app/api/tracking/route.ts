import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const taskType = searchParams.get('taskType')
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')

  const results: Array<Record<string, unknown>> = []

  if (!taskType || taskType === 'INBOUND') {
    const inboundWhere: Record<string, unknown> = {}
    if (status) inboundWhere.status = status
    const inbounds = await prisma.inboundTask.findMany({
      where: inboundWhere,
      orderBy: { createdAt: 'desc' },
    })
    results.push(...inbounds.map((t) => ({ ...t, taskType: 'INBOUND' })))
  }

  if (!taskType || taskType === 'PICKING') {
    const pickingWhere: Record<string, unknown> = {}
    if (status) pickingWhere.status = status
    const pickings = await prisma.pickingTask.findMany({
      where: pickingWhere,
      orderBy: { createdAt: 'desc' },
    })
    results.push(...pickings.map((t) => ({ ...t, taskType: 'PICKING' })))
  }

  if (!taskType || taskType === 'DELIVERY') {
    const deliveryWhere: Record<string, unknown> = {}
    if (status) deliveryWhere.status = status
    const deliveries = await prisma.deliveryTask.findMany({
      where: deliveryWhere,
      orderBy: { createdAt: 'desc' },
    })
    results.push(...deliveries.map((t) => ({ ...t, taskType: 'DELIVERY' })))
  }

  results.sort(
    (a, b) =>
      new Date(b.createdAt as string).getTime() -
      new Date(a.createdAt as string).getTime()
  )

  const total = results.length
  const start = (page - 1) * pageSize
  const data = results.slice(start, start + pageSize)

  return NextResponse.json({ data, total, page, pageSize })
}
