'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  PackagePlus,
  ShoppingCart,
  Truck,
  Activity,
  ClipboardList,
  Warehouse,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui-store'

const navItems = [
  { href: '/', label: '仪表盘', icon: LayoutDashboard },
  { href: '/inbound', label: '入库管理', icon: PackagePlus },
  { href: '/picking', label: '拣货管理', icon: ShoppingCart },
  { href: '/delivery', label: '配送管理', icon: Truck },
  { href: '/tracking', label: '状态追踪', icon: Activity },
  { href: '/tasks', label: '任务管理', icon: ClipboardList },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'no-print fixed inset-y-0 left-0 z-40 flex flex-col bg-primary-900 text-white transition-all duration-300',
          sidebarOpen ? 'w-60' : 'w-16',
          'max-lg:translate-x-0',
          !sidebarOpen && 'max-lg:-translate-x-full'
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center border-b border-white/10 px-4',
            sidebarOpen ? 'justify-between' : 'justify-center'
          )}
        >
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Warehouse className="h-6 w-6 text-accent-500" />
              <span className="text-sm font-bold whitespace-nowrap">
                仓储物流管理系统
              </span>
            </div>
          )}
          {!sidebarOpen && (
            <Warehouse className="h-6 w-6 text-accent-500" />
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent-500 text-white'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white',
                      !sidebarOpen && 'justify-center px-0'
                    )}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-2">
          <button
            onClick={toggleSidebar}
            className={cn(
              'flex w-full items-center justify-center rounded-lg py-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white',
              !sidebarOpen && 'px-0'
            )}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
