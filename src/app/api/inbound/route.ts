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
      { productName: { contains: search } },
      { batchNo: { contains: search } },
    ]
  }

  const [total, data] = await Promise.all([
    prisma.inboundTask.count({ where }),
    prisma.inboundTask.findMany({
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
  const taskNo = generateTaskNo('IN')

  const task = await prisma.inboundTask.create({
    data: {
      taskNo,
      productName: body.productName,
      quantity: body.quantity,
      batchNo: body.batchNo,
      storageLocation: body.storageLocation,
      status: body.status || 'PENDING',
      priority: body.priority || 'MEDIUM',
      assignee: body.assignee,
    },
  })

  return NextResponse.json({ data: task }, { status: 201 })
}
