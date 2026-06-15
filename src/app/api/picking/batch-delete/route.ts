import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids }: { ids: string[] } = body

    if (!ids || ids.length === 0) {
      return NextResponse.json(
        { error: '请选择要删除的任务' },
        { status: 400 }
      )
    }

    const successIds: string[] = []
    const failedIds: string[] = []

    for (const id of ids) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.pickingItem.deleteMany({
            where: { pickingTaskId: id },
          })
          await tx.statusHistory.deleteMany({
            where: { pickingTaskId: id },
          })
          await tx.notification.deleteMany({
            where: { pickingTaskId: id },
          })
          await tx.pickingTask.delete({
            where: { id },
          })
        })
        successIds.push(id)
      } catch (e) {
        console.error(`删除拣货任务 ${id} 失败:`, e)
        failedIds.push(id)
      }
    }

    return NextResponse.json({
      data: {
        successCount: successIds.length,
        failCount: failedIds.length,
        successIds,
        failedIds,
      },
    })
  } catch (error) {
    console.error('批量删除拣货任务失败:', error)
    return NextResponse.json(
      { error: '批量删除失败，请稍后重试' },
      { status: 500 }
    )
  }
}
