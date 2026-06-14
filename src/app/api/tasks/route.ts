import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')

  const results: Array<Record<string, unknown>> = []

  if (!type || type === 'INBOUND') {
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (search) {
      where.OR = [
        { taskNo: { contains: search } },
        { productName: { contains: search } },
        { batchNo: { contains: search } },
      ]
    }
    const tasks = await prisma.inboundTask.findMany({ where, orderBy: { createdAt: 'desc' } })
    results.push(...tasks.map((t) => ({ ...t, type: 'INBOUND' })))
  }

  if (!type || type === 'PICKING') {
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (search) {
      where.OR = [
        { taskNo: { contains: search } },
        { orderNo: { contains: search } },
        { zone: { contains: search } },
      ]
    }
    const tasks = await prisma.pickingTask.findMany({ where, orderBy: { createdAt: 'desc' } })
    results.push(...tasks.map((t) => ({ ...t, type: 'PICKING' })))
  }

  if (!type || type === 'DELIVERY') {
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (search) {
      where.OR = [
        { taskNo: { contains: search } },
        { orderNo: { contains: search } },
        { courierName: { contains: search } },
      ]
    }
    const tasks = await prisma.deliveryTask.findMany({ where, orderBy: { createdAt: 'desc' } })
    results.push(...tasks.map((t) => ({ ...t, type: 'DELIVERY' })))
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
