import { prisma } from '@/lib/prisma'
import { generateTaskNo } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const inboundItemSchema = z.object({
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
  batchNo: z.string().min(1),
  storageLocation: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assignee: z.string().nullable().optional(),
})

const batchSchema = z.object({
  items: z.array(inboundItemSchema).min(1).max(100),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = batchSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: '数据验证失败', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { items } = parsed.data
    const tasks = []

    for (const item of items) {
      const taskNo = generateTaskNo('IN')
      const task = await prisma.inboundTask.create({
        data: {
          taskNo,
          productName: item.productName,
          quantity: item.quantity,
          batchNo: item.batchNo,
          storageLocation: item.storageLocation,
          status: 'PENDING',
          priority: item.priority,
          assignee: item.assignee || null,
        },
      })
      tasks.push(task)
    }

    return NextResponse.json({ data: tasks, count: tasks.length }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '批量导入失败' }, { status: 500 })
  }
}
