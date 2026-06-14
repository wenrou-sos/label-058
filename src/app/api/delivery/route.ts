import { prisma } from '@/lib/prisma'
import { generateTaskNo } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')

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

  const [total, data] = await Promise.all([
    prisma.deliveryTask.count({ where }),
    prisma.deliveryTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return NextResponse.json({ data, total, page, pageSize })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const taskNo = generateTaskNo('DL')

  const task = await prisma.deliveryTask.create({
    data: {
      taskNo,
      orderNo: body.orderNo,
      courierName: body.courierName,
      courierPhone: body.courierPhone,
      deliveryRoute: body.deliveryRoute,
      estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : null,
      status: body.status || 'PENDING',
      priority: body.priority || 'MEDIUM',
    },
  })

  return NextResponse.json({ data: task }, { status: 201 })
}
