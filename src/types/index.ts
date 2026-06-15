export type TaskType = 'INBOUND' | 'PICKING' | 'DELIVERY'
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface InboundTask {
  id: string
  taskNo: string
  productName: string
  quantity: number
  batchNo: string
  storageLocation: string
  status: TaskStatus
  priority: Priority
  assignee: string | null
  orderNo: string | null
  createdAt: string
  updatedAt: string
}

export interface PickingTask {
  id: string
  taskNo: string
  orderNo: string
  zone: string
  status: TaskStatus
  priority: Priority
  assignee: string | null
  optimizedPath: string | null
  sourceInboundTaskId: string | null
  items: PickingItem[]
  createdAt: string
  updatedAt: string
}

export interface PickingItem {
  id: string
  pickingTaskId: string
  productName: string
  quantity: number
  storageLocation: string
  isPicked: boolean
}

export interface DeliveryTask {
  id: string
  taskNo: string
  orderNo: string
  courierName: string | null
  courierPhone: string | null
  deliveryRoute: string
  estimatedDelivery: string | null
  status: TaskStatus
  priority: Priority
  sourcePickingTaskId: string | null
  createdAt: string
  updatedAt: string
}

export interface StatusHistory {
  id: string
  taskId: string
  taskType: TaskType
  fromStatus: TaskStatus
  toStatus: TaskStatus
  operator: string
  remark: string | null
  createdAt: string
}

export interface Notification {
  id: string
  taskId: string
  taskType: TaskType
  message: string
  isRead: boolean
  createdAt: string
}

export interface DashboardStats {
  inboundCount: number
  pickingCount: number
  deliveryCount: number
  completedCount: number
  inboundPending: number
  pickingInProgress: number
  deliveringCount: number
  statusDistribution: { status: string; count: number }[]
  recentTasks: {
    id: string
    taskNo: string
    type: TaskType
    status: TaskStatus
    priority: Priority
    createdAt: string
  }[]
  weeklyTrend: {
    date: string
    inbound: number
    picking: number
    delivery: number
  }[]
}

export interface ApiResponse<T> {
  data: T
  total?: number
  page?: number
  pageSize?: number
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: '待处理',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '紧急',
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  INBOUND: '入库',
  PICKING: '拣货',
  DELIVERY: '配送',
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
}

export const ZONES = ['A区', 'B区', 'C区', 'D区', 'E区'] as const
export const LOCATIONS = ['A-01-01', 'A-01-02', 'A-02-01', 'B-01-01', 'B-01-02', 'B-02-01', 'C-01-01', 'C-01-02', 'D-01-01', 'E-01-01'] as const
export const ASSIGNEES = ['张明', '李华', '王强', '赵伟', '陈刚', '刘洋'] as const
export const COURIERS = ['配送员-周杰', '配送员-吴磊', '配送员-孙涛', '配送员-马超'] as const
